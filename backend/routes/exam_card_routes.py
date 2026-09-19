from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import ExamCard, Student, Payment, ActivityLog
from extensions import db
from datetime import datetime
from utils.decorators import role_required

exam_card_bp = Blueprint('exam_card', __name__)

@exam_card_bp.route('/<int:exam_card_id>', methods=['GET'])
@login_required
def get_exam_card(exam_card_id):
    """Get exam card details"""
    try:
        exam_card = ExamCard.query.get_or_404(exam_card_id)
        
        # Check permissions
        if current_user.role.name == 'Student':
            student = Student.query.filter_by(user_id=current_user.id).first()
            if exam_card.student_id != student.id:
                return jsonify({'error': 'Access denied'}), 403
        
        return jsonify(exam_card.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@exam_card_bp.route('/<int:exam_card_id>/download', methods=['POST'])
@login_required
def download_exam_card(exam_card_id):
    """Mark exam card as downloaded"""
    try:
        exam_card = ExamCard.query.get_or_404(exam_card_id)
        
        # Check permissions
        if current_user.role.name == 'Student':
            student = Student.query.filter_by(user_id=current_user.id).first()
            if exam_card.student_id != student.id:
                return jsonify({'error': 'Access denied'}), 403
        
        exam_card.is_downloaded = True
        db.session.commit()
        
        return jsonify({
            'message': 'Exam card marked as downloaded',
            'exam_card': exam_card.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500