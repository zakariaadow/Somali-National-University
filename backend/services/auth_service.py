# backend/services/auth_service.py
from flask_login import login_user, logout_user, current_user
from database import db
from models import User, Role, Student, ActivityLog
from datetime import datetime
import re
import secrets
from werkzeug.security import generate_password_hash

class AuthService:
    @staticmethod
    def login(username, password, ip_address=None, user_agent=None):
        """Authenticate and login user"""
        user = User.query.filter_by(username=username).first()
        
        if not user or not user.check_password(password):
            return {'success': False, 'error': 'Invalid credentials'}
        
        if not user.is_active:
            return {'success': False, 'error': 'Account is deactivated'}
        
        login_user(user)
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Log activity
        AuthService.log_activity(
            user.id,
            'login',
            f'User {user.username} logged in',
            ip_address,
            user_agent
        )
        
        return {
            'success': True,
            'user': AuthService.get_user_data(user)
        }
    
    @staticmethod
    def logout(user_id, ip_address=None, user_agent=None):
        """Logout user"""
        # Log activity
        AuthService.log_activity(
            user_id,
            'logout',
            f'User logged out',
            ip_address,
            user_agent
        )
        
        logout_user()
        return {'success': True}
    
    @staticmethod
    def register_student(data):
        """Register a new student"""
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name', 
                          'registration_number', 'admission_date', 'year_of_study', 
                          'programme_id']
        
        for field in required_fields:
            if field not in data:
                return {'success': False, 'error': f'{field} is required'}
        
        # Validate email
        if not AuthService.validate_email(data['email']):
            return {'success': False, 'error': 'Invalid email format'}
        
        # Validate username
        if not AuthService.validate_username(data['username']):
            return {'success': False, 'error': 'Invalid username format'}
        
        # Check for duplicates
        if User.query.filter_by(username=data['username']).first():
            return {'success': False, 'error': 'Username already exists'}
        
        if User.query.filter_by(email=data['email']).first():
            return {'success': False, 'error': 'Email already exists'}
        
        if Student.query.filter_by(registration_number=data['registration_number']).first():
            return {'success': False, 'error': 'Registration number already exists'}
        
        # Get student role
        student_role = Role.query.filter_by(name='Student').first()
        if not student_role:
            return {'success': False, 'error': 'Student role not found'}
        
        try:
            # Create user
            user = User(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                role_id=student_role.id,
                phone=data.get('phone')
            )
            db.session.add(user)
            db.session.flush()
            
            # Create student
            student = Student(
                registration_number=data['registration_number'],
                admission_date=datetime.strptime(data['admission_date'], '%Y-%m-%d').date(),
                year_of_study=data['year_of_study'],
                user_id=user.id,
                programme_id=data['programme_id']
            )
            db.session.add(student)
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Student registered successfully',
                'user_id': user.id,
                'student_id': student.id
            }
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def register_staff(data, role_name):
        """Register staff (lecturer, finance officer, etc.)"""
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name', 
                          'staff_number']
        
        for field in required_fields:
            if field not in data:
                return {'success': False, 'error': f'{field} is required'}
        
        # Validate
        if not AuthService.validate_email(data['email']):
            return {'success': False, 'error': 'Invalid email format'}
        
        if User.query.filter_by(username=data['username']).first():
            return {'success': False, 'error': 'Username already exists'}
        
        if User.query.filter_by(email=data['email']).first():
            return {'success': False, 'error': 'Email already exists'}
        
        # Get role
        role = Role.query.filter_by(name=role_name).first()
        if not role:
            return {'success': False, 'error': f'{role_name} role not found'}
        
        try:
            user = User(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                role_id=role.id,
                phone=data.get('phone')
            )
            db.session.add(user)
            db.session.flush()
            
            # Create staff based on role
            if role_name == 'Lecturer':
                from models import Lecturer
                staff = Lecturer(
                    staff_number=data['staff_number'],
                    user_id=user.id,
                    department_id=data['department_id'],
                    title=data.get('title'),
                    specialization=data.get('specialization')
                )
            elif role_name == 'Finance Officer':
                from models import FinanceStaff
                staff = FinanceStaff(
                    staff_number=data['staff_number'],
                    user_id=user.id,
                    designation=data.get('designation')
                )
            elif role_name == 'Faculty Officer':
                from models import FacultyOfficer
                staff = FacultyOfficer(
                    staff_number=data['staff_number'],
                    user_id=user.id,
                    faculty_id=data['faculty_id'],
                    designation=data.get('designation')
                )
            elif role_name == 'College Officer':
                from models import CollegeOfficer
                staff = CollegeOfficer(
                    staff_number=data['staff_number'],
                    user_id=user.id,
                    college_id=data['college_id'],
                    designation=data.get('designation')
                )
            else:
                db.session.rollback()
                return {'success': False, 'error': 'Invalid role'}
            
            db.session.add(staff)
            db.session.commit()
            
            return {
                'success': True,
                'message': f'{role_name} registered successfully',
                'user_id': user.id,
                'staff_id': staff.id
            }
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def change_password(user_id, current_password, new_password, confirm_password):
        """Change user password"""
        user = User.query.get(user_id)
        if not user:
            return {'success': False, 'error': 'User not found'}
        
        if new_password != confirm_password:
            return {'success': False, 'error': 'New passwords do not match'}
        
        if not user.check_password(current_password):
            return {'success': False, 'error': 'Current password is incorrect'}
        
        user.set_password(new_password)
        db.session.commit()
        
        return {'success': True, 'message': 'Password changed successfully'}
    
    @staticmethod
    def reset_password(email):
        """Initiate password reset"""
        user = User.query.filter_by(email=email).first()
        if not user:
            return {'success': False, 'error': 'Email not found'}
        
        # Generate reset token
        token = secrets.token_urlsafe(32)
        # Store token in database (would need a PasswordReset model)
        
        # Send email with reset link (implement email service)
        
        return {'success': True, 'message': 'Password reset email sent'}
    
    @staticmethod
    def get_user_data(user):
        """Get user data for response"""
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.get_full_name(),
            'role': user.get_role_name(),
            'is_admin': user.is_admin(),
            'is_student': user.is_student(),
            'is_lecturer': user.is_lecturer(),
            'is_finance_officer': user.is_finance_officer(),
            'is_faculty_officer': user.is_faculty_officer(),
            'is_college_officer': user.is_college_officer()
        }
    
    @staticmethod
    def log_activity(user_id, action, description, ip_address=None, user_agent=None):
        """Log user activity"""
        try:
            log = ActivityLog(
                action=action,
                user_id=user_id,
                description=description,
                ip_address=ip_address,
                user_agent=user_agent
            )
            db.session.add(log)
            db.session.commit()
        except:
            db.session.rollback()
    
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_username(username):
        """Validate username format"""
        pattern = r'^[a-zA-Z0-9_]{3,30}$'
        return re.match(pattern, username) is not None
    
    @staticmethod
    def check_permission(user, required_role):
        """Check if user has required role"""
        if not user or not user.is_authenticated:
            return False
        
        if user.is_admin():
            return True
        
        role_map = {
            'student': user.is_student,
            'lecturer': user.is_lecturer,
            'finance_officer': user.is_finance_officer,
            'faculty_officer': user.is_faculty_officer,
            'college_officer': user.is_college_officer
        }
        
        if required_role in role_map:
            return role_map[required_role]()
        
        return False