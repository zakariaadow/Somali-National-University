from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import User, Student, Lecturer, FinanceOfficer, FacultyOfficer, CollegeOfficer, Role, ActivityLog, Programme, Department, Faculty, College
from extensions import db
from utils.decorators import role_required
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard', methods=['GET'])
@login_required
@role_required('Admin')
def get_dashboard():
    """Get admin dashboard statistics"""
    try:
        stats = {
            'total_users': User.query.count(),
            'total_students': Student.query.count(),
            'total_lecturers': Lecturer.query.count(),
            'total_colleges': College.query.count(),
            'total_faculties': Faculty.query.count(),
            'total_departments': Department.query.count(),
            'total_programmes': Programme.query.count(),
            'active_users': User.query.filter_by(is_active=True).count(),
            'recent_registrations': Student.query.order_by(Student.created_at.desc()).limit(10).all()
        }
        
        # Convert recent registrations to dict
        recent_students = []
        for student in stats['recent_registrations']:
            recent_students.append({
                'id': student.id,
                'registration_number': student.registration_number,
                'full_name': student.user.get_full_name() if student.user else 'N/A',
                'email': student.user.email if student.user else 'N/A',
                'created_at': student.created_at.isoformat() if student.created_at else None
            })
        stats['recent_registrations'] = recent_students
        
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
@login_required
@role_required('Admin')
def get_users():
    """Get all users with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        role_id = request.args.get('role_id', type=int)
        search = request.args.get('search', '')
        is_active = request.args.get('is_active', type=bool)
        
        query = User.query
        
        if role_id:
            query = query.filter_by(role_id=role_id)
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        if search:
            query = query.filter(
                db.or_(
                    User.first_name.ilike(f'%{search}%'),
                    User.last_name.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    User.username.ilike(f'%{search}%')
                )
            )
        
        users = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Get role and profile for each user
        users_with_details = []
        for user in users.items:
            user_data = user.to_dict()
            profile = None
            
            if user.role.name == 'Student':
                profile = Student.query.filter_by(user_id=user.id).first()
                if profile:
                    user_data['registration_number'] = profile.registration_number
                    user_data['programme'] = profile.programme.name if profile.programme else None
            elif user.role.name == 'Lecturer':
                profile = Lecturer.query.filter_by(user_id=user.id).first()
                if profile:
                    user_data['staff_number'] = profile.staff_number
                    user_data['department'] = profile.department.name if profile.department else None
            elif user.role.name == 'Finance Officer':
                profile = FinanceOfficer.query.filter_by(user_id=user.id).first()
                if profile:
                    user_data['employee_number'] = profile.employee_number
            elif user.role.name == 'Faculty Officer':
                profile = FacultyOfficer.query.filter_by(user_id=user.id).first()
                if profile:
                    user_data['employee_number'] = profile.employee_number
                    user_data['faculty'] = profile.faculty.name if profile.faculty else None
            elif user.role.name == 'College Officer':
                profile = CollegeOfficer.query.filter_by(user_id=user.id).first()
                if profile:
                    user_data['employee_number'] = profile.employee_number
                    user_data['college'] = profile.college.name if profile.college else None
            
            users_with_details.append(user_data)
        
        return jsonify({
            'users': users_with_details,
            'total': users.total,
            'page': users.page,
            'pages': users.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@login_required
@role_required('Admin')
def get_user(user_id):
    """Get user by ID with profile details"""
    try:
        user = User.query.get_or_404(user_id)
        user_data = user.to_dict()
        
        # Get profile based on role
        profile = None
        if user.role.name == 'Student':
            profile = Student.query.filter_by(user_id=user.id).first()
            if profile:
                user_data['profile'] = profile.to_dict()
        elif user.role.name == 'Lecturer':
            profile = Lecturer.query.filter_by(user_id=user.id).first()
            if profile:
                user_data['profile'] = profile.to_dict()
        elif user.role.name == 'Finance Officer':
            profile = FinanceOfficer.query.filter_by(user_id=user.id).first()
            if profile:
                user_data['profile'] = profile.to_dict()
        elif user.role.name == 'Faculty Officer':
            profile = FacultyOfficer.query.filter_by(user_id=user.id).first()
            if profile:
                user_data['profile'] = profile.to_dict()
        elif user.role.name == 'College Officer':
            profile = CollegeOfficer.query.filter_by(user_id=user.id).first()
            if profile:
                user_data['profile'] = profile.to_dict()
        
        return jsonify(user_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@login_required
@role_required('Admin')
def update_user(user_id):
    """Update user details"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'middle_name' in data:
            user.middle_name = data['middle_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'is_active' in data:
            user.is_active = data['is_active']
        if 'is_verified' in data:
            user.is_verified = data['is_verified']
        if 'role_id' in data:
            user.role_id = data['role_id']
        
        db.session.commit()
        
        # Log activity
        log = ActivityLog(
            user_id=current_user.id,
            action='ADMIN_UPDATE_USER',
            description=f'Updated user {user.username}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@login_required
@role_required('Admin')
def change_user_role(user_id):
    """Change user role"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        role_id = data.get('role_id')
        if not role_id:
            return jsonify({'error': 'Role ID is required'}), 400
        
        role = Role.query.get(role_id)
        if not role:
            return jsonify({'error': 'Role not found'}), 404
        
        # Check if user already has this role
        if user.role_id == role_id:
            return jsonify({'error': 'User already has this role'}), 400
        
        user.role_id = role_id
        db.session.commit()
        
        log = ActivityLog(
            user_id=current_user.id,
            action='ADMIN_CHANGE_ROLE',
            description=f'Changed role of {user.username} to {role.name}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'User role updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/students', methods=['GET'])
@login_required
@role_required('Admin')
def get_students():
    """Get all students with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        programme_id = request.args.get('programme_id', type=int)
        search = request.args.get('search', '')
        year_of_study = request.args.get('year_of_study', type=int)
        
        query = Student.query
        
        if programme_id:
            query = query.filter_by(programme_id=programme_id)
        if year_of_study:
            query = query.filter_by(year_of_study=year_of_study)
        if search:
            query = query.join(User).filter(
                db.or_(
                    User.first_name.ilike(f'%{search}%'),
                    User.last_name.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    Student.registration_number.ilike(f'%{search}%')
                )
            )
        
        students = query.order_by(Student.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        students_with_details = []
        for student in students.items:
            student_data = student.to_dict()
            student_data['full_name'] = student.user.get_full_name() if student.user else 'N/A'
            student_data['email'] = student.user.email if student.user else 'N/A'
            student_data['programme_name'] = student.programme.name if student.programme else 'Not Assigned'
            students_with_details.append(student_data)
        
        return jsonify({
            'students': students_with_details,
            'total': students.total,
            'page': students.page,
            'pages': students.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/lecturers', methods=['GET'])
@login_required
@role_required('Admin')
def get_lecturers():
    """Get all lecturers with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        department_id = request.args.get('department_id', type=int)
        search = request.args.get('search', '')
        
        query = Lecturer.query
        
        if department_id:
            query = query.filter_by(department_id=department_id)
        if search:
            query = query.join(User).filter(
                db.or_(
                    User.first_name.ilike(f'%{search}%'),
                    User.last_name.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    Lecturer.staff_number.ilike(f'%{search}%')
                )
            )
        
        lecturers = query.order_by(Lecturer.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        lecturers_with_details = []
        for lecturer in lecturers.items:
            lecturer_data = lecturer.to_dict()
            lecturer_data['full_name'] = lecturer.user.get_full_name() if lecturer.user else 'N/A'
            lecturer_data['email'] = lecturer.user.email if lecturer.user else 'N/A'
            lecturer_data['department_name'] = lecturer.department.name if lecturer.department else 'N/A'
            lecturers_with_details.append(lecturer_data)
        
        return jsonify({
            'lecturers': lecturers_with_details,
            'total': lecturers.total,
            'page': lecturers.page,
            'pages': lecturers.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/activity-logs', methods=['GET'])
@login_required
@role_required('Admin')
def get_activity_logs():
    """Get system activity logs"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        user_id = request.args.get('user_id', type=int)
        action = request.args.get('action')
        
        query = ActivityLog.query
        if user_id:
            query = query.filter_by(user_id=user_id)
        if action:
            query = query.filter_by(action=action)
        
        logs = query.order_by(ActivityLog.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        logs_with_details = []
        for log in logs.items:
            log_data = log.to_dict()
            if log.user:
                log_data['user_name'] = log.user.get_full_name()
            logs_with_details.append(log_data)
        
        return jsonify({
            'logs': logs_with_details,
            'total': logs.total,
            'page': logs.page,
            'pages': logs.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/system-stats', methods=['GET'])
@login_required
@role_required('Admin')
def get_system_stats():
    """Get system statistics"""
    try:
        stats = {
            'total_users': User.query.count(),
            'total_students': Student.query.count(),
            'total_lecturers': Lecturer.query.count(),
            'total_colleges': College.query.count(),
            'total_faculties': Faculty.query.count(),
            'total_departments': Department.query.count(),
            'total_programmes': Programme.query.count(),
            'active_users': User.query.filter_by(is_active=True).count(),
            'verified_users': User.query.filter_by(is_verified=True).count(),
            'role_counts': {}
        }
        
        # Get role counts
        roles = Role.query.all()
        for role in roles:
            count = User.query.filter_by(role_id=role.id).count()
            stats['role_counts'][role.name] = count
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
