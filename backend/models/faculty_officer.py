from extensions import db
from datetime import datetime

class FacultyOfficer(db.Model):
    __tablename__ = 'faculty_officers'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_number = db.Column(db.String(20), unique=True, nullable=False)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculties.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using back_populates
    faculty = db.relationship('Faculty', back_populates='faculty_officers')
    user = db.relationship('User', back_populates='faculty_officer')
    student_cards = db.relationship('StudentCard', back_populates='faculty_officer', lazy=True)
    
    def __repr__(self):
        return f'<FacultyOfficer {self.employee_number}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_number': self.employee_number,
            'faculty_id': self.faculty_id,
            'faculty_name': self.faculty.name if self.faculty else None,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
