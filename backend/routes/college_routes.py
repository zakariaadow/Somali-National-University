from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import College, Faculty, Programme, ActivityLog
from extensions import db
from utils.decorators import role_required

college_bp = Blueprint('college', __name__)

# ============ PUBLIC ENDPOINTS (No Login Required) ============

@college_bp.route('/', methods=['GET'])
def get_colleges():
    """Get all colleges - Public endpoint"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        is_active = request.args.get('is_active', type=bool)
        
        query = College.query
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        colleges = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'colleges': [c.to_dict() for c in colleges.items],
            'total': colleges.total,
            'page': colleges.page,
            'pages': colleges.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@college_bp.route('/<int:college_id>', methods=['GET'])
def get_college(college_id):
    """Get college details with faculties and programmes - Public endpoint"""
    try:
        college = College.query.get_or_404(college_id)
        
        return jsonify({
            'college': college.to_dict(),
            'faculties': [f.to_dict() for f in college.faculties if f.is_active],
            'programmes': [p.to_dict() for p in college.programmes if p.is_active]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@college_bp.route('/<int:college_id>/faculties', methods=['GET'])
def get_college_faculties(college_id):
    """Get all faculties in a college - Public endpoint"""
    try:
        college = College.query.get_or_404(college_id)
        faculties = Faculty.query.filter_by(college_id=college_id, is_active=True).all()
        
        return jsonify({
            'faculties': [f.to_dict() for f in faculties],
            'total': len(faculties)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@college_bp.route('/<int:college_id>/programmes', methods=['GET'])
def get_college_programmes(college_id):
    """Get all programmes in a college - Public endpoint"""
    try:
        college = College.query.get_or_404(college_id)
        programmes = Programme.query.filter_by(college_id=college_id, is_active=True).all()
        
        result = []
        for p in programmes:
            data = p.to_dict()
            if p.department:
                data['department_name'] = p.department.name
            result.append(data)
        
        return jsonify({
            'programmes': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ PROTECTED ENDPOINTS (Login Required) ============

@college_bp.route('/', methods=['POST'])
@login_required
@role_required('Admin')
def create_college():
    """Create a new college - Admin only"""
    try:
        data = request.get_json()
        
        if College.query.filter_by(code=data['code']).first():
            return jsonify({'error': 'College code already exists'}), 400
        
        college = College(
            name=data['name'],
            code=data['code'],
            description=data.get('description'),
            dean_name=data.get('dean_name'),
            dean_email=data.get('dean_email'),
            dean_phone=data.get('dean_phone')
        )
        
        db.session.add(college)
        db.session.commit()
        
        log = ActivityLog(
            user_id=current_user.id,
            action='CREATE_COLLEGE',
            description=f'Created college {college.name}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'College created successfully',
            'college': college.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@college_bp.route('/<int:college_id>', methods=['PUT'])
@login_required
@role_required('Admin', 'College Officer')
def update_college(college_id):
    """Update college - Admin/College Officer only"""
    try:
        college = College.query.get_or_404(college_id)
        data = request.get_json()
        
        if 'name' in data:
            college.name = data['name']
        if 'description' in data:
            college.description = data['description']
        if 'dean_name' in data:
            college.dean_name = data['dean_name']
        if 'dean_email' in data:
            college.dean_email = data['dean_email']
        if 'dean_phone' in data:
            college.dean_phone = data['dean_phone']
        if 'is_active' in data:
            college.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'College updated successfully',
            'college': college.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@college_bp.route('/<int:college_id>', methods=['DELETE'])
@login_required
@role_required('Admin')
def delete_college(college_id):
    """Delete college (soft delete) - Admin only"""
    try:
        college = College.query.get_or_404(college_id)
        college.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'College deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500