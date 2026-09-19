from extensions import db
from datetime import datetime

class Unit(db.Model):
    __tablename__ = 'units'
    
    id = db.Column(db.Integer, primary_key=True)
    unit_code = db.Column(db.String(20), unique=True, nullable=False)
    unit_name = db.Column(db.String(200), nullable=False)
    credits = db.Column(db.Integer, nullable=False, default=3)
    description = db.Column(db.Text)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    semester_id = db.Column(db.Integer, db.ForeignKey('semesters.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using string references to avoid circular imports
    department = db.relationship('Department', back_populates='units')
    semester = db.relationship('Semester', back_populates='units')
    student_units = db.relationship('StudentUnit', back_populates='unit', lazy=True, cascade='all, delete-orphan')
    assessments = db.relationship('Assessment', back_populates='unit', lazy=True)
    # Use string reference for the association table
    lecturers = db.relationship('Lecturer', secondary='lecturer_units', back_populates='units', lazy=True)
    
    def __repr__(self):
        return f'<Unit {self.unit_code}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'unit_code': self.unit_code,
            'unit_name': self.unit_name,
            'credits': self.credits,
            'description': self.description,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'semester_id': self.semester_id,
            'semester_name': self.semester.name if self.semester else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
