from flask import Blueprint, request, jsonify
from flask_login import login_required
from models import Registration, Student, Semester, AcademicYear, ActivityLog
from extensions import db
from datetime import datetime
from utils.decorators import role_required

registration_bp = Blueprint('registration', __name__)

@registration_bp.route('/', methods=['GET'])
@login_required
def get_registrations():
    """Get all registrations with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        student_id = request.args.get('student_id', type=int)
        semester_id = request.args.get('semester_id', type=int)
        academic_year_id = request.args.get('academic_year_id', type=int)
        
        query = Registration.query
        
        if student_id:
            query = query.filter_by(student_id=student_id)
        if semester_id:
            query = query.filter_by(semester_id=semester_id)
        if academic_year_id:
            query = query.filter_by(academic_year_id=academic_year_id)
        
        registrations = query.order_by(
            Registration.registration_date.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'registrations': [r.to_dict() for r in registrations.items],
            'total': registrations.total,
            'page': registrations.page,
            'pages': registrations.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@registration_bp.route('/<int:registration_id>', methods=['GET'])
@login_required
def get_registration(registration_id):
    """Get registration details"""
    try:
        registration = Registration.query.get_or_404(registration_id)
        return jsonify(registration.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@registration_bp.route('/<int:registration_id>/approve', methods=['POST'])
@login_required
@role_required('Admin', 'Faculty Officer')
def approve_registration(registration_id):
    """Approve a registration"""
    try:
        registration = Registration.query.get_or_404(registration_id)
        
        if registration.is_approved:
            return jsonify({'error': 'Registration already approved'}), 400
        
        registration.is_approved = True
        registration.approved_by = current_user.id
        registration.approved_date = datetime.utcnow()
        
        db.session.commit()
        
        # Log activity
        log = ActivityLog(
            user_id=current_user.id,
            action='APPROVE_REGISTRATION',
            description=f'Approved registration {registration.id}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Registration approved successfully',
            'registration': registration.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500