from extensions import db
from datetime import datetime

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    document_name = db.Column(db.String(200), nullable=False)
    document_type = db.Column(db.String(50), nullable=False)  # pdf, doc, image, etc.
    file_path = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))  # academic, administrative, financial, etc.
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    is_public = db.Column(db.Boolean, default=False)
    download_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Document {self.document_name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'document_name': self.document_name,
            'document_type': self.document_type,
            'file_path': self.file_path,
            'description': self.description,
            'category': self.category,
            'uploaded_by': self.uploaded_by,
            'upload_date': self.upload_date.isoformat() if self.upload_date else None,
            'is_public': self.is_public,
            'download_count': self.download_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }