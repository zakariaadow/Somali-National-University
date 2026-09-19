from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import Unit, Department, Semester, ActivityLog
from extensions import db
from utils.decorators import role_required

unit_bp = Blueprint('unit', __name__)

# ============ PUBLIC ENDPOINTS ============

@unit_bp.route('/', methods=['GET'])
def get_units():
    """Get all units - Public endpoint"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        department_id = request.args.get('department_id', type=int)
        semester_id = request.args.get('semester_id', type=int)
        
        query = Unit.query
        if department_id:
            query = query.filter_by(department_id=department_id)
        if semester_id:
            query = query.filter_by(semester_id=semester_id)
        
        units = query.paginate(page=page, per_page=per_page, error_out=False)
        
        result = []
        for u in units.items:
            data = u.to_dict()
            if u.department:
                data['department_name'] = u.department.name
            if u.semester:
                data['semester_name'] = u.semester.name
            result.append(data)
        
        return jsonify({
            'units': result,
            'total': units.total,
            'page': units.page,
            'pages': units.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@unit_bp.route('/<int:unit_id>', methods=['GET'])
def get_unit(unit_id):
    """Get unit details - Public endpoint"""
    try:
        unit = Unit.query.get_or_404(unit_id)
        
        data = unit.to_dict()
        if unit.department:
            data['department_name'] = unit.department.name
        if unit.semester:
            data['semester_name'] = unit.semester.name
        
        return jsonify(data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@unit_bp.route('/department/<int:department_id>', methods=['GET'])
def get_units_by_department(department_id):
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

@unit_bp.route('/semester/<int:semester_id>', methods=['GET'])
def get_units_by_semester(semester_id):
    """Get all units in a semester - Public endpoint"""
    try:
        semester = Semester.query.get_or_404(semester_id)
        units = Unit.query.filter_by(semester_id=semester_id, is_active=True).all()
        
        result = []
        for u in units:
            data = u.to_dict()
            if u.department:
                data['department_name'] = u.department.name
            result.append(data)
        
        return jsonify({
            'units': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ PROTECTED ENDPOINTS ============

@unit_bp.route('/', methods=['POST'])
@login_required
@role_required('Admin', 'Faculty Officer')
def create_unit():
    """Create a new unit - Admin/Faculty Officer only"""
    try:
        data = request.get_json()
        
        if Unit.query.filter_by(unit_code=data['unit_code']).first():
            return jsonify({'error': 'Unit code already exists'}), 400
        
        department = Department.query.get(data['department_id'])
        if not department:
            return jsonify({'error': 'Department not found'}), 404
        
        semester = Semester.query.get(data['semester_id'])
        if not semester:
            return jsonify({'error': 'Semester not found'}), 404
        
        unit = Unit(
            unit_code=data['unit_code'],
            unit_name=data['unit_name'],
            credits=data.get('credits', 3),
            description=data.get('description'),
            department_id=data['department_id'],
            semester_id=data['semester_id']
        )
        
        db.session.add(unit)
        db.session.commit()
        
        log = ActivityLog(
            user_id=current_user.id,
            action='CREATE_UNIT',
            description=f'Created unit {unit.unit_code}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Unit created successfully',
            'unit': unit.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@unit_bp.route('/<int:unit_id>', methods=['PUT'])
@login_required
@role_required('Admin', 'Faculty Officer')
def update_unit(unit_id):
    """Update unit - Admin/Faculty Officer only"""
    try:
        unit = Unit.query.get_or_404(unit_id)
        data = request.get_json()
        
        if 'unit_name' in data:
            unit.unit_name = data['unit_name']
        if 'credits' in data:
            unit.credits = data['credits']
        if 'description' in data:
            unit.description = data['description']
        if 'department_id' in data:
            unit.department_id = data['department_id']
        if 'semester_id' in data:
            unit.semester_id = data['semester_id']
        if 'is_active' in data:
            unit.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Unit updated successfully',
            'unit': unit.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@unit_bp.route('/<int:unit_id>', methods=['DELETE'])
@login_required
@role_required('Admin', 'Faculty Officer')
def delete_unit(unit_id):
    """Delete unit (soft delete) - Admin/Faculty Officer only"""
    try:
        unit = Unit.query.get_or_404(unit_id)
        unit.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Unit deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500