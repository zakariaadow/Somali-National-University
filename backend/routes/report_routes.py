from flask import Blueprint, request, jsonify, send_file, make_response
from flask_login import login_required, current_user
from models import (
    Student, Payment, Result, StudentUnit, Registration, 
    StudentCard, College, Faculty, Department, Programme,
    Unit, Semester, AcademicYear, User, ActivityLog,
    FeeStructure, ExamCard
)
from extensions import db
from datetime import datetime, timedelta
from utils.decorators import role_required
from sqlalchemy import func, and_, or_
import csv
import io
import json
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

report_bp = Blueprint('report', __name__)

@report_bp.route('/dashboard', methods=['GET'])
@login_required
def get_report_dashboard():
    """Get report dashboard with available reports and quick stats"""
    try:
        # Get user role to determine available reports
        role = current_user.role.name
        
        available_reports = {
            'enrollment': {
                'title': 'Enrollment Report',
                'description': 'Student enrollment by programme, department, faculty, or college',
                'available_for': ['Admin', 'College Officer', 'Faculty Officer']
            },
            'financial': {
                'title': 'Financial Report',
                'description': 'Payment statistics and financial summary',
                'available_for': ['Admin', 'Finance Officer']
            },
            'academic_performance': {
                'title': 'Academic Performance Report',
                'description': 'Student performance, grades, and GPA analysis',
                'available_for': ['Admin', 'Lecturer', 'Faculty Officer']
            },
            'student_card': {
                'title': 'Student Card Report',
                'description': 'Student card application status and statistics',
                'available_for': ['Admin', 'College Officer', 'Faculty Officer']
            },
            'registration': {
                'title': 'Registration Report',
                'description': 'Semester registration statistics',
                'available_for': ['Admin', 'College Officer', 'Faculty Officer']
            },
            'attendance': {
                'title': 'Attendance Report',
                'description': 'Student attendance statistics',
                'available_for': ['Admin', 'Lecturer']
            },
            'exam_card': {
                'title': 'Exam Card Report',
                'description': 'Exam card generation and distribution',
                'available_for': ['Admin', 'Finance Officer', 'College Officer']
            },
            'fee_structure': {
                'title': 'Fee Structure Report',
                'description': 'Fee structures by programme and semester',
                'available_for': ['Admin', 'Finance Officer', 'College Officer']
            },
            'graduation': {
                'title': 'Graduation Report',
                'description': 'Graduation statistics and eligibility',
                'available_for': ['Admin', 'College Officer']
            }
        }
        
        # Filter reports based on user role
        user_reports = {}
        for key, report in available_reports.items():
            if role in report['available_for']:
                user_reports[key] = {
                    'title': report['title'],
                    'description': report['description']
                }
        
        # Get quick statistics
        stats = {}
        if role in ['Admin', 'College Officer', 'Faculty Officer']:
            stats['total_students'] = Student.query.count()
            stats['total_lecturers'] = User.query.join(Role).filter(Role.name == 'Lecturer').count()
        
        if role in ['Admin', 'Finance Officer']:
            total_amount = db.session.query(func.sum(Payment.amount)).filter_by(is_verified=True).scalar() or 0
            stats['total_payments'] = Payment.query.count()
            stats['total_amount'] = float(total_amount)
        
        if role in ['Admin', 'College Officer', 'Faculty Officer']:
            stats['pending_cards'] = StudentCard.query.filter_by(status='pending').count()
            stats['approved_cards'] = StudentCard.query.filter_by(status='approved').count()
        
        return jsonify({
            'available_reports': user_reports,
            'quick_stats': stats,
            'role': role
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/enrollment', methods=['GET'])
@login_required
@role_required('Admin', 'College Officer', 'Faculty Officer')
def get_enrollment_report():
    """Get enrollment report by college, faculty, department, or programme"""
    try:
        college_id = request.args.get('college_id', type=int)
        faculty_id = request.args.get('faculty_id', type=int)
        department_id = request.args.get('department_id', type=int)
        programme_id = request.args.get('programme_id', type=int)
        academic_year_id = request.args.get('academic_year_id', type=int)
        format = request.args.get('format', 'json')  # json or csv
        
        query = Student.query
        
        if programme_id:
            query = query.filter_by(programme_id=programme_id)
        elif department_id:
            query = query.join(Programme).filter(Programme.department_id == department_id)
        elif faculty_id:
            query = query.join(Programme).join(Department).filter(Department.faculty_id == faculty_id)
        elif college_id:
            query = query.join(Programme).filter(Programme.college_id == college_id)
        
        students = query.all()
        
        # Group by year of study
        year_groups = {}
        for student in students:
            year = student.year_of_study
            if year not in year_groups:
                year_groups[year] = []
            year_groups[year].append(student)
        
        report_data = {
            'report_type': 'Enrollment Report',
            'generated_at': datetime.utcnow().isoformat(),
            'total_students': len(students),
            'year_groups': {
                str(year): {
                    'count': len(group),
                    'students': [s.to_dict() for s in group]
                } for year, group in year_groups.items()
            },
            'students': [s.to_dict() for s in students]
        }
        
        # Add filters info
        if college_id:
            college = College.query.get(college_id)
            report_data['filter'] = f"College: {college.name if college else 'Unknown'}"
        elif faculty_id:
            faculty = Faculty.query.get(faculty_id)
            report_data['filter'] = f"Faculty: {faculty.name if faculty else 'Unknown'}"
        elif department_id:
            department = Department.query.get(department_id)
            report_data['filter'] = f"Department: {department.name if department else 'Unknown'}"
        elif programme_id:
            programme = Programme.query.get(programme_id)
            report_data['filter'] = f"Programme: {programme.name if programme else 'Unknown'}"
        
        if format == 'csv':
            return export_to_csv(report_data, 'enrollment_report')
        
        return jsonify(report_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/financial', methods=['GET'])
@login_required
@role_required('Admin', 'Finance Officer')
def get_financial_report():
    """Get comprehensive financial report"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        college_id = request.args.get('college_id', type=int)
        format = request.args.get('format', 'json')
        
        query = Payment.query.filter_by(is_verified=True)
        
        if start_date:
            query = query.filter(Payment.payment_date >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(Payment.payment_date <= datetime.fromisoformat(end_date))
        
        # Filter by college if specified
        if college_id:
            query = query.join(Student).join(Programme).filter(Programme.college_id == college_id)
        
        payments = query.all()
        
        # Group by payment method
        method_groups = {}
        for payment in payments:
            method = payment.payment_method
            if method not in method_groups:
                method_groups[method] = {
                    'count': 0,
                    'amount': 0,
                    'payments': []
                }
            method_groups[method]['count'] += 1
            method_groups[method]['amount'] += payment.amount
            method_groups[method]['payments'].append(payment)
        
        total_amount = sum(p.amount for p in payments)
        
        report_data = {
            'report_type': 'Financial Report',
            'generated_at': datetime.utcnow().isoformat(),
            'total_payments': len(payments),
            'total_amount': float(total_amount),
            'by_payment_method': {
                method: {
                    'count': data['count'],
                    'amount': float(data['amount']),
                    'percentage': round((data['amount'] / total_amount) * 100, 2) if total_amount > 0 else 0
                } for method, data in method_groups.items()
            },
            'payments': [p.to_dict() for p in payments]
        }
        
        # Add date range
        if start_date and end_date:
            report_data['date_range'] = f"{start_date} to {end_date}"
        
        if format == 'csv':
            return export_to_csv(report_data, 'financial_report')
        
        return jsonify(report_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/academic-performance', methods=['GET'])
@login_required
@role_required('Admin', 'Lecturer', 'Faculty Officer')
def get_academic_performance_report():
    """Get academic performance report with grade distribution"""
    try:
        semester_id = request.args.get('semester_id', type=int)
        academic_year_id = request.args.get('academic_year_id', type=int)
        programme_id = request.args.get('programme_id', type=int)
        department_id = request.args.get('department_id', type=int)
        faculty_id = request.args.get('faculty_id', type=int)
        college_id = request.args.get('college_id', type=int)
        unit_id = request.args.get('unit_id', type=int)
        format = request.args.get('format', 'json')
        
        query = Result.query.filter_by(is_published=True)
        
        if semester_id:
            query = query.filter_by(semester_id=semester_id)
        if academic_year_id:
            query = query.filter_by(academic_year_id=academic_year_id)
        if unit_id:
            query = query.filter_by(student_unit_id=unit_id)
        if programme_id:
            query = query.join(Student).filter(Student.programme_id == programme_id)
        elif department_id:
            query = query.join(Student).join(Programme).filter(Programme.department_id == department_id)
        elif faculty_id:
            query = query.join(Student).join(Programme).join(Department).filter(Department.faculty_id == faculty_id)
        elif college_id:
            query = query.join(Student).join(Programme).filter(Programme.college_id == college_id)
        
        results = query.all()
        
        # Grade distribution
        grade_distribution = {
            'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D': 0, 'F': 0
        }
        
        total_grade_points = 0
        total_credits = 0
        
        for result in results:
            if result.grade in grade_distribution:
                grade_distribution[result.grade] += 1
            if result.grade_point and result.student_unit and result.student_unit.unit:
                total_grade_points += result.grade_point * result.student_unit.unit.credits
                total_credits += result.student_unit.unit.credits
        
        # Calculate GPA
        gpa = total_grade_points / total_credits if total_credits > 0 else 0
        
        # Calculate pass/fail rates
        passed = sum(1 for r in results if r.grade != 'F')
        failed = sum(1 for r in results if r.grade == 'F')
        
        report_data = {
            'report_type': 'Academic Performance Report',
            'generated_at': datetime.utcnow().isoformat(),
            'total_students': len(set(r.student_id for r in results)),
            'total_results': len(results),
            'gpa': round(gpa, 2),
            'total_credits': total_credits,
            'pass_rate': round((passed / len(results)) * 100, 2) if results else 0,
            'fail_rate': round((failed / len(results)) * 100, 2) if results else 0,
            'grade_distribution': grade_distribution,
            'results': [r.to_dict() for r in results]
        }
        
        if format == 'csv':
            return export_to_csv(report_data, 'academic_performance_report')
        
        return jsonify(report_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/student-card', methods=['GET'])
@login_required
@role_required('Admin', 'College Officer', 'Faculty Officer')
def get_student_card_report():
    """Get student card report"""
    try:
        status = request.args.get('status')
        college_id = request.args.get('college_id', type=int)
        faculty_id = request.args.get('faculty_id', type=int)
        department_id = request.args.get('department_id', type=int)
        format = request.args.get('format', 'json')
        
        query = StudentCard.query
        
        if status:
            query = query.filter_by(status=status)
        
        if college_id:
            query = query.join(Student).join(Programme).filter(Programme.college_id == college_id)
        elif faculty_id:
            query = query.join(Student).join(Programme).join(Department).filter(Department.faculty_id == faculty_id)
        elif department_id:
            query = query.join(Student).join(Programme).filter(Programme.department_id == department_id)
        
        cards = query.all()
        
        # Status distribution
        status_distribution = {
            'pending': 0,
            'approved': 0,
            'rejected': 0
        }
        
        for card in cards:
            if card.status in status_distribution:
                status_distribution[card.status] += 1
        
        report_data = {
            'report_type': 'Student Card Report',
            'generated_at': datetime.utcnow().isoformat(),
            'total_applications': len(cards),
            'status_distribution': status_distribution,
            'cards': [c.to_dict() for c in cards]
        }
        
        if format == 'csv':
            return export_to_csv(report_data, 'student_card_report')
        
        return jsonify(report_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/registration', methods=['GET'])
@login_required
@role_required('Admin', 'College Officer', 'Faculty Officer')
def get_registration_report():
    """Get registration report"""
    try:
        semester_id = request.args.get('semester_id', type=int)
        academic_year_id = request.args.get('academic_year_id', type=int)
        college_id = request.args.get('college_id', type=int)
        faculty_id = request.args.get('faculty_id', type=int)
        department_id = request.args.get('department_id', type=int)
        format = request.args.get('format', 'json')
        
        query = Registration.query
        
        if semester_id:
            query = query.filter_by(semester_id=semester_id)
        if academic_year_id:
            query = query.filter_by(academic_year_id=academic_year_id)
        
        # Filter by academic structure
        if college_id:
            query = query.join(Student).join(Programme).filter(Programme.college_id == college_id)
        elif faculty_id:
            query = query.join(Student).join(Programme).join(Department).filter(Department.faculty_id == faculty_id)
        elif department_id:
            query = query.join(Student).join(Programme).filter(Programme.department_id == department_id)
        
        registrations = query.all()
        
        approved = sum(1 for r in registrations if r.is_approved)
        pending = len(registrations) - approved
        
        report_data = {
            'report_type': 'Registration Report',
            'generated_at': datetime.utcnow().isoformat(),
            'total_registrations': len(registrations),
            'approved': approved,
            'pending': pending,
            'approval_rate': round((approved / len(registrations)) * 100, 2) if registrations else 0,
            'registrations': [r.to_dict() for r in registrations]
        }
        
        if format == 'csv':
            return export_to_csv(report_data, 'registration_report')
        
        return jsonify(report_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/attendance', methods=['GET'])
@login_required
@role_required('Admin', 'Lecturer')
def get_attendance_report():
    """Get attendance report"""
    try:
        student_id = request.args.get('student_id', type=int)
        unit_id = request.args.get('unit_id', type=int)
        semester_id = request.args.get('semester_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        format = request.args.get('format', 'json')
        
        from models import Attendance
        
        query = Attendance.query
        
        if student_id:
            query = query.filter_by(student_id=student_id)
        if unit_id:
            query = query.filter_by(unit_id=unit_id)
        if semester_id:
            query = query.join(Unit).filter(Unit.semester_id == semester_id)
        if start_date:
            query = query.filter(Attendance.lecture_date >= datetime.fromisoformat(start_date).date())
        if end_date:
            query = query.filter(Attendance.lecture_date <= datetime.fromisoformat(end_date).date())
        
        attendances = query.all()
        
        # Attendance statistics
        total = len(attendances)
        present = sum(1 for a in attendances if a.status == 'present')
        absent = sum(1 for a in attendances if a.status == 'absent')
        excused = sum(1 for a in attendances if a.status == 'excused')
        
        report_data = {
            'report_type': 'Attendance Report',
            'generated_at': datetime.utcnow().isoformat(),
            'total_lectures': total,
            'present': present,
            'absent': absent,
            'excused': excused,
            'attendance_rate': round((present / total) * 100, 2) if total > 0 else 0,
            'attendances': [a.to_dict() for a in attendances]
        }
        
        if format == 'csv':
            return export_to_csv(report_data, 'attendance_report')
        
        return jsonify(report_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/exam-card', methods=['GET'])
@login_required
@role_required('Admin', 'Finance Officer', 'College Officer')
def get_exam_card_report():
    """Get exam card report"""
    try:
        semester_id = request.args.get('semester_id', type=int)
        academic_year_id = request.args.get('academic_year_id', type=int)
        college_id = request.args.get('college_id', type=int)
        format = request.args.get('format', 'json')
        
        query = ExamCard.query
        
        if semester_id:
            query = query.filter_by(semester_id=semester_id)
        if academic_year_id:
            query = query.filter_by(academic_year_id=academic_year_id)
        if college_id:
            query = query.join(Student).join(Programme).filter(Programme.college_id == college_id)
        
        exam_cards = query.all()
        
        generated = len(exam_cards)
        downloaded = sum(1 for c in exam_cards if c.is_downloaded)
        not_downloaded = generated - downloaded
        
        report_data = {
            'report_type': 'Exam Card Report',
            'generated_at': datetime.utcnow().isoformat(),
            'total_generated': generated,
            'downloaded': downloaded,
            'not_downloaded': not_downloaded,
            'download_rate': round((downloaded / generated) * 100, 2) if generated > 0 else 0,
            'exam_cards': [c.to_dict() for c in exam_cards]
        }
        
        if format == 'csv':
            return export_to_csv(report_data, 'exam_card_report')
        
        return jsonify(report_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/graduation', methods=['GET'])
@login_required
@role_required('Admin', 'College Officer')
def get_graduation_report():
    """Get graduation report"""
    try:
        academic_year_id = request.args.get('academic_year_id', type=int)
        college_id = request.args.get('college_id', type=int)
        faculty_id = request.args.get('faculty_id', type=int)
        department_id = request.args.get('department_id', type=int)
        format = request.args.get('format', 'json')
        
        query = Student.query.filter_by(is_graduated=True)
        
        if academic_year_id:
            academic_year = AcademicYear.query.get(academic_year_id)
            if academic_year:
                query = query.filter(
                    Student.graduation_date.between(
                        academic_year.start_date,
                        academic_year.end_date
                    )
                )
        
        if college_id:
            query = query.join(Programme).filter(Programme.college_id == college_id)
        elif faculty_id:
            query = query.join(Programme).join(Department).filter(Department.faculty_id == faculty_id)
        elif department_id:
            query = query.join(Programme).filter(Programme.department_id == department_id)
        
        graduates = query.all()
        
        # Group by programme
        programme_groups = {}
        for student in graduates:
            prog_name = student.programme.name if student.programme else 'Unknown'
            if prog_name not in programme_groups:
                programme_groups[prog_name] = []
            programme_groups[prog_name].append(student)
        
        report_data = {
            'report_type': 'Graduation Report',
            'generated_at': datetime.utcnow().isoformat(),
            'total_graduates': len(graduates),
            'programme_groups': {
                prog: {
                    'count': len(group),
                    'students': [s.to_dict() for s in group]
                } for prog, group in programme_groups.items()
            },
            'graduates': [s.to_dict() for s in graduates]
        }
        
        if format == 'csv':
            return export_to_csv(report_data, 'graduation_report')
        
        return jsonify(report_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/fee-structure', methods=['GET'])
@login_required
@role_required('Admin', 'Finance Officer', 'College Officer')
def get_fee_structure_report():
    """Get fee structure report"""
    try:
        semester_id = request.args.get('semester_id', type=int)
        academic_year_id = request.args.get('academic_year_id', type=int)
        college_id = request.args.get('college_id', type=int)
        format = request.args.get('format', 'json')
        
        query = FeeStructure.query
        
        if semester_id:
            query = query.filter_by(semester_id=semester_id)
        if academic_year_id:
            query = query.filter_by(academic_year_id=academic_year_id)
        if college_id:
            query = query.join(Programme).filter(Programme.college_id == college_id)
        
        fee_structures = query.all()
        
        # Calculate averages
        avg_tuition = sum(fs.tuition_fee for fs in fee_structures) / len(fee_structures) if fee_structures else 0
        avg_total = sum(fs.total_fee for fs in fee_structures) / len(fee_structures) if fee_structures else 0
        
        report_data = {
            'report_type': 'Fee Structure Report',
            'generated_at': datetime.utcnow().isoformat(),
            'total_fee_structures': len(fee_structures),
            'average_tuition': round(avg_tuition, 2),
            'average_total_fee': round(avg_total, 2),
            'fee_structures': [fs.to_dict() for fs in fee_structures]
        }
        
        if format == 'csv':
            return export_to_csv(report_data, 'fee_structure_report')
        
        return jsonify(report_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def export_to_csv(data, filename):
    """Export report data to CSV"""
    try:
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['Report Type', data.get('report_type', 'Unknown')])
        writer.writerow(['Generated At', data.get('generated_at', '')])
        writer.writerow([])  # Empty row
        
        # Write data
        for key, value in data.items():
            if key not in ['report_type', 'generated_at'] and not isinstance(value, (list, dict)):
                writer.writerow([key.replace('_', ' ').title(), value])
        
        writer.writerow([])
        
        # If there's a list of items, write them
        for key, value in data.items():
            if isinstance(value, list) and value:
                writer.writerow([key.replace('_', ' ').title()])
                if value and isinstance(value[0], dict):
                    headers = list(value[0].keys())
                    writer.writerow(headers)
                    for item in value:
                        row = []
                        for header in headers:
                            val = item.get(header, '')
                            if isinstance(val, dict):
                                val = json.dumps(val)
                            row.append(val)
                        writer.writerow(row)
                writer.writerow([])
        
        response = make_response(output.getvalue())
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename={filename}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        return response
        
    except Exception as e:
        return jsonify({'error': f'Error generating CSV: {str(e)}'}), 500

@report_bp.route('/generate-pdf', methods=['POST'])
@login_required
def generate_pdf_report():
    """Generate PDF report"""
    try:
        data = request.get_json()
        report_type = data.get('report_type')
        report_data = data.get('report_data')
        
        if not report_type or not report_data:
            return jsonify({'error': 'Report type and data required'}), 400
        
        # Create PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#003366'),
            alignment=1,  # Center
            spaceAfter=30
        )
        story.append(Paragraph(f"SNU - {report_type.replace('_', ' ').title()}", title_style))
        story.append(Spacer(1, 12))
        
        # Date
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        story.append(Spacer(1, 12))
        
        # Summary statistics
        summary_data = []
        for key, value in report_data.items():
            if not isinstance(value, (list, dict)) and key not in ['report_type', 'generated_at']:
                summary_data.append([key.replace('_', ' ').title(), str(value)])
        
        if summary_data:
            summary_table = Table(summary_data, colWidths=[2*inch, 3*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(summary_table)
            story.append(Spacer(1, 20))
        
        # Detailed data tables
        for key, value in report_data.items():
            if isinstance(value, list) and value and isinstance(value[0], dict):
                story.append(Paragraph(key.replace('_', ' ').title(), styles['Heading2']))
                story.append(Spacer(1, 6))
                
                headers = list(value[0].keys())
                table_data = [headers]
                for item in value:
                    row = []
                    for header in headers:
                        val = item.get(header, '')
                        if isinstance(val, dict):
                            val = json.dumps(val)
                        row.append(str(val))
                    table_data.append(row)
                
                table = Table(table_data)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                story.append(table)
                story.append(Spacer(1, 20))
        
        doc.build(story)
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/export-all', methods=['POST'])
@login_required
@role_required('Admin')
def export_all_reports():
    """Export all reports as a single package"""
    try:
        # This would generate a zip file with all reports
        # For now, return a message
        return jsonify({
            'message': 'Export all reports feature',
            'note': 'This will generate a comprehensive report package'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500