from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import AcademicYear, Semester, Registration, ActivityLog
from extensions import db
from datetime import datetime
from utils.decorators import role_required

academic_year_bp = Blueprint('academic_year', __name__)

# Make GET endpoints public
@academic_year_bp.route('/', methods=['GET'])
def get_academic_years():
    """Get all academic years - Public endpoint"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        is_current = request.args.get('is_current', type=bool)
        is_active = request.args.get('is_active', type=bool)
        
        query = AcademicYear.query
        if is_current is not None:
            query = query.filter_by(is_current=is_current)
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        academic_years = query.order_by(AcademicYear.start_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        result = []
        for ay in academic_years.items:
            data = ay.to_dict()
            if not data.get('start_year') and ay.start_date:
                data['start_year'] = ay.start_date.year
            if not data.get('end_year') and ay.end_date:
                data['end_year'] = ay.end_date.year
            result.append(data)
        
        return jsonify({
            'academic_years': result,
            'total': academic_years.total,
            'page': academic_years.page,
            'pages': academic_years.pages
        }), 200
        
    except Exception as e:
        print(f"Error in get_academic_years: {str(e)}")
        return jsonify({'error': str(e)}), 500

@academic_year_bp.route('/<int:academic_year_id>', methods=['GET'])
def get_academic_year(academic_year_id):
    """Get academic year details - Public endpoint"""
    try:
        academic_year = AcademicYear.query.get_or_404(academic_year_id)
        data = academic_year.to_dict()
        if not data.get('start_year') and academic_year.start_date:
            data['start_year'] = academic_year.start_date.year
        if not data.get('end_year') and academic_year.end_date:
            data['end_year'] = academic_year.end_date.year
        
        return jsonify({
            'academic_year': data,
            'semesters': [s.to_dict() for s in academic_year.semesters if s.is_active]
        }), 200
    except Exception as e:
        print(f"Error in get_academic_year: {str(e)}")
        return jsonify({'error': str(e)}), 500

@academic_year_bp.route('/current', methods=['GET'])
def get_current_academic_year():
    """Get current academic year - Public endpoint"""
    try:
        academic_year = AcademicYear.query.filter_by(is_current=True).first()
        if not academic_year:
            return jsonify({'error': 'No current academic year found'}), 404
        data = academic_year.to_dict()
        if not data.get('start_year') and academic_year.start_date:
            data['start_year'] = academic_year.start_date.year
        if not data.get('end_year') and academic_year.end_date:
            data['end_year'] = academic_year.end_date.year
        return jsonify(data), 200
    except Exception as e:
        print(f"Error in get_current_academic_year: {str(e)}")
        return jsonify({'error': str(e)}), 500

@academic_year_bp.route('/', methods=['POST'])
@login_required
@role_required('Admin')
def create_academic_year():
    """Create a new academic year - Admin only"""
    try:
        data = request.get_json()
        
        existing = AcademicYear.query.filter_by(
            name=data['name']
        ).first()
        if existing:
            return jsonify({'error': 'Academic year already exists'}), 400
        
        academic_year = AcademicYear(
            name=data['name'],
            start_year=data.get('start_year'),
            end_year=data.get('end_year'),
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date(),
            is_current=data.get('is_current', False)
        )
        
        db.session.add(academic_year)
        db.session.commit()
        
        if academic_year.is_current:
            AcademicYear.query.filter(
                AcademicYear.id != academic_year.id
            ).update({'is_current': False})
            db.session.commit()
        
        log = ActivityLog(
            user_id=current_user.id,
            action='CREATE_ACADEMIC_YEAR',
            description=f'Created academic year {academic_year.name}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Academic year created successfully',
            'academic_year': academic_year.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in create_academic_year: {str(e)}")
        return jsonify({'error': str(e)}), 500

@academic_year_bp.route('/<int:academic_year_id>', methods=['PUT'])
@login_required
@role_required('Admin')
def update_academic_year(academic_year_id):
    """Update academic year - Admin only"""
    try:
        academic_year = AcademicYear.query.get_or_404(academic_year_id)
        data = request.get_json()
        
        if 'name' in data:
            academic_year.name = data['name']
        if 'start_year' in data:
            academic_year.start_year = data['start_year']
        if 'end_year' in data:
            academic_year.end_year = data['end_year']
        if 'start_date' in data:
            academic_year.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if 'end_date' in data:
            academic_year.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        if 'is_current' in data:
            academic_year.is_current = data['is_current']
            if academic_year.is_current:
                AcademicYear.query.filter(
                    AcademicYear.id != academic_year.id
                ).update({'is_current': False})
        if 'is_active' in data:
            academic_year.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Academic year updated successfully',
            'academic_year': academic_year.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in update_academic_year: {str(e)}")
        return jsonify({'error': str(e)}), 500

@academic_year_bp.route('/<int:academic_year_id>', methods=['DELETE'])
@login_required
@role_required('Admin')
def delete_academic_year(academic_year_id):
    """Delete academic year (soft delete) - Admin only"""
    try:
        academic_year = AcademicYear.query.get_or_404(academic_year_id)
        academic_year.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Academic year deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in delete_academic_year: {str(e)}")
        return jsonify({'error': str(e)}), 500
