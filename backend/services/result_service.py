# backend/services/result_service.py
from database import db
from models import Result, Student, Assessment, StudentUnit, Unit
from datetime import datetime

class ResultService:
    @staticmethod
    def calculate_grade(score, max_score):
        """Calculate grade based on score"""
        if max_score == 0:
            return 'F'
        
        percentage = (score / max_score) * 100
        
        if percentage >= 80:
            return 'A'
        elif percentage >= 70:
            return 'B'
        elif percentage >= 60:
            return 'C'
        elif percentage >= 50:
            return 'D'
        else:
            return 'F'
    
    @staticmethod
    def get_grade_points(grade):
        """Convert grade to grade points"""
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
    def calculate_gpa(results):
        """Calculate GPA from results"""
        total_points = 0
        total_credits = 0
        
        for result in results:
            if result.grade and result.student_unit and result.student_unit.unit:
                grade_points = ResultService.get_grade_points(result.grade)
                credits = result.student_unit.unit.credits
                total_points += grade_points * credits
                total_credits += credits
        
        return round(total_points / total_credits, 2) if total_credits > 0 else 0
    
    @staticmethod
    def get_student_results(student_id, semester_id=None):
        """Get all results for a student"""
        query = Result.query.filter_by(student_id=student_id, is_published=True)
        
        if semester_id:
            query = query.join(StudentUnit).join(Unit).filter(Unit.semester_id == semester_id)
        
        results = query.all()
        
        return [{
            'id': r.id,
            'unit': r.student_unit.unit.name if r.student_unit and r.student_unit.unit else None,
            'unit_code': r.student_unit.unit.code if r.student_unit and r.student_unit.unit else None,
            'credits': r.student_unit.unit.credits if r.student_unit and r.student_unit.unit else 0,
            'assessment': r.assessment.name if r.assessment else None,
            'assessment_type': r.assessment.assessment_type if r.assessment else None,
            'score': r.score,
            'max_score': r.assessment.max_score if r.assessment else None,
            'grade': r.grade,
            'grade_points': ResultService.get_grade_points(r.grade)
        } for r in results]
    
    @staticmethod
    def get_transcript(student_id):
        """Generate full transcript for a student"""
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
            if r.student_unit and r.student_unit.unit:
                semester = r.student_unit.unit.semester
                if semester:
                    key = semester.id
                    if key not in semester_groups:
                        semester_groups[key] = {
                            'semester': semester.name,
                            'semester_number': semester.semester_number,
                            'academic_year': semester.academic_year.name if semester.academic_year else None,
                            'units': [],
                            'total_credits': 0,
                            'total_points': 0
                        }
                    
                    credits = r.student_unit.unit.credits
                    grade_points = ResultService.get_grade_points(r.grade) if r.grade else 0
                    
                    semester_groups[key]['units'].append({
                        'unit': r.student_unit.unit.name,
                        'code': r.student_unit.unit.code,
                        'credits': credits,
                        'grade': r.grade,
                        'grade_points': grade_points,
                        'score': r.score
                    })
                    
                    semester_groups[key]['total_credits'] += credits
                    semester_groups[key]['total_points'] += grade_points * credits
        
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
        
        return {
            'success': True,
            'student': {
                'name': student.get_full_name(),
                'registration_number': student.registration_number,
                'programme': student.programme.name if student.programme else None
            },
            'transcript': transcript,
            'cgpa': cgpa,
            'total_credits': total_credits
        }
    
    @staticmethod
    def get_unit_performance(unit_id):
        """Get performance statistics for a unit"""
        results = Result.query.filter_by(is_published=True).join(
            StudentUnit, Result.student_unit_id == StudentUnit.id
        ).filter(StudentUnit.unit_id == unit_id).all()
        
        if not results:
            return {
                'success': True,
                'total_students': 0,
                'average_score': 0,
                'pass_rate': 0,
                'grade_distribution': {}
            }
        
        total_students = len(results)
        total_score = sum(r.score for r in results if r.score)
        average_score = total_score / total_students if total_students > 0 else 0
        
        # Grade distribution
        grade_dist = {}
        passed = 0
        for r in results:
            grade = r.grade or 'F'
            grade_dist[grade] = grade_dist.get(grade, 0) + 1
            if grade != 'F':
                passed += 1
        
        return {
            'success': True,
            'total_students': total_students,
            'average_score': round(average_score, 2),
            'pass_rate': round((passed / total_students) * 100 if total_students > 0 else 0, 2),
            'grade_distribution': grade_dist
        }
    
    @staticmethod
    def get_class_performance(assessment_id):
        """Get performance for a specific assessment"""
        results = Result.query.filter_by(
            assessment_id=assessment_id,
            is_published=True
        ).all()
        
        if not results:
            return {
                'success': True,
                'total_students': 0,
                'average_score': 0,
                'max_score': 0,
                'min_score': 0
            }
        
        scores = [r.score for r in results if r.score is not None]
        if not scores:
            return {
                'success': True,
                'total_students': len(results),
                'average_score': 0,
                'max_score': 0,
                'min_score': 0
            }
        
        return {
            'success': True,
            'total_students': len(results),
            'average_score': round(sum(scores) / len(scores), 2),
            'max_score': max(scores),
            'min_score': min(scores),
            'median_score': sorted(scores)[len(scores) // 2]
        }