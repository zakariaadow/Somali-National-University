from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import Attendance, Student, Unit, Lecturer, ActivityLog
from extensions import db
from datetime import datetime
from utils.decorators import role_required

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/', methods=['GET'])
@login_required
def get_attendances():
    """Get all attendance records with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        student_id = request.args.get('student_id', type=int)
        unit_id = request.args.get('unit_id', type=int)
        status = request.args.get('status')
        
        query = Attendance.query
        if student_id:
            query = query.filter_by(student_id=student_id)
        if unit_id:
            query = query.filter_by(unit_id=unit_id)
        if status:
            query = query.filter_by(status=status)
        
        attendances = query.order_by(
            Attendance.lecture_date.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'attendances': [a.to_dict() for a in attendances.items],
            'total': attendances.total,
            'page': attendances.page,
            'pages': attendances.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@attendance_bp.route('/', methods=['POST'])
@login_required
@role_required('Lecturer')
def record_attendance():
    """Record attendance for a student"""
    try:
        data = request.get_json()
        lecturer = Lecturer.query.filter_by(user_id=current_user.id).first()
        
        if not lecturer:
            return jsonify({'error': 'Lecturer profile not found'}), 404
        
        # Check if lecturer teaches this unit
        unit = Unit.query.get(data['unit_id'])
        if not unit or unit.id not in [u.id for u in lecturer.units]:
            return jsonify({'error': 'You are not assigned to this unit'}), 403
        
        # Check if attendance already recorded for this student, unit, and date
        existing = Attendance.query.filter_by(
            student_id=data['student_id'],
            unit_id=data['unit_id'],
            lecture_date=datetime.strptime(data['lecture_date'], '%Y-%m-%d').date()
        ).first()
        
        if existing:
            return jsonify({'error': 'Attendance already recorded for this date'}), 400
        
        attendance = Attendance(
            student_id=data['student_id'],
            unit_id=data['unit_id'],
            lecture_date=datetime.strptime(data['lecture_date'], '%Y-%m-%d').date(),
            status=data['status'],
            remarks=data.get('remarks')
        )
        
        db.session.add(attendance)
        db.session.commit()
        
        # Log activity
        log = ActivityLog(
            user_id=current_user.id,
            action='RECORD_ATTENDANCE',
            description=f'Recorded attendance for student {data["student_id"]} - {data["status"]}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Attendance recorded successfully',
            'attendance': attendance.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@attendance_bp.route('/<int:attendance_id>', methods=['GET'])
@login_required
def get_attendance(attendance_id):
    """Get attendance record details"""
    try:
        attendance = Attendance.query.get_or_404(attendance_id)
        return jsonify(attendance.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@attendance_bp.route('/<int:attendance_id>', methods=['PUT'])
@login_required
@role_required('Lecturer')
def update_attendance(attendance_id):
    """Update attendance record"""
    try:
        attendance = Attendance.query.get_or_404(attendance_id)
        data = request.get_json()
        
        if 'status' in data:
            attendance.status = data['status']
        if 'remarks' in data:
            attendance.remarks = data['remarks']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Attendance updated successfully',
            'attendance': attendance.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@attendance_bp.route('/student/<int:student_id>', methods=['GET'])
@login_required
def get_student_attendance(student_id):
    """Get attendance summary for a student"""
    try:
        # Check permissions
        if current_user.role.name == 'Student':
            student = Student.query.filter_by(user_id=current_user.id).first()
            if not student or student.id != student_id:
                return jsonify({'error': 'Access denied'}), 403
        
        semester_id = request.args.get('semester_id', type=int)
        
        query = Attendance.query.filter_by(student_id=student_id)
        if semester_id:
            query = query.join(Unit).filter(Unit.semester_id == semester_id)
        
        attendances = query.all()
        
        # Calculate statistics
        total = len(attendances)
        present = sum(1 for a in attendances if a.status == 'present')
        absent = sum(1 for a in attendances if a.status == 'absent')
        excused = sum(1 for a in attendances if a.status == 'excused')
        
        return jsonify({
            'student_id': student_id,
            'summary': {
                'total': total,
                'present': present,
                'absent': absent,
                'excused': excused,
                'attendance_percentage': round((present / total) * 100, 2) if total > 0 else 0
            },
            'attendances': [a.to_dict() for a in attendances]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500