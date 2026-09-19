from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import Result, Student, StudentUnit, Unit, ActivityLog
from extensions import db
from datetime import datetime
from utils.decorators import role_required

result_bp = Blueprint('result', __name__)

@result_bp.route('/', methods=['GET'])
@login_required
def get_results():
    """Get all results with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        student_id = request.args.get('student_id', type=int)
        semester_id = request.args.get('semester_id', type=int)
        academic_year_id = request.args.get('academic_year_id', type=int)
        is_published = request.args.get('is_published', type=bool)
        
        query = Result.query
        if student_id:
            query = query.filter_by(student_id=student_id)
        if semester_id:
            query = query.filter_by(semester_id=semester_id)
        if academic_year_id:
            query = query.filter_by(academic_year_id=academic_year_id)
        if is_published is not None:
            query = query.filter_by(is_published=is_published)
        
        results = query.order_by(
            Result.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'results': [r.to_dict() for r in results.items],
            'total': results.total,
            'page': results.page,
            'pages': results.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@result_bp.route('/<int:result_id>', methods=['GET'])
@login_required
def get_result(result_id):
    """Get result details"""
    try:
        result = Result.query.get_or_404(result_id)
        
        # Check permissions
        if current_user.role.name == 'Student':
            student = Student.query.filter_by(user_id=current_user.id).first()
            if result.student_id != student.id:
                return jsonify({'error': 'Access denied'}), 403
        
        return jsonify(result.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@result_bp.route('/student/<int:student_id>/gpa', methods=['GET'])
@login_required
def get_student_gpa(student_id):
    """Get student's GPA"""
    try:
        # Check permissions
        if current_user.role.name == 'Student':
            student = Student.query.filter_by(user_id=current_user.id).first()
            if not student or student.id != student_id:
                return jsonify({'error': 'Access denied'}), 403
        
        semester_id = request.args.get('semester_id', type=int)
        
        query = Result.query.filter_by(
            student_id=student_id,
            is_published=True
        )
        
        if semester_id:
            query = query.filter_by(semester_id=semester_id)
        
        results = query.all()
        
        total_grade_points = 0
        total_credits = 0
        
        for result in results:
            if result.grade_point and result.student_unit and result.student_unit.unit:
                total_grade_points += result.grade_point * result.student_unit.unit.credits
                total_credits += result.student_unit.unit.credits
        
        gpa = total_grade_points / total_credits if total_credits > 0 else 0
        
        return jsonify({
            'student_id': student_id,
            'gpa': round(gpa, 2),
            'total_credits': total_credits,
            'total_grade_points': round(total_grade_points, 2),
            'semester_id': semester_id,
            'results': [r.to_dict() for r in results]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@result_bp.route('/transcript/<int:student_id>', methods=['GET'])
@login_required
def get_transcript(student_id):
    """Get student's complete transcript"""
    try:
        # Check permissions
        if current_user.role.name == 'Student':
            student = Student.query.filter_by(user_id=current_user.id).first()
            if not student or student.id != student_id:
                return jsonify({'error': 'Access denied'}), 403
        
        student = Student.query.get_or_404(student_id)
        
        # Get all published results
        results = Result.query.filter_by(
            student_id=student_id,
            is_published=True
        ).order_by(
            Result.academic_year_id,
            Result.semester_id
        ).all()
        
        # Group by semester
        semesters = {}
        for result in results:
            key = f"{result.academic_year_id}_{result.semester_id}"
            if key not in semesters:
                semesters[key] = {
                    'academic_year': result.academic_year.to_dict() if result.academic_year else None,
                    'semester': result.semester.to_dict() if result.semester else None,
                    'results': [],
                    'gpa': 0,
                    'total_credits': 0,
                    'total_grade_points': 0
                }
            semesters[key]['results'].append(result.to_dict())
            
            if result.grade_point and result.student_unit and result.student_unit.unit:
                semesters[key]['total_grade_points'] += result.grade_point * result.student_unit.unit.credits
                semesters[key]['total_credits'] += result.student_unit.unit.credits
        
        # Calculate GPA for each semester
        for key in semesters:
            semesters[key]['gpa'] = round(
                semesters[key]['total_grade_points'] / semesters[key]['total_credits'], 2
            ) if semesters[key]['total_credits'] > 0 else 0
        
        # Calculate overall GPA
        total_gp = 0
        total_cr = 0
        for semester in semesters.values():
            total_gp += semester['total_grade_points']
            total_cr += semester['total_credits']
        overall_gpa = round(total_gp / total_cr, 2) if total_cr > 0 else 0
        
        return jsonify({
            'student': student.to_dict(),
            'semesters': semesters,
            'overall_gpa': overall_gpa,
            'total_credits_completed': total_cr
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500