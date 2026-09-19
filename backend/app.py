# app.py
import os
import sys
from dotenv import load_dotenv
from datetime import timedelta

# Load .env BEFORE importing anything that reads env vars
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

from flask import Flask, jsonify, request as flask_request, redirect
from flask_cors import CORS
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import extensions
from extensions import db, migrate, login_manager, mail, csrf, cors, sess
from config import Config
from routes import register_blueprints


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ---- Session cookie settings ----
    app.config['SESSION_COOKIE_NAME'] = 'snu_session'
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SECURE'] = os.getenv('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
    app.config['SESSION_COOKIE_SAMESITE'] = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
    app.config['SESSION_COOKIE_DOMAIN'] = None
    app.config['SESSION_COOKIE_PATH'] = '/'
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

    # ---- CORS ----
    cors_origins = os.getenv(
        'CORS_ORIGINS',
        'http://localhost:3000,http://127.0.0.1:3000'
    ).split(',')
    cors_origins = [o.strip() for o in cors_origins if o.strip()]

    CORS(app, origins=cors_origins,
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    print(f"🌐 CORS allowed origins: {cors_origins}")

    # ---- Database URI (masked) ----
    db_path = app.config['SQLALCHEMY_DATABASE_URI']
    safe_db_path = db_path.split('@')[0].split(':')[0] + '://***@' + db_path.split('@')[-1] if '@' in db_path else db_path
    print(f"📁 Database URI: {safe_db_path}")

    # ---- Supabase bind ----
    neon_url = os.getenv('NEON_DATABASE_URL')
    if neon_url:
        if neon_url.startswith('postgresql://'):
            neon_url = neon_url.replace('postgresql://', 'postgresql+psycopg2://', 1)
        app.config.setdefault('SQLALCHEMY_BINDS', {})['postgres'] = neon_url
        print("🐘 Supabase mirror bind: enabled")
    else:
        print("⚠️  Supabase mirror bind: NEON_DATABASE_URL not set")

    app.url_map.strict_slashes = False

    # ---- Extensions ----
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    mail.init_app(app)
    csrf.init_app(app)

    # ============================================================
    # ⭐ THE FIX: Return JSON 401 for unauthenticated API requests
    # instead of redirecting to HTML /login (which caused the loop)
    # ============================================================
    @login_manager.unauthorized_handler
    def unauthorized():
        # For API requests → clean JSON 401
        if flask_request.path.startswith('/api/'):
            return jsonify({
                'error': 'Not authenticated',
                'message': 'Please log in',
                'authenticated': False
            }), 401
        # For HTML routes → redirect to login page
        return redirect('/login')

    if app.config.get('SESSION_TYPE'):
        sess.init_app(app)

    # ---- Per-request DB session cleanup ----
    @app.teardown_request
    def cleanup_db_session(exception=None):
        if exception:
            try:
                db.session.rollback()
            except Exception:
                pass
        try:
            db.session.remove()
        except Exception:
            pass

    # ---- Routes ----
    register_blueprints(app)
    print("✅ All routes registered!")

    # ---- Supabase push loop (dev only) ----
    if app.config.get('MIRROR_ENABLED') or os.getenv('MIRROR_ENABLED', 'False').lower() == 'true':
        try:
            from mirror import start_mirror
            start_mirror()
            print("🔄 Mirror push loop started")
        except Exception as e:
            print(f"⚠️  Mirror startup warning: {e}")
    else:
        print("ℹ️  Mirror disabled (production mode)")

    # ---- Upload folders ----
    from utils.file_upload import create_upload_folder
    upload_dirs = [
        'uploads/student_photos', 'uploads/documents', 'uploads/exam_cards',
        'uploads/student_cards', 'uploads/fee_structures',
        'uploads/learning_materials', 'uploads/receipts'
    ]
    for dir_path in upload_dirs:
        create_upload_folder(dir_path)

    # ---- Logs folder ----
    if not os.path.exists('logs'):
        os.makedirs('logs')

    # ---- DB init + seeding ----
    with app.app_context():
        try:
            print("\n📦 Importing models...")
            from models import (
                College, Faculty, Department, Programme, Unit,
                Semester, AcademicYear, Role, User, Student,
                Lecturer, FinanceOfficer, FacultyOfficer, CollegeOfficer,
                StudentUnit, Registration, Payment, Receipt, ExamCard,
                StudentCard, Result, Assessment, Attendance, FeeStructure,
                Announcement, News, OnlineClass, ActivityLog, Document
            )
            print("✅ All models imported successfully!")

            print("📊 Creating database tables...")
            try:
                db.create_all()
                print("✅ Tables created/verified")
            except Exception as te:
                print(f"⚠️  db.create_all warning (benign if tables exist): {te}")

            print("👤 Ensuring default roles...")
            from models import Role
            if Role.query.count() == 0:
                default_roles = [
                    Role(name='Admin', description='System Administrator'),
                    Role(name='Student', description='Registered Student'),
                    Role(name='Lecturer', description='Teaching Staff'),
                    Role(name='Finance Officer', description='Finance Department'),
                    Role(name='Faculty Officer', description='Faculty Administration'),
                    Role(name='College Officer', description='College Administration')
                ]
                for role in default_roles:
                    db.session.add(role)
                db.session.commit()
                print("✅ Default roles created!")
            else:
                print(f"✅ Roles already exist ({Role.query.count()} roles)")

            print("👤 Ensuring admin user...")
            from models import User
            admin_role = Role.query.filter_by(name='Admin').first()
            admin_username = os.getenv('ADMIN_USERNAME', 'admin')
            if admin_role and not User.query.filter_by(username=admin_username).first():
                admin_user = User(
                    username=admin_username,
                    email=os.getenv('ADMIN_EMAIL', 'admin@snu.edu.so'),
                    first_name=os.getenv('ADMIN_FIRST_NAME', 'System'),
                    last_name=os.getenv('ADMIN_LAST_NAME', 'Administrator'),
                    role_id=admin_role.id,
                    is_active=True,
                    is_verified=True
                )
                admin_user.set_password(os.getenv('ADMIN_PASSWORD', 'Admin@2024'))
                db.session.add(admin_user)
                db.session.commit()
                print(f"✅ Admin user created: {admin_username}")
            else:
                print("✅ Admin user already exists")

            print("\n✅ Database initialization complete!")

        except Exception as e:
            print(f"❌ Error during initialization: {e}")
            import traceback
            traceback.print_exc()

    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('FLASK_PORT', os.getenv('PORT', 5000)))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

    print("\n🚀 Starting SNU API Server...")
    print(f"   Host: 0.0.0.0")
    print(f"   Port: {port}")
    print(f"   Debug: {debug}")
    print("📍 Available endpoints:")
    print("   GET  /api/colleges")
    print("   GET  /api/faculties")
    print("   GET  /api/departments")
    print("   GET  /api/programmes")
    print("   GET  /api/units")
    print("   POST /api/auth/login")
    print("   POST /api/auth/register")
    print("   GET  /api/auth/profile")
    print("   And many more...")
    print("\n" + "=" * 50)

    app.run(debug=debug, host='0.0.0.0', port=port)