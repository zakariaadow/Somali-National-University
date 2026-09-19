from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import Assessment, StudentUnit, Unit, Lecturer, ActivityLog
from extensions import db
from datetime import datetime
from utils.decorators import role_required

assessment_bp = Blueprint('assessment', __name__)

@assessment_bp.route('/', methods=['GET'])
@login_required
def get_assessments():
    """Get all assessments with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        unit_id = request.args.get('unit_id', type=int)
        student_id = request.args.get('student_id', type=int)
        assessment_type = request.args.get('assessment_type')
        
        query = Assessment.query
        if unit_id:
            query = query.filter_by(unit_id=unit_id)
        if student_id:
            query = query.join(StudentUnit).filter(StudentUnit.student_id == student_id)
        if assessment_type:
            query = query.filter_by(assessment_type=assessment_type)
        
        assessments = query.order_by(
            Assessment.assessment_date.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'assessments': [a.to_dict() for a in assessments.items],
            'total': assessments.total,
            'page': assessments.page,
            'pages': assessments.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@assessment_bp.route('/', methods=['POST'])
@login_required
@role_required('Lecturer')
def create_assessment():
    """Create a new assessment"""
    try:
        data = request.get_json()
        lecturer = Lecturer.query.filter_by(user_id=current_user.id).first()
        
        if not lecturer:
            return jsonify({'error': 'Lecturer profile not found'}), 404
        
        # Check if lecturer teaches this unit
        unit = Unit.query.get(data['unit_id'])
        if not unit or unit.id not in [u.id for u in lecturer.units]:
            return jsonify({'error': 'You are not assigned to this unit'}), 403
        
        assessment = Assessment(
            student_unit_id=data['student_unit_id'],
            unit_id=data['unit_id'],
            lecturer_id=lecturer.id,
            assessment_type=data['assessment_type'],
            assessment_date=datetime.strptime(data['assessment_date'], '%Y-%m-%d').date(),
            marks=data.get('marks'),
            max_marks=data['max_marks'],
            weight=data['weight'],
            remarks=data.get('remarks')
        )
        
        db.session.add(assessment)
        db.session.commit()
        
        # Log activity
        log = ActivityLog(
            user_id=current_user.id,
            action='CREATE_ASSESSMENT',
            description=f'Created {assessment.assessment_type} assessment for unit {unit.unit_code}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Assessment created successfully',
            'assessment': assessment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@assessment_bp.route('/<int:assessment_id>', methods=['GET'])
@login_required
def get_assessment(assessment_id):
    """Get assessment details"""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        return jsonify(assessment.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@assessment_bp.route('/<int:assessment_id>', methods=['PUT'])
@login_required
@role_required('Lecturer')
def update_assessment(assessment_id):
    """Update assessment"""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        lecturer = Lecturer.query.filter_by(user_id=current_user.id).first()
        
        if assessment.lecturer_id != lecturer.id:
            return jsonify({'error': 'You can only update your own assessments'}), 403
        
        data = request.get_json()
        
        if 'marks' in data:
            assessment.marks = data['marks']
        if 'remarks' in data:
            assessment.remarks = data['remarks']
        if 'is_submitted' in data:
            assessment.is_submitted = data['is_submitted']
            if assessment.is_submitted:
                assessment.submitted_date = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Assessment updated successfully',
            'assessment': assessment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500