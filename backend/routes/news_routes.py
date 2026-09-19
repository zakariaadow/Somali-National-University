from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import News, ActivityLog
from extensions import db
from datetime import datetime
from utils.decorators import role_required

news_bp = Blueprint('news', __name__)

@news_bp.route('/', methods=['GET'])
@login_required
def get_news():
    """Get all news"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        category = request.args.get('category')
        is_active = request.args.get('is_active', type=bool)
        
        query = News.query
        if category:
            query = query.filter_by(category=category)
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        news = query.order_by(
            News.published_date.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'news': [n.to_dict() for n in news.items],
            'total': news.total,
            'page': news.page,
            'pages': news.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@news_bp.route('/', methods=['POST'])
@login_required
@role_required('Admin', 'Faculty Officer', 'College Officer')
def create_news():
    """Create new news"""
    try:
        data = request.get_json()
        
        news = News(
            title=data['title'],
            content=data['content'],
            summary=data.get('summary'),
            image_url=data.get('image_url'),
            category=data.get('category'),
            created_by=current_user.id
        )
        
        db.session.add(news)
        db.session.commit()
        
        # Log activity
        log = ActivityLog(
            user_id=current_user.id,
            action='CREATE_NEWS',
            description=f'Created news: {news.title}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'News created successfully',
            'news': news.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@news_bp.route('/<int:news_id>', methods=['GET'])
@login_required
def get_news_item(news_id):
    """Get news details"""
    try:
        news = News.query.get_or_404(news_id)
        # Increment views
        news.views += 1
        db.session.commit()
        return jsonify(news.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@news_bp.route('/<int:news_id>', methods=['PUT'])
@login_required
@role_required('Admin', 'Faculty Officer', 'College Officer')
def update_news(news_id):
    """Update news"""
    try:
        news = News.query.get_or_404(news_id)
        data = request.get_json()
        
        if 'title' in data:
            news.title = data['title']
        if 'content' in data:
            news.content = data['content']
        if 'summary' in data:
            news.summary = data['summary']
        if 'image_url' in data:
            news.image_url = data['image_url']
        if 'category' in data:
            news.category = data['category']
        if 'is_active' in data:
            news.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'News updated successfully',
            'news': news.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@news_bp.route('/<int:news_id>', methods=['DELETE'])
@login_required
@role_required('Admin')
def delete_news(news_id):
    """Delete news (soft delete)"""
    try:
        news = News.query.get_or_404(news_id)
        news.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'News deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500