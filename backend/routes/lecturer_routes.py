from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import Lecturer, Unit, StudentUnit, Assessment, Result, Attendance, ActivityLog
from extensions import db
from datetime import datetime
from utils.decorators import role_required

lecturer_bp = Blueprint('lecturer', __name__)

@lecturer_bp.route('/dashboard', methods=['GET'])
@login_required
@role_required('Lecturer')
def get_dashboard():
    """Get lecturer dashboard data"""
    try:
        lecturer = Lecturer.query.filter_by(user_id=current_user.id).first()
        
        if not lecturer:
            return jsonify({'error': 'Lecturer profile not found'}), 404
        
        # Get assigned units
        assigned_units = lecturer.units
        
        dashboard_data = {
            'lecturer': lecturer.to_dict(),
            'assigned_units': [unit.to_dict() for unit in assigned_units],
            'total_students': 0,  # Calculate from student units
            'pending_assessments': Assessment.query.filter_by(
                lecturer_id=lecturer.id,
                is_submitted=False
            ).count(),
            'total_assessments': Assessment.query.filter_by(
                lecturer_id=lecturer.id
            ).count()
        }
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lecturer_bp.route('/my-units', methods=['GET'])
@login_required
@role_required('Lecturer')
def get_my_units():
    """Get units assigned to the lecturer"""
    try:
        lecturer = Lecturer.query.filter_by(user_id=current_user.id).first()
        
        if not lecturer:
            return jsonify({'error': 'Lecturer profile not found'}), 404
        
        semester_id = request.args.get('semester_id', type=int)
        
        units = lecturer.units
        if semester_id:
            units = [u for u in units if u.semester_id == semester_id]
        
        return jsonify({
            'units': [unit.to_dict() for unit in units],
            'total': len(units)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lecturer_bp.route('/unit-students/<int:unit_id>', methods=['GET'])
@login_required
@role_required('Lecturer')
def get_unit_students(unit_id):
    """Get students registered for a specific unit"""
    try:
        lecturer = Lecturer.query.filter_by(user_id=current_user.id).first()
        
        if not lecturer:
            return jsonify({'error': 'Lecturer profile not found'}), 404
        
        # Check if lecturer teaches this unit
        if unit_id not in [u.id for u in lecturer.units]:
            return jsonify({'error': 'You are not assigned to this unit'}), 403
        
        student_units = StudentUnit.query.filter_by(unit_id=unit_id).all()
        
        students = []
        for su in student_units:
            student_data = su.student.to_dict()
            student_data['user'] = su.student.user.to_dict()
            students.append(student_data)
        
        return jsonify({
            'students': students,
            'total': len(students)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lecturer_bp.route('/record-assessment', methods=['POST'])
@login_required
@role_required('Lecturer')
def record_assessment():
    """Record assessment marks for students"""
    try:
        data = request.get_json()
        lecturer = Lecturer.query.filter_by(user_id=current_user.id).first()
        
        if not lecturer:
            return jsonify({'error': 'Lecturer profile not found'}), 404
        
        unit_id = data.get('unit_id')
        assessment_type = data.get('assessment_type')
        assessment_date = data.get('assessment_date')
        max_marks = data.get('max_marks')
        weight = data.get('weight')
        student_marks = data.get('student_marks', [])  # List of {student_unit_id, marks}
        
        # Check if lecturer teaches this unit
        if unit_id not in [u.id for u in lecturer.units]:
            return jsonify({'error': 'You are not assigned to this unit'}), 403
        
        # Record assessments for each student
        for sm in student_marks:
            assessment = Assessment(
                student_unit_id=sm['student_unit_id'],
                unit_id=unit_id,
                lecturer_id=lecturer.id,
                assessment_type=assessment_type,
                assessment_date=datetime.strptime(assessment_date, '%Y-%m-%d').date(),
                marks=sm['marks'],
                max_marks=max_marks,
                weight=weight,
                is_submitted=True,
                submitted_date=datetime.utcnow()
            )
            db.session.add(assessment)
        
        db.session.commit()
        
        # Log activity
        log = ActivityLog(
            user_id=current_user.id,
            action='RECORD_ASSESSMENT',
            description=f'Recorded {assessment_type} for {len(student_marks)} students',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': f'Assessment recorded for {len(student_marks)} students'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@lecturer_bp.route('/record-attendance', methods=['POST'])
@login_required
@role_required('Lecturer')
def record_attendance():
    """Record attendance for students"""
    try:
        data = request.get_json()
        lecturer = Lecturer.query.filter_by(user_id=current_user.id).first()
        
        if not lecturer:
            return jsonify({'error': 'Lecturer profile not found'}), 404
        
        unit_id = data.get('unit_id')
        lecture_date = data.get('lecture_date')
        attendance_data = data.get('attendance', [])  # List of {student_id, status, remarks}
        
        # Check if lecturer teaches this unit
        if unit_id not in [u.id for u in lecturer.units]:
            return jsonify({'error': 'You are not assigned to this unit'}), 403
        
        # Record attendance for each student
        for att in attendance_data:
            attendance = Attendance(
                student_id=att['student_id'],
                unit_id=unit_id,
                lecture_date=datetime.strptime(lecture_date, '%Y-%m-%d').date(),
                status=att['status'],
                remarks=att.get('remarks', '')
            )
            db.session.add(attendance)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Attendance recorded for {len(attendance_data)} students'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@lecturer_bp.route('/publish-results', methods=['POST'])
@login_required
@role_required('Lecturer')
def publish_results():
    """Publish final results for a unit"""
    try:
        data = request.get_json()
        lecturer = Lecturer.query.filter_by(user_id=current_user.id).first()
        
        if not lecturer:
            return jsonify({'error': 'Lecturer profile not found'}), 404
        
        unit_id = data.get('unit_id')
        semester_id = data.get('semester_id')
        academic_year_id = data.get('academic_year_id')
        
        # Check if lecturer teaches this unit
        if unit_id not in [u.id for u in lecturer.units]:
            return jsonify({'error': 'You are not assigned to this unit'}), 403
        
        # Get all student units for this unit, semester, and academic year
        student_units = StudentUnit.query.filter_by(
            unit_id=unit_id,
            semester_id=semester_id,
            academic_year_id=academic_year_id
        ).all()
        
        # Calculate final results
        for su in student_units:
            assessments = Assessment.query.filter_by(student_unit_id=su.id).all()
            
            # Calculate weighted total
            total_marks = 0
            for assessment in assessments:
                total_marks += (assessment.marks / assessment.max_marks) * assessment.weight
            
            # Determine grade
            grade, grade_point = calculate_grade(total_marks)
            
            # Create or update result
            result = Result.query.filter_by(student_unit_id=su.id).first()
            if not result:
                result = Result(
                    student_id=su.student_id,
                    student_unit_id=su.id,
                    semester_id=semester_id,
                    academic_year_id=academic_year_id,
                    is_published=True,
                    published_date=datetime.utcnow(),
                    published_by=lecturer.id
                )
                db.session.add(result)
            
            result.total_marks = total_marks
            result.grade = grade
            result.grade_point = grade_point
            result.is_published = True
            result.published_date = datetime.utcnow()
            result.published_by = lecturer.id
            
            # Update student unit
            su.is_completed = True
            su.grade = grade
            su.score = total_marks
        
        db.session.commit()
        
        # Log activity
        log = ActivityLog(
            user_id=current_user.id,
            action='PUBLISH_RESULTS',
            description=f'Published results for {len(student_units)} students',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': f'Results published for {len(student_units)} students'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def calculate_grade(marks):
    """Calculate grade and grade point based on marks"""
    if marks >= 80:
        return 'A', 4.0
    elif marks >= 75:
        return 'B+', 3.5
    elif marks >= 70:
        return 'B', 3.0
    elif marks >= 65:
        return 'C+', 2.5
    elif marks >= 60:
        return 'C', 2.0
    elif marks >= 50:
        return 'D', 1.0
    else:
        return 'F', 0.0