from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import Programme, College, Department, ActivityLog
from extensions import db
from utils.decorators import role_required

programme_bp = Blueprint('programme', __name__)

# ============ PUBLIC ENDPOINTS ============

@programme_bp.route('/', methods=['GET'])
def get_programmes():
    """Get all programmes - Public endpoint"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        college_id = request.args.get('college_id', type=int)
        department_id = request.args.get('department_id', type=int)
        is_active = request.args.get('is_active', type=bool)
        
        query = Programme.query
        if college_id:
            query = query.filter_by(college_id=college_id)
        if department_id:
            query = query.filter_by(department_id=department_id)
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        programmes = query.paginate(page=page, per_page=per_page, error_out=False)
        
        result = []
        for p in programmes.items:
            data = p.to_dict()
            if p.department:
                data['department_name'] = p.department.name
            if p.college:
                data['college_name'] = p.college.name
            result.append(data)
        
        return jsonify({
            'programmes': result,
            'total': programmes.total,
            'page': programmes.page,
            'pages': programmes.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@programme_bp.route('/<int:programme_id>', methods=['GET'])
def get_programme(programme_id):
    """Get programme details - Public endpoint"""
    try:
        programme = Programme.query.get_or_404(programme_id)
        
        data = programme.to_dict()
        if programme.department:
            data['department_name'] = programme.department.name
        if programme.college:
            data['college_name'] = programme.college.name
        
        return jsonify(data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ PROTECTED ENDPOINTS ============

@programme_bp.route('/', methods=['POST'])
@login_required
@role_required('Admin', 'College Officer')
def create_programme():
    """Create a new programme - Admin/College Officer only"""
    try:
        data = request.get_json()
        
        if Programme.query.filter_by(code=data['code']).first():
            return jsonify({'error': 'Programme code already exists'}), 400
        
        college = College.query.get(data['college_id'])
        if not college:
            return jsonify({'error': 'College not found'}), 404
        
        department = Department.query.get(data['department_id'])
        if not department:
            return jsonify({'error': 'Department not found'}), 404
        
        programme = Programme(
            name=data['name'],
            code=data['code'],
            duration_years=data.get('duration_years', 4),
            description=data.get('description'),
            college_id=data['college_id'],
            department_id=data['department_id']
        )
        
        db.session.add(programme)
        db.session.commit()
        
        log = ActivityLog(
            user_id=current_user.id,
            action='CREATE_PROGRAMME',
            description=f'Created programme {programme.name}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Programme created successfully',
            'programme': programme.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@programme_bp.route('/<int:programme_id>', methods=['PUT'])
@login_required
@role_required('Admin', 'College Officer')
def update_programme(programme_id):
    """Update programme - Admin/College Officer only"""
    try:
        programme = Programme.query.get_or_404(programme_id)
        data = request.get_json()
        
        if 'name' in data:
            programme.name = data['name']
        if 'description' in data:
            programme.description = data['description']
        if 'duration_years' in data:
            programme.duration_years = data['duration_years']
        if 'college_id' in data:
            programme.college_id = data['college_id']
        if 'department_id' in data:
            programme.department_id = data['department_id']
        if 'is_active' in data:
            programme.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Programme updated successfully',
            'programme': programme.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@programme_bp.route('/<int:programme_id>', methods=['DELETE'])
@login_required
@role_required('Admin', 'College Officer')
def delete_programme(programme_id):
    """Delete programme (soft delete) - Admin/College Officer only"""
    try:
        programme = Programme.query.get_or_404(programme_id)
        programme.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Programme deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500