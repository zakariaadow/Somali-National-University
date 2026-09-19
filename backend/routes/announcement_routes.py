from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import Announcement, ActivityLog
from extensions import db
from datetime import datetime
from utils.decorators import role_required

announcement_bp = Blueprint('announcement', __name__)

@announcement_bp.route('/', methods=['GET'])
@login_required
def get_announcements():
    """Get all announcements"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        announcement_type = request.args.get('announcement_type')
        is_active = request.args.get('is_active', type=bool)
        
        query = Announcement.query.filter(
            Announcement.expiry_date.is_(None) | 
            (Announcement.expiry_date >= datetime.now().date())
        )
        
        if announcement_type:
            query = query.filter_by(announcement_type=announcement_type)
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        announcements = query.order_by(
            Announcement.priority.desc(),
            Announcement.published_date.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'announcements': [a.to_dict() for a in announcements.items],
            'total': announcements.total,
            'page': announcements.page,
            'pages': announcements.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@announcement_bp.route('/', methods=['POST'])
@login_required
@role_required('Admin', 'Faculty Officer', 'College Officer')
def create_announcement():
    """Create a new announcement"""
    try:
        data = request.get_json()
        
        announcement = Announcement(
            title=data['title'],
            content=data['content'],
            announcement_type=data['announcement_type'],
            priority=data.get('priority', 'normal'),
            target_audience=data.get('target_audience', 'all'),
            expiry_date=datetime.strptime(data['expiry_date'], '%Y-%m-%d').date() if data.get('expiry_date') else None,
            created_by=current_user.id
        )
        
        db.session.add(announcement)
        db.session.commit()
        
        # Log activity
        log = ActivityLog(
            user_id=current_user.id,
            action='CREATE_ANNOUNCEMENT',
            description=f'Created announcement: {announcement.title}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Announcement created successfully',
            'announcement': announcement.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@announcement_bp.route('/<int:announcement_id>', methods=['GET'])
@login_required
def get_announcement(announcement_id):
    """Get announcement details"""
    try:
        announcement = Announcement.query.get_or_404(announcement_id)
        return jsonify(announcement.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@announcement_bp.route('/<int:announcement_id>', methods=['PUT'])
@login_required
@role_required('Admin', 'Faculty Officer', 'College Officer')
def update_announcement(announcement_id):
    """Update announcement"""
    try:
        announcement = Announcement.query.get_or_404(announcement_id)
        data = request.get_json()
        
        if 'title' in data:
            announcement.title = data['title']
        if 'content' in data:
            announcement.content = data['content']
        if 'announcement_type' in data:
            announcement.announcement_type = data['announcement_type']
        if 'priority' in data:
            announcement.priority = data['priority']
        if 'target_audience' in data:
            announcement.target_audience = data['target_audience']
        if 'expiry_date' in data:
            announcement.expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
        if 'is_active' in data:
            announcement.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Announcement updated successfully',
            'announcement': announcement.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@announcement_bp.route('/<int:announcement_id>', methods=['DELETE'])
@login_required
@role_required('Admin')
def delete_announcement(announcement_id):
    """Delete announcement (soft delete)"""
    try:
        announcement = Announcement.query.get_or_404(announcement_id)
        announcement.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Announcement deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500