from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
import os
from werkzeug.utils import secure_filename
from datetime import datetime
from utils.file_upload import allowed_file, save_file, create_upload_folder

upload_bp = Blueprint('upload', __name__)

# Configure upload folders
UPLOAD_FOLDER = 'uploads'
PHOTO_FOLDER = os.path.join(UPLOAD_FOLDER, 'student_photos')
DOCUMENT_FOLDER = os.path.join(UPLOAD_FOLDER, 'documents')
EXAM_CARD_FOLDER = os.path.join(UPLOAD_FOLDER, 'exam_cards')
STUDENT_CARD_FOLDER = os.path.join(UPLOAD_FOLDER, 'student_cards')

# Ensure folders exist
for folder in [PHOTO_FOLDER, DOCUMENT_FOLDER, EXAM_CARD_FOLDER, STUDENT_CARD_FOLDER]:
    create_upload_folder(folder)

@upload_bp.route('/photo', methods=['POST'])
@login_required
def upload_photo():
    """Upload student photo"""
    try:
        if 'photo' not in request.files:
            return jsonify({'error': 'No photo file provided'}), 400
        
        file = request.files['photo']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename, ['png', 'jpg', 'jpeg', 'gif', 'webp']):
            return jsonify({'error': 'File type not allowed. Please upload an image file.'}), 400
        
        # Check file size (5MB max)
        file.seek(0, 2)  # Seek to end
        size = file.tell()  # Get size
        file.seek(0)  # Seek back to beginning
        
        if size > 5 * 1024 * 1024:  # 5MB
            return jsonify({'error': 'File too large. Maximum size is 5MB.'}), 400
        
        # Create student-specific folder
        student_id = request.form.get('student_id') or str(current_user.id)
        student_folder = os.path.join(PHOTO_FOLDER, str(student_id))
        create_upload_folder(student_folder)
        
        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        filename = f"profile_{timestamp}_{secure_filename(file.filename)}"
        file_path = os.path.join(student_folder, filename)
        file.save(file_path)
        
        # Save relative path to database
        relative_path = os.path.join('uploads', 'student_photos', str(student_id), filename)
        
        return jsonify({
            'message': 'Photo uploaded successfully',
            'file_path': relative_path,
            'filename': filename
        }), 200
        
    except Exception as e:
        print(f"Error uploading photo: {str(e)}")
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/document', methods=['POST'])
@login_required
def upload_document():
    """Upload a document"""
    try:
        if 'document' not in request.files:
            return jsonify({'error': 'No document file provided'}), 400
        
        file = request.files['document']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        category = request.form.get('category', 'general')
        document_type = request.form.get('document_type', 'pdf')
        
        # Create category folder
        category_folder = os.path.join(DOCUMENT_FOLDER, category)
        create_upload_folder(category_folder)
        
        # Save file
        filename = f"{category}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{secure_filename(file.filename)}"
        file_path = os.path.join(category_folder, filename)
        file.save(file_path)
        
        relative_path = os.path.join('uploads', 'documents', category, filename)
        
        return jsonify({
            'message': 'Document uploaded successfully',
            'file_path': relative_path,
            'filename': filename
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/exam-card', methods=['POST'])
@login_required
def upload_exam_card():
    """Upload exam card (for admin/generation)"""
    try:
        if 'exam_card' not in request.files:
            return jsonify({'error': 'No exam card file provided'}), 400
        
        file = request.files['exam_card']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        student_id = request.form.get('student_id')
        semester_id = request.form.get('semester_id')
        
        if not student_id or not semester_id:
            return jsonify({'error': 'Student ID and Semester ID required'}), 400
        
        # Create student-semester folder
        card_folder = os.path.join(EXAM_CARD_FOLDER, f"student_{student_id}", f"semester_{semester_id}")
        create_upload_folder(card_folder)
        
        # Save file
        filename = f"exam_card_{student_id}_{semester_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
        file_path = os.path.join(card_folder, filename)
        file.save(file_path)
        
        relative_path = os.path.join('uploads', 'exam_cards', f"student_{student_id}", f"semester_{semester_id}", filename)
        
        return jsonify({
            'message': 'Exam card uploaded successfully',
            'file_path': relative_path,
            'filename': filename
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/student-card', methods=['POST'])
@login_required
def upload_student_card():
    """Upload student card (for generation)"""
    try:
        if 'student_card' not in request.files:
            return jsonify({'error': 'No student card file provided'}), 400
        
        file = request.files['student_card']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        student_id = request.form.get('student_id')
        
        if not student_id:
            return jsonify({'error': 'Student ID required'}), 400
        
        # Create student folder
        card_folder = os.path.join(STUDENT_CARD_FOLDER, f"student_{student_id}")
        create_upload_folder(card_folder)
        
        # Save file
        filename = f"student_card_{student_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
        file_path = os.path.join(card_folder, filename)
        file.save(file_path)
        
        relative_path = os.path.join('uploads', 'student_cards', f"student_{student_id}", filename)
        
        return jsonify({
            'message': 'Student card uploaded successfully',
            'file_path': relative_path,
            'filename': filename
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
