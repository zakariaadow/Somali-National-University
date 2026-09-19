# backend/services/upload_service.py
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
from PIL import Image
import hashlib

class UploadService:
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'}
    MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB
    
    @staticmethod
    def allowed_file(filename):
        """Check if file extension is allowed"""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in UploadService.ALLOWED_EXTENSIONS
    
    @staticmethod
    def get_file_size(filepath):
        """Get file size in bytes"""
        try:
            return os.path.getsize(filepath)
        except:
            return 0
    
    @staticmethod
    def get_file_type(filename):
        """Get file extension"""
        return filename.rsplit('.', 1)[1].lower() if '.' in filename else None
    
    @staticmethod
    def save_file(file, upload_dir, prefix='', max_size=None):
        """
        Save uploaded file to specified directory
        Returns: (filename, filepath, success, error)
        """
        if not file:
            return None, None, False, 'No file provided'
        
        if file.filename == '':
            return None, None, False, 'No file selected'
        
        if not UploadService.allowed_file(file.filename):
            return None, None, False, 'File type not allowed'
        
        # Check file size
        file.seek(0, 2)
        size = file.tell()
        file.seek(0)
        
        max_size = max_size or UploadService.MAX_FILE_SIZE
        if size > max_size:
            return None, None, False, f'File too large. Maximum size: {max_size // (1024*1024)}MB'
        
        try:
            # Create directory if it doesn't exist
            os.makedirs(upload_dir, exist_ok=True)
            
            # Generate unique filename
            original_filename = secure_filename(file.filename)
            ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
            timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
            unique_id = uuid.uuid4().hex[:8]
            
            if prefix:
                filename = f"{prefix}_{timestamp}_{unique_id}.{ext}"
            else:
                filename = f"{timestamp}_{unique_id}.{ext}"
            
            filepath = os.path.join(upload_dir, filename)
            file.save(filepath)
            
            return filename, filepath, True, None
        except Exception as e:
            return None, None, False, str(e)
    
    @staticmethod
    def save_student_photo(file, student_id):
        """Save student passport photo"""
        upload_dir = os.path.join('uploads', 'student_photos')
        filename, filepath, success, error = UploadService.save_file(
            file, upload_dir, prefix=f"student_{student_id}"
        )
        
        if success:
            # Compress and resize image
            try:
                img = Image.open(filepath)
                img.thumbnail((300, 300))
                img.save(filepath, optimize=True, quality=85)
            except:
                pass
        
        return filename, filepath, success, error
    
    @staticmethod
    def save_document(file, unit_id=None, uploaded_by=None):
        """Save document"""
        upload_dir = os.path.join('uploads', 'documents')
        prefix = f"doc_{uploaded_by or 'anon'}"
        if unit_id:
            prefix = f"unit_{unit_id}_{prefix}"
        
        return UploadService.save_file(file, upload_dir, prefix)
    
    @staticmethod
    def save_learning_material(file, unit_id):
        """Save learning material"""
        upload_dir = os.path.join('uploads', 'learning_materials')
        prefix = f"unit_{unit_id}"
        
        return UploadService.save_file(file, upload_dir, prefix)
    
    @staticmethod
    def save_fee_structure(file):
        """Save fee structure document"""
        upload_dir = os.path.join('uploads', 'fee_structures')
        prefix = f"fee_structure_{datetime.utcnow().strftime('%Y%m%d')}"
        
        return UploadService.save_file(file, upload_dir, prefix)
    
    @staticmethod
    def delete_file(filepath):
        """Delete a file"""
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                return True
            return False
        except:
            return False
    
    @staticmethod
    def get_file_info(filepath):
        """Get file information"""
        try:
            stat = os.stat(filepath)
            return {
                'size': stat.st_size,
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'created': datetime.fromtimestamp(stat.st_ctime).isoformat()
            }
        except:
            return None
    
    @staticmethod
    def generate_thumbnail(filepath, size=(150, 150)):
        """Generate thumbnail for image"""
        try:
            img = Image.open(filepath)
            img.thumbnail(size)
            thumb_path = filepath.rsplit('.', 1)[0] + '_thumb.' + filepath.rsplit('.', 1)[1]
            img.save(thumb_path, optimize=True, quality=75)
            return thumb_path
        except:
            return None