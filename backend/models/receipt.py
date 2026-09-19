from extensions import db
from datetime import datetime

class Receipt(db.Model):
    __tablename__ = 'receipts'
    
    id = db.Column(db.Integer, primary_key=True)
    receipt_number = db.Column(db.String(50), unique=True, nullable=False)
    payment_id = db.Column(db.Integer, db.ForeignKey('payments.id'), unique=True, nullable=False)
    generated_by = db.Column(db.Integer, db.ForeignKey('finance_officers.id'), nullable=False)
    generated_date = db.Column(db.DateTime, default=datetime.utcnow)
    receipt_pdf = db.Column(db.String(255))
    is_downloaded = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using back_populates
    payment = db.relationship('Payment', back_populates='receipt')
    finance_officer = db.relationship('FinanceOfficer', back_populates='receipts')
    
    def __repr__(self):
        return f'<Receipt {self.receipt_number}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'receipt_number': self.receipt_number,
            'payment_id': self.payment_id,
            'payment_reference': self.payment.payment_reference if self.payment else None,
            'generated_by': self.generated_by,
            'generated_date': self.generated_date.isoformat() if self.generated_date else None,
            'receipt_pdf': self.receipt_pdf,
            'is_downloaded': self.is_downloaded,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
