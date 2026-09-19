from extensions import db
from datetime import datetime

class StudentCard(db.Model):
    __tablename__ = 'student_cards'
    
    id = db.Column(db.Integer, primary_key=True)
    card_number = db.Column(db.String(50), unique=True, nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), unique=True, nullable=False)
    photo = db.Column(db.String(255), nullable=False)
    card_pdf = db.Column(db.String(255))
    application_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='pending')
    rejection_reason = db.Column(db.Text)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    reviewed_date = db.Column(db.DateTime)
    faculty_officer_id = db.Column(db.Integer, db.ForeignKey('faculty_officers.id'))
    college_officer_id = db.Column(db.Integer, db.ForeignKey('college_officers.id'))
    issue_date = db.Column(db.Date)
    expiry_date = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = db.relationship('Student', back_populates='student_card')
    faculty_officer = db.relationship('FacultyOfficer', back_populates='student_cards')
    college_officer = db.relationship('CollegeOfficer', back_populates='student_cards')
    
    def __repr__(self):
        return f'<StudentCard {self.card_number}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'card_number': self.card_number,
            'student_id': self.student_id,
            'student_name': self.student.user.get_full_name() if self.student and self.student.user else None,
            'registration_number': self.student.registration_number if self.student else None,
            'photo': self.photo,
            'card_pdf': self.card_pdf,
            'application_date': self.application_date.isoformat() if self.application_date else None,
            'status': self.status,
            'rejection_reason': self.rejection_reason,
            'reviewed_by': self.reviewed_by,
            'reviewed_date': self.reviewed_date.isoformat() if self.reviewed_date else None,
            'faculty_officer_id': self.faculty_officer_id,
            'college_officer_id': self.college_officer_id,
            'issue_date': self.issue_date.isoformat() if self.issue_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
