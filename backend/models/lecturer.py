from extensions import db
from datetime import datetime

class Lecturer(db.Model):
    __tablename__ = 'lecturers'
    
    id = db.Column(db.Integer, primary_key=True)
    staff_number = db.Column(db.String(20), unique=True, nullable=False)
    qualification = db.Column(db.String(200))
    specialization = db.Column(db.String(200))
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using back_populates
    department = db.relationship('Department', back_populates='lecturers')
    user = db.relationship('User', back_populates='lecturer')
    assessments = db.relationship('Assessment', back_populates='lecturer', lazy=True)
    # Use string reference for the association table
    units = db.relationship('Unit', secondary='lecturer_units', back_populates='lecturers', lazy=True)
    
    def __repr__(self):
        return f'<Lecturer {self.staff_number}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'staff_number': self.staff_number,
            'qualification': self.qualification,
            'specialization': self.specialization,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
