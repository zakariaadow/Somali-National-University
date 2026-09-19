# backend/services/pdf_service.py
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import io
import os
from PIL import Image as PILImage
import qrcode

class PDFService:
    @staticmethod
    def generate_receipt(receipt_data):
        """Generate receipt PDF"""
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
            f"Receipt Number: {receipt_data.get('receipt_number', 'N/A')}",
            f"Date: {receipt_data.get('date', 'N/A')}",
            f"Student: {receipt_data.get('student_name', 'N/A')}",
            f"Registration Number: {receipt_data.get('registration_number', 'N/A')}",
            f"Transaction ID: {receipt_data.get('transaction_id', 'N/A')}",
            f"Payment Method: {receipt_data.get('payment_method', 'N/A')}",
            f"Fee Structure: {receipt_data.get('fee_structure', 'N/A')}",
            "",
            f"Amount: {receipt_data.get('currency', 'USD')} {receipt_data.get('amount', 0):,.2f}",
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
        return buffer
    
    @staticmethod
    def generate_exam_card(exam_card_data):
        """Generate exam card PDF"""
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
        
        details = [
            f"Name: {exam_card_data.get('student_name', 'N/A')}",
            f"Registration Number: {exam_card_data.get('registration_number', 'N/A')}",
            f"Programme: {exam_card_data.get('programme', 'N/A')}",
            f"Semester: {exam_card_data.get('semester', 'N/A')}",
            f"Academic Year: {exam_card_data.get('academic_year', 'N/A')}",
            f"Card Number: {exam_card_data.get('card_number', 'N/A')}",
            f"Issue Date: {exam_card_data.get('issue_date', 'N/A')}",
            f"Status: {exam_card_data.get('status', 'N/A')}"
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
        units = exam_card_data.get('units', [])
        for unit in units:
            c.drawString(50, y, f"{unit.get('code', '')}: {unit.get('name', '')} ({unit.get('credits', 0)} credits)")
            y -= 18
        
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
        return buffer
    
    @staticmethod
    def generate_student_card(card_data, photo_path=None):
        """Generate student ID card PDF"""
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Header
        c.setFont("Helvetica-Bold", 16)
        c.drawString(160, height - 50, "SOMALI NATIONAL UNIVERSITY")
        c.setFont("Helvetica", 12)
        c.drawString(200, height - 70, "STUDENT IDENTIFICATION CARD")
        
        c.line(50, height - 85, width - 50, height - 85)
        
        # Student photo
        y = height - 170
        if photo_path and os.path.exists(photo_path):
            try:
                c.drawImage(photo_path, 50, y - 100, width=120, height=140)
            except:
                c.rect(50, y - 100, 120, 140)
                c.setFont("Helvetica", 10)
                c.drawString(80, y - 50, "PHOTO")
        else:
            c.rect(50, y - 100, 120, 140)
            c.setFont("Helvetica", 10)
            c.drawString(80, y - 50, "PHOTO")
        
        # QR Code
        qr = qrcode.QRCode(version=1, box_size=4, border=1)
        qr.add_data(card_data.get('card_number', 'N/A'))
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_path = f"/tmp/qr_{card_data.get('card_number', 'temp')}.png"
        qr_img.save(qr_path)
        c.drawImage(qr_path, width - 180, 50, width=120, height=120)
        os.remove(qr_path)
        
        # Student information
        y = height - 120
        c.setFont("Helvetica-Bold", 10)
        c.drawString(200, y, "STUDENT INFORMATION")
        
        y -= 25
        c.setFont("Helvetica", 10)
        
        details = [
            f"Name: {card_data.get('student_name', 'N/A')}",
            f"Registration Number: {card_data.get('registration_number', 'N/A')}",
            f"Programme: {card_data.get('programme', 'N/A')}",
            f"Year of Study: {card_data.get('year_of_study', 'N/A')}",
            f"Card Number: {card_data.get('card_number', 'N/A')}",
            f"Issue Date: {card_data.get('issue_date', 'N/A')}",
            f"Expiry Date: {card_data.get('expiry_date', 'N/A')}"
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
        return buffer
    
    @staticmethod
    def generate_transcript(transcript_data):
        """Generate transcript PDF"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            alignment=1,
            spaceAfter=30
        )
        story.append(Paragraph("ACADEMIC TRANSCRIPT", title_style))
        
        # Student info
        story.append(Spacer(1, 12))
        student = transcript_data.get('student', {})
        story.append(Paragraph(f"Name: {student.get('name', 'N/A')}", styles['Normal']))
        story.append(Paragraph(f"Registration Number: {student.get('registration_number', 'N/A')}", styles['Normal']))
        story.append(Paragraph(f"Programme: {student.get('programme', 'N/A')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Transcript
        for semester in transcript_data.get('transcript', []):
            story.append(Paragraph(f"<b>{semester.get('semester', 'N/A')}</b>", styles['Normal']))
            story.append(Paragraph(f"Academic Year: {semester.get('academic_year', 'N/A')}", styles['Normal']))
            story.append(Spacer(1, 6))
            
            # Units table
            table_data = [['Unit', 'Code', 'Credits', 'Grade', 'Grade Points']]
            for unit in semester.get('units', []):
                table_data.append([
                    unit.get('unit', ''),
                    unit.get('code', ''),
                    str(unit.get('credits', 0)),
                    unit.get('grade', ''),
                    str(unit.get('grade_points', 0))
                ])
            
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 7)
            ]))
            story.append(table)
            
            story.append(Spacer(1, 6))
            story.append(Paragraph(f"GPA: {semester.get('gpa', 0)}", styles['Normal']))
            story.append(Spacer(1, 12))
        
        # CGPA
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"<b>Cumulative GPA (CGPA): {transcript_data.get('cgpa', 0)}</b>", styles['Normal']))
        story.append(Paragraph(f"Total Credits: {transcript_data.get('total_credits', 0)}", styles['Normal']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer