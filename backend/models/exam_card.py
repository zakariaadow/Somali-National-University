from extensions import db
from datetime import datetime

class ExamCard(db.Model):
    __tablename__ = 'exam_cards'
    
    id = db.Column(db.Integer, primary_key=True)
    exam_card_number = db.Column(db.String(50), unique=True, nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    semester_id = db.Column(db.Integer, db.ForeignKey('semesters.id'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'), nullable=False)
    payment_id = db.Column(db.Integer, db.ForeignKey('payments.id'), nullable=False)
    generated_date = db.Column(db.DateTime, default=datetime.utcnow)
    exam_card_pdf = db.Column(db.String(255))
    is_downloaded = db.Column(db.Boolean, default=False)
    is_approved = db.Column(db.Boolean, default=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using back_populates
    student = db.relationship('Student', back_populates='exam_cards')
    semester = db.relationship('Semester', back_populates='exam_cards')
    academic_year = db.relationship('AcademicYear', back_populates='exam_cards')
    payment = db.relationship('Payment', back_populates='exam_card')
    
    def __repr__(self):
        return f'<ExamCard {self.exam_card_number}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'exam_card_number': self.exam_card_number,
            'student_id': self.student_id,
            'student_name': self.student.user.get_full_name() if self.student and self.student.user else None,
            'registration_number': self.student.registration_number if self.student else None,
            'semester_id': self.semester_id,
            'semester_name': self.semester.name if self.semester else None,
            'academic_year_id': self.academic_year_id,
            'academic_year': self.academic_year.name if self.academic_year else None,
            'payment_id': self.payment_id,
            'generated_date': self.generated_date.isoformat() if self.generated_date else None,
            'exam_card_pdf': self.exam_card_pdf,
            'is_downloaded': self.is_downloaded,
            'is_approved': self.is_approved,
            'approved_by': self.approved_by,
            'approved_date': self.approved_date.isoformat() if self.approved_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
