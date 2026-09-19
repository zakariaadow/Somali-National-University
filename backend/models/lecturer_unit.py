from extensions import db
from datetime import datetime

# Association table for many-to-many relationship between lecturers and units
lecturer_units = db.Table('lecturer_units',
    db.Column('lecturer_id', db.Integer, db.ForeignKey('lecturers.id'), primary_key=True),
    db.Column('unit_id', db.Integer, db.ForeignKey('units.id'), primary_key=True),
    db.Column('assigned_date', db.DateTime, default=datetime.utcnow),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)
