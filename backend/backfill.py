"""
One-time backfill: copy all existing rows from SQLite main DB
into both the SQLite mirror file AND Neon PostgreSQL.
Run once:  python backfill.py
"""
import os
import sqlite3
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

MAIN_DB   = os.getenv("SQLITE_MAIN_PATH", "instance/snu.db")
MIRROR_DB = os.getenv("SQLITE_MIRROR_PATH", "instance/snu_mirror.db")


def backfill_sqlite_mirror():
    """Copy every row from main SQLite → mirror SQLite."""
    os.makedirs(os.path.dirname(MIRROR_DB) or ".", exist_ok=True)

    src = sqlite3.connect(MAIN_DB)
    src.row_factory = sqlite3.Row

    # Attach mirror file
    src.execute(f"ATTACH DATABASE '{MIRROR_DB}' AS mirror")

    tables = [
        r[0] for r in src.execute(
            "SELECT name FROM sqlite_master WHERE type='table' "
            "AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%_mirror'"
        ).fetchall()
    ]

    print(f"📋 Found {len(tables)} tables")

    for table in tables:
        # Create mirror table if missing (copy schema)
        schema = src.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
            (table,)
        ).fetchone()[0]
        mirror_schema = (
            schema.replace(f"CREATE TABLE {table}",
                           f"CREATE TABLE IF NOT EXISTS mirror.{table}")
                  .replace(f'CREATE TABLE "{table}"',
                           f'CREATE TABLE IF NOT EXISTS mirror."{table}"')
        )
        src.execute(mirror_schema)

        # Copy rows
        rows = src.execute(f"SELECT * FROM {table}").fetchall()
        if not rows:
            print(f"   ⏭️  {table}: 0 rows")
            continue

        cols = rows[0].keys()
        col_list = ", ".join(cols)
        placeholders = ", ".join(["?"] * len(cols))
        data = [tuple(r) for r in rows]

        src.executemany(
            f"INSERT OR REPLACE INTO mirror.{table} ({col_list}) "
            f"VALUES ({placeholders})",
            data
        )
        print(f"   ✅ {table}: {len(rows)} rows → mirror")

    src.commit()
    src.close()
    print("✅ SQLite mirror backfilled")


def backfill_neon():
    """Push everything from mirror SQLite → Neon PostgreSQL."""
    import psycopg2
    import psycopg2.extras
    from urllib.parse import urlparse, unquote

    # Prefer NEON_DATABASE_URL, else PG* vars
    url = os.getenv("NEON_DATABASE_URL")
    if url:
        url = url.replace("postgresql+psycopg2://", "postgresql://")
        p = urlparse(url)
        cfg = dict(
            host=p.hostname, port=p.port or 5432,
            user=unquote(p.username or ""), password=unquote(p.password or ""),
            dbname=p.path.lstrip("/"), sslmode="require",
        )
    else:
        cfg = dict(
            host=os.getenv("PGHOST"), port=int(os.getenv("PGPORT", 5432)),
            user=os.getenv("PGUSER"), password=os.getenv("PGPASSWORD"),
            dbname=os.getenv("PGDATABASE"), sslmode="require",
        )

    print(f"\n🐘 Connecting to Neon at {cfg['host']}...")
    pg = psycopg2.connect(**cfg)

    lite = sqlite3.connect(MIRROR_DB)
    lite.row_factory = sqlite3.Row

    tables = [
        r[0] for r in lite.execute(
            "SELECT name FROM sqlite_master WHERE type='table' "
            "AND name NOT LIKE 'sqlite_%'"
        ).fetchall()
    ]

    # Type map
    def pg_type(t):
        t = (t or "").upper()
        if "INT" in t: return "BIGINT"
        if "CHAR" in t or "CLOB" in t or "TEXT" in t: return "TEXT"
        if "BLOB" in t: return "BYTEA"
        if "REAL" in t or "FLOA" in t or "DOUB" in t: return "DOUBLE PRECISION"
        if "DATE" in t or "TIME" in t: return "TIMESTAMP"
        return "TEXT"

    for table in tables:
        cols_info = lite.execute(f"PRAGMA table_info({table})").fetchall()
        cols = [c[1] for c in cols_info]
        pk_col = next((c[1] for c in cols_info if c[5]), cols[0])

        # Create table in Neon
        col_defs = [f'"{c[1]}" {pg_type(c[2])}' for c in cols_info]
        col_defs.append(f'PRIMARY KEY ("{pk_col}")')
        ddl = f'CREATE TABLE IF NOT EXISTS "{table}" (' + ", ".join(col_defs) + ")"
        with pg.cursor() as cur:
            cur.execute(ddl)

        rows = lite.execute(f"SELECT * FROM {table}").fetchall()
        if not rows:
            print(f"   ⏭️  {table}: 0 rows")
            continue

        col_list = ", ".join(f'"{c}"' for c in cols)
        placeholders = ", ".join(["%s"] * len(cols))
        updates = ", ".join(f'"{c}"=EXCLUDED."{c}"' for c in cols if c != pk_col)
        conflict = (f'ON CONFLICT ("{pk_col}") DO UPDATE SET {updates}'
                    if updates else "ON CONFLICT DO NOTHING")

        sql = (f'INSERT INTO "{table}" ({col_list}) '
               f'VALUES ({placeholders}) {conflict}')
        data = [tuple(r[c] for c in cols) for r in rows]

        with pg.cursor() as cur:
            psycopg2.extras.execute_batch(cur, sql, data)

        print(f"   ✅ {table}: {len(rows)} rows → Neon")

    pg.commit()
    pg.close()
    lite.close()
    print("✅ Neon backfilled")


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Backfilling mirror databases")
    print("=" * 60)

    print("\n📦 Step 1: SQLite main → SQLite mirror")
    backfill_sqlite_mirror()

    print("\n📦 Step 2: SQLite mirror → Neon PostgreSQL")
    backfill_neon()

    print("\n" + "=" * 60)
    print("🎉 Backfill complete!")
    print("=" * 60)