from extensions import db
from datetime import datetime

class Department(db.Model):
    __tablename__ = 'departments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    description = db.Column(db.Text)
    head_name = db.Column(db.String(100))
    head_email = db.Column(db.String(100))
    head_phone = db.Column(db.String(20))
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculties.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using back_populates
    faculty = db.relationship('Faculty', back_populates='departments')
    programmes = db.relationship('Programme', back_populates='department', lazy=True, cascade='all, delete-orphan')
    units = db.relationship('Unit', back_populates='department', lazy=True)
    lecturers = db.relationship('Lecturer', back_populates='department', lazy=True)
    
    def __repr__(self):
        return f'<Department {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'description': self.description,
            'head_name': self.head_name,
            'head_email': self.head_email,
            'head_phone': self.head_phone,
            'faculty_id': self.faculty_id,
            'faculty_name': self.faculty.name if self.faculty else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
