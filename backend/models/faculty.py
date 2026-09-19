from extensions import db
from datetime import datetime

class Faculty(db.Model):
    __tablename__ = 'faculties'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    description = db.Column(db.Text)
    dean_name = db.Column(db.String(100))
    dean_email = db.Column(db.String(100))
    dean_phone = db.Column(db.String(20))
    college_id = db.Column(db.Integer, db.ForeignKey('colleges.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using back_populates
    college = db.relationship('College', back_populates='faculties')
    departments = db.relationship('Department', back_populates='faculty', lazy=True, cascade='all, delete-orphan')
    faculty_officers = db.relationship('FacultyOfficer', back_populates='faculty', lazy=True)
    
    def __repr__(self):
        return f'<Faculty {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'description': self.description,
            'dean_name': self.dean_name,
            'dean_email': self.dean_email,
            'dean_phone': self.dean_phone,
            'college_id': self.college_id,
            'college_name': self.college.name if self.college else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
