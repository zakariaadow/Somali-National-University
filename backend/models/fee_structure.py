from extensions import db
from datetime import datetime

class FeeStructure(db.Model):
    __tablename__ = 'fee_structures'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    programme_id = db.Column(db.Integer, db.ForeignKey('programmes.id'), nullable=False)
    semester_id = db.Column(db.Integer, db.ForeignKey('semesters.id'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'), nullable=False)
    tuition_fee = db.Column(db.Float, nullable=False)
    registration_fee = db.Column(db.Float, nullable=False)
    examination_fee = db.Column(db.Float, nullable=False)
    student_card_fee = db.Column(db.Float, nullable=False)
    library_fee = db.Column(db.Float, nullable=False)
    sports_fee = db.Column(db.Float, nullable=False)
    medical_fee = db.Column(db.Float, nullable=False)
    other_fees = db.Column(db.Float, default=0)
    total_fee = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='SOS')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using back_populates
    programme = db.relationship('Programme', back_populates='fee_structures')
    semester = db.relationship('Semester', back_populates='fee_structures')
    academic_year = db.relationship('AcademicYear', back_populates='fee_structures')
    
    __table_args__ = (db.UniqueConstraint('programme_id', 'semester_id', 'academic_year_id', name='unique_fee_structure'),)
    
    def __repr__(self):
        return f'<FeeStructure {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'programme_id': self.programme_id,
            'programme_name': self.programme.name if self.programme else None,
            'semester_id': self.semester_id,
            'semester_name': self.semester.name if self.semester else None,
            'academic_year_id': self.academic_year_id,
            'academic_year': self.academic_year.name if self.academic_year else None,
            'tuition_fee': self.tuition_fee,
            'registration_fee': self.registration_fee,
            'examination_fee': self.examination_fee,
            'student_card_fee': self.student_card_fee,
            'library_fee': self.library_fee,
            'sports_fee': self.sports_fee,
            'medical_fee': self.medical_fee,
            'other_fees': self.other_fees,
            'total_fee': self.total_fee,
            'currency': self.currency,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
