from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import (
    CollegeOfficer, StudentCard, Student, Programme, 
    College, Faculty, Department, Registration, ActivityLog,
    User, Unit, Semester, AcademicYear, FeeStructure, ExamCard, 
    Payment, Result
)
from extensions import db
from datetime import datetime
from utils.decorators import role_required
from sqlalchemy import func

college_officer_bp = Blueprint('college_officer', __name__)

@college_officer_bp.route('/dashboard', methods=['GET'])
@login_required
@role_required('College Officer')
def get_dashboard():
    """Get college officer dashboard with comprehensive statistics"""
    try:
        college_officer = CollegeOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not college_officer:
            return jsonify({'error': 'College Officer profile not found'}), 404
        
        college = college_officer.college
        
        # Get all programmes in this college
        programme_ids = [p.id for p in Programme.query.filter_by(college_id=college.id).all()]
        
        # Student statistics
        total_students = Student.query.filter(Student.programme_id.in_(programme_ids)).count()
        active_students = Student.query.filter(
            Student.programme_id.in_(programme_ids),
            Student.is_graduated == False
        ).count()
        graduated_students = Student.query.filter(
            Student.programme_id.in_(programme_ids),
            Student.is_graduated == True
        ).count()
        
        # Student card statistics
        pending_cards = StudentCard.query.filter(
            StudentCard.status == 'pending',
            StudentCard.college_officer_id.is_(None),
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
        
        rejected_cards = StudentCard.query.filter(
            StudentCard.status == 'rejected',
            StudentCard.student_id.in_(
                db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
            )
        ).count()
        
        # Registration statistics
        current_semester = Semester.query.filter_by(is_current=True).first()
        current_academic_year = AcademicYear.query.filter_by(is_current=True).first()
        
        registrations = 0
        if current_semester and current_academic_year:
            registrations = Registration.query.filter(
                Registration.semester_id == current_semester.id,
                Registration.academic_year_id == current_academic_year.id,
                Registration.student_id.in_(
                    db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
                )
            ).count()
        
        # Payment statistics
        total_payments = Payment.query.filter(
            Payment.student_id.in_(
                db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
            )
        ).count()
        
        total_amount = db.session.query(func.sum(Payment.amount)).filter(
            Payment.student_id.in_(
                db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
            ),
            Payment.is_verified == True
        ).scalar() or 0
        
        # Faculty statistics
        faculties = Faculty.query.filter_by(college_id=college.id).all()
        faculty_stats = []
        for faculty in faculties:
            dept_ids = [d.id for d in faculty.departments]
            student_count = Student.query.join(Programme).filter(
                Programme.department_id.in_(dept_ids)
            ).count()
            faculty_stats.append({
                'id': faculty.id,
                'name': faculty.name,
                'code': faculty.code,
                'student_count': student_count,
                'department_count': len(dept_ids)
            })
        
        # Programme statistics
        programme_stats = []
        for prog in Programme.query.filter_by(college_id=college.id).all():
            student_count = Student.query.filter_by(programme_id=prog.id).count()
            programme_stats.append({
                'id': prog.id,
                'name': prog.name,
                'code': prog.code,
                'department_name': prog.department.name if prog.department else None,
                'student_count': student_count,
                'duration_years': prog.duration_years
            })
        
        # Recent activity
        recent_activity = ActivityLog.query.filter_by(
            user_id=current_user.id
        ).order_by(
            ActivityLog.timestamp.desc()
        ).limit(10).all()
        
        return jsonify({
            'college_officer': college_officer.to_dict(),
            'college': college.to_dict(),
            'statistics': {
                'total_students': total_students,
                'active_students': active_students,
                'graduated_students': graduated_students,
                'pending_cards': pending_cards,
                'approved_cards': approved_cards,
                'rejected_cards': rejected_cards,
                'current_registrations': registrations,
                'total_payments': total_payments,
                'total_amount_collected': float(total_amount),
                'total_faculties': len(faculties)
            },
            'faculty_stats': faculty_stats,
            'programme_stats': programme_stats,
            'recent_activities': [log.to_dict() for log in recent_activity]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@college_officer_bp.route('/students', methods=['GET'])
@login_required
@role_required('College Officer')
def get_college_students():
    """Get all students in the college with filters"""
    try:
        college_officer = CollegeOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not college_officer:
            return jsonify({'error': 'College Officer profile not found'}), 404
        
        college = college_officer.college
        programme_ids = [p.id for p in Programme.query.filter_by(college_id=college.id).all()]
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        faculty_id = request.args.get('faculty_id', type=int)
        department_id = request.args.get('department_id', type=int)
        programme_id = request.args.get('programme_id', type=int)
        year_of_study = request.args.get('year_of_study', type=int)
        search = request.args.get('search', '')
        
        query = Student.query.filter(Student.programme_id.in_(programme_ids))
        
        if faculty_id:
            query = query.join(Programme).join(Department).filter(Department.faculty_id == faculty_id)
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

@college_officer_bp.route('/programmes', methods=['GET'])
@login_required
@role_required('College Officer')
def get_college_programmes():
    """Get all programmes in the college"""
    try:
        college_officer = CollegeOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not college_officer:
            return jsonify({'error': 'College Officer profile not found'}), 404
        
        programmes = Programme.query.filter_by(
            college_id=college_officer.college_id,
            is_active=True
        ).all()
        
        result = []
        for p in programmes:
            prog_data = p.to_dict()
            if p.department:
                prog_data['department_name'] = p.department.name
                if p.department.faculty:
                    prog_data['faculty_name'] = p.department.faculty.name
            student_count = Student.query.filter_by(programme_id=p.id).count()
            prog_data['student_count'] = student_count
            result.append(prog_data)
        
        return jsonify({
            'programmes': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@college_officer_bp.route('/units', methods=['GET'])
@login_required
@role_required('College Officer')
def get_college_units():
    """Get all units in the college"""
    try:
        college_officer = CollegeOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not college_officer:
            return jsonify({'error': 'College Officer profile not found'}), 404
        
        # Get all department IDs in this college
        dept_ids = db.session.query(Department.id).join(Faculty).filter(
            Faculty.college_id == college_officer.college_id
        ).all()
        dept_ids = [d[0] for d in dept_ids]
        
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
                unit_data['department_name'] = unit.department.name
                if unit.department.faculty:
                    unit_data['faculty_name'] = unit.department.faculty.name
                    unit_data['faculty_id'] = unit.department.faculty_id
            if unit.semester:
                unit_data['semester_name'] = unit.semester.name
            units_with_details.append(unit_data)
        
        return jsonify({
            'units': units_with_details,
            'total': units.total,
            'page': units.page,
            'pages': units.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@college_officer_bp.route('/faculties', methods=['GET'])
@login_required
@role_required('College Officer')
def get_college_faculties():
    """Get all faculties in the college with statistics"""
    try:
        college_officer = CollegeOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not college_officer:
            return jsonify({'error': 'College Officer profile not found'}), 404
        
        faculties = Faculty.query.filter_by(
            college_id=college_officer.college_id,
            is_active=True
        ).all()
        
        faculty_data = []
        for faculty in faculties:
            dept_ids = [d.id for d in faculty.departments]
            student_count = Student.query.join(Programme).filter(
                Programme.department_id.in_(dept_ids)
            ).count()
            
            faculty_data.append({
                'id': faculty.id,
                'name': faculty.name,
                'code': faculty.code,
                'description': faculty.description,
                'dean_name': faculty.dean_name,
                'dean_email': faculty.dean_email,
                'dean_phone': faculty.dean_phone,
                'department_count': len(dept_ids),
                'student_count': student_count,
                'is_active': faculty.is_active,
                'created_at': faculty.created_at,
                'updated_at': faculty.updated_at
            })
        
        return jsonify({
            'faculties': faculty_data,
            'total': len(faculty_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@college_officer_bp.route('/departments', methods=['GET'])
@login_required
@role_required('College Officer')
def get_college_departments():
    """Get all departments in the college"""
    try:
        college_officer = CollegeOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not college_officer:
            return jsonify({'error': 'College Officer profile not found'}), 404
        
        # Get all departments in this college
        departments = db.session.query(Department).join(Faculty).filter(
            Faculty.college_id == college_officer.college_id,
            Department.is_active == True
        ).all()
        
        result = []
        for dept in departments:
            dept_data = dept.to_dict()
            if dept.faculty:
                dept_data['faculty_name'] = dept.faculty.name
            # Count students in this department
            programme_ids = [p.id for p in Programme.query.filter_by(department_id=dept.id).all()]
            student_count = Student.query.filter(Student.programme_id.in_(programme_ids)).count()
            dept_data['student_count'] = student_count
            dept_data['programme_count'] = len(programme_ids)
            result.append(dept_data)
        
        return jsonify({
            'departments': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@college_officer_bp.route('/registrations', methods=['GET'])
@login_required
@role_required('College Officer')
def get_college_registrations():
    """Get registrations for the college"""
    try:
        college_officer = CollegeOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not college_officer:
            return jsonify({'error': 'College Officer profile not found'}), 404
        
        college = college_officer.college
        programme_ids = [p.id for p in Programme.query.filter_by(college_id=college.id).all()]
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        semester_id = request.args.get('semester_id', type=int)
        academic_year_id = request.args.get('academic_year_id', type=int)
        is_approved = request.args.get('is_approved', type=bool)
        
        query = Registration.query.filter(
            Registration.student_id.in_(
                db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
            )
        )
        
        if semester_id:
            query = query.filter_by(semester_id=semester_id)
        if academic_year_id:
            query = query.filter_by(academic_year_id=academic_year_id)
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

@college_officer_bp.route('/registrations/approve/<int:registration_id>', methods=['POST'])
@login_required
@role_required('College Officer')
def approve_college_registration(registration_id):
    """Approve a student registration"""
    try:
        college_officer = CollegeOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not college_officer:
            return jsonify({'error': 'College Officer profile not found'}), 404
        
        registration = Registration.query.get_or_404(registration_id)
        
        # Verify student is in this college
        student = Student.query.get(registration.student_id)
        if not student or student.programme.college_id != college_officer.college_id:
            return jsonify({'error': 'Student not in your college'}), 403
        
        if registration.is_approved:
            return jsonify({'error': 'Registration already approved'}), 400
        
        registration.is_approved = True
        registration.approved_by = current_user.id
        registration.approved_date = datetime.utcnow()
        
        db.session.commit()
        
        log = ActivityLog(
            user_id=current_user.id,
            action='COLLEGE_OFFICER_APPROVE_REGISTRATION',
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

@college_officer_bp.route('/results', methods=['GET'])
@login_required
@role_required('College Officer')
def get_college_results():
    """Get results for students in the college"""
    try:
        college_officer = CollegeOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not college_officer:
            return jsonify({'error': 'College Officer profile not found'}), 404
        
        # Get all programme IDs in this college
        programme_ids = [p.id for p in Programme.query.filter_by(college_id=college_officer.college_id).all()]
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        semester_id = request.args.get('semester_id', type=int)
        academic_year_id = request.args.get('academic_year_id', type=int)
        programme_id = request.args.get('programme_id', type=int)
        faculty_id = request.args.get('faculty_id', type=int)
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
        if faculty_id:
            query = query.join(Student).join(Programme).join(Department).filter(Department.faculty_id == faculty_id)
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

@college_officer_bp.route('/exam-cards', methods=['GET'])
@login_required
@role_required('College Officer')
def get_college_exam_cards():
    """Get exam cards for the college"""
    try:
        college_officer = CollegeOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not college_officer:
            return jsonify({'error': 'College Officer profile not found'}), 404
        
        college = college_officer.college
        programme_ids = [p.id for p in Programme.query.filter_by(college_id=college.id).all()]
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        semester_id = request.args.get('semester_id', type=int)
        
        query = ExamCard.query.filter(
            ExamCard.student_id.in_(
                db.session.query(Student.id).filter(Student.programme_id.in_(programme_ids))
            )
        )
        
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

@college_officer_bp.route('/fee-structures', methods=['GET'])
@login_required
@role_required('College Officer')
def get_college_fee_structures():
    """Get fee structures for programmes in the college"""
    try:
        college_officer = CollegeOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not college_officer:
            return jsonify({'error': 'College Officer profile not found'}), 404
        
        college = college_officer.college
        programme_ids = [p.id for p in Programme.query.filter_by(college_id=college.id).all()]
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        semester_id = request.args.get('semester_id', type=int)
        academic_year_id = request.args.get('academic_year_id', type=int)
        
        query = FeeStructure.query.filter(FeeStructure.programme_id.in_(programme_ids))
        
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

@college_officer_bp.route('/student-cards/pending', methods=['GET'])
@login_required
@role_required('College Officer')
def get_college_pending_cards():
    """Get pending student card applications for the college"""
    try:
        college_officer = CollegeOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not college_officer:
            return jsonify({'error': 'College Officer profile not found'}), 404
        
        college = college_officer.college
        programme_ids = [p.id for p in Programme.query.filter_by(college_id=college.id).all()]
        
        pending_cards = StudentCard.query.filter(
            StudentCard.status == 'pending',
            StudentCard.college_officer_id.is_(None),
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

@college_officer_bp.route('/student-cards/approved', methods=['GET'])
@login_required
@role_required('College Officer')
def get_college_approved_cards():
    """Get approved student cards for the college"""
    try:
        college_officer = CollegeOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not college_officer:
            return jsonify({'error': 'College Officer profile not found'}), 404
        
        college = college_officer.college
        programme_ids = [p.id for p in Programme.query.filter_by(college_id=college.id).all()]
        
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

@college_officer_bp.route('/student-cards/rejected', methods=['GET'])
@login_required
@role_required('College Officer')
def get_college_rejected_cards():
    """Get rejected student cards for the college"""
    try:
        college_officer = CollegeOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not college_officer:
            return jsonify({'error': 'College Officer profile not found'}), 404
        
        college = college_officer.college
        programme_ids = [p.id for p in Programme.query.filter_by(college_id=college.id).all()]
        
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

@college_officer_bp.route('/student-cards/review/<int:card_id>', methods=['POST'])
@login_required
@role_required('College Officer')
def review_college_student_card(card_id):
    """Review and approve/reject student card application"""
    try:
        data = request.get_json()
        college_officer = CollegeOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not college_officer:
            return jsonify({'error': 'College Officer profile not found'}), 404
        
        student_card = StudentCard.query.get_or_404(card_id)
        
        # Verify this card belongs to a student in this college
        student = Student.query.get(student_card.student_id)
        if not student or student.programme.college_id != college_officer.college_id:
            return jsonify({'error': 'You can only review cards for your college'}), 403
        
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
        student_card.college_officer_id = college_officer.id
        
        if status == 'rejected':
            student_card.rejection_reason = rejection_reason
        elif status == 'approved':
            student_card.issue_date = datetime.now().date()
            student_card.expiry_date = datetime.now().date().replace(year=datetime.now().year + 4)
            student_card.card_pdf = f"/api/uploads/student_cards/{student_card.card_number}.pdf"
        
        db.session.commit()
        
        log = ActivityLog(
            user_id=current_user.id,
            action='COLLEGE_OFFICER_REVIEW_CARD',
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

@college_officer_bp.route('/reports', methods=['GET'])
@login_required
@role_required('College Officer')
def get_college_reports():
    """Get college reports"""
    try:
        college_officer = CollegeOfficer.query.filter_by(user_id=current_user.id).first()
        
        if not college_officer:
            return jsonify({'error': 'College Officer profile not found'}), 404
        
        report_type = request.args.get('type', 'enrollment')
        
        # Different report types
        if report_type == 'enrollment':
            # Enrollment by programme
            programmes = Programme.query.filter_by(college_id=college_officer.college_id).all()
            data = []
            for prog in programmes:
                count = Student.query.filter_by(programme_id=prog.id).count()
                data.append({
                    'programme': prog.name,
                    'code': prog.code,
                    'students': count,
                    'department': prog.department.name if prog.department else None
                })
            return jsonify({
                'report_type': 'Enrollment Report',
                'data': data,
                'total': sum(d['students'] for d in data)
            }), 200
        
        elif report_type == 'student_cards':
            # Student card statistics
            total = StudentCard.query.filter(
                StudentCard.student_id.in_(
                    db.session.query(Student.id).join(Programme).filter(
                        Programme.college_id == college_officer.college_id
                    )
                )
            ).count()
            
            pending = StudentCard.query.filter(
                StudentCard.status == 'pending',
                StudentCard.student_id.in_(
                    db.session.query(Student.id).join(Programme).filter(
                        Programme.college_id == college_officer.college_id
                    )
                )
            ).count()
            
            approved = StudentCard.query.filter(
                StudentCard.status == 'approved',
                StudentCard.student_id.in_(
                    db.session.query(Student.id).join(Programme).filter(
                        Programme.college_id == college_officer.college_id
                    )
                )
            ).count()
            
            rejected = StudentCard.query.filter(
                StudentCard.status == 'rejected',
                StudentCard.student_id.in_(
                    db.session.query(Student.id).join(Programme).filter(
                        Programme.college_id == college_officer.college_id
                    )
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
