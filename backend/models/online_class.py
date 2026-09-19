from extensions import db
from datetime import datetime

class OnlineClass(db.Model):
    __tablename__ = 'online_classes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    lecturer_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=False)
    class_date = db.Column(db.DateTime, nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # Duration in minutes
    meeting_link = db.Column(db.String(255), nullable=False)
    meeting_id = db.Column(db.String(100))
    meeting_password = db.Column(db.String(100))
    recording_url = db.Column(db.String(255))
    materials = db.Column(db.Text)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, ongoing, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<OnlineClass {self.title}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'unit_id': self.unit_id,
            'unit_code': self.unit.unit_code if self.unit else None,
            'unit_name': self.unit.unit_name if self.unit else None,
            'lecturer_id': self.lecturer_id,
            'lecturer_name': self.lecturer.user.get_full_name() if self.lecturer and self.lecturer.user else None,
            'class_date': self.class_date.isoformat() if self.class_date else None,
            'duration': self.duration,
            'meeting_link': self.meeting_link,
            'meeting_id': self.meeting_id,
            'meeting_password': self.meeting_password,
            'recording_url': self.recording_url,
            'materials': self.materials,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }