import os
from PIL import Image
import io
from datetime import datetime
import uuid

def resize_image(image_path, max_width=800, max_height=600, quality=85):
    """
    Resize image while maintaining aspect ratio
    """
    try:
        with Image.open(image_path) as img:
            # Get original dimensions
            original_width, original_height = img.size
            
            # Calculate new dimensions
            ratio = min(max_width / original_width, max_height / original_height)
            new_width = int(original_width * ratio)
            new_height = int(original_height * ratio)
            
            # Resize image
            img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Save resized image
            img_resized.save(image_path, quality=quality, optimize=True)
            return True
    except Exception as e:
        print(f"Error resizing image: {str(e)}")
        return False

def compress_image(image_path, quality=60, max_size_mb=1):
    """
    Compress image to reduce file size
    """
    try:
        with Image.open(image_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Save with lower quality
            img.save(image_path, quality=quality, optimize=True)
            
            # Check file size and compress more if needed
            file_size = os.path.getsize(image_path) / (1024 * 1024)  # Size in MB
            if file_size > max_size_mb and quality > 30:
                # Recursively compress more
                quality = max(30, quality - 10)
                compress_image(image_path, quality, max_size_mb)
            
            return True
    except Exception as e:
        print(f"Error compressing image: {str(e)}")
        return False

def generate_thumbnail(image_path, size=(150, 150), quality=80):
    """
    Generate a thumbnail from an image
    """
    try:
        with Image.open(image_path) as img:
            # Create thumbnail
            img.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Generate thumbnail filename
            base_dir = os.path.dirname(image_path)
            filename = os.path.basename(image_path)
            name, ext = os.path.splitext(filename)
            thumbnail_name = f"{name}_thumbnail{ext}"
            thumbnail_path = os.path.join(base_dir, thumbnail_name)
            
            # Save thumbnail
            img.save(thumbnail_path, quality=quality, optimize=True)
            return thumbnail_path
    except Exception as e:
        print(f"Error generating thumbnail: {str(e)}")
        return None

def get_image_dimensions(image_path):
    """
    Get image dimensions
    """
    try:
        with Image.open(image_path) as img:
            return img.size
    except Exception as e:
        print(f"Error getting image dimensions: {str(e)}")
        return None

def validate_image(image_path, max_width=2000, max_height=2000, max_size_mb=5):
    """
    Validate image dimensions and size
    """
    try:
        # Check file size
        file_size = os.path.getsize(image_path) / (1024 * 1024)
        if file_size > max_size_mb:
            return False, f"Image size exceeds {max_size_mb}MB limit"
        
        # Check dimensions
        dimensions = get_image_dimensions(image_path)
        if dimensions:
            width, height = dimensions
            if width > max_width or height > max_height:
                return False, f"Image dimensions exceed maximum ({max_width}x{max_height})"
        
        return True, None
    except Exception as e:
        return False, str(e)

def convert_image_format(image_path, format='JPEG'):
    """
    Convert image to different format
    """
    try:
        with Image.open(image_path) as img:
            # Generate new filename
            base_dir = os.path.dirname(image_path)
            filename = os.path.basename(image_path)
            name, _ = os.path.splitext(filename)
            new_filename = f"{name}.{format.lower()}"
            new_path = os.path.join(base_dir, new_filename)
            
            # Convert and save
            img.save(new_path, format=format, quality=85, optimize=True)
            return new_path
    except Exception as e:
        print(f"Error converting image format: {str(e)}")
        return None

def crop_image(image_path, crop_box):
    """
    Crop image to specified box
    crop_box: (left, top, right, bottom)
    """
    try:
        with Image.open(image_path) as img:
            img_cropped = img.crop(crop_box)
            
            # Generate new filename
            base_dir = os.path.dirname(image_path)
            filename = os.path.basename(image_path)
            name, ext = os.path.splitext(filename)
            new_filename = f"{name}_cropped{ext}"
            new_path = os.path.join(base_dir, new_filename)
            
            # Save cropped image
            img_cropped.save(new_path, quality=85, optimize=True)
            return new_path
    except Exception as e:
        print(f"Error cropping image: {str(e)}")
        return None

def optimize_image_for_web(image_path):
    """
    Optimize image for web usage
    """
    try:
        # Resize if too large
        dimensions = get_image_dimensions(image_path)
        if dimensions:
            width, height = dimensions
            if width > 1200 or height > 1200:
                resize_image(image_path, 1200, 1200, 85)
        
        # Compress
        compress_image(image_path, 75, 1)
        
        return True
    except Exception as e:
        print(f"Error optimizing image: {str(e)}")
        return False

def create_watermark(image_path, watermark_text):
    """
    Add watermark to image
    """
    try:
        from PIL import ImageDraw, ImageFont
        
        with Image.open(image_path) as img:
            # Create a drawing context
            draw = ImageDraw.Draw(img)
            
            # Get image dimensions
            width, height = img.size
            
            # Set font size
            font_size = min(width, height) // 20
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
            
            # Calculate text position (bottom right corner with padding)
            text_bbox = draw.textbbox((0, 0), watermark_text, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]
            x = width - text_width - 20
            y = height - text_height - 20
            
            # Draw watermark
            draw.text((x, y), watermark_text, fill=(255, 255, 255, 128), font=font)
            
            # Save image
            img.save(image_path, quality=85, optimize=True)
            return True
    except Exception as e:
        print(f"Error adding watermark: {str(e)}")
        return False