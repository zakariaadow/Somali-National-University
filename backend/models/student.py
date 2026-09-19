from extensions import db
from datetime import datetime

class Student(db.Model):
    __tablename__ = 'students'
    
    id = db.Column(db.Integer, primary_key=True)
    registration_number = db.Column(db.String(20), unique=True, nullable=False)
    admission_date = db.Column(db.Date, nullable=False)
    year_of_study = db.Column(db.Integer, nullable=False, default=1)
    is_graduated = db.Column(db.Boolean, default=False)
    graduation_date = db.Column(db.Date)
    programme_id = db.Column(db.Integer, db.ForeignKey('programmes.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using back_populates
    programme = db.relationship('Programme', back_populates='students')
    user = db.relationship('User', back_populates='student')
    registrations = db.relationship('Registration', back_populates='student', lazy=True, cascade='all, delete-orphan')
    student_units = db.relationship('StudentUnit', back_populates='student', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('Payment', back_populates='student', lazy=True)
    results = db.relationship('Result', back_populates='student', lazy=True)
    exam_cards = db.relationship('ExamCard', back_populates='student', lazy=True)
    student_card = db.relationship('StudentCard', back_populates='student', uselist=False, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Student {self.registration_number}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'registration_number': self.registration_number,
            'admission_date': self.admission_date.isoformat() if self.admission_date else None,
            'year_of_study': self.year_of_study,
            'is_graduated': self.is_graduated,
            'graduation_date': self.graduation_date.isoformat() if self.graduation_date else None,
            'programme_id': self.programme_id,
            'programme_name': self.programme.name if self.programme else None,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
