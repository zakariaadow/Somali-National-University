# config.py
import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    # ---- Flask ----
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'

    # ---- Database ----
    _db_url = os.environ.get('DATABASE_URL')
    if _db_url:
        if _db_url.startswith('postgresql://'):
            _db_url = _db_url.replace('postgresql://', 'postgresql+psycopg2://', 1)
        SQLALCHEMY_DATABASE_URI = _db_url
    else:
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(basedir, "instance", "snu.db")}'

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ---- Connection pool (fixes Supabase SSL decryption errors) ----
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,       # verify connection before use
        'pool_recycle': 300,          # recycle connections every 5 min
        'pool_size': 5,
        'max_overflow': 10,
        'pool_timeout': 30,
        'connect_args': {
            'connect_timeout': 10,
            'keepalives': 1,
            'keepalives_idle': 30,
            'keepalives_interval': 10,
            'keepalives_count': 5,
            'sslmode': 'require',
        },
    }

    # ---- Session ----
    # Using Flask default signed cookies (multi-worker safe).
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)

    SESSION_COOKIE_NAME = 'snu_session'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
    SESSION_COOKIE_SAMESITE = os.environ.get('SESSION_COOKIE_SAMESITE', 'Lax')

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