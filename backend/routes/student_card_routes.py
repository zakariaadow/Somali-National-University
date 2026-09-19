from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import StudentCard, Student, ActivityLog
from extensions import db
from datetime import datetime
from utils.decorators import role_required

student_card_bp = Blueprint('student_card', __name__)

@student_card_bp.route('/', methods=['GET'])
@login_required
def get_student_cards():
    """Get all student cards with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        student_id = request.args.get('student_id', type=int)
        
        query = StudentCard.query
        if status:
            query = query.filter_by(status=status)
        if student_id:
            query = query.filter_by(student_id=student_id)
        
        cards = query.order_by(
            StudentCard.application_date.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'student_cards': [c.to_dict() for c in cards.items],
            'total': cards.total,
            'page': cards.page,
            'pages': cards.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_card_bp.route('/<int:card_id>', methods=['GET'])
@login_required
def get_student_card(card_id):
    """Get student card details"""
    try:
        card = StudentCard.query.get_or_404(card_id)
        
        # Check permissions
        if current_user.role.name == 'Student':
            student = Student.query.filter_by(user_id=current_user.id).first()
            if card.student_id != student.id:
                return jsonify({'error': 'Access denied'}), 403
        
        return jsonify(card.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_card_bp.route('/<int:card_id>/download', methods=['GET'])
@login_required
def download_student_card(card_id):
    """Download student card PDF"""
    try:
        card = StudentCard.query.get_or_404(card_id)
        
        # Check permissions
        if current_user.role.name == 'Student':
            student = Student.query.filter_by(user_id=current_user.id).first()
            if card.student_id != student.id:
                return jsonify({'error': 'Access denied'}), 403
        
        if card.status != 'approved':
            return jsonify({'error': 'Student card not approved yet'}), 400
        
        # In production, this would return the actual PDF file
        return jsonify({
            'student_card': card.to_dict(),
            'download_url': f'/api/uploads/student_cards/{card.card_pdf}'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_card_bp.route('/status/<string:status>', methods=['GET'])
@login_required
@role_required('Admin', 'Faculty Officer', 'College Officer')
def get_cards_by_status(status):
    """Get student cards by status"""
    try:
        if status not in ['pending', 'approved', 'rejected']:
            return jsonify({'error': 'Invalid status'}), 400
        
        cards = StudentCard.query.filter_by(status=status).all()
        
        return jsonify({
            'student_cards': [c.to_dict() for c in cards],
            'total': len(cards),
            'status': status
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500