from flask import current_app, render_template_string
from flask_mail import Message
from extensions import mail
import threading
import os
from datetime import datetime

def send_async_email(app, msg):
    """Send email asynchronously"""
    with app.app_context():
        try:
            mail.send(msg)
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            # Log error to file
            with open('logs/email_errors.log', 'a') as f:
                f.write(f"{datetime.now()} - {str(e)}\n")

def send_email(subject, recipients, body, html_body=None, sender=None):
    """
    Send email to recipients
    """
    try:
        if not sender:
            sender = current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@snu.edu.so')
        
        msg = Message(
            subject=subject,
            recipients=recipients if isinstance(recipients, list) else [recipients],
            sender=sender,
            body=body
        )
        
        if html_body:
            msg.html = html_body
        
        # Send email asynchronously
        app = current_app._get_current_object()
        thread = threading.Thread(target=send_async_email, args=(app, msg))
        thread.start()
        
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

def send_verification_email(user, verification_token):
    """Send account verification email"""
    try:
        subject = "Verify Your Account - Somali National University"
        
        verification_link = f"{current_app.config.get('BASE_URL')}/api/auth/verify-email/{verification_token}"
        
        body = f"""
        Dear {user.first_name} {user.last_name},
        
        Welcome to Somali National University!
        
        Please click the link below to verify your email address:
        {verification_link}
        
        If you didn't create an account with SNU, please ignore this email.
        
        Best regards,
        Somali National University
        """
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h1 style="color: #003366; text-align: center;">Welcome to SNU!</h1>
                <p style="color: #333333; font-size: 16px;">Dear {user.first_name} {user.last_name},</p>
                <p style="color: #333333; font-size: 16px;">Thank you for registering with Somali National University. Please verify your email address to activate your account.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_link}" style="background-color: #003366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        Verify Email Address
                    </a>
                </div>
                <p style="color: #666666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="color: #666666; font-size: 14px; word-break: break-all;">{verification_link}</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999999; font-size: 12px; text-align: center;">
                    If you didn't create an account with SNU, please ignore this email.
                    <br>
                    &copy; 2024 Somali National University. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        """
        
        return send_email(subject, user.email, body, html_body)
    except Exception as e:
        print(f"Error sending verification email: {str(e)}")
        return False

def send_password_reset_email(user, reset_token):
    """Send password reset email"""
    try:
        subject = "Reset Your Password - Somali National University"
        
        reset_link = f"{current_app.config.get('BASE_URL')}/reset-password/{reset_token}"
        
        body = f"""
        Dear {user.first_name} {user.last_name},
        
        We received a request to reset your password for your SNU account.
        
        Click the link below to reset your password:
        {reset_link}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, please ignore this email.
        
        Best regards,
        Somali National University
        """
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h1 style="color: #003366; text-align: center;">Reset Your Password</h1>
                <p style="color: #333333; font-size: 16px;">Dear {user.first_name} {user.last_name},</p>
                <p style="color: #333333; font-size: 16px;">We received a request to reset your password for your SNU account.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #003366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #666666; font-size: 14px;">This link will expire in 1 hour.</p>
                <p style="color: #666666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="color: #666666; font-size: 14px; word-break: break-all;">{reset_link}</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999999; font-size: 12px; text-align: center;">
                    If you didn't request a password reset, please ignore this email.
                    <br>
                    &copy; 2024 Somali National University. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        """
        
        return send_email(subject, user.email, body, html_body)
    except Exception as e:
        print(f"Error sending password reset email: {str(e)}")
        return False

def send_payment_confirmation_email(student, payment, receipt):
    """Send payment confirmation email"""
    try:
        subject = f"Payment Confirmation - SNU - {payment.payment_reference}"
        
        body = f"""
        Dear {student.user.first_name} {student.user.last_name},
        
        Your payment has been confirmed.
        
        Payment Details:
        Reference: {payment.payment_reference}
        Amount: {payment.amount} SOS
        Date: {payment.payment_date.strftime('%Y-%m-%d %H:%M')}
        Receipt: {receipt.receipt_number}
        
        Thank you for your payment.
        
        Best regards,
        Somali National University
        """
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Payment Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h1 style="color: #003366; text-align: center;">Payment Confirmed</h1>
                <p style="color: #333333; font-size: 16px;">Dear {student.user.first_name} {student.user.last_name},</p>
                <p style="color: #333333; font-size: 16px;">Your payment has been confirmed and verified.</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Reference:</strong> {payment.payment_reference}</p>
                    <p style="margin: 5px 0;"><strong>Amount:</strong> {payment.amount} SOS</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> {payment.payment_date.strftime('%Y-%m-%d %H:%M')}</p>
                    <p style="margin: 5px 0;"><strong>Receipt:</strong> {receipt.receipt_number}</p>
                </div>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999999; font-size: 12px; text-align: center;">
                    &copy; 2024 Somali National University. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        """
        
        return send_email(subject, student.user.email, body, html_body)
    except Exception as e:
        print(f"Error sending payment confirmation email: {str(e)}")
        return False

def send_student_card_email(student, student_card):
    """Send student card approval email"""
    try:
        subject = f"Student Card Approved - SNU - {student_card.card_number}"
        
        body = f"""
        Dear {student.user.first_name} {student.user.last_name},
        
        Your student card application has been approved!
        
        Card Details:
        Card Number: {student_card.card_number}
        Issue Date: {student_card.issue_date.strftime('%Y-%m-%d')}
        Expiry Date: {student_card.expiry_date.strftime('%Y-%m-%d')}
        
        You can download your student card from your dashboard.
        
        Best regards,
        Somali National University
        """
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Student Card Approved</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h1 style="color: #003366; text-align: center;">Student Card Approved!</h1>
                <p style="color: #333333; font-size: 16px;">Dear {student.user.first_name} {student.user.last_name},</p>
                <p style="color: #333333; font-size: 16px;">Your student card application has been approved.</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Card Number:</strong> {student_card.card_number}</p>
                    <p style="margin: 5px 0;"><strong>Issue Date:</strong> {student_card.issue_date.strftime('%Y-%m-%d')}</p>
                    <p style="margin: 5px 0;"><strong>Expiry Date:</strong> {student_card.expiry_date.strftime('%Y-%m-%d')}</p>
                </div>
                <p style="color: #333333; font-size: 16px;">You can download your student card from your dashboard.</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999999; font-size: 12px; text-align: center;">
                    &copy; 2024 Somali National University. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        """
        
        return send_email(subject, student.user.email, body, html_body)
    except Exception as e:
        print(f"Error sending student card email: {str(e)}")
        return False