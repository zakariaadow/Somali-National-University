from extensions import db
from datetime import datetime

class Result(db.Model):
    __tablename__ = 'results'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    student_unit_id = db.Column(db.Integer, db.ForeignKey('student_units.id'), unique=True, nullable=False)
    semester_id = db.Column(db.Integer, db.ForeignKey('semesters.id'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'), nullable=False)
    cat_marks = db.Column(db.Float)
    exam_marks = db.Column(db.Float)
    total_marks = db.Column(db.Float)
    grade = db.Column(db.String(2))
    grade_point = db.Column(db.Float)
    is_published = db.Column(db.Boolean, default=False)
    published_date = db.Column(db.DateTime)
    published_by = db.Column(db.Integer, db.ForeignKey('lecturers.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using back_populates
    student = db.relationship('Student', back_populates='results')
    student_unit = db.relationship('StudentUnit', back_populates='result')
    semester = db.relationship('Semester', back_populates='results')
    academic_year = db.relationship('AcademicYear', back_populates='results')
    
    def __repr__(self):
        return f'<Result {self.student_id} - {self.student_unit_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': self.student.user.get_full_name() if self.student and self.student.user else None,
            'registration_number': self.student.registration_number if self.student else None,
            'student_unit_id': self.student_unit_id,
            'unit_code': self.student_unit.unit.unit_code if self.student_unit and self.student_unit.unit else None,
            'unit_name': self.student_unit.unit.unit_name if self.student_unit and self.student_unit.unit else None,
            'semester_id': self.semester_id,
            'semester_name': self.semester.name if self.semester else None,
            'academic_year_id': self.academic_year_id,
            'academic_year': self.academic_year.name if self.academic_year else None,
            'cat_marks': self.cat_marks,
            'exam_marks': self.exam_marks,
            'total_marks': self.total_marks,
            'grade': self.grade,
            'grade_point': self.grade_point,
            'is_published': self.is_published,
            'published_date': self.published_date.isoformat() if self.published_date else None,
            'published_by': self.published_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
