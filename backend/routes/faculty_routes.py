from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import Faculty, College, Department, ActivityLog
from extensions import db
from utils.decorators import role_required

faculty_bp = Blueprint('faculty', __name__)

# ============ PUBLIC ENDPOINTS ============

@faculty_bp.route('/', methods=['GET'])
def get_faculties():
    """Get all faculties - Public endpoint"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        college_id = request.args.get('college_id', type=int)
        is_active = request.args.get('is_active', type=bool)
        
        query = Faculty.query
        if college_id:
            query = query.filter_by(college_id=college_id)
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        faculties = query.paginate(page=page, per_page=per_page, error_out=False)
        
        result = []
        for f in faculties.items:
            faculty_data = f.to_dict()
            if f.college:
                faculty_data['college_name'] = f.college.name
            result.append(faculty_data)
        
        return jsonify({
            'faculties': result,
            'total': faculties.total,
            'page': faculties.page,
            'pages': faculties.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@faculty_bp.route('/<int:faculty_id>', methods=['GET'])
def get_faculty(faculty_id):
    """Get faculty details with departments - Public endpoint"""
    try:
        faculty = Faculty.query.get_or_404(faculty_id)
        
        return jsonify({
            'faculty': faculty.to_dict(),
            'college': faculty.college.to_dict() if faculty.college else None,
            'departments': [d.to_dict() for d in faculty.departments if d.is_active]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@faculty_bp.route('/<int:faculty_id>/departments', methods=['GET'])
def get_faculty_departments(faculty_id):
    """Get all departments in a faculty - Public endpoint"""
    try:
        faculty = Faculty.query.get_or_404(faculty_id)
        departments = Department.query.filter_by(faculty_id=faculty_id, is_active=True).all()
        
        return jsonify({
            'departments': [d.to_dict() for d in departments],
            'total': len(departments)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@faculty_bp.route('/<int:faculty_id>/programmes', methods=['GET'])
def get_faculty_programmes(faculty_id):
    """Get all programmes in a faculty - Public endpoint"""
    try:
        faculty = Faculty.query.get_or_404(faculty_id)
        dept_ids = [d.id for d in faculty.departments]
        programmes = Programme.query.filter(Programme.department_id.in_(dept_ids), Programme.is_active==True).all()
        
        result = []
        for p in programmes:
            data = p.to_dict()
            if p.department:
                data['department_name'] = p.department.name
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

@faculty_bp.route('/', methods=['POST'])
@login_required
@role_required('Admin', 'College Officer')
def create_faculty():
    """Create a new faculty - Admin/College Officer only"""
    try:
        data = request.get_json()
        
        if Faculty.query.filter_by(code=data['code']).first():
            return jsonify({'error': 'Faculty code already exists'}), 400
        
        college = College.query.get(data['college_id'])
        if not college:
            return jsonify({'error': 'College not found'}), 404
        
        faculty = Faculty(
            name=data['name'],
            code=data['code'],
            description=data.get('description'),
            dean_name=data.get('dean_name'),
            dean_email=data.get('dean_email'),
            dean_phone=data.get('dean_phone'),
            college_id=data['college_id']
        )
        
        db.session.add(faculty)
        db.session.commit()
        
        log = ActivityLog(
            user_id=current_user.id,
            action='CREATE_FACULTY',
            description=f'Created faculty {faculty.name}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Faculty created successfully',
            'faculty': faculty.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@faculty_bp.route('/<int:faculty_id>', methods=['PUT'])
@login_required
@role_required('Admin', 'College Officer', 'Faculty Officer')
def update_faculty(faculty_id):
    """Update faculty - Admin/College Officer/Faculty Officer only"""
    try:
        faculty = Faculty.query.get_or_404(faculty_id)
        data = request.get_json()
        
        if 'name' in data:
            faculty.name = data['name']
        if 'description' in data:
            faculty.description = data['description']
        if 'dean_name' in data:
            faculty.dean_name = data['dean_name']
        if 'dean_email' in data:
            faculty.dean_email = data['dean_email']
        if 'dean_phone' in data:
            faculty.dean_phone = data['dean_phone']
        if 'college_id' in data:
            faculty.college_id = data['college_id']
        if 'is_active' in data:
            faculty.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Faculty updated successfully',
            'faculty': faculty.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@faculty_bp.route('/<int:faculty_id>', methods=['DELETE'])
@login_required
@role_required('Admin', 'College Officer')
def delete_faculty(faculty_id):
    """Delete faculty (soft delete) - Admin/College Officer only"""
    try:
        faculty = Faculty.query.get_or_404(faculty_id)
        faculty.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Faculty deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500