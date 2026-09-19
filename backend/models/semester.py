from extensions import db
from datetime import datetime

class Semester(db.Model):
    __tablename__ = 'semesters'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    semester_number = db.Column(db.Integer, nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    registration_start = db.Column(db.Date, nullable=False)
    registration_end = db.Column(db.Date, nullable=False)
    is_current = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using back_populates
    academic_year = db.relationship('AcademicYear', back_populates='semesters')
    units = db.relationship('Unit', back_populates='semester', lazy=True)
    registrations = db.relationship('Registration', back_populates='semester', lazy=True)
    student_units = db.relationship('StudentUnit', back_populates='semester', lazy=True)
    exam_cards = db.relationship('ExamCard', back_populates='semester', lazy=True)
    results = db.relationship('Result', back_populates='semester', lazy=True)
    fee_structures = db.relationship('FeeStructure', back_populates='semester', lazy=True)
    
    def __repr__(self):
        return f'<Semester {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'semester_number': self.semester_number,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'registration_start': self.registration_start.isoformat() if self.registration_start else None,
            'registration_end': self.registration_end.isoformat() if self.registration_end else None,
            'is_current': self.is_current,
            'is_active': self.is_active,
            'academic_year_id': self.academic_year_id,
            'academic_year_name': self.academic_year.name if self.academic_year else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
