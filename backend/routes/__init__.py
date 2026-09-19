from flask import Blueprint

# Import all route blueprints
from .auth_routes import auth_bp
from .admin_routes import admin_bp
from .student_routes import student_bp
from .lecturer_routes import lecturer_bp
from .finance_routes import finance_bp
from .faculty_officer_routes import faculty_officer_bp
from .college_officer_routes import college_officer_bp
from .college_routes import college_bp
from .faculty_routes import faculty_bp
from .department_routes import department_bp
from .programme_routes import programme_bp
from .unit_routes import unit_bp
from .semester_routes import semester_bp
from .academic_year_routes import academic_year_bp
from .registration_routes import registration_bp
from .payment_routes import payment_bp
from .receipt_routes import receipt_bp
from .exam_card_routes import exam_card_bp
from .student_card_routes import student_card_bp
from .result_routes import result_bp
from .assessment_routes import assessment_bp
from .attendance_routes import attendance_bp
from .fee_structure_routes import fee_structure_bp
from .announcement_routes import announcement_bp
from .news_routes import news_bp
from .online_class_routes import online_class_bp
from .report_routes import report_bp
from .upload_routes import upload_bp

def register_blueprints(app):
    """Register all blueprints with the Flask app"""
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(student_bp, url_prefix='/api/student')
    app.register_blueprint(lecturer_bp, url_prefix='/api/lecturer')
    app.register_blueprint(finance_bp, url_prefix='/api/finance')
    app.register_blueprint(faculty_officer_bp, url_prefix='/api/faculty-officer')
    app.register_blueprint(college_officer_bp, url_prefix='/api/college-officer')
    app.register_blueprint(college_bp, url_prefix='/api/colleges')
    app.register_blueprint(faculty_bp, url_prefix='/api/faculties')
    app.register_blueprint(department_bp, url_prefix='/api/departments')
    app.register_blueprint(programme_bp, url_prefix='/api/programmes')
    app.register_blueprint(unit_bp, url_prefix='/api/units')
    app.register_blueprint(semester_bp, url_prefix='/api/semesters')
    app.register_blueprint(academic_year_bp, url_prefix='/api/academic-years')
    app.register_blueprint(registration_bp, url_prefix='/api/registrations')
    app.register_blueprint(payment_bp, url_prefix='/api/payments')
    app.register_blueprint(receipt_bp, url_prefix='/api/receipts')
    app.register_blueprint(exam_card_bp, url_prefix='/api/exam-cards')
    app.register_blueprint(student_card_bp, url_prefix='/api/student-cards')
    app.register_blueprint(result_bp, url_prefix='/api/results')
    app.register_blueprint(assessment_bp, url_prefix='/api/assessments')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(fee_structure_bp, url_prefix='/api/fee-structures')
    app.register_blueprint(announcement_bp, url_prefix='/api/announcements')
    app.register_blueprint(news_bp, url_prefix='/api/news')
    app.register_blueprint(online_class_bp, url_prefix='/api/online-classes')
    app.register_blueprint(report_bp, url_prefix='/api/reports')
    app.register_blueprint(upload_bp, url_prefix='/api/uploads')
