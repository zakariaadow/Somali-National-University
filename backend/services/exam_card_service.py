# backend/services/exam_card_service.py
from database import db
from models import ExamCard, Student, Semester, Registration, Payment
from datetime import datetime
import os
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

class ExamCardService:
    @staticmethod
    def generate_exam_card(student_id, semester_id=None):
        """Generate an exam card for a student"""
        student = Student.query.get(student_id)
        if not student:
            return {'success': False, 'error': 'Student not found'}
        
        # Check eligibility
        eligibility = ExamCardService.check_eligibility(student_id, semester_id)
        if not eligibility['eligible']:
            return {'success': False, 'error': eligibility['reason']}
        
        # Check if exam card already exists
        existing = ExamCard.query.filter_by(
            student_id=student_id,
            semester_id=semester_id
        ).first()
        
        if existing:
            return {'success': False, 'error': 'Exam card already exists'}
        
        # Get semester
        if not semester_id:
            semester = Semester.query.filter_by(is_current=True, is_active=True).first()
            if not semester:
                return {'success': False, 'error': 'No current semester found'}
            semester_id = semester.id
        
        # Generate exam card number
        exam_card_number = f"EX{datetime.utcnow().strftime('%Y%m%d')}{student.id}"
        
        try:
            exam_card = ExamCard(
                exam_card_number=exam_card_number,
                student_id=student_id,
                semester_id=semester_id
            )
            db.session.add(exam_card)
            db.session.flush()
            
            # Generate PDF
            pdf_path = ExamCardService._generate_exam_card_pdf(exam_card)
            exam_card.exam_card_file = pdf_path
            
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Exam card generated successfully',
                'card_id': exam_card.id,
                'card_number': exam_card_number
            }
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def approve_exam_card(card_id):
        """Approve an exam card"""
        card = ExamCard.query.get(card_id)
        if not card:
            return {'success': False, 'error': 'Exam card not found'}
        
        if card.status != 'pending':
            return {'success': False, 'error': 'Exam card already processed'}
        
        try:
            card.is_approved = True
            card.approval_date = datetime.utcnow()
            card.status = 'approved'
            db.session.commit()
            
            return {'success': True, 'message': 'Exam card approved'}
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def check_eligibility(student_id, semester_id=None):
        """Check if a student is eligible for an exam card"""
        student = Student.query.get(student_id)
        if not student:
            return {'eligible': False, 'reason': 'Student not found'}
        
        # Check if student is registered for this semester
        if not semester_id:
            semester = Semester.query.filter_by(is_current=True, is_active=True).first()
            if not semester:
                return {'eligible': False, 'reason': 'No current semester found'}
            semester_id = semester.id
        
        registration = Registration.query.filter_by(
            student_id=student_id,
            semester_id=semester_id,
            status='approved'
        ).first()
        
        if not registration:
            return {'eligible': False, 'reason': 'Not registered for this semester'}
        
        # Check if all fees are paid
        pending_payments = Payment.query.filter_by(
            student_id=student_id,
            status='pending'
        ).count()
        
        if pending_payments > 0:
            return {'eligible': False, 'reason': 'Has pending payments'}
        
        return {'eligible': True}
    
    @staticmethod
    def get_student_exam_cards(student_id):
        """Get all exam cards for a student"""
        cards = ExamCard.query.filter_by(student_id=student_id).order_by(
            ExamCard.created_at.desc()
        ).all()
        
        return [{
            'id': c.id,
            'card_number': c.exam_card_number,
            'issue_date': c.issue_date.isoformat(),
            'is_approved': c.is_approved,
            'status': c.status,
            'semester': c.semester.name if c.semester else None,
            'can_download': c.status == 'approved'
        } for c in cards]
    
    @staticmethod
    def _generate_exam_card_pdf(card):
        """Generate PDF for exam card"""
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Header
        c.setFont("Helvetica-Bold", 16)
        c.drawString(180, height - 50, "SOMALI NATIONAL UNIVERSITY")
        c.setFont("Helvetica", 12)
        c.drawString(210, height - 70, "EXAMINATION CARD")
        
        c.line(50, height - 85, width - 50, height - 85)
        
        # Student info
        y = height - 120
        c.setFont("Helvetica-Bold", 10)
        c.drawString(50, y, "STUDENT INFORMATION")
        
        y -= 25
        c.setFont("Helvetica", 10)
        student = card.student
        semester = card.semester
        
        details = [
            f"Name: {student.get_full_name() if student else 'N/A'}",
            f"Registration Number: {student.registration_number if student else 'N/A'}",
            f"Programme: {student.programme.name if student and student.programme else 'N/A'}",
            f"Semester: {semester.name if semester else 'N/A'}",
            f"Academic Year: {semester.academic_year.name if semester and semester.academic_year else 'N/A'}",
            f"Card Number: {card.exam_card_number}",
            f"Issue Date: {card.issue_date.strftime('%Y-%m-%d')}",
            f"Status: {card.status.upper()}"
        ]
        
        for detail in details:
            c.drawString(50, y, detail)
            y -= 20
        
        # Unit list
        y -= 10
        c.setFont("Helvetica-Bold", 10)
        c.drawString(50, y, "REGISTERED UNITS")
        y -= 25
        
        c.setFont("Helvetica", 9)
        registration = Registration.query.filter_by(
            student_id=student.id,
            semester_id=card.semester_id,
            status='approved'
        ).first()
        
        if registration:
            for su in registration.student_units:
                c.drawString(50, y, f"{su.unit.code}: {su.unit.name} ({su.unit.credits} credits)")
                y -= 18
        else:
            c.drawString(50, y, "No units registered")
        
        # Footer
        y -= 30
        c.line(50, y + 10, width - 50, y + 10)
        y -= 20
        c.setFont("Helvetica", 8)
        c.drawString(50, y, "This card is valid only for the current examination period.")
        y -= 15
        c.drawString(50, y, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
        
        c.save()
        buffer.seek(0)
        
        # Save to file
        upload_dir = os.path.join('uploads', 'exam_cards')
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"exam_card_{card.exam_card_number}.pdf"
        filepath = os.path.join(upload_dir, filename)
        
        with open(filepath, 'wb') as f:
            f.write(buffer.getvalue())
        
        return filepath