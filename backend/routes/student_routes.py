from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from models import Student, StudentUnit, Registration, Payment, Result, ExamCard, StudentCard, Unit, Semester, AcademicYear, FeeStructure, Programme, ActivityLog
from extensions import db
from datetime import datetime
from utils.decorators import role_required
import os
import uuid
from werkzeug.utils import secure_filename

student_bp = Blueprint('student', __name__)

def save_photo(file):
    """Save uploaded photo and return the path"""
    if not file:
        return None
    
    # Create upload folder if it doesn't exist
    upload_folder = os.path.join('uploads', 'student_photos')
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    
    # Generate unique filename
    filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}_{secure_filename(file.filename)}"
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)
    
    return f"uploads/student_photos/{filename}"

@student_bp.route('/apply-student-card', methods=['POST'])
@login_required
@role_required('Student')
def apply_student_card():
    """Apply for student card with photo upload"""
    try:
        student = Student.query.filter_by(user_id=current_user.id).first()
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404
        
        # Check if student has a programme
        if not student.programme_id:
            return jsonify({'error': 'Please select a programme first'}), 400
        
        # Check if already has a card application
        existing = StudentCard.query.filter_by(student_id=student.id).first()
        if existing:
            return jsonify({'error': 'You already have a student card application', 'status': existing.status}), 400
        
        # Get the uploaded photo
        if 'photo' not in request.files:
            return jsonify({'error': 'Photo is required'}), 400
        
        file = request.files['photo']
        if file.filename == '':
            return jsonify({'error': 'No photo selected'}), 400
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, gif'}), 400
        
        # Save photo
        photo_path = save_photo(file)
        
        # Generate card number
        card_number = f"SC{datetime.now().strftime('%Y%m%d')}{student.id:04d}"
        
        student_card = StudentCard(
            card_number=card_number,
            student_id=student.id,
            semester_id=1,  # Default to first semester
            photo=photo_path,
            application_date=datetime.utcnow(),
            status='pending'
        )
        
        db.session.add(student_card)
        db.session.commit()
        
        # Log activity
        log = ActivityLog(
            user_id=current_user.id,
            action='APPLY_STUDENT_CARD',
            description=f'Student applied for card {card_number}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Student card application submitted successfully',
            'student_card': student_card.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@student_bp.route('/student-card', methods=['GET'])
@login_required
@role_required('Student')
def get_student_card():
    """Get student card status and details"""
    try:
        student = Student.query.filter_by(user_id=current_user.id).first()
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404
        
        student_card = StudentCard.query.filter_by(student_id=student.id).first()
        
        if not student_card:
            return jsonify({
                'has_application': False,
                'message': 'No student card application found'
            }), 200
        
        return jsonify({
            'has_application': True,
            'student_card': student_card.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/student-card/download', methods=['GET'])
@login_required
@role_required('Student')
def download_student_card():
    """Download student card PDF"""
    try:
        student = Student.query.filter_by(user_id=current_user.id).first()
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404
        
        student_card = StudentCard.query.filter_by(student_id=student.id).first()
        
        if not student_card:
            return jsonify({'error': 'No student card found'}), 404
        
        if student_card.status != 'approved':
            return jsonify({'error': 'Student card not approved yet'}), 400
        
        if not student_card.card_pdf:
            return jsonify({'error': 'Student card PDF not available'}), 404
        
        return jsonify({
            'student_card': student_card.to_dict(),
            'download_url': f'/uploads/student_cards/{student_card.card_pdf}'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/profile', methods=['GET'])
@login_required
@role_required('Student')
def get_profile():
    """Get student profile"""
    try:
        student = Student.query.filter_by(user_id=current_user.id).first()
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404
        
        return jsonify({
            'user': current_user.to_dict(),
            'student': student.to_dict(),
            'programme': student.programme.to_dict() if student.programme else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/my-units', methods=['GET'])
@login_required
@role_required('Student')
def get_my_units():
    """Get student's enrolled units"""
    try:
        student = Student.query.filter_by(user_id=current_user.id).first()
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404
        
        student_units = StudentUnit.query.filter_by(student_id=student.id).all()
        result = []
        for su in student_units:
            unit_data = su.unit.to_dict() if su.unit else {}
            unit_data['is_completed'] = su.is_completed
            unit_data['grade'] = su.grade
            unit_data['score'] = su.score
            result.append(unit_data)
        
        return jsonify({'units': result, 'total': len(result)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/payments', methods=['GET'])
@login_required
@role_required('Student')
def get_payments():
    """Get student's payment history"""
    try:
        student = Student.query.filter_by(user_id=current_user.id).first()
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404
        
        payments = Payment.query.filter_by(student_id=student.id).all()
        return jsonify({'payments': [p.to_dict() for p in payments], 'total': len(payments)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/results', methods=['GET'])
@login_required
@role_required('Student')
def get_results():
    """Get student's results"""
    try:
        student = Student.query.filter_by(user_id=current_user.id).first()
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404
        
        results = Result.query.filter_by(student_id=student.id, is_published=True).all()
        return jsonify({'results': [r.to_dict() for r in results], 'total': len(results)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/exam-cards', methods=['GET'])
@login_required
@role_required('Student')
def get_exam_cards():
    """Get student's exam cards"""
    try:
        student = Student.query.filter_by(user_id=current_user.id).first()
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404
        
        exam_cards = ExamCard.query.filter_by(student_id=student.id).all()
        return jsonify({'exam_cards': [ec.to_dict() for ec in exam_cards], 'total': len(exam_cards)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/registrations', methods=['GET'])
@login_required
@role_required('Student')
def get_registrations():
    """Get student's semester registrations"""
    try:
        student = Student.query.filter_by(user_id=current_user.id).first()
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404
        
        registrations = Registration.query.filter_by(student_id=student.id).all()
        return jsonify({'registrations': [r.to_dict() for r in registrations], 'total': len(registrations)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/available-units', methods=['GET'])
@login_required
@role_required('Student')
def get_available_units():
    """Get available units for registration"""
    try:
        student = Student.query.filter_by(user_id=current_user.id).first()
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404
        
        semester_id = request.args.get('semester_id', type=int)
        if not semester_id:
            return jsonify({'error': 'Semester ID required'}), 400
        
        # Get units available for the semester
        units = Unit.query.filter_by(semester_id=semester_id, is_active=True).all()
        
        # Get already registered units
        registered_ids = [su.unit_id for su in StudentUnit.query.filter_by(
            student_id=student.id,
            semester_id=semester_id
        ).all()]
        
        # Filter out already registered units
        available = [u for u in units if u.id not in registered_ids]
        
        return jsonify({
            'units': [u.to_dict() for u in available],
            'total': len(available),
            'registered_count': len(registered_ids)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/fee-structure', methods=['GET'])
@login_required
@role_required('Student')
def get_fee_structure():
    """Get fee structure for student's programme and semester"""
    try:
        student = Student.query.filter_by(user_id=current_user.id).first()
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404
        
        semester_id = request.args.get('semester_id', type=int)
        academic_year_id = request.args.get('academic_year_id', type=int)
        
        if not semester_id or not academic_year_id:
            return jsonify({'error': 'Semester ID and Academic Year ID required'}), 400
        
        if not student.programme_id:
            return jsonify({'error': 'Please select a programme first'}), 400
        
        fee = FeeStructure.query.filter_by(
            programme_id=student.programme_id,
            semester_id=semester_id,
            academic_year_id=academic_year_id
        ).first()
        
        if not fee:
            return jsonify({'error': 'Fee structure not found'}), 404
        
        return jsonify(fee.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/programme', methods=['PUT'])
@login_required
@role_required('Student')
def update_programme():
    """Update student's programme"""
    try:
        data = request.get_json()
        student = Student.query.filter_by(user_id=current_user.id).first()
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        programme_id = data.get('programme_id')
        if not programme_id:
            return jsonify({'error': 'Programme ID required'}), 400
        
        programme = Programme.query.get(programme_id)
        if not programme:
            return jsonify({'error': 'Programme not found'}), 404
        
        student.programme_id = programme_id
        db.session.commit()
        
        return jsonify({
            'message': 'Programme updated successfully',
            'student': student.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@student_bp.route('/register-semester', methods=['POST'])
@login_required
@role_required('Student')
def register_semester():
    """Register for a semester"""
    try:
        data = request.get_json()
        student = Student.query.filter_by(user_id=current_user.id).first()
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        semester_id = data.get('semester_id')
        academic_year_id = data.get('academic_year_id')
        
        if not semester_id or not academic_year_id:
            return jsonify({'error': 'Semester ID and Academic Year ID required'}), 400
        
        # Check if already registered
        existing = Registration.query.filter_by(
            student_id=student.id,
            semester_id=semester_id,
            academic_year_id=academic_year_id
        ).first()
        
        if existing:
            return jsonify({'error': 'Already registered for this semester'}), 400
        
        registration = Registration(
            student_id=student.id,
            semester_id=semester_id,
            academic_year_id=academic_year_id,
            registration_date=datetime.utcnow()
        )
        db.session.add(registration)
        db.session.commit()
        
        return jsonify({
            'message': 'Semester registered successfully',
            'registration': registration.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@student_bp.route('/register-units', methods=['POST'])
@login_required
@role_required('Student')
def register_units():
    """Register for units in a semester"""
    try:
        data = request.get_json()
        student = Student.query.filter_by(user_id=current_user.id).first()
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        semester_id = data.get('semester_id')
        academic_year_id = data.get('academic_year_id')
        unit_ids = data.get('unit_ids', [])
        
        if not semester_id or not academic_year_id:
            return jsonify({'error': 'Semester ID and Academic Year ID required'}), 400
        
        # Check if student is registered for this semester
        registration = Registration.query.filter_by(
            student_id=student.id,
            semester_id=semester_id,
            academic_year_id=academic_year_id
        ).first()
        
        if not registration:
            return jsonify({'error': 'Please register for the semester first'}), 400
        
        registered = []
        for unit_id in unit_ids:
            # Check if already registered
            existing = StudentUnit.query.filter_by(
                student_id=student.id,
                unit_id=unit_id,
                semester_id=semester_id,
                academic_year_id=academic_year_id
            ).first()
            
            if not existing:
                su = StudentUnit(
                    student_id=student.id,
                    unit_id=unit_id,
                    semester_id=semester_id,
                    academic_year_id=academic_year_id,
                    registration_date=datetime.utcnow()
                )
                db.session.add(su)
                registered.append(unit_id)
        
        db.session.commit()
        return jsonify({
            'message': f'Registered {len(registered)} units',
            'registered': len(registered)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
