from extensions import db
from datetime import datetime

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    payment_reference = db.Column(db.String(50), unique=True, nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    registration_id = db.Column(db.Integer, db.ForeignKey('registrations.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)
    payment_method = db.Column(db.String(50), nullable=False)
    transaction_id = db.Column(db.String(100))
    is_verified = db.Column(db.Boolean, default=False)
    verified_by = db.Column(db.Integer, db.ForeignKey('finance_officers.id'))
    verified_date = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = db.relationship('Student', back_populates='payments')
    registration = db.relationship('Registration', back_populates='payments')
    finance_officer = db.relationship('FinanceOfficer', back_populates='payments')
    receipt = db.relationship('Receipt', back_populates='payment', uselist=False, cascade='all, delete-orphan')
    exam_card = db.relationship('ExamCard', back_populates='payment', uselist=False, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Payment {self.payment_reference}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'payment_reference': self.payment_reference,
            'student_id': self.student_id,
            'student_name': self.student.user.get_full_name() if self.student and self.student.user else None,
            'registration_id': self.registration_id,
            'amount': self.amount,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'payment_method': self.payment_method,
            'transaction_id': self.transaction_id,
            'is_verified': self.is_verified,
            'verified_by': self.verified_by,
            'verified_date': self.verified_date.isoformat() if self.verified_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
