# backend/services/notification_service.py
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

class NotificationService:
    @staticmethod
    def send_email(to_email, subject, body, html_body=None):
        """Send email notification"""
        try:
            smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
            smtp_port = int(os.environ.get('SMTP_PORT', 587))
            smtp_user = os.environ.get('SMTP_USER')
            smtp_password = os.environ.get('SMTP_PASSWORD')
            
            if not smtp_user or not smtp_password:
                # Log error but don't fail
                print("SMTP credentials not configured")
                return False
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = smtp_user
            msg['To'] = to_email
            
            # Plain text body
            text_part = MIMEText(body, 'plain')
            msg.attach(text_part)
            
            # HTML body if provided
            if html_body:
                html_part = MIMEText(html_body, 'html')
                msg.attach(html_part)
            
            # Send email
            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
            
            return True
        except Exception as e:
            print(f"Email send error: {str(e)}")
            return False
    
    @staticmethod
    def notify_payment_verified(payment, receipt_number):
        """Notify student that payment was verified"""
        student = payment.student
        if not student or not student.user:
            return False
        
        subject = "Payment Verification - Somali National University"
        body = f"""
        Dear {student.get_full_name()},
        
        Your payment of {payment.currency} {payment.amount:,.2f} has been verified.
        
        Receipt Number: {receipt_number}
        Transaction ID: {payment.transaction_id}
        Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}
        
        You can download your receipt from the student portal.
        
        Thank you,
        Somali National University Finance Department
        """
        
        return NotificationService.send_email(student.user.email, subject, body)
    
    @staticmethod
    def notify_exam_card_approved(exam_card):
        """Notify student that exam card was approved"""
        student = exam_card.student
        if not student or not student.user:
            return False
        
        subject = "Exam Card Approved - Somali National University"
        body = f"""
        Dear {student.get_full_name()},
        
        Your examination card has been approved.
        
        Card Number: {exam_card.exam_card_number}
        Semester: {exam_card.semester.name if exam_card.semester else 'N/A'}
        Approval Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}
        
        You can download your exam card from the student portal.
        
        Good luck with your examinations!
        Somali National University
        """
        
        return NotificationService.send_email(student.user.email, subject, body)
    
    @staticmethod
    def notify_registration_approved(registration):
        """Notify student that registration was approved"""
        student = registration.student
        if not student or not student.user:
            return False
        
        subject = "Registration Approved - Somali National University"
        body = f"""
        Dear {student.get_full_name()},
        
        Your registration for the semester has been approved.
        
        Semester: {registration.semester.name if registration.semester else 'N/A'}
        Approval Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}
        Units Registered: {registration.student_units.count()}
        
        You can view your registered units on the student portal.
        
        Somali National University
        """
        
        return NotificationService.send_email(student.user.email, subject, body)
    
    @staticmethod
    def notify_results_published(student_id, unit_name):
        """Notify student that results were published"""
        from models import Student
        
        student = Student.query.get(student_id)
        if not student or not student.user:
            return False
        
        subject = "Results Published - Somali National University"
        body = f"""
        Dear {student.get_full_name()},
        
        Results for {unit_name} have been published.
        
        Please log in to the student portal to view your results.
        
        Somali National University
        """
        
        return NotificationService.send_email(student.user.email, subject, body)
    
    @staticmethod
    def notify_announcement(announcement):
        """Notify students about new announcement"""
        from models import Student
        
        # Get all students
        students = Student.query.all()
        
        sent_count = 0
        for student in students:
            if student.user and student.user.email:
                subject = f"New Announcement: {announcement.title} - Somali National University"
                body = f"""
                Dear {student.get_full_name()},
                
                A new announcement has been posted:
                
                {announcement.title}
                {announcement.content}
                
                Posted: {announcement.created_at.strftime('%Y-%m-%d %H:%M')}
                
                Please log in to the student portal for more details.
                
                Somali National University
                """
                
                if NotificationService.send_email(student.user.email, subject, body):
                    sent_count += 1
        
        return sent_count