"""
SQLite (primary) + Supabase PostgreSQL (mirror)
- Background thread pushes SQLite rows → Supabase every 1 second
- No triggers (SQLite doesn't support cross-database triggers)
"""
import os
import sqlite3
import threading
import time
import logging
import psycopg2
import psycopg2.extras
from urllib.parse import urlparse, unquote

log = logging.getLogger("mirror")

MAIN_DB   = os.getenv("SQLITE_MAIN_PATH", "instance/snu.db")
MIRROR_DB = os.getenv("SQLITE_MIRROR_PATH", "instance/snu_mirror.db")
MIRROR_ENABLED = os.getenv("MIRROR_ENABLED", "False") == "True"


# ------------------------------------------------------------------
# Parse Supabase URL → psycopg2 kwargs (fallback to PG* vars)
# ------------------------------------------------------------------
def _pg_cfg_from_env() -> dict:
    url = os.getenv("NEON_DATABASE_URL")
    if url:
        url = url.replace("postgresql+psycopg2://", "postgresql://")
        p = urlparse(url)
        return {
            "host":     p.hostname,
            "port":     p.port or 5432,
            "user":     unquote(p.username or ""),
            "password": unquote(p.password or ""),
            "dbname":   p.path.lstrip("/"),
            "sslmode":  "require",
        }
    return {
        "host":     os.getenv("PGHOST"),
        "port":     int(os.getenv("PGPORT", "5432")),
        "user":     os.getenv("PGUSER"),
        "password": os.getenv("PGPASSWORD"),
        "dbname":   os.getenv("PGDATABASE"),
        "sslmode":  "require",
    }


PG_CFG = _pg_cfg_from_env()


# ------------------------------------------------------------------
# SQLite type → PostgreSQL type
# ------------------------------------------------------------------
def _sqlite_type_to_pg(sqlite_type: str) -> str:
    t = (sqlite_type or "").upper()
    if "INT" in t:                                return "BIGINT"
    if "CHAR" in t or "CLOB" in t or "TEXT" in t: return "TEXT"
    if "BLOB" in t:                               return "BYTEA"
    if "REAL" in t or "FLOA" in t or "DOUB" in t: return "DOUBLE PRECISION"
    if "DATE" in t or "TIME" in t:                return "TIMESTAMP"
    return "TEXT"


def _ensure_pg_table(pg_conn, table, cols_info):
    col_defs, pk_col = [], None
    for cid, name, ctype, notnull, default, pk in cols_info:
        col_defs.append(f'"{name}" {_sqlite_type_to_pg(ctype)}')
        if pk:
            pk_col = name
    if pk_col:
        col_defs.append(f'PRIMARY KEY ("{pk_col}")')
    ddl = f'CREATE TABLE IF NOT EXISTS "{table}" (' + ", ".join(col_defs) + ")"
    with pg_conn.cursor() as cur:
        cur.execute(ddl)
    pg_conn.commit()


# ------------------------------------------------------------------
# Push loop — runs every 1 second
# ------------------------------------------------------------------
def push_to_pg_loop(interval=1):
    if not MIRROR_ENABLED:
        return
    log.info(f"🔄 Supabase push loop started (every {interval}s)")

    while True:
        try:
            lite = sqlite3.connect(MAIN_DB)     # read from MAIN, not mirror
            lite.row_factory = sqlite3.Row
            pg = psycopg2.connect(**PG_CFG)

            tables = [
                r[0] for r in lite.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' "
                    "AND name NOT LIKE 'sqlite_%'"
                ).fetchall()
            ]

            pushed = 0
            for table in tables:
                cols_info = lite.execute(f"PRAGMA table_info({table})").fetchall()
                if not cols_info:
                    continue
                _ensure_pg_table(pg, table, cols_info)

                cols = [c[1] for c in cols_info]
                pk_col = next((c[1] for c in cols_info if c[5]), cols[0])
                col_list     = ", ".join(f'"{c}"' for c in cols)
                placeholders = ", ".join(["%s"] * len(cols))
                updates      = ", ".join(f'"{c}"=EXCLUDED."{c}"' for c in cols if c != pk_col)
                conflict     = (f'ON CONFLICT ("{pk_col}") DO UPDATE SET {updates}'
                                if updates else "ON CONFLICT DO NOTHING")

                rows = lite.execute(f"SELECT * FROM {table}").fetchall()
                if not rows:
                    continue

                sql = (f'INSERT INTO "{table}" ({col_list}) '
                       f'VALUES ({placeholders}) {conflict}')
                data = [tuple(r[c] for c in cols) for r in rows]

                with pg.cursor() as cur:
                    psycopg2.extras.execute_batch(cur, sql, data)
                pushed += len(data)

            pg.commit()
            pg.close()
            lite.close()

        except Exception as e:
            log.error(f"Supabase push error: {e}")

        time.sleep(interval)


def start_mirror():
    """Start the push loop thread. No trigger setup (SQLite limitation)."""
    if not MIRROR_ENABLED:
        log.info("Supabase mirror disabled")
        return
    threading.Thread(target=push_to_pg_loop, daemon=True).start()