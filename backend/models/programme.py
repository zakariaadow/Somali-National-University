from extensions import db
from datetime import datetime

class Programme(db.Model):
    __tablename__ = 'programmes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    duration_years = db.Column(db.Integer, nullable=False, default=4)
    description = db.Column(db.Text)
    college_id = db.Column(db.Integer, db.ForeignKey('colleges.id'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using back_populates
    college = db.relationship('College', back_populates='programmes')
    department = db.relationship('Department', back_populates='programmes')
    students = db.relationship('Student', back_populates='programme', lazy=True)
    fee_structures = db.relationship('FeeStructure', back_populates='programme', lazy=True)
    
    def __repr__(self):
        return f'<Programme {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'duration_years': self.duration_years,
            'description': self.description,
            'college_id': self.college_id,
            'college_name': self.college.name if self.college else None,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
