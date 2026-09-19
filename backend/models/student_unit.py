from extensions import db
from datetime import datetime

class StudentUnit(db.Model):
    __tablename__ = 'student_units'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    semester_id = db.Column(db.Integer, db.ForeignKey('semesters.id'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'), nullable=False)
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)
    is_completed = db.Column(db.Boolean, default=False)
    grade = db.Column(db.String(2))
    score = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using back_populates
    student = db.relationship('Student', back_populates='student_units')
    unit = db.relationship('Unit', back_populates='student_units')
    semester = db.relationship('Semester', back_populates='student_units')
    academic_year = db.relationship('AcademicYear', back_populates='student_units')
    assessments = db.relationship('Assessment', back_populates='student_unit', lazy=True, cascade='all, delete-orphan')
    result = db.relationship('Result', back_populates='student_unit', uselist=False, cascade='all, delete-orphan')
    
    __table_args__ = (db.UniqueConstraint('student_id', 'unit_id', 'semester_id', 'academic_year_id', name='unique_student_unit'),)
    
    def __repr__(self):
        return f'<StudentUnit {self.student_id} - {self.unit_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'unit_id': self.unit_id,
            'unit_code': self.unit.unit_code if self.unit else None,
            'unit_name': self.unit.unit_name if self.unit else None,
            'semester_id': self.semester_id,
            'semester_name': self.semester.name if self.semester else None,
            'academic_year_id': self.academic_year_id,
            'academic_year': self.academic_year.name if self.academic_year else None,
            'registration_date': self.registration_date.isoformat() if self.registration_date else None,
            'is_completed': self.is_completed,
            'grade': self.grade,
            'score': self.score,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
