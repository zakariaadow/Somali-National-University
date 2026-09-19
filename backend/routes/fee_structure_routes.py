from flask import Blueprint, request, jsonify
from flask_login import login_required
from models import FeeStructure, Programme, Semester, AcademicYear, ActivityLog
from extensions import db
from utils.decorators import role_required

fee_structure_bp = Blueprint('fee_structure', __name__)

@fee_structure_bp.route('/', methods=['GET'])
@login_required
def get_fee_structures():
    """Get all fee structures"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        programme_id = request.args.get('programme_id', type=int)
        semester_id = request.args.get('semester_id', type=int)
        academic_year_id = request.args.get('academic_year_id', type=int)
        
        query = FeeStructure.query
        
        if programme_id:
            query = query.filter_by(programme_id=programme_id)
        if semester_id:
            query = query.filter_by(semester_id=semester_id)
        if academic_year_id:
            query = query.filter_by(academic_year_id=academic_year_id)
        
        fee_structures = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'fee_structures': [fs.to_dict() for fs in fee_structures.items],
            'total': fee_structures.total,
            'page': fee_structures.page,
            'pages': fee_structures.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@fee_structure_bp.route('/', methods=['POST'])
@login_required
@role_required('Admin', 'Finance Officer')
def create_fee_structure():
    """Create a new fee structure"""
    try:
        data = request.get_json()
        
        # Check if fee structure already exists
        existing = FeeStructure.query.filter_by(
            programme_id=data['programme_id'],
            semester_id=data['semester_id'],
            academic_year_id=data['academic_year_id']
        ).first()
        
        if existing:
            return jsonify({'error': 'Fee structure already exists for this programme, semester, and academic year'}), 400
        
        # Calculate total fee
        total_fee = (
            data.get('tuition_fee', 0) +
            data.get('registration_fee', 0) +
            data.get('examination_fee', 0) +
            data.get('student_card_fee', 0) +
            data.get('library_fee', 0) +
            data.get('sports_fee', 0) +
            data.get('medical_fee', 0) +
            data.get('other_fees', 0)
        )
        
        fee_structure = FeeStructure(
            name=data['name'],
            programme_id=data['programme_id'],
            semester_id=data['semester_id'],
            academic_year_id=data['academic_year_id'],
            tuition_fee=data.get('tuition_fee', 0),
            registration_fee=data.get('registration_fee', 0),
            examination_fee=data.get('examination_fee', 0),
            student_card_fee=data.get('student_card_fee', 0),
            library_fee=data.get('library_fee', 0),
            sports_fee=data.get('sports_fee', 0),
            medical_fee=data.get('medical_fee', 0),
            other_fees=data.get('other_fees', 0),
            total_fee=total_fee,
            currency=data.get('currency', 'SOS')
        )
        
        db.session.add(fee_structure)
        db.session.commit()
        
        # Log activity
        log = ActivityLog(
            user_id=current_user.id,
            action='CREATE_FEE_STRUCTURE',
            description=f'Created fee structure {fee_structure.name}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Fee structure created successfully',
            'fee_structure': fee_structure.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500