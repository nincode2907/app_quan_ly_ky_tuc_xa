# core/utils.py
import os
import random
import string
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from .templates import index

def validate_image_extension(value):
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif']
    if hasattr(value, 'name'):
        ext = os.path.splitext(value.name)[1].lower()
    else: 
        ext = '.png'  
    if ext not in valid_extensions:
        raise ValidationError('Chỉ chấp nhận file ảnh có đuôi .jpg, .jpeg, .png, hoặc .gif.')
    
def generate_random_password(length=8):
    characters = (
        string.ascii_lowercase +  # chữ thường
        string.ascii_uppercase +  # chữ hoa
        string.digits +           # số 0-9
        string.punctuation        # ký tự đặc biệt
    )
    
    # Đảm bảo mật khẩu có ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt
    password = [
        random.choice(string.ascii_lowercase),
        random.choice(string.ascii_uppercase),
        random.choice(string.digits),
        random.choice(string.punctuation),
    ]
    
    # Sinh các ký tự còn lại
    for _ in range(length - 4):
        password.append(random.choice(characters))
    
    # Xáo trộn mật khẩu
    random.shuffle(password)
    
    return ''.join(password)

def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(email, otp_code):
    email_context = {
        'otp_code': otp_code,
    }
    html_message = render_to_string(index.templates['e_otp_change_password'], email_context)
    send_mail(
        subject='Mã OTP Xác Nhận Đổi Mật Khẩu',
        message='',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        html_message=html_message,
        fail_silently=False,
    )