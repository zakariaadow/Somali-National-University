from extensions import db
from datetime import datetime

class Announcement(db.Model):
    __tablename__ = 'announcements'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    announcement_type = db.Column(db.String(50), nullable=False, default='general')
    priority = db.Column(db.String(20), default='normal')
    target_audience = db.Column(db.String(50), default='all')
    published_date = db.Column(db.DateTime, default=datetime.utcnow)
    expiry_date = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Announcement {self.title}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'announcement_type': self.announcement_type,
            'priority': self.priority,
            'target_audience': self.target_audience,
            'published_date': self.published_date.isoformat() if self.published_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'is_active': self.is_active,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
