from database import db
from datetime import datetime

class FinanceStaff(db.Model):
    __tablename__ = 'finance_staff'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    staff_number = db.Column(db.String(50), unique=True, nullable=False)
    designation = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', back_populates='finance_staff')
    
    def __repr__(self):
        return f'<FinanceStaff {self.staff_number}>'