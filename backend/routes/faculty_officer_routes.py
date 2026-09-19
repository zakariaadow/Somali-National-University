from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import (
    FacultyOfficer, StudentCard, Student, Programme, 
    Faculty, Department, Registration, ActivityLog,
    User, Unit, Lecturer, StudentUnit, Semester, AcademicYear,
    Result
)
from extensions import db
from datetime import datetime
from utils.decorators import role_required
from sqlalchemy import func

faculty_officer_bp = Blueprint('faculty_officer', __name__)

@faculty_officer_bp.route('/dashboard', methods=['GET'])
@login_required
@role_required('Faculty Officer')
def get_dashboard():
    """Get faculty officer dashboard with comprehensive statistics"""
    try:
        faculty_officer = FacultyOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not faculty_officer:
            return jsonify({'error': 'Faculty Officer profile not found'}), 404
        
        faculty = faculty_officer.faculty
        dept_ids = [d.id for d in faculty.departments]
        programme_ids = [p.id for p in Programme.query.filter(Programme.department_id.in_(dept_ids)).all()]
        
        # Student statistics
        total_students = Student.query.filter(Student.programme_id.in_(programme_ids)).count()
        active_students = Student.query.filter(
            Student.programme_id.in_(programme_ids),
            Student.is_graduated == False
        ).count()
        
        # Student card statistics
        pending_cards = StudentCard.query.filter(
            StudentCard.status == 'pending',
            StudentCard.faculty_officer_id.is_(None),
            StudentCard.student_id.in_(
                db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
            )
        ).count()
        
        approved_cards = StudentCard.query.filter(
            StudentCard.status == 'approved',
            StudentCard.student_id.in_(
                db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
            )
        ).count()
        
        # Department statistics
        dept_stats = []
        for dept in faculty.departments:
            prog_ids = [p.id for p in Programme.query.filter_by(department_id=dept.id).all()]
            student_count = Student.query.filter(Student.programme_id.in_(prog_ids)).count()
            dept_stats.append({
                'id': dept.id,
                'name': dept.name,
                'code': dept.code,
                'student_count': student_count,
                'programme_count': len(prog_ids)
            })
        
        # Lecturer statistics
        lecturers = Lecturer.query.filter(Lecturer.department_id.in_(dept_ids)).all()
        
        # Unit statistics
        units = Unit.query.filter(Unit.department_id.in_(dept_ids)).all()
        
        # Recent activity
        recent_activity = ActivityLog.query.filter_by(
            user_id=current_user.id
        ).order_by(
            ActivityLog.timestamp.desc()
        ).limit(10).all()
        
        # Registration statistics - current semester
        current_semester = Semester.query.filter_by(is_current=True).first()
        registrations = 0
        if current_semester:
            registrations = Registration.query.filter(
                Registration.semester_id == current_semester.id,
                Registration.student_id.in_(
                    db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
                )
            ).count()
        
        return jsonify({
            'faculty_officer': faculty_officer.to_dict(),
            'faculty': faculty.to_dict(),
            'statistics': {
                'total_students': total_students,
                'active_students': active_students,
                'pending_cards': pending_cards,
                'approved_cards': approved_cards,
                'current_registrations': registrations,
                'total_lecturers': len(lecturers),
                'total_units': len(units),
                'total_departments': len(faculty.departments)
            },
            'department_stats': dept_stats,
            'recent_activities': [log.to_dict() for log in recent_activity]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@faculty_officer_bp.route('/departments', methods=['GET'])
@login_required
@role_required('Faculty Officer')
def get_faculty_departments():
    """Get all departments in the faculty with statistics"""
    try:
        faculty_officer = FacultyOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not faculty_officer:
            return jsonify({'error': 'Faculty Officer profile not found'}), 404
        
        departments = Department.query.filter_by(
            faculty_id=faculty_officer.faculty_id,
            is_active=True
        ).all()
        
        dept_data = []
        for dept in departments:
            programme_ids = [p.id for p in Programme.query.filter_by(department_id=dept.id).all()]
            student_count = Student.query.filter(Student.programme_id.in_(programme_ids)).count()
            
            dept_data.append({
                'id': dept.id,
                'name': dept.name,
                'code': dept.code,
                'description': dept.description,
                'head_name': dept.head_name,
                'head_email': dept.head_email,
                'head_phone': dept.head_phone,
                'programme_count': len(programme_ids),
                'student_count': student_count,
                'is_active': dept.is_active,
                'created_at': dept.created_at,
                'updated_at': dept.updated_at
            })
        
        return jsonify({
            'departments': dept_data,
            'total': len(dept_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@faculty_officer_bp.route('/units', methods=['GET'])
@login_required
@role_required('Faculty Officer')
def get_faculty_units():
    """Get all units in the faculty"""
    try:
        faculty_officer = FacultyOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not faculty_officer:
            return jsonify({'error': 'Faculty Officer profile not found'}), 404
        
        faculty = faculty_officer.faculty
        dept_ids = [d.id for d in faculty.departments]
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        department_id = request.args.get('department_id', type=int)
        semester_id = request.args.get('semester_id', type=int)
        
        query = Unit.query.filter(Unit.department_id.in_(dept_ids))
        
        if department_id:
            query = query.filter_by(department_id=department_id)
        if semester_id:
            query = query.filter_by(semester_id=semester_id)
        
        units = query.paginate(page=page, per_page=per_page, error_out=False)
        
        units_with_details = []
        for unit in units.items:
            unit_data = unit.to_dict()
            if unit.department:
                unit_data['faculty_id'] = unit.department.faculty_id
                unit_data['faculty_name'] = unit.department.faculty.name if unit.department.faculty else None
            units_with_details.append(unit_data)
        
        return jsonify({
            'units': units_with_details,
            'total': units.total,
            'page': units.page,
            'pages': units.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@faculty_officer_bp.route('/lecturers', methods=['GET'])
@login_required
@role_required('Faculty Officer')
def get_lecturers():
    """Get all lecturers in the faculty"""
    try:
        faculty_officer = FacultyOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not faculty_officer:
            return jsonify({'error': 'Faculty Officer profile not found'}), 404
        
        faculty = faculty_officer.faculty
        dept_ids = [d.id for d in faculty.departments]
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        department_id = request.args.get('department_id', type=int)
        
        query = Lecturer.query.filter(Lecturer.department_id.in_(dept_ids))
        
        if department_id:
            query = query.filter_by(department_id=department_id)
        
        lecturers = query.paginate(page=page, per_page=per_page, error_out=False)
        
        lecturers_with_details = []
        for lecturer in lecturers.items:
            lecturer_data = lecturer.to_dict()
            if lecturer.user:
                lecturer_data['user'] = lecturer.user.to_dict()
            if lecturer.department:
                lecturer_data['department_name'] = lecturer.department.name
            lecturers_with_details.append(lecturer_data)
        
        return jsonify({
            'lecturers': lecturers_with_details,
            'total': lecturers.total,
            'page': lecturers.page,
            'pages': lecturers.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@faculty_officer_bp.route('/students', methods=['GET'])
@login_required
@role_required('Faculty Officer')
def get_faculty_students():
    """Get all students in the faculty with filters"""
    try:
        faculty_officer = FacultyOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not faculty_officer:
            return jsonify({'error': 'Faculty Officer profile not found'}), 404
        
        faculty = faculty_officer.faculty
        dept_ids = [d.id for d in faculty.departments]
        programme_ids = [p.id for p in Programme.query.filter(Programme.department_id.in_(dept_ids)).all()]
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        department_id = request.args.get('department_id', type=int)
        programme_id = request.args.get('programme_id', type=int)
        year_of_study = request.args.get('year_of_study', type=int)
        search = request.args.get('search', '')
        
        query = Student.query.filter(Student.programme_id.in_(programme_ids))
        
        if department_id:
            query = query.join(Programme).filter(Programme.department_id == department_id)
        if programme_id:
            query = query.filter_by(programme_id=programme_id)
        if year_of_study:
            query = query.filter_by(year_of_study=year_of_study)
        if search:
            query = query.join(User).filter(
                db.or_(
                    User.first_name.ilike(f'%{search}%'),
                    User.last_name.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    Student.registration_number.ilike(f'%{search}%')
                )
            )
        
        students = query.order_by(
            Student.year_of_study,
            Student.registration_number
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        students_with_details = []
        for student in students.items:
            student_data = student.to_dict()
            if student.user:
                student_data['user'] = student.user.to_dict()
            if student.programme:
                student_data['programme'] = student.programme.to_dict()
                if student.programme.department:
                    student_data['department_name'] = student.programme.department.name
                    if student.programme.department.faculty:
                        student_data['faculty_name'] = student.programme.department.faculty.name
            students_with_details.append(student_data)
        
        return jsonify({
            'students': students_with_details,
            'total': students.total,
            'page': students.page,
            'pages': students.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@faculty_officer_bp.route('/registrations', methods=['GET'])
@login_required
@role_required('Faculty Officer')
def get_faculty_registrations():
    """Get registrations for the faculty"""
    try:
        faculty_officer = FacultyOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not faculty_officer:
            return jsonify({'error': 'Faculty Officer profile not found'}), 404
        
        faculty = faculty_officer.faculty
        dept_ids = [d.id for d in faculty.departments]
        programme_ids = [p.id for p in Programme.query.filter(Programme.department_id.in_(dept_ids)).all()]
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        semester_id = request.args.get('semester_id', type=int)
        is_approved = request.args.get('is_approved', type=bool)
        
        query = Registration.query.filter(
            Registration.student_id.in_(
                db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
            )
        )
        
        if semester_id:
            query = query.filter_by(semester_id=semester_id)
        if is_approved is not None:
            query = query.filter_by(is_approved=is_approved)
        
        registrations = query.order_by(
            Registration.registration_date.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        registrations_with_details = []
        for reg in registrations.items:
            student = Student.query.get(reg.student_id)
            reg_data = reg.to_dict()
            if student:
                reg_data['student'] = student.to_dict()
                if student.user:
                    reg_data['user'] = student.user.to_dict()
                if student.programme:
                    reg_data['programme_name'] = student.programme.name
            registrations_with_details.append(reg_data)
        
        return jsonify({
            'registrations': registrations_with_details,
            'total': registrations.total,
            'page': registrations.page,
            'pages': registrations.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@faculty_officer_bp.route('/registrations/approve/<int:registration_id>', methods=['POST'])
@login_required
@role_required('Faculty Officer')
def approve_registration(registration_id):
    """Approve a student registration"""
    try:
        faculty_officer = FacultyOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not faculty_officer:
            return jsonify({'error': 'Faculty Officer profile not found'}), 404
        
        registration = Registration.query.get_or_404(registration_id)
        
        student = Student.query.get(registration.student_id)
        if not student or student.programme.department.faculty_id != faculty_officer.faculty_id:
            return jsonify({'error': 'Student not in your faculty'}), 403
        
        if registration.is_approved:
            return jsonify({'error': 'Registration already approved'}), 400
        
        registration.is_approved = True
        registration.approved_by = current_user.id
        registration.approved_date = datetime.utcnow()
        
        db.session.commit()
        
        log = ActivityLog(
            user_id=current_user.id,
            action='FACULTY_OFFICER_APPROVE_REGISTRATION',
            description=f'Approved registration for student {student.registration_number}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Registration approved successfully',
            'registration': registration.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@faculty_officer_bp.route('/results', methods=['GET'])
@login_required
@role_required('Faculty Officer')
def get_faculty_results():
    """Get results for students in the faculty"""
    try:
        faculty_officer = FacultyOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not faculty_officer:
            return jsonify({'error': 'Faculty Officer profile not found'}), 404
        
        faculty = faculty_officer.faculty
        dept_ids = [d.id for d in faculty.departments]
        programme_ids = [p.id for p in Programme.query.filter(Programme.department_id.in_(dept_ids)).all()]
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        semester_id = request.args.get('semester_id', type=int)
        academic_year_id = request.args.get('academic_year_id', type=int)
        programme_id = request.args.get('programme_id', type=int)
        department_id = request.args.get('department_id', type=int)
        
        query = Result.query.filter(
            Result.student_id.in_(
                db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
            ),
            Result.is_published == True
        )
        
        if semester_id:
            query = query.filter_by(semester_id=semester_id)
        if academic_year_id:
            query = query.filter_by(academic_year_id=academic_year_id)
        if programme_id:
            query = query.join(Student).filter(Student.programme_id == programme_id)
        if department_id:
            query = query.join(Student).join(Programme).filter(Programme.department_id == department_id)
        
        results = query.order_by(
            Result.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        result = []
        for r in results.items:
            result_data = r.to_dict()
            if r.student and r.student.user:
                result_data['student_name'] = f"{r.student.user.first_name} {r.student.user.last_name}"
                result_data['registration_number'] = r.student.registration_number
            if r.student_unit and r.student_unit.unit:
                result_data['unit_code'] = r.student_unit.unit.unit_code
                result_data['unit_name'] = r.student_unit.unit.unit_name
                result_data['credits'] = r.student_unit.unit.credits
            if r.semester:
                result_data['semester_name'] = r.semester.name
            if r.academic_year:
                result_data['academic_year_name'] = r.academic_year.name
            result.append(result_data)
        
        return jsonify({
            'results': result,
            'total': results.total,
            'page': results.page,
            'pages': results.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@faculty_officer_bp.route('/student-cards/pending', methods=['GET'])
@login_required
@role_required('Faculty Officer')
def get_pending_cards():
    """Get pending student card applications for the faculty"""
    try:
        faculty_officer = FacultyOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not faculty_officer:
            return jsonify({'error': 'Faculty Officer profile not found'}), 404
        
        faculty = faculty_officer.faculty
        dept_ids = [d.id for d in faculty.departments]
        programme_ids = [p.id for p in Programme.query.filter(Programme.department_id.in_(dept_ids)).all()]
        
        pending_cards = StudentCard.query.filter(
            StudentCard.status == 'pending',
            StudentCard.faculty_officer_id.is_(None),
            StudentCard.student_id.in_(
                db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
            )
        ).order_by(StudentCard.application_date.asc()).all()
        
        cards_with_details = []
        for card in pending_cards:
            student = Student.query.get(card.student_id)
            cards_with_details.append({
                'card': card.to_dict(),
                'student': student.to_dict() if student else None,
                'user': student.user.to_dict() if student and student.user else None,
                'programme': student.programme.to_dict() if student and student.programme else None
            })
        
        return jsonify({
            'pending_cards': cards_with_details,
            'total': len(cards_with_details)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@faculty_officer_bp.route('/student-cards/approved', methods=['GET'])
@login_required
@role_required('Faculty Officer')
def get_approved_cards():
    """Get approved student cards for the faculty"""
    try:
        faculty_officer = FacultyOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not faculty_officer:
            return jsonify({'error': 'Faculty Officer profile not found'}), 404
        
        faculty = faculty_officer.faculty
        dept_ids = [d.id for d in faculty.departments]
        programme_ids = [p.id for p in Programme.query.filter(Programme.department_id.in_(dept_ids)).all()]
        
        approved_cards = StudentCard.query.filter(
            StudentCard.status == 'approved',
            StudentCard.student_id.in_(
                db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
            )
        ).order_by(StudentCard.reviewed_date.desc()).all()
        
        result = []
        for card in approved_cards:
            card_data = card.to_dict()
            student = Student.query.get(card.student_id)
            if student:
                card_data['student_name'] = f"{student.user.first_name} {student.user.last_name}" if student.user else None
                card_data['registration_number'] = student.registration_number
                if student.programme:
                    card_data['programme_name'] = student.programme.name
            result.append(card_data)
        
        return jsonify({
            'approved_cards': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@faculty_officer_bp.route('/student-cards/rejected', methods=['GET'])
@login_required
@role_required('Faculty Officer')
def get_rejected_cards():
    """Get rejected student cards for the faculty"""
    try:
        faculty_officer = FacultyOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not faculty_officer:
            return jsonify({'error': 'Faculty Officer profile not found'}), 404
        
        faculty = faculty_officer.faculty
        dept_ids = [d.id for d in faculty.departments]
        programme_ids = [p.id for p in Programme.query.filter(Programme.department_id.in_(dept_ids)).all()]
        
        rejected_cards = StudentCard.query.filter(
            StudentCard.status == 'rejected',
            StudentCard.student_id.in_(
                db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
            )
        ).order_by(StudentCard.reviewed_date.desc()).all()
        
        result = []
        for card in rejected_cards:
            card_data = card.to_dict()
            student = Student.query.get(card.student_id)
            if student:
                card_data['student_name'] = f"{student.user.first_name} {student.user.last_name}" if student.user else None
                card_data['registration_number'] = student.registration_number
                if student.programme:
                    card_data['programme_name'] = student.programme.name
            result.append(card_data)
        
        return jsonify({
            'rejected_cards': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@faculty_officer_bp.route('/student-cards/review/<int:card_id>', methods=['POST'])
@login_required
@role_required('Faculty Officer')
def review_student_card(card_id):
    """Review and approve/reject student card application"""
    try:
        data = request.get_json()
        faculty_officer = FacultyOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not faculty_officer:
            return jsonify({'error': 'Faculty Officer profile not found'}), 404
        
        student_card = StudentCard.query.get_or_404(card_id)
        
        student = Student.query.get(student_card.student_id)
        if not student or student.programme.department.faculty_id != faculty_officer.faculty_id:
            return jsonify({'error': 'You can only review cards for your faculty'}), 403
        
        if student_card.status != 'pending':
            return jsonify({'error': 'Application already reviewed'}), 400
        
        status = data.get('status')
        rejection_reason = data.get('rejection_reason')
        
        if status not in ['approved', 'rejected']:
            return jsonify({'error': 'Invalid status. Must be approved or rejected'}), 400
        
        if status == 'rejected' and not rejection_reason:
            return jsonify({'error': 'Rejection reason required for rejected applications'}), 400
        
        student_card.status = status
        student_card.reviewed_by = current_user.id
        student_card.reviewed_date = datetime.utcnow()
        student_card.faculty_officer_id = faculty_officer.id
        
        if status == 'rejected':
            student_card.rejection_reason = rejection_reason
        elif status == 'approved':
            student_card.issue_date = datetime.now().date()
            student_card.expiry_date = datetime.now().date().replace(year=datetime.now().year + 4)
            student_card.card_pdf = f"/api/uploads/student_cards/{student_card.card_number}.pdf"
        
        db.session.commit()
        
        log = ActivityLog(
            user_id=current_user.id,
            action='FACULTY_OFFICER_REVIEW_CARD',
            description=f'Reviewed student card {student_card.card_number} - {status}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': f'Student card application {status}',
            'student_card': student_card.to_dict(),
            'student': student.to_dict() if student else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@faculty_officer_bp.route('/reports', methods=['GET'])
@login_required
@role_required('Faculty Officer')
def get_faculty_reports():
    """Get faculty reports"""
    try:
        faculty_officer = FacultyOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not faculty_officer:
            return jsonify({'error': 'Faculty Officer profile not found'}), 404
        
        report_type = request.args.get('type', 'enrollment')
        dept_ids = [d.id for d in faculty_officer.faculty.departments]
        programme_ids = [p.id for p in Programme.query.filter(Programme.department_id.in_(dept_ids)).all()]
        
        if report_type == 'enrollment':
            data = []
            for dept in faculty_officer.faculty.departments:
                prog_ids = [p.id for p in Programme.query.filter_by(department_id=dept.id).all()]
                count = Student.query.filter(Student.programme_id.in_(prog_ids)).count()
                data.append({
                    'department': dept.name,
                    'code': dept.code,
                    'students': count,
                    'programmes': len(prog_ids)
                })
            return jsonify({
                'report_type': 'Enrollment Report',
                'data': data,
                'total': sum(d['students'] for d in data)
            }), 200
        
        elif report_type == 'student_cards':
            total = StudentCard.query.filter(
                StudentCard.student_id.in_(
                    db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
                )
            ).count()
            
            pending = StudentCard.query.filter(
                StudentCard.status == 'pending',
                StudentCard.student_id.in_(
                    db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
                )
            ).count()
            
            approved = StudentCard.query.filter(
                StudentCard.status == 'approved',
                StudentCard.student_id.in_(
                    db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
                )
            ).count()
            
            rejected = StudentCard.query.filter(
                StudentCard.status == 'rejected',
                StudentCard.student_id.in_(
                    db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
                )
            ).count()
            
            return jsonify({
                'report_type': 'Student Card Report',
                'total': total,
                'pending': pending,
                'approved': approved,
                'rejected': rejected
            }), 200
        
        else:
            return jsonify({'error': 'Invalid report type'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
