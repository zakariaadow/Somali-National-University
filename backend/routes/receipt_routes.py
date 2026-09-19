from flask import Blueprint, request, jsonify, send_file
from flask_login import login_required, current_user
from models import Receipt, Payment, Student, ActivityLog
from extensions import db
from datetime import datetime
from utils.decorators import role_required
import os

receipt_bp = Blueprint('receipt', __name__)

@receipt_bp.route('/<int:receipt_id>', methods=['GET'])
@login_required
def get_receipt(receipt_id):
    """Get receipt details"""
    try:
        receipt = Receipt.query.get_or_404(receipt_id)
        
        # Check permissions
        if current_user.role.name == 'Student':
            student = Student.query.filter_by(user_id=current_user.id).first()
            if receipt.payment.student_id != student.id:
                return jsonify({'error': 'Access denied'}), 403
        
        return jsonify(receipt.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@receipt_bp.route('/<int:receipt_id>/download', methods=['GET'])
@login_required
def download_receipt(receipt_id):
    """Download receipt PDF"""
    try:
        receipt = Receipt.query.get_or_404(receipt_id)
        
        # Check permissions
        if current_user.role.name == 'Student':
            student = Student.query.filter_by(user_id=current_user.id).first()
            if receipt.payment.student_id != student.id:
                return jsonify({'error': 'Access denied'}), 403
        
        # Update download status
        receipt.is_downloaded = True
        db.session.commit()
        
        # In production, this would return the actual PDF file
        # For now, return the receipt details
        return jsonify({
            'receipt': receipt.to_dict(),
            'download_url': f'/api/uploads/receipts/{receipt.receipt_pdf}'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@receipt_bp.route('/student/<int:student_id>', methods=['GET'])
@login_required
def get_student_receipts(student_id):
    """Get all receipts for a student"""
    try:
        # Check permissions
        if current_user.role.name == 'Student':
            student = Student.query.filter_by(user_id=current_user.id).first()
            if not student or student.id != student_id:
                return jsonify({'error': 'Access denied'}), 403
        
        receipts = Receipt.query.join(Payment).filter(
            Payment.student_id == student_id
        ).order_by(Receipt.generated_date.desc()).all()
        
        return jsonify({
            'receipts': [r.to_dict() for r in receipts],
            'total': len(receipts)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500