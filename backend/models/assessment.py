from extensions import db
from datetime import datetime

class Assessment(db.Model):
    __tablename__ = 'assessments'
    
    id = db.Column(db.Integer, primary_key=True)
    student_unit_id = db.Column(db.Integer, db.ForeignKey('student_units.id'), nullable=False)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    lecturer_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=False)
    assessment_type = db.Column(db.String(50), nullable=False)
    assessment_date = db.Column(db.Date, nullable=False)
    marks = db.Column(db.Float)
    max_marks = db.Column(db.Float, nullable=False)
    weight = db.Column(db.Float, nullable=False)
    is_submitted = db.Column(db.Boolean, default=False)
    submitted_date = db.Column(db.DateTime)
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student_unit = db.relationship('StudentUnit', back_populates='assessments')
    unit = db.relationship('Unit', back_populates='assessments')
    lecturer = db.relationship('Lecturer', back_populates='assessments')
    
    def __repr__(self):
        return f'<Assessment {self.id} - {self.assessment_type}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_unit_id': self.student_unit_id,
            'unit_id': self.unit_id,
            'unit_code': self.unit.unit_code if self.unit else None,
            'unit_name': self.unit.unit_name if self.unit else None,
            'lecturer_id': self.lecturer_id,
            'lecturer_name': self.lecturer.user.get_full_name() if self.lecturer and self.lecturer.user else None,
            'assessment_type': self.assessment_type,
            'assessment_date': self.assessment_date.isoformat() if self.assessment_date else None,
            'marks': self.marks,
            'max_marks': self.max_marks,
            'weight': self.weight,
            'is_submitted': self.is_submitted,
            'submitted_date': self.submitted_date.isoformat() if self.submitted_date else None,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
