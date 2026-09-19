import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import current_app

ALLOWED_EXTENSIONS = {
    'photo': {'png', 'jpg', 'jpeg', 'gif', 'webp'},
    'document': {'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'},
    'image': {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'},
    'video': {'mp4', 'avi', 'mov', 'wmv', 'flv'},
    'audio': {'mp3', 'wav', 'ogg', 'm4a'},
    'archive': {'zip', 'rar', '7z', 'tar', 'gz'}
}

MAX_FILE_SIZE = {
    'photo': 5 * 1024 * 1024,  # 5MB
    'document': 10 * 1024 * 1024,  # 10MB
    'image': 5 * 1024 * 1024,  # 5MB
    'video': 100 * 1024 * 1024,  # 100MB
    'audio': 50 * 1024 * 1024,  # 50MB
    'archive': 50 * 1024 * 1024  # 50MB
}

def allowed_file(filename, allowed_types=None):
    """
    Check if file extension is allowed
    """
    if not filename or '.' not in filename:
        return False
    
    ext = filename.rsplit('.', 1)[1].lower()
    
    if allowed_types:
        # Check specific allowed types
        if ext in allowed_types:
            return True
    else:
        # Check all allowed extensions
        for extensions in ALLOWED_EXTENSIONS.values():
            if ext in extensions:
                return True
    
    return False

def get_file_category(filename):
    """
    Determine file category based on extension
    """
    if not filename or '.' not in filename:
        return None
    
    ext = filename.rsplit('.', 1)[1].lower()
    
    for category, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return category
    
    return None

def save_file(file, folder, filename=None, allowed_types=None, max_size=None):
    """
    Save file to specified folder with validation
    """
    try:
        # Validate file
        if not file:
            return None, {'error': 'No file provided'}
        
        if file.filename == '':
            return None, {'error': 'No file selected'}
        
        # Check file type
        if allowed_types and not allowed_file(file.filename, allowed_types):
            return None, {'error': f'File type not allowed. Allowed: {", ".join(allowed_types)}'}
        
        # Check file size
        if max_size and len(file.read()) > max_size:
            file.seek(0)
            return None, {'error': f'File too large. Maximum size: {max_size // (1024*1024)}MB'}
        file.seek(0)
        
        # Create folder if it doesn't exist
        if not os.path.exists(folder):
            os.makedirs(folder)
        
        # Generate filename
        if not filename:
            original_filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            unique_id = uuid.uuid4().hex[:8]
            ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
            filename = f"{timestamp}_{unique_id}.{ext}" if ext else f"{timestamp}_{unique_id}"
        
        # Ensure filename is secure
        filename = secure_filename(filename)
        
        # Save file
        file_path = os.path.join(folder, filename)
        file.save(file_path)
        
        return file_path, {'filename': filename, 'path': file_path}
        
    except Exception as e:
        return None, {'error': str(e)}

def create_upload_folder(folder):
    """
    Create upload folder if it doesn't exist
    """
    try:
        if not os.path.exists(folder):
            os.makedirs(folder)
            return True
        return True
    except Exception as e:
        print(f"Error creating folder: {str(e)}")
        return False

def generate_unique_filename(original_filename, prefix=''):
    """
    Generate a unique filename
    """
    ext = None
    if '.' in original_filename:
        ext = original_filename.rsplit('.', 1)[1].lower()
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_id = uuid.uuid4().hex[:8]
    
    if prefix:
        filename = f"{prefix}_{timestamp}_{unique_id}"
    else:
        filename = f"{timestamp}_{unique_id}"
    
    if ext:
        filename = f"{filename}.{ext}"
    
    return filename

def delete_file(file_path):
    """
    Delete file from filesystem
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        print(f"Error deleting file: {str(e)}")
        return False

def get_file_size(file_path):
    """
    Get file size in bytes
    """
    try:
        if os.path.exists(file_path):
            return os.path.getsize(file_path)
        return 0
    except Exception as e:
        print(f"Error getting file size: {str(e)}")
        return 0

def get_file_info(file_path):
    """
    Get file information
    """
    try:
        if not os.path.exists(file_path):
            return None
        
        stat = os.stat(file_path)
        return {
            'filename': os.path.basename(file_path),
            'size': stat.st_size,
            'created': datetime.fromtimestamp(stat.st_ctime),
            'modified': datetime.fromtimestamp(stat.st_mtime),
            'extension': file_path.rsplit('.', 1)[1].lower() if '.' in file_path else None
        }
    except Exception as e:
        print(f"Error getting file info: {str(e)}")
        return None

def move_file(source_path, destination_path):
    """
    Move file from source to destination
    """
    try:
        if not os.path.exists(source_path):
            return False
        
        # Create destination directory if it doesn't exist
        dest_dir = os.path.dirname(destination_path)
        if not os.path.exists(dest_dir):
            os.makedirs(dest_dir)
        
        os.rename(source_path, destination_path)
        return True
    except Exception as e:
        print(f"Error moving file: {str(e)}")
        return False

def copy_file(source_path, destination_path):
    """
    Copy file from source to destination
    """
    try:
        import shutil
        
        if not os.path.exists(source_path):
            return False
        
        # Create destination directory if it doesn't exist
        dest_dir = os.path.dirname(destination_path)
        if not os.path.exists(dest_dir):
            os.makedirs(dest_dir)
        
        shutil.copy2(source_path, destination_path)
        return True
    except Exception as e:
        print(f"Error copying file: {str(e)}")
        return False