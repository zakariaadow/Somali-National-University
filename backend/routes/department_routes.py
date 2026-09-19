from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import Department, Faculty, Unit, Programme, ActivityLog
from extensions import db
from utils.decorators import role_required

department_bp = Blueprint('department', __name__)

# ============ PUBLIC ENDPOINTS ============

@department_bp.route('/', methods=['GET'])
def get_departments():
    """Get all departments - Public endpoint"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        faculty_id = request.args.get('faculty_id', type=int)
        is_active = request.args.get('is_active', type=bool)
        
        query = Department.query
        if faculty_id:
            query = query.filter_by(faculty_id=faculty_id)
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        departments = query.paginate(page=page, per_page=per_page, error_out=False)
        
        result = []
        for d in departments.items:
            dept_data = d.to_dict()
            if d.faculty:
                dept_data['faculty_name'] = d.faculty.name
            result.append(dept_data)
        
        return jsonify({
            'departments': result,
            'total': departments.total,
            'page': departments.page,
            'pages': departments.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@department_bp.route('/<int:department_id>', methods=['GET'])
def get_department(department_id):
    """Get department details with units and programmes - Public endpoint"""
    try:
        department = Department.query.get_or_404(department_id)
        
        return jsonify({
            'department': department.to_dict(),
            'faculty': department.faculty.to_dict() if department.faculty else None,
            'units': [u.to_dict() for u in department.units if u.is_active],
            'programmes': [p.to_dict() for p in department.programmes if p.is_active]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@department_bp.route('/<int:department_id>/units', methods=['GET'])
def get_department_units(department_id):
    """Get all units in a department - Public endpoint"""
    try:
        department = Department.query.get_or_404(department_id)
        units = Unit.query.filter_by(department_id=department_id, is_active=True).all()
        
        result = []
        for u in units:
            data = u.to_dict()
            if u.semester:
                data['semester_name'] = u.semester.name
            result.append(data)
        
        return jsonify({
            'units': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@department_bp.route('/<int:department_id>/programmes', methods=['GET'])
def get_department_programmes(department_id):
    """Get all programmes in a department - Public endpoint"""
    try:
        department = Department.query.get_or_404(department_id)
        programmes = Programme.query.filter_by(department_id=department_id, is_active=True).all()
        
        result = []
        for p in programmes:
            data = p.to_dict()
            if p.college:
                data['college_name'] = p.college.name
            result.append(data)
        
        return jsonify({
            'programmes': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ PROTECTED ENDPOINTS ============

@department_bp.route('/', methods=['POST'])
@login_required
@role_required('Admin', 'College Officer', 'Faculty Officer')
def create_department():
    """Create a new department - Admin/College Officer/Faculty Officer only"""
    try:
        data = request.get_json()
        
        if Department.query.filter_by(code=data['code']).first():
            return jsonify({'error': 'Department code already exists'}), 400
        
        faculty = Faculty.query.get(data['faculty_id'])
        if not faculty:
            return jsonify({'error': 'Faculty not found'}), 404
        
        department = Department(
            name=data['name'],
            code=data['code'],
            description=data.get('description'),
            head_name=data.get('head_name'),
            head_email=data.get('head_email'),
            head_phone=data.get('head_phone'),
            faculty_id=data['faculty_id']
        )
        
        db.session.add(department)
        db.session.commit()
        
        log = ActivityLog(
            user_id=current_user.id,
            action='CREATE_DEPARTMENT',
            description=f'Created department {department.name}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Department created successfully',
            'department': department.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@department_bp.route('/<int:department_id>', methods=['PUT'])
@login_required
@role_required('Admin', 'College Officer', 'Faculty Officer')
def update_department(department_id):
    """Update department - Admin/College Officer/Faculty Officer only"""
    try:
        department = Department.query.get_or_404(department_id)
        data = request.get_json()
        
        if 'name' in data:
            department.name = data['name']
        if 'description' in data:
            department.description = data['description']
        if 'head_name' in data:
            department.head_name = data['head_name']
        if 'head_email' in data:
            department.head_email = data['head_email']
        if 'head_phone' in data:
            department.head_phone = data['head_phone']
        if 'faculty_id' in data:
            department.faculty_id = data['faculty_id']
        if 'is_active' in data:
            department.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Department updated successfully',
            'department': department.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@department_bp.route('/<int:department_id>', methods=['DELETE'])
@login_required
@role_required('Admin', 'College Officer', 'Faculty Officer')
def delete_department(department_id):
    """Delete department (soft delete) - Admin/College Officer/Faculty Officer only"""
    try:
        department = Department.query.get_or_404(department_id)
        department.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Department deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500