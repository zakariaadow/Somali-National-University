from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import Payment, Receipt, Student, Registration, FeeStructure, ExamCard, ActivityLog, FinanceOfficer
from extensions import db
from datetime import datetime, timedelta
from utils.decorators import role_required
from sqlalchemy import func

finance_bp = Blueprint('finance', __name__)

@finance_bp.route('/dashboard', methods=['GET'])
@login_required
@role_required('Finance Officer')
def get_dashboard():
    """Get finance officer dashboard"""
    try:
        finance_officer = FinanceOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not finance_officer:
            return jsonify({'error': 'Finance Officer profile not found'}), 404
        
        # Statistics
        total_payments = Payment.query.count()
        verified_payments = Payment.query.filter_by(is_verified=True).count()
        pending_payments = Payment.query.filter_by(is_verified=False).count()
        total_amount = db.session.query(func.sum(Payment.amount)).scalar() or 0
        verified_amount = db.session.query(func.sum(Payment.amount)).filter_by(is_verified=True).scalar() or 0
        
        # Today's collections
        today = datetime.now().date()
        today_collections = db.session.query(func.sum(Payment.amount)).filter(
            Payment.is_verified == True,
            func.date(Payment.payment_date) == today
        ).scalar() or 0
        
        # Outstanding balance (unverified payments)
        outstanding_balance = db.session.query(func.sum(Payment.amount)).filter_by(is_verified=False).scalar() or 0
        
        # Recent transactions
        recent_transactions = Payment.query.order_by(
            Payment.payment_date.desc()
        ).limit(10).all()
        
        return jsonify({
            'finance_officer': finance_officer.to_dict(),
            'statistics': {
                'total_payments': total_payments,
                'verified_payments': verified_payments,
                'pending_payments': pending_payments,
                'total_amount': float(total_amount),
                'verified_amount': float(verified_amount),
                'today_collections': float(today_collections),
                'outstanding_balance': float(outstanding_balance),
                'total_revenue': float(verified_amount)
            },
            'recent_transactions': [p.to_dict() for p in recent_transactions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@finance_bp.route('/payments', methods=['GET'])
@login_required
@role_required('Finance Officer')
def get_payments():
    """Get all payments with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        student_id = request.args.get('student_id', type=int)
        is_verified = request.args.get('is_verified')
        
        query = Payment.query
        
        if student_id:
            query = query.filter_by(student_id=student_id)
        if is_verified is not None:
            if is_verified.lower() == 'true':
                query = query.filter_by(is_verified=True)
            elif is_verified.lower() == 'false':
                query = query.filter_by(is_verified=False)
        
        payments = query.order_by(
            Payment.payment_date.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        # Add student names to response
        result = []
        for p in payments.items:
            payment_data = p.to_dict()
            if p.student and p.student.user:
                payment_data['student_name'] = f"{p.student.user.first_name} {p.student.user.last_name}"
                payment_data['registration_number'] = p.student.registration_number
            result.append(payment_data)
        
        return jsonify({
            'payments': result,
            'total': payments.total,
            'page': payments.page,
            'pages': payments.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@finance_bp.route('/payments/<int:payment_id>', methods=['GET'])
@login_required
@role_required('Finance Officer')
def get_payment(payment_id):
    """Get payment details"""
    try:
        payment = Payment.query.get_or_404(payment_id)
        payment_data = payment.to_dict()
        if payment.student and payment.student.user:
            payment_data['student_name'] = f"{payment.student.user.first_name} {payment.student.user.last_name}"
            payment_data['registration_number'] = payment.student.registration_number
        return jsonify(payment_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@finance_bp.route('/verify-payment', methods=['POST'])
@login_required
@role_required('Finance Officer')
def verify_payment():
    """Verify a student payment"""
    try:
        data = request.get_json()
        finance_officer = FinanceOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not finance_officer:
            return jsonify({'error': 'Finance Officer profile not found'}), 404
        
        payment_id = data.get('payment_id')
        payment = Payment.query.get_or_404(payment_id)
        
        if payment.is_verified:
            return jsonify({'error': 'Payment already verified'}), 400
        
        # Verify payment
        payment.is_verified = True
        payment.verified_by = finance_officer.id
        payment.verified_date = datetime.utcnow()
        
        # Generate receipt
        receipt_number = f"RCP{datetime.now().strftime('%Y%m%d')}{payment_id:04d}"
        receipt = Receipt(
            receipt_number=receipt_number,
            payment_id=payment.id,
            generated_by=finance_officer.id,
            generated_date=datetime.utcnow()
        )
        db.session.add(receipt)
        
        # Generate exam card
        student = Student.query.get(payment.student_id)
        if student:
            exam_card_number = f"EXC{datetime.now().strftime('%Y%m%d')}{student.id:04d}"
            exam_card = ExamCard(
                exam_card_number=exam_card_number,
                student_id=student.id,
                semester_id=payment.registration.semester_id,
                academic_year_id=payment.registration.academic_year_id,
                payment_id=payment.id,
                generated_date=datetime.utcnow(),
                is_approved=True
            )
            db.session.add(exam_card)
        
        db.session.commit()
        
        # Log activity
        log = ActivityLog(
            user_id=current_user.id,
            action='VERIFY_PAYMENT',
            description=f'Verified payment {payment.payment_reference}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Payment verified successfully',
            'payment': payment.to_dict(),
            'receipt': receipt.to_dict() if receipt else None,
            'exam_card': exam_card.to_dict() if exam_card else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@finance_bp.route('/receipts', methods=['GET'])
@login_required
@role_required('Finance Officer')
def get_receipts():
    """Get all receipts"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        student_id = request.args.get('student_id', type=int)
        
        query = Receipt.query.join(Payment)
        
        if student_id:
            query = query.filter(Payment.student_id == student_id)
        
        receipts = query.order_by(
            Receipt.generated_date.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        result = []
        for r in receipts.items:
            receipt_data = r.to_dict()
            if r.payment and r.payment.student and r.payment.student.user:
                receipt_data['student_name'] = f"{r.payment.student.user.first_name} {r.payment.student.user.last_name}"
                receipt_data['registration_number'] = r.payment.student.registration_number
                receipt_data['payment_reference'] = r.payment.payment_reference
            result.append(receipt_data)
        
        return jsonify({
            'receipts': result,
            'total': receipts.total,
            'page': receipts.page,
            'pages': receipts.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@finance_bp.route('/receipts/<int:receipt_id>', methods=['GET'])
@login_required
@role_required('Finance Officer')
def get_receipt(receipt_id):
    """Get receipt details"""
    try:
        receipt = Receipt.query.get_or_404(receipt_id)
        receipt_data = receipt.to_dict()
        if receipt.payment and receipt.payment.student and receipt.payment.student.user:
            receipt_data['student_name'] = f"{receipt.payment.student.user.first_name} {receipt.payment.student.user.last_name}"
            receipt_data['registration_number'] = receipt.payment.student.registration_number
            receipt_data['payment_reference'] = receipt.payment.payment_reference
        return jsonify(receipt_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@finance_bp.route('/exam-cards', methods=['GET'])
@login_required
@role_required('Finance Officer')
def get_exam_cards():
    """Get all exam cards"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        student_id = request.args.get('student_id', type=int)
        semester_id = request.args.get('semester_id', type=int)
        
        query = ExamCard.query
        
        if student_id:
            query = query.filter_by(student_id=student_id)
        if semester_id:
            query = query.filter_by(semester_id=semester_id)
        
        exam_cards = query.order_by(
            ExamCard.generated_date.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        result = []
        for ec in exam_cards.items:
            card_data = ec.to_dict()
            if ec.student and ec.student.user:
                card_data['student_name'] = f"{ec.student.user.first_name} {ec.student.user.last_name}"
                card_data['registration_number'] = ec.student.registration_number
            result.append(card_data)
        
        return jsonify({
            'exam_cards': result,
            'total': exam_cards.total,
            'page': exam_cards.page,
            'pages': exam_cards.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@finance_bp.route('/fee-structures', methods=['GET'])
@login_required
@role_required('Finance Officer')
def get_fee_structures():
    """Get fee structures"""
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
