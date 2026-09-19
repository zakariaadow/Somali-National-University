from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Initialize SQLAlchemy
db = SQLAlchemy()

# Initialize Flask-Migrate
migrate = Migrate()

def init_db(app):
    """Initialize database with app"""
    # Only initialize if not already initialized
    if not hasattr(app, 'extensions') or 'sqlalchemy' not in app.extensions:
        db.init_app(app)
        migrate.init_app(app, db)
        
        # Create tables if they don't exist
        with app.app_context():
            db.create_all()
            
            # Initialize default data
            init_roles()
            init_faculties()
            init_colleges()
            init_academic_years()
            init_semesters()
            init_admin_user()
    else:
        print("Database already initialized")

def init_roles():
    """Initialize default roles"""
    from models import Role
    
    roles = [
        ('Admin', 'System Administrator with full access'),
        ('Student', 'Registered student'),
        ('Lecturer', 'Teaching staff'),
        ('Finance Officer', 'Finance department staff'),
        ('Faculty Officer', 'Faculty administration staff'),
        ('College Officer', 'College administration staff')
    ]
    
    for role_name, description in roles:
        if not Role.query.filter_by(name=role_name).first():
            role = Role(name=role_name, description=description)
            db.session.add(role)
    
    db.session.commit()

def init_faculties():
    """Initialize default faculties"""
    from models import Faculty
    
    faculties = [
        ('Faculty of Agriculture', 'AGR', 'School of Agriculture and Food Sciences'),
        ('Faculty of Industrial Chemistry', 'CHEM', 'School of Chemistry and Chemical Engineering'),
        ('Faculty of Engineering', 'ENG', 'School of Engineering and Technology'),
        ('Faculty of Geology', 'GEO', 'School of Earth Sciences'),
        ('Faculty of Medicine', 'MED', 'School of Medicine and Health Sciences'),
        ('Faculty of Veterinary Science', 'VET', 'School of Veterinary Medicine'),
        ('Faculty of Economy', 'ECO', 'School of Economics and Business'),
        ('Faculty of Language', 'LANG', 'School of Languages and Literature')
    ]
    
    for name, code, description in faculties:
        if not Faculty.query.filter_by(code=code).first():
            faculty = Faculty(name=name, code=code, description=description)
            db.session.add(faculty)
    
    db.session.commit()

def init_colleges():
    """Initialize default colleges"""
    from models import College
    
    colleges = [
        ('College of Agriculture', 'COA', 'College of Agriculture and Food Sciences'),
        ('College of Industrial Chemistry', 'CIC', 'College of Chemistry and Chemical Engineering'),
        ('College of Engineering', 'COE', 'College of Engineering and Technology'),
        ('College of Geology', 'COG', 'College of Earth Sciences'),
        ('College of Medicine', 'COM', 'College of Medicine and Health Sciences'),
        ('College of Veterinary Science', 'CVS', 'College of Veterinary Medicine'),
        ('College of Economics', 'COE2', 'College of Economics and Business'),
        ('College of Languages', 'COL', 'College of Languages and Literature')
    ]
    
    for name, code, description in colleges:
        if not College.query.filter_by(code=code).first():
            college = College(name=name, code=code, description=description)
            db.session.add(college)
    
    db.session.commit()

def init_academic_years():
    """Initialize default academic years"""
    from models import AcademicYear
    from datetime import date
    
    # Current academic year
    current_year = date.today().year
    academic_years = [
        (f'{current_year-1}/{current_year}', date(current_year-1, 9, 1), date(current_year, 8, 31), False),
        (f'{current_year}/{current_year+1}', date(current_year, 9, 1), date(current_year+1, 8, 31), True)
    ]
    
    for name, start_date, end_date, is_current in academic_years:
        if not AcademicYear.query.filter_by(name=name).first():
            year = AcademicYear(
                name=name,
                start_date=start_date,
                end_date=end_date,
                is_current=is_current
            )
            db.session.add(year)
    
    db.session.commit()

def init_semesters():
    """Initialize default semesters"""
    from models import Semester, AcademicYear
    from datetime import date
    
    academic_year = AcademicYear.query.filter_by(is_current=True).first()
    if not academic_year:
        return
    
    # Check if semesters already exist
    if Semester.query.filter_by(academic_year_id=academic_year.id).first():
        return
    
    # Create four semesters
    semesters = [
        {
            'name': 'Semester 1',
            'semester_number': 1,
            'start_date': date(academic_year.start_date.year, 9, 1),
            'end_date': date(academic_year.start_date.year, 12, 15),
            'registration_start': date(academic_year.start_date.year, 8, 15),
            'registration_end': date(academic_year.start_date.year, 9, 15),
            'is_current': True
        },
        {
            'name': 'Semester 2',
            'semester_number': 2,
            'start_date': date(academic_year.start_date.year + 1, 1, 15),
            'end_date': date(academic_year.start_date.year + 1, 5, 15),
            'registration_start': date(academic_year.start_date.year + 1, 1, 1),
            'registration_end': date(academic_year.start_date.year + 1, 2, 1),
            'is_current': False
        },
        {
            'name': 'Semester 3',
            'semester_number': 3,
            'start_date': date(academic_year.start_date.year + 1, 9, 1),
            'end_date': date(academic_year.start_date.year + 1, 12, 15),
            'registration_start': date(academic_year.start_date.year + 1, 8, 15),
            'registration_end': date(academic_year.start_date.year + 1, 9, 15),
            'is_current': False
        },
        {
            'name': 'Semester 4',
            'semester_number': 4,
            'start_date': date(academic_year.start_date.year + 2, 1, 15),
            'end_date': date(academic_year.start_date.year + 2, 5, 15),
            'registration_start': date(academic_year.start_date.year + 2, 1, 1),
            'registration_end': date(academic_year.start_date.year + 2, 2, 1),
            'is_current': False
        }
    ]
    
    for sem_data in semesters:
        semester = Semester(
            name=sem_data['name'],
            semester_number=sem_data['semester_number'],
            start_date=sem_data['start_date'],
            end_date=sem_data['end_date'],
            registration_start=sem_data['registration_start'],
            registration_end=sem_data['registration_end'],
            academic_year_id=academic_year.id,
            is_current=sem_data['is_current']
        )
        db.session.add(semester)
    
    db.session.commit()

def init_admin_user():
    """Initialize default admin user"""
    from models import User, Role
    import os
    
    # Check if admin already exists
    admin_role = Role.query.filter_by(name='Admin').first()
    if not admin_role:
        return
    
    if User.query.filter_by(username='admin').first():
        return
    
    # Create admin user with password from .env or default
    from werkzeug.security import generate_password_hash
    admin_password = os.environ.get('ADMIN_PASSWORD', 'Admin@2024')
    password_hash = generate_password_hash(admin_password)
    
    admin = User(
        username='admin',
        email='admin@snu.edu.so',
        password_hash=password_hash,
        first_name='System',
        last_name='Administrator',
        role_id=admin_role.id,
        phone='+252612345678',
        is_active=True,
        is_verified=True
    )
    db.session.add(admin)
    db.session.commit()

def drop_all_tables():
    """Drop all tables (use with caution)"""
    db.drop_all()
    db.session.commit()

def reset_database():
    """Reset database - drop and recreate all tables"""
    drop_all_tables()
    db.create_all()
    init_roles()
    init_faculties()
    init_colleges()
    init_academic_years()
    init_semesters()
    init_admin_user()
    db.session.commit()
