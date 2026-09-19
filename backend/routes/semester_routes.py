from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import Semester, AcademicYear, Unit, Registration, ActivityLog
from extensions import db
from datetime import datetime
from utils.decorators import role_required

semester_bp = Blueprint('semester', __name__)

# Make GET endpoints public
@semester_bp.route('/', methods=['GET'])
def get_semesters():
    """Get all semesters - Public endpoint"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        academic_year_id = request.args.get('academic_year_id', type=int)
        is_current = request.args.get('is_current', type=bool)
        is_active = request.args.get('is_active', type=bool)
        
        query = Semester.query
        if academic_year_id:
            query = query.filter_by(academic_year_id=academic_year_id)
        if is_current is not None:
            query = query.filter_by(is_current=is_current)
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        semesters = query.paginate(page=page, per_page=per_page, error_out=False)
        
        result = []
        for s in semesters.items:
            data = s.to_dict()
            if s.academic_year:
                data['academic_year_name'] = s.academic_year.name
            result.append(data)
        
        return jsonify({
            'semesters': result,
            'total': semesters.total,
            'page': semesters.page,
            'pages': semesters.pages
        }), 200
        
    except Exception as e:
        print(f"Error in get_semesters: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@semester_bp.route('/<int:semester_id>', methods=['GET'])
def get_semester(semester_id):
    """Get semester details - Public endpoint"""
    try:
        semester = Semester.query.get_or_404(semester_id)
        data = semester.to_dict()
        if semester.academic_year:
            data['academic_year_name'] = semester.academic_year.name
        return jsonify(data), 200
    except Exception as e:
        print(f"Error in get_semester: {str(e)}")
        return jsonify({'error': str(e)}), 500

@semester_bp.route('/current', methods=['GET'])
def get_current_semester():
    """Get current semester - Public endpoint"""
    try:
        semester = Semester.query.filter_by(is_current=True).first()
        if not semester:
            return jsonify({'error': 'No current semester found'}), 404
        data = semester.to_dict()
        if semester.academic_year:
            data['academic_year_name'] = semester.academic_year.name
        return jsonify(data), 200
    except Exception as e:
        print(f"Error in get_current_semester: {str(e)}")
        return jsonify({'error': str(e)}), 500

@semester_bp.route('/', methods=['POST'])
@login_required
@role_required('Admin')
def create_semester():
    """Create a new semester - Admin only"""
    try:
        data = request.get_json()
        
        academic_year = AcademicYear.query.get(data['academic_year_id'])
        if not academic_year:
            return jsonify({'error': 'Academic year not found'}), 404
        
        existing = Semester.query.filter_by(
            semester_number=data['semester_number'],
            academic_year_id=data['academic_year_id']
        ).first()
        if existing:
            return jsonify({'error': 'Semester number already exists for this academic year'}), 400
        
        semester = Semester(
            name=data['name'],
            semester_number=data['semester_number'],
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date(),
            registration_start=datetime.strptime(data['registration_start'], '%Y-%m-%d').date(),
            registration_end=datetime.strptime(data['registration_end'], '%Y-%m-%d').date(),
            is_current=data.get('is_current', False),
            academic_year_id=data['academic_year_id']
        )
        
        db.session.add(semester)
        db.session.commit()
        
        if semester.is_current:
            Semester.query.filter(
                Semester.id != semester.id,
                Semester.academic_year_id == semester.academic_year_id
            ).update({'is_current': False})
            db.session.commit()
        
        log = ActivityLog(
            user_id=current_user.id,
            action='CREATE_SEMESTER',
            description=f'Created semester {semester.name} for {academic_year.name}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Semester created successfully',
            'semester': semester.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in create_semester: {str(e)}")
        return jsonify({'error': str(e)}), 500

@semester_bp.route('/<int:semester_id>', methods=['PUT'])
@login_required
@role_required('Admin')
def update_semester(semester_id):
    """Update semester - Admin only"""
    try:
        semester = Semester.query.get_or_404(semester_id)
        data = request.get_json()
        
        if 'name' in data:
            semester.name = data['name']
        if 'start_date' in data:
            semester.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if 'end_date' in data:
            semester.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        if 'registration_start' in data:
            semester.registration_start = datetime.strptime(data['registration_start'], '%Y-%m-%d').date()
        if 'registration_end' in data:
            semester.registration_end = datetime.strptime(data['registration_end'], '%Y-%m-%d').date()
        if 'is_current' in data:
            semester.is_current = data['is_current']
            if semester.is_current:
                Semester.query.filter(
                    Semester.id != semester.id,
                    Semester.academic_year_id == semester.academic_year_id
                ).update({'is_current': False})
        if 'is_active' in data:
            semester.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Semester updated successfully',
            'semester': semester.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in update_semester: {str(e)}")
        return jsonify({'error': str(e)}), 500

@semester_bp.route('/<int:semester_id>', methods=['DELETE'])
@login_required
@role_required('Admin')
def delete_semester(semester_id):
    """Delete semester (soft delete) - Admin only"""
    try:
        semester = Semester.query.get_or_404(semester_id)
        semester.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Semester deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in delete_semester: {str(e)}")
        return jsonify({'error': str(e)}), 500
