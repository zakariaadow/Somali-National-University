from extensions import db
from datetime import datetime

class Attendance(db.Model):
    __tablename__ = 'attendances'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    lecture_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False)  # present, absent, excused
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('student_id', 'unit_id', 'lecture_date', name='unique_attendance'),)
    
    def __repr__(self):
        return f'<Attendance {self.student_id} - {self.unit_id} - {self.lecture_date}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': self.student.user.get_full_name() if self.student and self.student.user else None,
            'unit_id': self.unit_id,
            'unit_code': self.unit.unit_code if self.unit else None,
            'unit_name': self.unit.unit_name if self.unit else None,
            'lecture_date': self.lecture_date.isoformat() if self.lecture_date else None,
            'status': self.status,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }