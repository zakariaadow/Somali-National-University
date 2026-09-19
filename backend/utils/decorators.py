from functools import wraps
from flask import jsonify, request
from flask_login import current_user
from models import ActivityLog
from extensions import db
from datetime import datetime

def role_required(*roles):
    """
    Decorator to check if user has required role(s)
    Usage: @role_required('Admin', 'Finance Officer')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return jsonify({'error': 'Authentication required'}), 401
            
            if not current_user.role:
                return jsonify({'error': 'User role not found'}), 403
            
            if current_user.role.name not in roles:
                return jsonify({
                    'error': f'Insufficient permissions. Required role: {", ".join(roles)}'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def permission_required(permission):
    """
    Decorator to check if user has specific permission
    Usage: @permission_required('manage_students')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Admin has all permissions
            if current_user.role.name == 'Admin':
                return f(*args, **kwargs)
            
            # TODO: Implement permission checking logic
            # user_permissions = get_user_permissions(current_user.id)
            # if permission not in user_permissions:
            #     return jsonify({'error': 'Insufficient permissions'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_activity(action, description=None):
    """
    Decorator to log user activity
    Usage: @log_activity('LOGIN', 'User logged in')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # Execute the function first
                response = f(*args, **kwargs)
                
                # Log the activity
                if current_user.is_authenticated:
                    log = ActivityLog(
                        user_id=current_user.id,
                        action=action,
                        description=description or f'{action} performed',
                        ip_address=request.remote_addr,
                        user_agent=request.headers.get('User-Agent')
                    )
                    db.session.add(log)
                    db.session.commit()
                
                return response
            except Exception as e:
                # Log error if needed
                raise e
        return decorated_function
    return decorator

def api_key_required(f):
    """
    Decorator to check API key for external API access
    Usage: @api_key_required
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return jsonify({'error': 'API key required'}), 401
        
        # TODO: Validate API key against database
        # if not validate_api_key(api_key):
        #     return jsonify({'error': 'Invalid API key'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

def rate_limit(max_requests=100, time_window=3600):
    """
    Decorator to rate limit API endpoints
    Usage: @rate_limit(max_requests=100, time_window=3600)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # TODO: Implement rate limiting using Redis or cache
            # key = f"rate_limit:{request.remote_addr}:{request.endpoint}"
            # count = get_rate_limit_count(key)
            # if count >= max_requests:
            #     return jsonify({'error': 'Rate limit exceeded'}), 429
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def cache_response(timeout=300):
    """
    Decorator to cache API responses
    Usage: @cache_response(timeout=300)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # TODO: Implement caching using Redis or cache
            # cache_key = f"cache:{request.path}:{request.args}"
            # cached_response = get_cache(cache_key)
            # if cached_response:
            #     return jsonify(cached_response)
            
            response = f(*args, **kwargs)
            
            # Store in cache
            # set_cache(cache_key, response.get_json(), timeout)
            
            return response
        return decorated_function
    return decorator

def validate_json(schema):
    """
    Decorator to validate JSON request body against a schema
    Usage: @validate_json({'email': str, 'password': str})
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.get_json()
            if not data:
                return jsonify({'error': 'JSON data required'}), 400
            
            # Validate required fields
            for field, field_type in schema.items():
                if field not in data:
                    return jsonify({'error': f'Missing required field: {field}'}), 400
                
                if not isinstance(data[field], field_type):
                    return jsonify({'error': f'Invalid type for field: {field}'}), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator