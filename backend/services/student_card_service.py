# backend/services/student_card_service.py
from database import db
from models import StudentCard, Student, Semester
from datetime import datetime
import os
import uuid
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PIL import Image
import qrcode

class StudentCardService:
    @staticmethod
    def generate_card(student_id, semester_id=None):
        """Generate a student ID card"""
        student = Student.query.get(student_id)
        if not student:
            return {'success': False, 'error': 'Student not found'}
        
        # Check if already has active card
        existing = StudentCard.query.filter_by(
            student_id=student_id,
            is_active=True
        ).first()
        
        if existing:
            return {'success': False, 'error': 'Active student card already exists'}
        
        # Get current semester if not specified
        if not semester_id:
            current_semester = Semester.query.filter_by(is_current=True, is_active=True).first()
            if not current_semester:
                return {'success': False, 'error': 'No current semester found'}
            semester_id = current_semester.id
            semester = current_semester
        else:
            semester = Semester.query.get(semester_id)
            if not semester:
                return {'success': False, 'error': 'Semester not found'}
        
        # Generate card number
        card_number = f"SC{datetime.utcnow().strftime('%Y%m%d')}{student.id}"
        
        # Expiry date: end of current academic year
        expiry_date = semester.academic_year.end_date if semester.academic_year else datetime.utcnow().date()
        
        try:
            student_card = StudentCard(
                card_number=card_number,
                student_id=student_id,
                semester_id=semester_id,
                expiry_date=expiry_date
            )
            db.session.add(student_card)
            db.session.flush()
            
            # Generate PDF
            card_file = StudentCardService._generate_card_pdf(student_card)
            student_card.card_file = card_file
            
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Student card generated successfully',
                'card_id': student_card.id,
                'card_number': card_number
            }
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def regenerate_card(card_id):
        """Regenerate an existing student card"""
        card = StudentCard.query.get(card_id)
        if not card:
            return {'success': False, 'error': 'Card not found'}
        
        try:
            # Generate new PDF
            card_file = StudentCardService._generate_card_pdf(card)
            card.card_file = card_file
            card.issue_date = datetime.utcnow()
            db.session.commit()
            
            return {'success': True, 'message': 'Card regenerated successfully'}
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def deactivate_card(card_id):
        """Deactivate a student card"""
        card = StudentCard.query.get(card_id)
        if not card:
            return {'success': False, 'error': 'Card not found'}
        
        try:
            card.is_active = False
            db.session.commit()
            
            return {'success': True, 'message': 'Card deactivated'}
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_active_card(student_id):
        """Get active student card for a student"""
        card = StudentCard.query.filter_by(
            student_id=student_id,
            is_active=True
        ).first()
        
        if not card:
            return None
        
        return {
            'id': card.id,
            'card_number': card.card_number,
            'card_file': card.card_file,
            'issue_date': card.issue_date.isoformat(),
            'expiry_date': card.expiry_date.isoformat(),
            'is_active': card.is_active,
            'is_printed': card.is_printed
        }
    
    @staticmethod
    def _generate_card_pdf(card):
        """Generate PDF for student card"""
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # University header
        c.setFont("Helvetica-Bold", 16)
        c.drawString(160, height - 50, "SOMALI NATIONAL UNIVERSITY")
        c.setFont("Helvetica", 12)
        c.drawString(200, height - 70, "STUDENT IDENTIFICATION CARD")
        
        c.line(50, height - 85, width - 50, height - 85)
        
        # Student photo
        y = height - 170
        c.rect(50, y - 100, 120, 140)
        c.setFont("Helvetica", 10)
        c.drawString(80, y - 50, "PHOTO")
        
        # QR Code (placeholder)
        qr = qrcode.QRCode(version=1, box_size=4, border=1)
        qr.add_data(card.card_number)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        img_path = f"/tmp/qr_{card.card_number}.png"
        img.save(img_path)
        c.drawImage(img_path, width - 180, 50, width=120, height=120)
        os.remove(img_path)
        
        # Student information
        y = height - 120
        c.setFont("Helvetica-Bold", 10)
        c.drawString(200, y, "STUDENT INFORMATION")
        
        y -= 25
        c.setFont("Helvetica", 10)
        student = card.student
        
        details = [
            f"Name: {student.get_full_name() if student else 'N/A'}",
            f"Registration Number: {student.registration_number if student else 'N/A'}",
            f"Programme: {student.programme.name if student and student.programme else 'N/A'}",
            f"Year of Study: {student.year_of_study if student else 'N/A'}",
            f"Card Number: {card.card_number}",
            f"Issue Date: {card.issue_date.strftime('%Y-%m-%d')}",
            f"Expiry Date: {card.expiry_date.strftime('%Y-%m-%d')}"
        ]
        
        for detail in details:
            c.drawString(200, y, detail)
            y -= 20
        
        # Footer
        c.line(50, 45, width - 50, 45)
        c.setFont("Helvetica", 8)
        c.drawString(50, 30, "This card is the property of Somali National University")
        c.drawString(50, 15, "and must be presented upon request.")
        
        c.save()
        buffer.seek(0)
        
        # Save to file
        upload_dir = os.path.join('uploads', 'student_cards')
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"student_card_{card.card_number}.pdf"
        filepath = os.path.join(upload_dir, filename)
        
        with open(filepath, 'wb') as f:
            f.write(buffer.getvalue())
        
        return filepath