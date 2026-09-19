# backend/services/report_service.py
from database import db
from models import (
    User, Student, Lecturer, Payment, Registration, Result, Unit, 
    Semester, Faculty, College, Department, Programme, ActivityLog,
    FeeStructure, Receipt, ExamCard, StudentCard, Attendance, OnlineClass
)
from datetime import datetime, timedelta
import io
import csv
import json
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, landscape, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.linecharts import HorizontalLineChart

class ReportService:
    """Comprehensive report generation service for Somali National University"""
    
    @staticmethod
    def generate_student_registration_report(filters=None):
        """
        Generate student registration report
        Filters: semester_id, programme_id, status, start_date, end_date
        """
        query = Registration.query
        
        if filters:
            if filters.get('semester_id'):
                query = query.filter_by(semester_id=filters['semester_id'])
            if filters.get('programme_id'):
                query = query.join(Student).filter(Student.programme_id == filters['programme_id'])
            if filters.get('status'):
                query = query.filter_by(status=filters['status'])
            if filters.get('start_date'):
                query = query.filter(Registration.registration_date >= filters['start_date'])
            if filters.get('end_date'):
                query = query.filter(Registration.registration_date <= filters['end_date'])
        
        registrations = query.all()
        
        # Statistics
        total = len(registrations)
        pending = len([r for r in registrations if r.status == 'pending'])
        approved = len([r for r in registrations if r.status == 'approved'])
        rejected = len([r for r in registrations if r.status == 'rejected'])
        
        # Group by programme
        programme_stats = {}
        for r in registrations:
            if r.student and r.student.programme:
                prog_name = r.student.programme.name
                if prog_name not in programme_stats:
                    programme_stats[prog_name] = 0
                programme_stats[prog_name] += 1
        
        # Group by semester
        semester_stats = {}
        for r in registrations:
            if r.semester:
                sem_name = r.semester.name
                if sem_name not in semester_stats:
                    semester_stats[sem_name] = 0
                semester_stats[sem_name] += 1
        
        return {
            'report_type': 'student_registrations',
            'generated_at': datetime.utcnow().isoformat(),
            'filters': filters,
            'summary': {
                'total_registrations': total,
                'pending': pending,
                'approved': approved,
                'rejected': rejected,
                'approval_rate': round((approved / total * 100) if total > 0 else 0, 2)
            },
            'programme_breakdown': programme_stats,
            'semester_breakdown': semester_stats,
            'data': [{
                'student': r.student.get_full_name() if r.student else 'N/A',
                'registration_number': r.student.registration_number if r.student else 'N/A',
                'programme': r.student.programme.name if r.student and r.student.programme else 'N/A',
                'semester': r.semester.name if r.semester else 'N/A',
                'status': r.status,
                'units': r.student_units.count(),
                'registration_date': r.registration_date.isoformat(),
                'approval_date': r.approval_date.isoformat() if r.approval_date else None
            } for r in registrations]
        }
    
    @staticmethod
    def generate_financial_report(filters=None):
        """
        Generate financial report
        Filters: start_date, end_date, payment_method, programme_id, semester_id
        """
        query = Payment.query.filter_by(status='verified')
        
        if filters:
            if filters.get('start_date'):
                query = query.filter(Payment.payment_date >= filters['start_date'])
            if filters.get('end_date'):
                query = query.filter(Payment.payment_date <= filters['end_date'])
            if filters.get('payment_method'):
                query = query.filter_by(payment_method=filters['payment_method'])
            if filters.get('programme_id'):
                query = query.join(Student).filter(Student.programme_id == filters['programme_id'])
            if filters.get('semester_id'):
                query = query.join(FeeStructure).filter(FeeStructure.semester_id == filters['semester_id'])
        
        payments = query.all()
        
        # Statistics
        total_amount = sum(p.amount for p in payments)
        total_count = len(payments)
        
        # Payment method breakdown
        method_breakdown = {}
        for p in payments:
            method = p.payment_method
            if method not in method_breakdown:
                method_breakdown[method] = {'count': 0, 'amount': 0}
            method_breakdown[method]['count'] += 1
            method_breakdown[method]['amount'] += p.amount
        
        # Daily collection
        daily_collection = {}
        for p in payments:
            date_key = p.payment_date.strftime('%Y-%m-%d')
            if date_key not in daily_collection:
                daily_collection[date_key] = 0
            daily_collection[date_key] += p.amount
        
        # Programme breakdown
        programme_breakdown = {}
        for p in payments:
            if p.student and p.student.programme:
                prog_name = p.student.programme.name
                if prog_name not in programme_breakdown:
                    programme_breakdown[prog_name] = {'count': 0, 'amount': 0}
                programme_breakdown[prog_name]['count'] += 1
                programme_breakdown[prog_name]['amount'] += p.amount
        
        return {
            'report_type': 'financial',
            'generated_at': datetime.utcnow().isoformat(),
            'filters': filters,
            'summary': {
                'total_amount': total_amount,
                'total_transactions': total_count,
                'average_amount': round(total_amount / total_count, 2) if total_count > 0 else 0,
                'currency': 'USD'
            },
            'payment_method_breakdown': method_breakdown,
            'daily_collection': daily_collection,
            'programme_breakdown': programme_breakdown,
            'data': [{
                'transaction_id': p.transaction_id,
                'student': p.student.get_full_name() if p.student else 'N/A',
                'registration_number': p.student.registration_number if p.student else 'N/A',
                'programme': p.student.programme.name if p.student and p.student.programme else 'N/A',
                'amount': p.amount,
                'currency': p.currency,
                'payment_method': p.payment_method,
                'payment_date': p.payment_date.isoformat(),
                'fee_structure': p.fee_structure.name if p.fee_structure else 'N/A',
                'receipt_number': p.receipt.receipt_number if p.receipt else 'N/A'
            } for p in payments]
        }
    
    @staticmethod
    def generate_academic_performance_report(filters=None):
        """
        Generate academic performance report
        Filters: semester_id, programme_id, unit_id, student_id, assessment_type
        """
        query = Result.query.filter_by(is_published=True)
        
        if filters:
            if filters.get('semester_id'):
                query = query.join(StudentUnit).join(Unit).filter(Unit.semester_id == filters['semester_id'])
            if filters.get('programme_id'):
                query = query.join(Student).filter(Student.programme_id == filters['programme_id'])
            if filters.get('unit_id'):
                query = query.join(StudentUnit).filter(StudentUnit.unit_id == filters['unit_id'])
            if filters.get('student_id'):
                query = query.filter_by(student_id=filters['student_id'])
            if filters.get('assessment_type'):
                query = query.join(Assessment).filter(Assessment.assessment_type == filters['assessment_type'])
        
        results = query.all()
        
        if not results:
            return {
                'report_type': 'academic_performance',
                'generated_at': datetime.utcnow().isoformat(),
                'filters': filters,
                'summary': {
                    'total_results': 0,
                    'total_students': 0,
                    'average_score': 0,
                    'pass_rate': 0
                },
                'data': []
            }
        
        # Statistics
        total_results = len(results)
        total_students = len(set(r.student_id for r in results))
        
        scores = [r.score for r in results if r.score is not None]
        avg_score = sum(scores) / len(scores) if scores else 0
        
        # Grade distribution
        grade_distribution = {}
        for r in results:
            grade = r.grade or 'F'
            grade_distribution[grade] = grade_distribution.get(grade, 0) + 1
        
        # Pass rate
        passed = len([r for r in results if r.grade and r.grade != 'F'])
        pass_rate = (passed / total_results * 100) if total_results > 0 else 0
        
        # Unit performance
        unit_performance = {}
        for r in results:
            if r.student_unit and r.student_unit.unit:
                unit_name = r.student_unit.unit.name
                if unit_name not in unit_performance:
                    unit_performance[unit_name] = {'scores': [], 'pass': 0, 'fail': 0}
                if r.score is not None:
                    unit_performance[unit_name]['scores'].append(r.score)
                if r.grade and r.grade != 'F':
                    unit_performance[unit_name]['pass'] += 1
                else:
                    unit_performance[unit_name]['fail'] += 1
        
        # Calculate average for each unit
        for unit_name, data in unit_performance.items():
            scores = data['scores']
            data['average'] = round(sum(scores) / len(scores), 2) if scores else 0
            data['total'] = len(scores)
            data['pass_rate'] = round((data['pass'] / data['total'] * 100) if data['total'] > 0 else 0, 2)
        
        return {
            'report_type': 'academic_performance',
            'generated_at': datetime.utcnow().isoformat(),
            'filters': filters,
            'summary': {
                'total_results': total_results,
                'total_students': total_students,
                'average_score': round(avg_score, 2),
                'pass_rate': round(pass_rate, 2),
                'grade_distribution': grade_distribution
            },
            'unit_performance': unit_performance,
            'data': [{
                'student': r.student.get_full_name() if r.student else 'N/A',
                'registration_number': r.student.registration_number if r.student else 'N/A',
                'unit': r.student_unit.unit.name if r.student_unit and r.student_unit.unit else 'N/A',
                'assessment': r.assessment.name if r.assessment else 'N/A',
                'assessment_type': r.assessment.assessment_type if r.assessment else 'N/A',
                'score': r.score,
                'max_score': r.assessment.max_score if r.assessment else 0,
                'grade': r.grade,
                'is_published': r.is_published
            } for r in results]
        }
    
    @staticmethod
    def generate_student_transcript_report(student_id):
        """
        Generate comprehensive student transcript
        """
        student = Student.query.get(student_id)
        if not student:
            return {'success': False, 'error': 'Student not found'}
        
        results = Result.query.filter_by(
            student_id=student_id,
            is_published=True
        ).all()
        
        # Group by semester
        semester_groups = {}
        for r in results:
            if r.student_unit and r.student_unit.unit and r.student_unit.unit.semester:
                semester = r.student_unit.unit.semester
                key = semester.id
                if key not in semester_groups:
                    semester_groups[key] = {
                        'semester': semester.name,
                        'semester_number': semester.semester_number,
                        'academic_year': semester.academic_year.name if semester.academic_year else 'N/A',
                        'start_date': semester.start_date.isoformat(),
                        'end_date': semester.end_date.isoformat(),
                        'units': [],
                        'total_credits': 0,
                        'total_points': 0,
                        'units_completed': 0
                    }
                
                credits = r.student_unit.unit.credits if r.student_unit.unit else 0
                grade_points = ReportService._get_grade_points(r.grade) if r.grade else 0
                
                semester_groups[key]['units'].append({
                    'unit': r.student_unit.unit.name if r.student_unit and r.student_unit.unit else 'N/A',
                    'code': r.student_unit.unit.code if r.student_unit and r.student_unit.unit else 'N/A',
                    'credits': credits,
                    'grade': r.grade or 'N/A',
                    'grade_points': grade_points,
                    'score': r.score
                })
                
                semester_groups[key]['total_credits'] += credits
                semester_groups[key]['total_points'] += grade_points * credits
                if r.grade and r.grade != 'F':
                    semester_groups[key]['units_completed'] += 1
        
        # Calculate GPA for each semester
        transcript = []
        for sem_key, sem_data in semester_groups.items():
            if sem_data['total_credits'] > 0:
                sem_data['gpa'] = round(sem_data['total_points'] / sem_data['total_credits'], 2)
            else:
                sem_data['gpa'] = 0
            transcript.append(sem_data)
        
        # Sort by semester number
        transcript.sort(key=lambda x: x['semester_number'])
        
        # Calculate CGPA
        total_credits = sum(s['total_credits'] for s in transcript)
        total_points = sum(s['total_points'] for s in transcript)
        cgpa = round(total_points / total_credits, 2) if total_credits > 0 else 0
        
        # Calculate classification
        classification = ReportService._get_classification(cgpa)
        
        return {
            'success': True,
            'student': {
                'name': student.get_full_name(),
                'registration_number': student.registration_number,
                'programme': student.programme.name if student.programme else 'N/A',
                'admission_date': student.admission_date.isoformat(),
                'year_of_study': student.year_of_study
            },
            'transcript': transcript,
            'cgpa': cgpa,
            'total_credits': total_credits,
            'classification': classification,
            'generated_at': datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def generate_faculty_report(faculty_id):
        """
        Generate comprehensive faculty report
        """
        faculty = Faculty.query.get(faculty_id)
        if not faculty:
            return {'success': False, 'error': 'Faculty not found'}
        
        # Get all departments
        departments = Department.query.filter_by(faculty_id=faculty_id).all()
        dept_ids = [d.id for d in departments]
        
        # Get all programmes
        programmes = Programme.query.filter(Programme.department_id.in_(dept_ids)).all()
        prog_ids = [p.id for p in programmes]
        
        # Get students
        students = Student.query.filter(Student.programme_id.in_(prog_ids)).all()
        
        # Get lecturers
        lecturers = Lecturer.query.filter(Lecturer.department_id.in_(dept_ids)).all()
        
        # Get units
        units = Unit.query.filter(Unit.department_id.in_(dept_ids)).all()
        
        # Get current semester registrations
        current_semester = Semester.query.filter_by(is_current=True).first()
        registrations = []
        if current_semester:
            registrations = Registration.query.filter(
                Registration.semester_id == current_semester.id,
                Registration.student_id.in_([s.id for s in students])
            ).all()
        
        # Department breakdown
        dept_breakdown = []
        for dept in departments:
            dept_students = [s for s in students if s.programme.department_id == dept.id]
            dept_lecturers = [l for l in lecturers if l.department_id == dept.id]
            dept_units = [u for u in units if u.department_id == dept.id]
            dept_progs = [p for p in programmes if p.department_id == dept.id]
            
            dept_breakdown.append({
                'name': dept.name,
                'code': dept.code,
                'student_count': len(dept_students),
                'lecturer_count': len(dept_lecturers),
                'unit_count': len(dept_units),
                'programme_count': len(dept_progs)
            })
        
        # Gender statistics (if available)
        male_count = 0
        female_count = 0
        for s in students:
            if s.user and s.user.email:  # Placeholder - would need gender field
                pass
        
        return {
            'success': True,
            'faculty': {
                'name': faculty.name,
                'code': faculty.code,
                'dean_name': faculty.dean_name,
                'description': faculty.description
            },
            'summary': {
                'total_departments': len(departments),
                'total_programmes': len(programmes),
                'total_students': len(students),
                'total_lecturers': len(lecturers),
                'total_units': len(units),
                'current_registrations': len(registrations)
            },
            'department_breakdown': dept_breakdown,
            'generated_at': datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def generate_college_report(college_id):
        """
        Generate comprehensive college report
        """
        college = College.query.get(college_id)
        if not college:
            return {'success': False, 'error': 'College not found'}
        
        # Get all programmes
        programmes = Programme.query.filter_by(college_id=college_id).all()
        prog_ids = [p.id for p in programmes]
        
        # Get students
        students = Student.query.filter(Student.programme_id.in_(prog_ids)).all()
        
        # Get departments (through programmes)
        dept_ids = list(set([p.department_id for p in programmes]))
        departments = Department.query.filter(Department.id.in_(dept_ids)).all()
        
        # Programme breakdown
        prog_breakdown = []
        for prog in programmes:
            prog_students = [s for s in students if s.programme_id == prog.id]
            prog_breakdown.append({
                'name': prog.name,
                'code': prog.code,
                'duration_years': prog.duration_years,
                'student_count': len(prog_students),
                'department': prog.department.name if prog.department else 'N/A'
            })
        
        return {
            'success': True,
            'college': {
                'name': college.name,
                'code': college.code,
                'dean_name': college.dean_name,
                'description': college.description
            },
            'summary': {
                'total_programmes': len(programmes),
                'total_students': len(students),
                'total_departments': len(departments)
            },
            'programme_breakdown': prog_breakdown,
            'generated_at': datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def generate_audit_report(filters=None):
        """
        Generate audit log report
        Filters: start_date, end_date, user_id, action
        """
        query = ActivityLog.query
        
        if filters:
            if filters.get('start_date'):
                query = query.filter(ActivityLog.timestamp >= filters['start_date'])
            if filters.get('end_date'):
                query = query.filter(ActivityLog.timestamp <= filters['end_date'])
            if filters.get('user_id'):
                query = query.filter_by(user_id=filters['user_id'])
            if filters.get('action'):
                query = query.filter_by(action=filters['action'])
        
        logs = query.order_by(ActivityLog.timestamp.desc()).limit(1000).all()
        
        # Activity breakdown
        action_breakdown = {}
        for log in logs:
            action = log.action
            action_breakdown[action] = action_breakdown.get(action, 0) + 1
        
        # Daily activity
        daily_activity = {}
        for log in logs:
            date_key = log.timestamp.strftime('%Y-%m-%d')
            daily_activity[date_key] = daily_activity.get(date_key, 0) + 1
        
        return {
            'report_type': 'audit',
            'generated_at': datetime.utcnow().isoformat(),
            'filters': filters,
            'summary': {
                'total_activities': len(logs),
                'unique_users': len(set(log.user_id for log in logs)),
                'action_breakdown': action_breakdown,
                'daily_activity': daily_activity
            },
            'data': [{
                'user': log.user.get_full_name() if log.user else 'N/A',
                'username': log.user.username if log.user else 'N/A',
                'action': log.action,
                'description': log.description,
                'ip_address': log.ip_address,
                'timestamp': log.timestamp.isoformat()
            } for log in logs]
        }
    
    @staticmethod
    def generate_attendance_report(filters=None):
        """
        Generate attendance report
        Filters: class_id, student_id, start_date, end_date, status
        """
        query = Attendance.query
        
        if filters:
            if filters.get('class_id'):
                query = query.filter_by(online_class_id=filters['class_id'])
            if filters.get('student_id'):
                query = query.filter_by(student_id=filters['student_id'])
            if filters.get('start_date'):
                query = query.filter(Attendance.attendance_date >= filters['start_date'])
            if filters.get('end_date'):
                query = query.filter(Attendance.attendance_date <= filters['end_date'])
            if filters.get('status'):
                query = query.filter_by(status=filters['status'])
        
        attendances = query.order_by(Attendance.attendance_date.desc()).all()
        
        # Statistics
        total = len(attendances)
        present = len([a for a in attendances if a.status == 'present'])
        absent = len([a for a in attendances if a.status == 'absent'])
        late = len([a for a in attendances if a.status == 'late'])
        excused = len([a for a in attendances if a.status == 'excused'])
        
        # Student attendance rate
        student_stats = {}
        for a in attendances:
            student_id = a.student_id
            if student_id not in student_stats:
                student_stats[student_id] = {
                    'total': 0,
                    'present': 0,
                    'absent': 0,
                    'late': 0
                }
            student_stats[student_id]['total'] += 1
            if a.status == 'present':
                student_stats[student_id]['present'] += 1
            elif a.status == 'absent':
                student_stats[student_id]['absent'] += 1
            elif a.status == 'late':
                student_stats[student_id]['late'] += 1
        
        # Calculate attendance rates
        for sid, stats in student_stats.items():
            stats['rate'] = round((stats['present'] / stats['total'] * 100) if stats['total'] > 0 else 0, 2)
        
        return {
            'report_type': 'attendance',
            'generated_at': datetime.utcnow().isoformat(),
            'filters': filters,
            'summary': {
                'total_records': total,
                'present': present,
                'absent': absent,
                'late': late,
                'excused': excused,
                'attendance_rate': round((present / total * 100) if total > 0 else 0, 2)
            },
            'student_summary': student_stats,
            'data': [{
                'student': a.student.get_full_name() if a.student else 'N/A',
                'registration_number': a.student.registration_number if a.student else 'N/A',
                'class': a.online_class.title if a.online_class else 'N/A',
                'status': a.status,
                'attendance_date': a.attendance_date.isoformat(),
                'check_in': a.check_in_time.isoformat() if a.check_in_time else 'N/A',
                'check_out': a.check_out_time.isoformat() if a.check_out_time else 'N/A'
            } for a in attendances]
        }
    
    @staticmethod
    def generate_fee_collection_report(filters=None):
        """
        Generate fee collection report
        Filters: start_date, end_date, semester_id, programme_id
        """
        query = Payment.query.filter_by(status='verified')
        
        if filters:
            if filters.get('start_date'):
                query = query.filter(Payment.payment_date >= filters['start_date'])
            if filters.get('end_date'):
                query = query.filter(Payment.payment_date <= filters['end_date'])
            if filters.get('semester_id'):
                query = query.join(FeeStructure).filter(FeeStructure.semester_id == filters['semester_id'])
            if filters.get('programme_id'):
                query = query.join(Student).filter(Student.programme_id == filters['programme_id'])
        
        payments = query.all()
        
        # Totals
        total_amount = sum(p.amount for p in payments)
        total_count = len(payments)
        
        # Monthly breakdown
        monthly_breakdown = {}
        for p in payments:
            month_key = p.payment_date.strftime('%Y-%m')
            if month_key not in monthly_breakdown:
                monthly_breakdown[month_key] = {'count': 0, 'amount': 0}
            monthly_breakdown[month_key]['count'] += 1
            monthly_breakdown[month_key]['amount'] += p.amount
        
        # Fee structure breakdown
        fee_breakdown = {}
        for p in payments:
            fee_name = p.fee_structure.name if p.fee_structure else 'N/A'
            if fee_name not in fee_breakdown:
                fee_breakdown[fee_name] = {'count': 0, 'amount': 0}
            fee_breakdown[fee_name]['count'] += 1
            fee_breakdown[fee_name]['amount'] += p.amount
        
        return {
            'report_type': 'fee_collection',
            'generated_at': datetime.utcnow().isoformat(),
            'filters': filters,
            'summary': {
                'total_amount': total_amount,
                'total_transactions': total_count,
                'average_amount': round(total_amount / total_count, 2) if total_count > 0 else 0
            },
            'monthly_breakdown': monthly_breakdown,
            'fee_structure_breakdown': fee_breakdown,
            'data': [{
                'transaction_id': p.transaction_id,
                'student': p.student.get_full_name() if p.student else 'N/A',
                'registration_number': p.student.registration_number if p.student else 'N/A',
                'programme': p.student.programme.name if p.student and p.student.programme else 'N/A',
                'amount': p.amount,
                'payment_method': p.payment_method,
                'payment_date': p.payment_date.isoformat(),
                'fee_structure': p.fee_structure.name if p.fee_structure else 'N/A'
            } for p in payments]
        }
    
    @staticmethod
    def generate_enrollment_report(semester_id=None):
        """
        Generate enrollment report for a semester
        """
        query = Registration.query
        if semester_id:
            query = query.filter_by(semester_id=semester_id)
        
        registrations = query.all()
        
        # Group by programme
        programme_stats = {}
        for r in registrations:
            if r.student and r.student.programme:
                prog_name = r.student.programme.name
                if prog_name not in programme_stats:
                    programme_stats[prog_name] = {'total': 0, 'approved': 0, 'pending': 0}
                programme_stats[prog_name]['total'] += 1
                if r.status == 'approved':
                    programme_stats[prog_name]['approved'] += 1
                elif r.status == 'pending':
                    programme_stats[prog_name]['pending'] += 1
        
        # Unit enrollment
        unit_stats = {}
        for r in registrations:
            for su in r.student_units:
                unit_name = su.unit.name if su.unit else 'N/A'
                if unit_name not in unit_stats:
                    unit_stats[unit_name] = 0
                unit_stats[unit_name] += 1
        
        return {
            'report_type': 'enrollment',
            'generated_at': datetime.utcnow().isoformat(),
            'semester_id': semester_id,
            'summary': {
                'total_registrations': len(registrations),
                'approved': len([r for r in registrations if r.status == 'approved']),
                'pending': len([r for r in registrations if r.status == 'pending'])
            },
            'programme_stats': programme_stats,
            'unit_enrollment': unit_stats,
            'data': [{
                'student': r.student.get_full_name() if r.student else 'N/A',
                'registration_number': r.student.registration_number if r.student else 'N/A',
                'programme': r.student.programme.name if r.student and r.student.programme else 'N/A',
                'status': r.status,
                'units': r.student_units.count()
            } for r in registrations]
        }
    
    @staticmethod
    def generate_exam_card_report(semester_id=None):
        """
        Generate exam card report
        """
        query = ExamCard.query
        if semester_id:
            query = query.filter_by(semester_id=semester_id)
        
        exam_cards = query.all()
        
        return {
            'report_type': 'exam_cards',
            'generated_at': datetime.utcnow().isoformat(),
            'semester_id': semester_id,
            'summary': {
                'total_cards': len(exam_cards),
                'approved': len([e for e in exam_cards if e.status == 'approved']),
                'pending': len([e for e in exam_cards if e.status == 'pending']),
                'rejected': len([e for e in exam_cards if e.status == 'rejected'])
            },
            'data': [{
                'student': e.student.get_full_name() if e.student else 'N/A',
                'registration_number': e.student.registration_number if e.student else 'N/A',
                'card_number': e.exam_card_number,
                'status': e.status,
                'issue_date': e.issue_date.isoformat(),
                'approval_date': e.approval_date.isoformat() if e.approval_date else None
            } for e in exam_cards]
        }
    
    @staticmethod
    def export_to_pdf(report_data, title):
        """
        Export report data to PDF format
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            alignment=1,
            spaceAfter=30,
            textColor=colors.HexColor('#1a237e')
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.HexColor('#283593')
        )
        
        story = []
        
        # Title
        story.append(Paragraph(title, title_style))
        
        # Generated date
        story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        story.append(Spacer(1, 12))
        
        # Summary section
        if 'summary' in report_data:
            story.append(Paragraph("Summary Statistics", heading_style))
            summary_data = [['Metric', 'Value']]
            for key, value in report_data['summary'].items():
                if isinstance(value, dict):
                    continue
                display_key = key.replace('_', ' ').title()
                display_value = str(value)
                summary_data.append([display_key, display_value])
            
            summary_table = Table(summary_data, colWidths=[200, 100])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a237e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#e8eaf6')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#c5cae9'))
            ]))
            story.append(summary_table)
            story.append(Spacer(1, 20))
        
        # Charts (if data available)
        if 'data' in report_data and report_data['data']:
            story.append(Paragraph("Detailed Data", heading_style))
            
            # Get headers from first data item
            headers = list(report_data['data'][0].keys())
            table_data = [headers]
            
            # Add rows (limit to 30 rows for PDF)
            for item in report_data['data'][:30]:
                row = []
                for h in headers:
                    val = item.get(h, '')
                    if isinstance(val, (int, float)):
                        row.append(str(val))
                    else:
                        row.append(str(val) if val else '')
                table_data.append(row)
            
            # Create table
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a237e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f5f5f5')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e0e0e0')),
                ('FONTSIZE', (0, 1), (-1, -1), 7)
            ]))
            story.append(table)
            
            # Show total count if more than 30
            if len(report_data['data']) > 30:
                story.append(Paragraph(f"Showing 30 of {len(report_data['data'])} records", styles['Italic']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def export_to_csv(report_data):
        """
        Export report data to CSV format
        """
        if 'data' not in report_data or not report_data['data']:
            return None
        
        output = io.StringIO()
        
        # Get headers
        headers = list(report_data['data'][0].keys())
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        
        # Write data
        for row in report_data['data']:
            writer.writerow(row)
        
        output.seek(0)
        return output.getvalue()
    
    @staticmethod
    def export_to_json(report_data):
        """
        Export report data to JSON format
        """
        return json.dumps(report_data, indent=2, default=str)
    
    @staticmethod
    def _get_grade_points(grade):
        """Get grade points for a grade"""
        grade_map = {
            'A': 4.0,
            'A-': 3.7,
            'B+': 3.3,
            'B': 3.0,
            'B-': 2.7,
            'C+': 2.3,
            'C': 2.0,
            'C-': 1.7,
            'D+': 1.3,
            'D': 1.0,
            'F': 0.0
        }
        return grade_map.get(grade, 0.0)
    
    @staticmethod
    def _get_classification(cgpa):
        """Get degree classification based on CGPA"""
        if cgpa >= 3.6:
            return 'First Class Honours'
        elif cgpa >= 3.0:
            return 'Second Class Honours (Upper Division)'
        elif cgpa >= 2.5:
            return 'Second Class Honours (Lower Division)'
        elif cgpa >= 2.0:
            return 'Pass'
        else:
            return 'Fail'