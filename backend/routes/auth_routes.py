from flask import Blueprint, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from datetime import datetime
from models import (
    User, Student, Lecturer, FinanceOfficer, FacultyOfficer, CollegeOfficer,
    Role, ActivityLog, Programme, Department, Faculty, College
)
from extensions import db
from utils.decorators import role_required
from utils.helpers import generate_registration_number

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Student registration - creates account and student profile"""
    try:
        data = request.get_json()
        print(f"📝 Registration data received: {data}")

        required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        programme_id = data.get('programme_id')
        if not programme_id:
            return jsonify({'error': 'Please select a programme'}), 400

        programme = Programme.query.get(programme_id)
        if not programme:
            return jsonify({'error': 'Invalid programme selected'}), 400

        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already taken'}), 400

        user = User(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            middle_name=data.get('middle_name', ''),
            phone=data.get('phone', ''),
            role_id=data.get('role_id', 2)
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.flush()

        registration_number = (
            data.get('registration_number')
            or generate_registration_number()
        )

        student = Student(
            registration_number=registration_number,
            admission_date=datetime.now().date(),
            year_of_study=data.get('year_of_study', 1),
            programme_id=programme_id,
            user_id=user.id
        )
        db.session.add(student)

        log = ActivityLog(
            user_id=user.id,
            action='REGISTER',
            description=f'Student {registration_number} registered for {programme.name}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            'message': 'Registration successful',
            'user': user.to_dict(),
            'student': student.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"❌ Registration error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """User login. GET returns JSON 401 to avoid 405 redirect loop."""
    # ⭐ THE FIX: Handle GET requests with a clean 401
    if request.method == 'GET':
        return jsonify({
            'error': 'Not authenticated',
            'message': 'Please log in',
            'authenticated': False
        }), 401

    try:
        data = request.get_json()
        print(f"🔐 Login attempt: {data.get('email') if data else 'no data'}")

        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400

        user = User.query.filter_by(email=data['email']).first()
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403

        login_user(user)
        user.last_login = datetime.utcnow()

        log = ActivityLog(
            user_id=user.id,
            action='LOGIN',
            description=f'User {user.username} logged in',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()

        profile = None
        if user.role.name == 'Student':
            profile = Student.query.filter_by(user_id=user.id).first()
        elif user.role.name == 'Lecturer':
            profile = Lecturer.query.filter_by(user_id=user.id).first()
        elif user.role.name == 'Finance Officer':
            profile = FinanceOfficer.query.filter_by(user_id=user.id).first()
        elif user.role.name == 'Faculty Officer':
            profile = FacultyOfficer.query.filter_by(user_id=user.id).first()
        elif user.role.name == 'College Officer':
            profile = CollegeOfficer.query.filter_by(user_id=user.id).first()

        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'profile': profile.to_dict() if profile else None,
            'role': user.role.name
        }), 200

    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    try:
        log = ActivityLog(
            user_id=current_user.id,
            action='LOGOUT',
            description=f'User {current_user.username} logged out',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        logout_user()
        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    try:
        profile = None
        if current_user.role.name == 'Student':
            profile = Student.query.filter_by(user_id=current_user.id).first()
        elif current_user.role.name == 'Lecturer':
            profile = Lecturer.query.filter_by(user_id=current_user.id).first()
        elif current_user.role.name == 'Finance Officer':
            profile = FinanceOfficer.query.filter_by(user_id=current_user.id).first()
        elif current_user.role.name == 'Faculty Officer':
            profile = FacultyOfficer.query.filter_by(user_id=current_user.id).first()
        elif current_user.role.name == 'College Officer':
            profile = CollegeOfficer.query.filter_by(user_id=current_user.id).first()

        return jsonify({
            'user': current_user.to_dict(),
            'profile': profile.to_dict() if profile else None,
            'role': current_user.role.name
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    try:
        data = request.get_json()
        for field in ['first_name', 'last_name', 'middle_name', 'phone', 'profile_picture']:
            if field in data:
                setattr(current_user, field, data[field])
        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully',
            'user': current_user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    try:
        data = request.get_json()
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Current password and new password are required'}), 400
        if not current_user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 401
        if len(data['new_password']) < 8:
            return jsonify({'error': 'New password must be at least 8 characters'}), 400
        current_user.set_password(data['new_password'])
        db.session.commit()
        return jsonify({'message': 'Password changed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        if not data.get('email'):
            return jsonify({'error': 'Email is required'}), 400
        user = User.query.filter_by(email=data['email']).first()
        if not user:
            return jsonify({'error': 'Email not found'}), 404
        return jsonify({'message': 'Password reset instructions sent to your email'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/roles', methods=['GET'])
def get_roles():
    try:
        roles = Role.query.all()
        return jsonify([role.to_dict() for role in roles]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500