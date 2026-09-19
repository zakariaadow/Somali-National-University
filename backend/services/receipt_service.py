# backend/services/receipt_service.py
from database import db
from models import Receipt, Payment, Student
from datetime import datetime
import os
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

class ReceiptService:
    @staticmethod
    def generate_receipt(payment_id):
        """Generate a receipt for a payment"""
        payment = Payment.query.get(payment_id)
        if not payment:
            return {'success': False, 'error': 'Payment not found'}
        
        if payment.status != 'verified':
            return {'success': False, 'error': 'Payment not verified'}
        
        # Check if receipt already exists
        if payment.receipt:
            return {
                'success': True,
                'message': 'Receipt already exists',
                'receipt_id': payment.receipt.id,
                'receipt_number': payment.receipt.receipt_number
            }
        
        try:
            # Generate receipt number
            receipt_number = f"RCP{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{payment.student.id}"
            
            receipt = Receipt(
                receipt_number=receipt_number,
                payment_id=payment.id,
                student_id=payment.student_id,
                amount=payment.amount,
                currency=payment.currency
            )
            db.session.add(receipt)
            db.session.flush()
            
            # Generate PDF
            pdf_path = ReceiptService._generate_receipt_pdf(receipt)
            receipt.receipt_file = pdf_path
            
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Receipt generated successfully',
                'receipt_id': receipt.id,
                'receipt_number': receipt_number
            }
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_receipt(receipt_id):
        """Get receipt details"""
        receipt = Receipt.query.get(receipt_id)
        if not receipt:
            return None
        
        return {
            'id': receipt.id,
            'receipt_number': receipt.receipt_number,
            'amount': receipt.amount,
            'currency': receipt.currency,
            'issue_date': receipt.issue_date.isoformat(),
            'receipt_file': receipt.receipt_file,
            'is_printed': receipt.is_printed,
            'student': {
                'id': receipt.student.id,
                'name': receipt.student.get_full_name(),
                'registration_number': receipt.student.registration_number
            } if receipt.student else None,
            'payment': {
                'id': receipt.payment.id,
                'transaction_id': receipt.payment.transaction_id,
                'payment_method': receipt.payment.payment_method,
                'fee_structure': receipt.payment.fee_structure.name if receipt.payment.fee_structure else None
            } if receipt.payment else None
        }
    
    @staticmethod
    def get_student_receipts(student_id):
        """Get all receipts for a student"""
        receipts = Receipt.query.filter_by(student_id=student_id).order_by(
            Receipt.created_at.desc()
        ).all()
        
        return [{
            'id': r.id,
            'receipt_number': r.receipt_number,
            'amount': r.amount,
            'currency': r.currency,
            'issue_date': r.issue_date.isoformat(),
            'is_printed': r.is_printed,
            'payment_method': r.payment.payment_method if r.payment else None
        } for r in receipts]
    
    @staticmethod
    def mark_as_printed(receipt_id):
        """Mark receipt as printed"""
        receipt = Receipt.query.get(receipt_id)
        if not receipt:
            return {'success': False, 'error': 'Receipt not found'}
        
        try:
            receipt.is_printed = True
            db.session.commit()
            
            return {'success': True, 'message': 'Receipt marked as printed'}
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def _generate_receipt_pdf(receipt):
        """Generate PDF for receipt"""
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Header
        c.setFont("Helvetica-Bold", 16)
        c.drawString(200, height - 50, "SOMALI NATIONAL UNIVERSITY")
        c.setFont("Helvetica", 12)
        c.drawString(210, height - 70, "OFFICIAL RECEIPT")
        
        c.line(50, height - 85, width - 50, height - 85)
        
        # Receipt details
        y = height - 120
        c.setFont("Helvetica-Bold", 10)
        
        details = [
            f"Receipt Number: {receipt.receipt_number}",
            f"Date: {receipt.issue_date.strftime('%Y-%m-%d %H:%M')}",
            f"Student: {receipt.student.get_full_name() if receipt.student else 'N/A'}",
            f"Registration Number: {receipt.student.registration_number if receipt.student else 'N/A'}",
            f"Transaction ID: {receipt.payment.transaction_id if receipt.payment else 'N/A'}",
            f"Payment Method: {receipt.payment.payment_method if receipt.payment else 'N/A'}",
            f"Fee Structure: {receipt.payment.fee_structure.name if receipt.payment and receipt.payment.fee_structure else 'N/A'}",
            "",
            f"Amount: {receipt.currency} {receipt.amount:,.2f}",
            f"Status: VERIFIED"
        ]
        
        for detail in details:
            c.drawString(50, y, detail)
            y -= 20
        
        # Footer
        c.line(50, y - 20, width - 50, y - 20)
        y -= 40
        c.setFont("Helvetica", 8)
        c.drawString(50, y, "This is a computer-generated receipt. No signature required.")
        y -= 15
        c.drawString(50, y, f"Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
        
        c.save()
        buffer.seek(0)
        
        # Save to file
        upload_dir = os.path.join('uploads', 'receipts')
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"receipt_{receipt.receipt_number}.pdf"
        filepath = os.path.join(upload_dir, filename)
        
        with open(filepath, 'wb') as f:
            f.write(buffer.getvalue())
        
        return filepath