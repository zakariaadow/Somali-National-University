# routes/admin_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import (
    User, Student, Lecturer, FinanceOfficer, FacultyOfficer, CollegeOfficer,
    Role, ActivityLog, Programme, Department, Faculty, College, AcademicYear
)
from extensions import db
from utils.decorators import role_required
from werkzeug.security import generate_password_hash
from datetime import datetime

admin_bp = Blueprint('admin', __name__)


# ============================================================
# DASHBOARD / STATS
# ============================================================

@admin_bp.route('/dashboard', methods=['GET'])
@login_required
@role_required('Admin')
def get_dashboard():
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


@admin_bp.route('/system-stats', methods=['GET'])
@login_required
@role_required('Admin')
def get_system_stats():
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
        for role in Role.query.all():
            stats['role_counts'][role.name] = User.query.filter_by(role_id=role.id).count()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================
# USERS — FULL CRUD
# ============================================================

@admin_bp.route('/users', methods=['GET', 'POST'])
@login_required
@role_required('Admin')
def users():
    """GET: list users. POST: create new user."""
    if request.method == 'POST':
        return _create_user()
    return _list_users()


def _list_users():
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

        users_with_details = []
        for user in users.items:
            user_data = user.to_dict()
            if user.role.name == 'Student':
                p = Student.query.filter_by(user_id=user.id).first()
                if p:
                    user_data['registration_number'] = p.registration_number
                    user_data['programme'] = p.programme.name if p.programme else None
            elif user.role.name == 'Lecturer':
                p = Lecturer.query.filter_by(user_id=user.id).first()
                if p:
                    user_data['staff_number'] = p.staff_number
                    user_data['department'] = p.department.name if p.department else None
            elif user.role.name == 'Finance Officer':
                p = FinanceOfficer.query.filter_by(user_id=user.id).first()
                if p:
                    user_data['employee_number'] = p.employee_number
            elif user.role.name == 'Faculty Officer':
                p = FacultyOfficer.query.filter_by(user_id=user.id).first()
                if p:
                    user_data['employee_number'] = p.employee_number
                    user_data['faculty'] = p.faculty.name if p.faculty else None
            elif user.role.name == 'College Officer':
                p = CollegeOfficer.query.filter_by(user_id=user.id).first()
                if p:
                    user_data['employee_number'] = p.employee_number
                    user_data['college'] = p.college.name if p.college else None
            users_with_details.append(user_data)

        return jsonify({
            'users': users_with_details,
            'total': users.total,
            'page': users.page,
            'pages': users.pages
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def _create_user():
    """Admin creates a new user (any role)."""
    try:
        data = request.get_json() or {}

        required = ['username', 'email', 'password', 'first_name', 'last_name', 'role_id']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 409

        role = Role.query.get(data['role_id'])
        if not role:
            return jsonify({'error': 'Role not found'}), 404

        user = User(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            middle_name=data.get('middle_name'),
            phone=data.get('phone'),
            role_id=data['role_id'],
            is_active=data.get('is_active', True),
            is_verified=data.get('is_verified', False)
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()

        # Auto-create role profile if student/lecturer/officer
        if role.name == 'Student':
            student = Student(
                user_id=user.id,
                registration_number=data.get('registration_number') or f"SNU-{datetime.now().year}-{user.id:04d}",
                programme_id=data.get('programme_id'),
                year_of_study=data.get('year_of_study', 1),
                admission_date=datetime.utcnow().date()
            )
            db.session.add(student)
        elif role.name == 'Lecturer':
            lec = Lecturer(
                user_id=user.id,
                staff_number=data.get('staff_number') or f"LEC-{user.id:03d}",
                department_id=data.get('department_id'),
                title=data.get('title'),
                specialization=data.get('specialization')
            )
            db.session.add(lec)
        elif role.name == 'Finance Officer':
            fo = FinanceOfficer(
                user_id=user.id,
                employee_number=data.get('employee_number') or f"FIN-{user.id:03d}"
            )
            db.session.add(fo)
        elif role.name == 'Faculty Officer':
            fo = FacultyOfficer(
                user_id=user.id,
                staff_number=data.get('staff_number') or f"FO-{user.id:03d}",
                faculty_id=data.get('faculty_id'),
                designation=data.get('designation')
            )
            db.session.add(fo)
        elif role.name == 'College Officer':
            co = CollegeOfficer(
                user_id=user.id,
                employee_number=data.get('employee_number') or f"CO-{user.id:03d}",
                college_id=data.get('college_id'),
                designation=data.get('designation')
            )
            db.session.add(co)

        db.session.commit()

        _log(current_user.id, 'ADMIN_CREATE_USER', f'Created user {user.username}')

        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
@role_required('Admin')
def user_detail(user_id):
    if request.method == 'GET':
        return _get_user(user_id)
    if request.method == 'PUT':
        return _update_user(user_id)
    if request.method == 'DELETE':
        return _delete_user(user_id)


def _get_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        user_data = user.to_dict()
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
        if profile:
            user_data['profile'] = profile.to_dict()
        return jsonify(user_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def _update_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json() or {}

        for field in ['first_name', 'last_name', 'middle_name', 'phone',
                      'is_active', 'is_verified', 'role_id']:
            if field in data:
                setattr(user, field, data[field])

        if 'email' in data and data['email'] != user.email:
            if User.query.filter_by(email=data['email']).first():
                return jsonify({'error': 'Email already exists'}), 409
            user.email = data['email']

        if 'username' in data and data['username'] != user.username:
            if User.query.filter_by(username=data['username']).first():
                return jsonify({'error': 'Username already exists'}), 409
            user.username = data['username']

        if data.get('password'):
            user.set_password(data['password'])

        db.session.commit()
        _log(current_user.id, 'ADMIN_UPDATE_USER', f'Updated user {user.username}')

        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


def _delete_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        if user.id == current_user.id:
            return jsonify({'error': 'You cannot delete your own account'}), 400

        username = user.username

        # Delete role profiles first
        Student.query.filter_by(user_id=user.id).delete()
        Lecturer.query.filter_by(user_id=user.id).delete()
        FinanceOfficer.query.filter_by(user_id=user.id).delete()
        FacultyOfficer.query.filter_by(user_id=user.id).delete()
        CollegeOfficer.query.filter_by(user_id=user.id).delete()

        db.session.delete(user)
        db.session.commit()
        _log(current_user.id, 'ADMIN_DELETE_USER', f'Deleted user {username}')

        return jsonify({'message': f'User {username} deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@login_required
@role_required('Admin')
def change_user_role(user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json() or {}
        role_id = data.get('role_id')
        if not role_id:
            return jsonify({'error': 'Role ID is required'}), 400
        role = Role.query.get(role_id)
        if not role:
            return jsonify({'error': 'Role not found'}), 404
        if user.role_id == role_id:
            return jsonify({'error': 'User already has this role'}), 400
        user.role_id = role_id
        db.session.commit()
        _log(current_user.id, 'ADMIN_CHANGE_ROLE',
             f'Changed role of {user.username} to {role.name}')
        return jsonify({
            'message': 'User role updated successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>/password', methods=['PUT'])
@login_required
@role_required('Admin')
def reset_user_password(user_id):
    """Admin resets a user's password."""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json() or {}
        new_password = data.get('password')
        if not new_password or len(new_password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        user.set_password(new_password)
        db.session.commit()
        _log(current_user.id, 'ADMIN_RESET_PASSWORD', f'Reset password for {user.username}')
        return jsonify({'message': f'Password reset for {user.username}'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============================================================
# STUDENTS — FULL CRUD
# ============================================================

@admin_bp.route('/students', methods=['GET', 'POST'])
@login_required
@role_required('Admin')
def students():
    if request.method == 'POST':
        return _create_student()
    return _list_students()


def _list_students():
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
        result = []
        for s in students.items:
            d = s.to_dict()
            d['full_name'] = s.user.get_full_name() if s.user else 'N/A'
            d['email'] = s.user.email if s.user else 'N/A'
            d['programme_name'] = s.programme.name if s.programme else 'Not Assigned'
            result.append(d)
        return jsonify({
            'students': result,
            'total': students.total,
            'page': students.page,
            'pages': students.pages
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def _create_student():
    """Create a User + Student pair."""
    try:
        data = request.get_json() or {}
        required = ['username', 'email', 'password', 'first_name', 'last_name']
        for f in required:
            if not data.get(f):
                return jsonify({'error': f'{f} is required'}), 400

        student_role = Role.query.filter_by(name='Student').first()
        if not student_role:
            return jsonify({'error': 'Student role not found'}), 500

        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 409

        user = User(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            middle_name=data.get('middle_name'),
            phone=data.get('phone'),
            role_id=student_role.id,
            is_active=True,
            is_verified=True
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.flush()  # get user.id

        student = Student(
            user_id=user.id,
            registration_number=data.get('registration_number') or f"SNU-{datetime.now().year}-{user.id:04d}",
            programme_id=data.get('programme_id'),
            year_of_study=data.get('year_of_study', 1),
            admission_date=datetime.utcnow().date()
        )
        db.session.add(student)
        db.session.commit()

        _log(current_user.id, 'ADMIN_CREATE_STUDENT', f'Created student {user.username}')

        return jsonify({
            'message': 'Student created successfully',
            'student': student.to_dict(),
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/students/<int:student_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
@role_required('Admin')
def student_detail(student_id):
    if request.method == 'GET':
        return _get_student(student_id)
    if request.method == 'PUT':
        return _update_student(student_id)
    if request.method == 'DELETE':
        return _delete_student(student_id)


def _get_student(student_id):
    try:
        s = Student.query.get_or_404(student_id)
        d = s.to_dict()
        d['user'] = s.user.to_dict() if s.user else None
        return jsonify(d), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def _update_student(student_id):
    try:
        s = Student.query.get_or_404(student_id)
        data = request.get_json() or {}

        for f in ['programme_id', 'year_of_study', 'is_active', 'is_registered',
                  'is_graduated', 'graduation_date', 'registration_number']:
            if f in data:
                setattr(s, f, data[f])

        if s.user:
            for f in ['first_name', 'last_name', 'middle_name', 'phone', 'email']:
                if f in data:
                    setattr(s.user, f, data[f])

        db.session.commit()
        _log(current_user.id, 'ADMIN_UPDATE_STUDENT', f'Updated student {s.id}')
        return jsonify({
            'message': 'Student updated',
            'student': s.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


def _delete_student(student_id):
    try:
        s = Student.query.get_or_404(student_id)
        uid = s.user_id
        reg = s.registration_number
        db.session.delete(s)
        # Delete user too (cascade)
        if uid:
            User.query.filter_by(id=uid).delete()
        db.session.commit()
        _log(current_user.id, 'ADMIN_DELETE_STUDENT', f'Deleted student {reg}')
        return jsonify({'message': f'Student {reg} deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============================================================
# LECTURERS — FULL CRUD
# ============================================================

@admin_bp.route('/lecturers', methods=['GET', 'POST'])
@login_required
@role_required('Admin')
def lecturers():
    if request.method == 'POST':
        return _create_lecturer()
    return _list_lecturers()


def _list_lecturers():
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
        result = []
        for l in lecturers.items:
            d = l.to_dict()
            d['full_name'] = l.user.get_full_name() if l.user else 'N/A'
            d['email'] = l.user.email if l.user else 'N/A'
            d['department_name'] = l.department.name if l.department else 'N/A'
            result.append(d)
        return jsonify({
            'lecturers': result,
            'total': lecturers.total,
            'page': lecturers.page,
            'pages': lecturers.pages
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def _create_lecturer():
    try:
        data = request.get_json() or {}
        required = ['username', 'email', 'password', 'first_name', 'last_name']
        for f in required:
            if not data.get(f):
                return jsonify({'error': f'{f} is required'}), 400

        role = Role.query.filter_by(name='Lecturer').first()
        if not role:
            return jsonify({'error': 'Lecturer role not found'}), 500
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 409

        user = User(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            middle_name=data.get('middle_name'),
            phone=data.get('phone'),
            role_id=role.id,
            is_active=True,
            is_verified=True
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.flush()

        lec = Lecturer(
            user_id=user.id,
            staff_number=data.get('staff_number') or f"LEC-{user.id:03d}",
            department_id=data.get('department_id'),
            title=data.get('title'),
            specialization=data.get('specialization'),
            qualification=data.get('qualification')
        )
        db.session.add(lec)
        db.session.commit()
        _log(current_user.id, 'ADMIN_CREATE_LECTURER', f'Created lecturer {user.username}')
        return jsonify({
            'message': 'Lecturer created',
            'lecturer': lec.to_dict(),
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/lecturers/<int:lecturer_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
@role_required('Admin')
def lecturer_detail(lecturer_id):
    if request.method == 'GET':
        lec = Lecturer.query.get_or_404(lecturer_id)
        d = lec.to_dict()
        d['user'] = lec.user.to_dict() if lec.user else None
        return jsonify(d), 200

    if request.method == 'PUT':
        try:
            lec = Lecturer.query.get_or_404(lecturer_id)
            data = request.get_json() or {}
            for f in ['department_id', 'title', 'specialization',
                      'qualification', 'staff_number', 'is_active']:
                if f in data:
                    setattr(lec, f, data[f])
            if lec.user:
                for f in ['first_name', 'last_name', 'middle_name', 'phone', 'email']:
                    if f in data:
                        setattr(lec.user, f, data[f])
            db.session.commit()
            _log(current_user.id, 'ADMIN_UPDATE_LECTURER', f'Updated lecturer {lec.id}')
            return jsonify({'message': 'Lecturer updated', 'lecturer': lec.to_dict()}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    if request.method == 'DELETE':
        try:
            lec = Lecturer.query.get_or_404(lecturer_id)
            uid = lec.user_id
            db.session.delete(lec)
            if uid:
                User.query.filter_by(id=uid).delete()
            db.session.commit()
            _log(current_user.id, 'ADMIN_DELETE_LECTURER', f'Deleted lecturer {lecturer_id}')
            return jsonify({'message': 'Lecturer deleted'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


# ============================================================
# ACTIVITY LOGS
# ============================================================

@admin_bp.route('/activity-logs', methods=['GET'])
@login_required
@role_required('Admin')
def get_activity_logs():
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
        result = []
        for log in logs.items:
            d = log.to_dict()
            if log.user:
                d['user_name'] = log.user.get_full_name()
            result.append(d)
        return jsonify({
            'logs': result,
            'total': logs.total,
            'page': logs.page,
            'pages': logs.pages
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================
# INTERNAL HELPERS
# ============================================================

def _log(user_id, action, description):
    """Insert an activity log."""
    try:
        log = ActivityLog(
            user_id=user_id,
            action=action,
            description=description,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
    except Exception:
        db.session.rollback()