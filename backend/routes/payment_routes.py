from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import Payment, Student, Registration, FeeStructure, ActivityLog
from extensions import db
from datetime import datetime
from utils.decorators import role_required
import uuid

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/', methods=['POST'])
@login_required
@role_required('Student')
def make_payment():
    """Make a payment"""
    try:
        data = request.get_json()
        student = Student.query.filter_by(user_id=current_user.id).first()
        
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404
        
        registration_id = data.get('registration_id')
        amount = data.get('amount')
        payment_method = data.get('payment_method')
        transaction_id = data.get('transaction_id')
        
        # Validate registration
        registration = Registration.query.get_or_404(registration_id)
        if registration.student_id != student.id:
            return jsonify({'error': 'Registration not found for this student'}), 403
        
        # Generate payment reference
        payment_reference = f"PAY{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"
        
        payment = Payment(
            payment_reference=payment_reference,
            student_id=student.id,
            registration_id=registration_id,
            amount=amount,
            payment_date=datetime.utcnow(),
            payment_method=payment_method,
            transaction_id=transaction_id,
            is_verified=False
        )
        
        db.session.add(payment)
        db.session.commit()
        
        # Log activity
        log = ActivityLog(
            user_id=current_user.id,
            action='MAKE_PAYMENT',
            description=f'Payment {payment_reference} made for {amount}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Payment recorded successfully. Awaiting verification.',
            'payment': payment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/<int:payment_id>', methods=['GET'])
@login_required
def get_payment(payment_id):
    """Get payment details"""
    try:
        payment = Payment.query.get_or_404(payment_id)
        
        # Check permissions
        if current_user.role.name == 'Student':
            student = Student.query.filter_by(user_id=current_user.id).first()
            if payment.student_id != student.id:
                return jsonify({'error': 'Access denied'}), 403
        
        return jsonify(payment.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500