from extensions import db
from datetime import datetime

class Registration(db.Model):
    __tablename__ = 'registrations'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    semester_id = db.Column(db.Integer, db.ForeignKey('semesters.id'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'), nullable=False)
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)
    is_approved = db.Column(db.Boolean, default=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = db.relationship('Student', back_populates='registrations')
    semester = db.relationship('Semester', back_populates='registrations')
    academic_year = db.relationship('AcademicYear', back_populates='registrations')
    payments = db.relationship('Payment', back_populates='registration', lazy=True, cascade='all, delete-orphan')
    
    __table_args__ = (db.UniqueConstraint('student_id', 'semester_id', 'academic_year_id', name='unique_registration'),)
    
    def __repr__(self):
        return f'<Registration {self.student_id} - {self.semester_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'semester_id': self.semester_id,
            'semester_name': self.semester.name if self.semester else None,
            'academic_year_id': self.academic_year_id,
            'academic_year': self.academic_year.name if self.academic_year else None,
            'registration_date': self.registration_date.isoformat() if self.registration_date else None,
            'is_approved': self.is_approved,
            'approved_by': self.approved_by,
            'approved_date': self.approved_date.isoformat() if self.approved_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
