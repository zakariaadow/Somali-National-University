from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import OnlineClass, Unit, Lecturer, ActivityLog
from extensions import db
from datetime import datetime
from utils.decorators import role_required

online_class_bp = Blueprint('online_class', __name__)

@online_class_bp.route('/', methods=['GET'])
@login_required
def get_online_classes():
    """Get all online classes"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        unit_id = request.args.get('unit_id', type=int)
        status = request.args.get('status')
        
        query = OnlineClass.query
        if unit_id:
            query = query.filter_by(unit_id=unit_id)
        if status:
            query = query.filter_by(status=status)
        
        classes = query.order_by(
            OnlineClass.class_date.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'online_classes': [c.to_dict() for c in classes.items],
            'total': classes.total,
            'page': classes.page,
            'pages': classes.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@online_class_bp.route('/', methods=['POST'])
@login_required
@role_required('Lecturer')
def create_online_class():
    """Create a new online class"""
    try:
        data = request.get_json()
        lecturer = Lecturer.query.filter_by(user_id=current_user.id).first()
        
        if not lecturer:
            return jsonify({'error': 'Lecturer profile not found'}), 404
        
        # Check if lecturer teaches this unit
        unit = Unit.query.get(data['unit_id'])
        if not unit or unit.id not in [u.id for u in lecturer.units]:
            return jsonify({'error': 'You are not assigned to this unit'}), 403
        
        online_class = OnlineClass(
            title=data['title'],
            description=data.get('description'),
            unit_id=data['unit_id'],
            lecturer_id=lecturer.id,
            class_date=datetime.fromisoformat(data['class_date']),
            duration=data['duration'],
            meeting_link=data['meeting_link'],
            meeting_id=data.get('meeting_id'),
            meeting_password=data.get('meeting_password'),
            materials=data.get('materials'),
            status=data.get('status', 'scheduled')
        )
        
        db.session.add(online_class)
        db.session.commit()
        
        # Log activity
        log = ActivityLog(
            user_id=current_user.id,
            action='CREATE_ONLINE_CLASS',
            description=f'Created online class: {online_class.title}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Online class created successfully',
            'online_class': online_class.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@online_class_bp.route('/<int:class_id>', methods=['GET'])
@login_required
def get_online_class(class_id):
    """Get online class details"""
    try:
        online_class = OnlineClass.query.get_or_404(class_id)
        return jsonify(online_class.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@online_class_bp.route('/<int:class_id>', methods=['PUT'])
@login_required
@role_required('Lecturer')
def update_online_class(class_id):
    """Update online class"""
    try:
        online_class = OnlineClass.query.get_or_404(class_id)
        lecturer = Lecturer.query.filter_by(user_id=current_user.id).first()
        
        if online_class.lecturer_id != lecturer.id:
            return jsonify({'error': 'You can only update your own classes'}), 403
        
        data = request.get_json()
        
        if 'title' in data:
            online_class.title = data['title']
        if 'description' in data:
            online_class.description = data['description']
        if 'class_date' in data:
            online_class.class_date = datetime.fromisoformat(data['class_date'])
        if 'duration' in data:
            online_class.duration = data['duration']
        if 'meeting_link' in data:
            online_class.meeting_link = data['meeting_link']
        if 'meeting_id' in data:
            online_class.meeting_id = data['meeting_id']
        if 'meeting_password' in data:
            online_class.meeting_password = data['meeting_password']
        if 'recording_url' in data:
            online_class.recording_url = data['recording_url']
        if 'materials' in data:
            online_class.materials = data['materials']
        if 'status' in data:
            online_class.status = data['status']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Online class updated successfully',
            'online_class': online_class.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@online_class_bp.route('/<int:class_id>', methods=['DELETE'])
@login_required
@role_required('Lecturer', 'Admin')
def delete_online_class(class_id):
    """Delete online class"""
    try:
        online_class = OnlineClass.query.get_or_404(class_id)
        lecturer = Lecturer.query.filter_by(user_id=current_user.id).first()
        
        if online_class.lecturer_id != lecturer.id and current_user.role.name != 'Admin':
            return jsonify({'error': 'You can only delete your own classes'}), 403
        
        db.session.delete(online_class)
        db.session.commit()
        
        return jsonify({'message': 'Online class deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500