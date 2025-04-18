# core/utils.py
import os
import random
import string
from django.core.exceptions import ValidationError

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