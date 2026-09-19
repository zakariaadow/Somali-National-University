import re
from datetime import datetime

def validate_email(email):
    """
    Validate email format
    """
    if not email:
        return False, "Email is required"
    
    # Simple email validation
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False, "Invalid email format"
    
    return True, None

def validate_phone(phone):
    """
    Validate phone number format
    """
    if not phone:
        return True, None  # Phone is optional
    
    # Remove spaces and special characters
    phone_clean = re.sub(r'[\s\-\(\)]', '', phone)
    
    # Check if it's a valid phone number (simple validation)
    pattern = r'^[\d+]{7,15}$'
    if not re.match(pattern, phone_clean):
        return False, "Invalid phone number format"
    
    return True, None

def validate_registration_number(reg_number):
    """
    Validate student registration number format
    """
    if not reg_number:
        return False, "Registration number is required"
    
    # Format: SNU-YYYY-XXX-XXXX or similar
    pattern = r'^[A-Z]{3}-\d{4}-[A-Z0-9]{3}-[A-Z0-9]{4}$'
    if not re.match(pattern, reg_number):
        return False, "Invalid registration number format"
    
    return True, None

def validate_password(password, confirm_password=None):
    """
    Validate password strength
    """
    if not password:
        return False, "Password is required"
    
    # Check minimum length
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    
    # Check for uppercase
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    # Check for lowercase
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    # Check for number
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    # Check for special character
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    # Check if passwords match
    if confirm_password and password != confirm_password:
        return False, "Passwords do not match"
    
    return True, None

def validate_date(date_str, format='%Y-%m-%d'):
    """
    Validate date string format
    """
    if not date_str:
        return False, "Date is required"
    
    try:
        datetime.strptime(date_str, format)
        return True, None
    except ValueError:
        return False, f"Invalid date format. Expected: {format}"

def validate_amount(amount):
    """
    Validate amount is a positive number
    """
    if amount is None:
        return False, "Amount is required"
    
    try:
        amount = float(amount)
        if amount < 0:
            return False, "Amount must be positive"
        return True, None
    except (ValueError, TypeError):
        return False, "Invalid amount format"

def validate_grade(grade):
    """
    Validate grade value
    """
    valid_grades = ['A', 'B+', 'B', 'C+', 'C', 'D', 'F']
    if grade not in valid_grades:
        return False, f"Invalid grade. Must be one of: {', '.join(valid_grades)}"
    return True, None

def validate_year(year):
    """
    Validate year
    """
    try:
        year = int(year)
        current_year = datetime.now().year
        if year < 1900 or year > current_year + 10:
            return False, f"Year must be between 1900 and {current_year + 10}"
        return True, None
    except (ValueError, TypeError):
        return False, "Invalid year format"

def validate_credit_hours(credits):
    """
    Validate credit hours
    """
    try:
        credits = float(credits)
        if credits <= 0:
            return False, "Credit hours must be positive"
        return True, None
    except (ValueError, TypeError):
        return False, "Invalid credit hours format"

def validate_percentage(value):
    """
    Validate percentage value (0-100)
    """
    try:
        value = float(value)
        if value < 0 or value > 100:
            return False, "Percentage must be between 0 and 100"
        return True, None
    except (ValueError, TypeError):
        return False, "Invalid percentage format"

def validate_file_size(file, max_size_mb=5):
    """
    Validate file size
    """
    if not file:
        return False, "No file provided"
    
    try:
        file.seek(0, 2)  # Seek to end
        size = file.tell()  # Get size
        file.seek(0)  # Seek back to beginning
        
        max_size_bytes = max_size_mb * 1024 * 1024
        if size > max_size_bytes:
            return False, f"File size exceeds {max_size_mb}MB limit"
        return True, None
    except Exception as e:
        return False, str(e)

def validate_image_dimensions(image, max_width=2000, max_height=2000):
    """
    Validate image dimensions
    """
    try:
        from PIL import Image
        
        img = Image.open(image)
        width, height = img.size
        
        if width > max_width or height > max_height:
            return False, f"Image dimensions exceed maximum ({max_width}x{max_height})"
        
        return True, None
    except Exception as e:
        return False, str(e)

def validate_semester_dates(start_date, end_date, registration_start, registration_end):
    """
    Validate semester date ranges
    """
    # Check if dates are provided
    if not all([start_date, end_date, registration_start, registration_end]):
        return False, "All dates are required"
    
    # Convert to date objects if strings
    if isinstance(start_date, str):
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    if isinstance(end_date, str):
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    if isinstance(registration_start, str):
        registration_start = datetime.strptime(registration_start, '%Y-%m-%d').date()
    if isinstance(registration_end, str):
        registration_end = datetime.strptime(registration_end, '%Y-%m-%d').date()
    
    # Check date order
    if start_date >= end_date:
        return False, "Semester start date must be before end date"
    
    if registration_start >= registration_end:
        return False, "Registration start date must be before end date"
    
    if registration_start < start_date:
        return False, "Registration start date must be after or on semester start date"
    
    if registration_end > end_date:
        return False, "Registration end date must be before or on semester end date"
    
    return True, None