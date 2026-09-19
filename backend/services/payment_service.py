# backend/services/payment_service.py
from database import db
from models import Payment, FeeStructure, Student, Receipt, ExamCard, Semester, ActivityLog
from datetime import datetime
import uuid
import secrets

class PaymentService:
    @staticmethod
    def create_payment(data, student_id):
        """Create a new payment"""
        required_fields = ['fee_structure_id', 'amount', 'payment_method']
        for field in required_fields:
            if field not in data:
                return {'success': False, 'error': f'{field} is required'}
        
        # Validate fee structure
        fee_structure = FeeStructure.query.get(data['fee_structure_id'])
        if not fee_structure:
            return {'success': False, 'error': 'Fee structure not found'}
        
        if not fee_structure.is_active:
            return {'success': False, 'error': 'Fee structure is not active'}
        
        # Check if student exists
        student = Student.query.get(student_id)
        if not student:
            return {'success': False, 'error': 'Student not found'}
        
        # Generate transaction ID
        transaction_id = f"TXN{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{secrets.token_hex(4)}"
        
        try:
            payment = Payment(
                transaction_id=transaction_id,
                amount=data['amount'],
                payment_method=data['payment_method'],
                student_id=student_id,
                fee_structure_id=data['fee_structure_id'],
                currency=data.get('currency', 'USD'),
                payment_reference=data.get('payment_reference'),
                notes=data.get('notes')
            )
            db.session.add(payment)
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Payment created successfully',
                'payment_id': payment.id,
                'transaction_id': transaction_id,
                'status': payment.status
            }
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def verify_payment(payment_id, finance_staff_id):
        """Verify a payment and generate receipt"""
        payment = Payment.query.get(payment_id)
        if not payment:
            return {'success': False, 'error': 'Payment not found'}
        
        if payment.status != 'pending':
            return {'success': False, 'error': 'Payment already processed'}
        
        try:
            payment.status = 'verified'
            payment.verified_date = datetime.utcnow()
            payment.processed_by = finance_staff_id
            
            # Generate receipt
            receipt_number = f"RCP{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{payment.student.id}"
            receipt = Receipt(
                receipt_number=receipt_number,
                payment_id=payment.id,
                student_id=payment.student_id,
                amount=payment.amount,
                currency=payment.currency
            )
            db.session.add(receipt)
            
            # Generate exam card if fee is cleared
            current_semester = Semester.query.filter_by(is_current=True, is_active=True).first()
            exam_card_generated = False
            
            if current_semester:
                existing = ExamCard.query.filter_by(
                    student_id=payment.student_id,
                    semester_id=current_semester.id
                ).first()
                
                if not existing:
                    exam_card_number = f"EX{datetime.utcnow().strftime('%Y%m%d')}{payment.student.id}"
                    exam_card = ExamCard(
                        exam_card_number=exam_card_number,
                        student_id=payment.student_id,
                        semester_id=current_semester.id
                    )
                    db.session.add(exam_card)
                    exam_card_generated = True
            
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Payment verified successfully',
                'receipt_number': receipt_number,
                'exam_card_generated': exam_card_generated
            }
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def reject_payment(payment_id, finance_staff_id):
        """Reject a payment"""
        payment = Payment.query.get(payment_id)
        if not payment:
            return {'success': False, 'error': 'Payment not found'}
        
        if payment.status != 'pending':
            return {'success': False, 'error': 'Payment already processed'}
        
        try:
            payment.status = 'rejected'
            payment.processed_by = finance_staff_id
            db.session.commit()
            
            return {'success': True, 'message': 'Payment rejected'}
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_payment_history(student_id):
        """Get payment history for a student"""
        payments = Payment.query.filter_by(student_id=student_id).order_by(
            Payment.created_at.desc()
        ).all()
        
        return [{
            'id': p.id,
            'transaction_id': p.transaction_id,
            'amount': p.amount,
            'currency': p.currency,
            'payment_date': p.payment_date.isoformat(),
            'payment_method': p.payment_method,
            'status': p.status,
            'fee_structure': p.fee_structure.name if p.fee_structure else None,
            'receipt_number': p.receipt.receipt_number if p.receipt else None
        } for p in payments]
    
    @staticmethod
    def get_payment_summary(start_date=None, end_date=None):
        """Get payment summary for reporting"""
        query = Payment.query.filter_by(status='verified')
        
        if start_date:
            query = query.filter(Payment.payment_date >= start_date)
        if end_date:
            query = query.filter(Payment.payment_date <= end_date)
        
        payments = query.all()
        
        total_amount = sum(p.amount for p in payments)
        total_count = len(payments)
        
        # Payment method breakdown
        method_breakdown = {}
        for p in payments:
            method = p.payment_method
            method_breakdown[method] = method_breakdown.get(method, 0) + p.amount
        
        # Daily breakdown
        daily_breakdown = {}
        for p in payments:
            date_key = p.payment_date.strftime('%Y-%m-%d')
            daily_breakdown[date_key] = daily_breakdown.get(date_key, 0) + p.amount
        
        return {
            'total_amount': total_amount,
            'total_count': total_count,
            'average_amount': total_amount / total_count if total_count > 0 else 0,
            'method_breakdown': method_breakdown,
            'daily_breakdown': daily_breakdown,
            'currency': 'USD'
        }
    
    @staticmethod
    def check_clearance(student_id, semester_id=None):
        """Check if student has cleared all fees"""
        # Check for pending payments
        pending_payments = Payment.query.filter_by(
            student_id=student_id,
            status='pending'
        ).count()
        
        if pending_payments > 0:
            return {'cleared': False, 'reason': 'Has pending payments'}
        
        # Check if any unpaid fee structures for the semester
        if semester_id:
            fee_structures = FeeStructure.query.filter_by(semester_id=semester_id).all()
            for fs in fee_structures:
                paid = Payment.query.filter_by(
                    student_id=student_id,
                    fee_structure_id=fs.id,
                    status='verified'
                ).first()
                if not paid:
                    return {'cleared': False, 'reason': f'Unpaid fee: {fs.name}'}
        
        return {'cleared': True}