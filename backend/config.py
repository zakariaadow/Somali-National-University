# config.py
import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    # ---- Flask ----
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'

    # ---- Database ----
    # Priority:
    #   1. DATABASE_URL env var (Render/Supabase)
    #   2. Local SQLite fallback for dev
    _db_url = os.environ.get('DATABASE_URL')

    if _db_url:
        # SQLAlchemy needs postgresql+psycopg2:// scheme for Postgres
        if _db_url.startswith('postgresql://'):
            _db_url = _db_url.replace('postgresql://', 'postgresql+psycopg2://', 1)
        SQLALCHEMY_DATABASE_URI = _db_url
    else:
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(basedir, "instance", "snu.db")}'

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ---- Session ----
    SESSION_TYPE = 'filesystem'
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    SESSION_FILE_DIR = os.path.join(basedir, 'flask_session')

    # ---- Mail ----
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', True)
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@snu.edu.so')

    # ---- Upload ----
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB

    # ---- CSRF ----
    WTF_CSRF_ENABLED = False
    WTF_CSRF_SECRET_KEY = os.environ.get('WTF_CSRF_SECRET_KEY') or 'csrf-secret-key'

    # ---- CORS ----
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')