import re
import uuid
from datetime import datetime, timedelta
from flask import current_app

def generate_registration_number(programme_code=None):
    """
    Generate a unique student registration number
    Format: SNU-YYYY-{programme}-{sequence}
    """
    year = datetime.now().year
    sequence = f"{uuid.uuid4().hex[:4].upper()}"
    
    if programme_code:
        return f"SNU-{year}-{programme_code}-{sequence}"
    else:
        return f"SNU-{year}-{sequence}"

def generate_reference_number(prefix='REF'):
    """
    Generate a unique reference number
    """
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    unique_id = uuid.uuid4().hex[:6].upper()
    return f"{prefix}-{timestamp}-{unique_id}"

def calculate_gpa(results):
    """
    Calculate GPA from results
    """
    if not results:
        return 0.0
    
    total_grade_points = 0
    total_credits = 0
    
    for result in results:
        if result.grade_point and result.student_unit and result.student_unit.unit:
            total_grade_points += result.grade_point * result.student_unit.unit.credits
            total_credits += result.student_unit.unit.credits
    
    if total_credits == 0:
        return 0.0
    
    return round(total_grade_points / total_credits, 2)

def calculate_grade(score, max_score=100):
    """
    Calculate grade and grade point based on score
    """
    percentage = (score / max_score) * 100 if max_score > 0 else 0
    
    if percentage >= 80:
        return {'grade': 'A', 'grade_point': 4.0, 'percentage': percentage}
    elif percentage >= 75:
        return {'grade': 'B+', 'grade_point': 3.5, 'percentage': percentage}
    elif percentage >= 70:
        return {'grade': 'B', 'grade_point': 3.0, 'percentage': percentage}
    elif percentage >= 65:
        return {'grade': 'C+', 'grade_point': 2.5, 'percentage': percentage}
    elif percentage >= 60:
        return {'grade': 'C', 'grade_point': 2.0, 'percentage': percentage}
    elif percentage >= 50:
        return {'grade': 'D', 'grade_point': 1.0, 'percentage': percentage}
    else:
        return {'grade': 'F', 'grade_point': 0.0, 'percentage': percentage}

def validate_date_range(start_date, end_date):
    """
    Validate that start_date is before end_date
    """
    try:
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date)
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date)
        
        if start_date > end_date:
            return False, "Start date must be before end date"
        
        return True, None
    except Exception as e:
        return False, str(e)

def sanitize_input(value):
    """
    Sanitize input to prevent XSS attacks
    """
    if value is None:
        return None
    
    if isinstance(value, str):
        # Remove HTML tags
        value = re.sub(r'<[^>]+>', '', value)
        # Escape special characters
        value = re.sub(r'[<>]', '', value)
        # Remove extra whitespace
        value = ' '.join(value.split())
        return value
    
    return value

def format_currency(amount, currency='SOS'):
    """
    Format currency with proper thousands separator
    """
    try:
        formatted = f"{amount:,.2f}"
        return f"{formatted} {currency}"
    except:
        return f"0.00 {currency}"

def get_date_range(date_type='current_semester'):
    """
    Get date range for reports
    """
    today = datetime.now().date()
    
    if date_type == 'today':
        return today, today
    elif date_type == 'this_week':
        start = today - timedelta(days=today.weekday())
        return start, today
    elif date_type == 'this_month':
        start = today.replace(day=1)
        return start, today
    elif date_type == 'this_year':
        start = today.replace(month=1, day=1)
        return start, today
    elif date_type == 'last_30_days':
        start = today - timedelta(days=30)
        return start, today
    elif date_type == 'last_90_days':
        start = today - timedelta(days=90)
        return start, today
    elif date_type == 'current_semester':
        # Get current semester from database
        from models import Semester
        semester = Semester.query.filter_by(is_current=True).first()
        if semester:
            return semester.start_date, semester.end_date
    elif date_type == 'current_academic_year':
        # Get current academic year from database
        from models import AcademicYear
        academic_year = AcademicYear.query.filter_by(is_current=True).first()
        if academic_year:
            return academic_year.start_date, academic_year.end_date
    
    # Default to last 30 days
    return today - timedelta(days=30), today

def get_pageination_params(request):
    """
    Get pagination parameters from request
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Validate per_page
    if per_page < 1:
        per_page = 1
    elif per_page > 100:
        per_page = 100
    
    return page, per_page

def get_sort_params(request, default_sort='created_at', default_order='desc'):
    """
    Get sorting parameters from request
    """
    sort_by = request.args.get('sort_by', default_sort)
    sort_order = request.args.get('sort_order', default_order)
    
    # Validate sort_order
    if sort_order not in ['asc', 'desc']:
        sort_order = default_order
    
    return sort_by, sort_order

def get_filter_params(request, allowed_filters):
    """
    Get filter parameters from request based on allowed filters
    """
    filters = {}
    
    for key in allowed_filters:
        value = request.args.get(key)
        if value is not None and value != '':
            filters[key] = value
    
    return filters

def generate_exam_card_number(student_id, semester_id):
    """
    Generate exam card number
    """
    timestamp = datetime.now().strftime('%Y%m%d')
    return f"EXC-{timestamp}-{student_id}-{semester_id}"

def generate_student_card_number(registration_number):
    """
    Generate student card number
    """
    timestamp = datetime.now().strftime('%Y%m%d')
    return f"SC-{timestamp}-{registration_number}"

def format_phone_number(phone):
    """
    Format phone number to standard format
    """
    if not phone:
        return None
    
    # Remove any non-digit characters
    digits = re.sub(r'\D', '', phone)
    
    # Check if it's a Somali number
    if len(digits) == 9 and digits.startswith(('6', '7', '9')):
        return f"+252{digits}"
    elif len(digits) == 12 and digits.startswith('252'):
        return f"+{digits}"
    elif len(digits) == 13 and digits.startswith('252'):
        return f"+{digits}"
    
    return phone

def truncate_text(text, max_length=100, suffix='...'):
    """
    Truncate text to specified length
    """
    if not text:
        return text
    
    if len(text) <= max_length:
        return text
    
    return text[:max_length] + suffix

def get_current_semester_id():
    """
    Get current semester ID from database
    """
    from models import Semester
    semester = Semester.query.filter_by(is_current=True).first()
    return semester.id if semester else None

def get_current_academic_year_id():
    """
    Get current academic year ID from database
    """
    from models import AcademicYear
    academic_year = AcademicYear.query.filter_by(is_current=True).first()
    return academic_year.id if academic_year else None

def get_student_full_name(student):
    """
    Get student's full name
    """
    if student and student.user:
        return student.user.get_full_name()
    return None

def get_student_programme_name(student):
    """
    Get student's programme name
    """
    if student and student.programme:
        return student.programme.name
    return None