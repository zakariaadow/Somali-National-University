from extensions import db
from datetime import datetime

class AcademicYear(db.Model):
    __tablename__ = 'academic_years'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    start_year = db.Column(db.Integer, nullable=False)
    end_year = db.Column(db.Integer, nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    is_current = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using back_populates
    semesters = db.relationship('Semester', back_populates='academic_year', lazy=True, cascade='all, delete-orphan')
    registrations = db.relationship('Registration', back_populates='academic_year', lazy=True)
    student_units = db.relationship('StudentUnit', back_populates='academic_year', lazy=True)
    results = db.relationship('Result', back_populates='academic_year', lazy=True)
    exam_cards = db.relationship('ExamCard', back_populates='academic_year', lazy=True)
    fee_structures = db.relationship('FeeStructure', back_populates='academic_year', lazy=True)
    
    def __repr__(self):
        return f'<AcademicYear {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'start_year': self.start_year,
            'end_year': self.end_year,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'is_current': self.is_current,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
