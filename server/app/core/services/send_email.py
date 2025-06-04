from core.utils import generate_random_password
from core.models import User, Student
from django.template.loader import render_to_string
from django.conf import settings
from django.core.mail import send_mail
from core.templates import index

class EmailService:
    @staticmethod
    def send_new_password(email):
        try:
            user = User.objects.get(email=email)
            student = user.students 
        except User.DoesNotExist:
            raise ValueError("Email không tồn tại")
        except Student.DoesNotExist:
            raise ValueError("Không tìm thấy thông tin sinh viên")

        new_password = generate_random_password()
        user.set_password(new_password)
        user.is_first_login = True
        user.save()

        subject = 'Khôi Phục Mật Khẩu Ký Túc Xá Sinh Viên'
        html_message = render_to_string(index.templates['e_reset_password'], {
            'full_name': student.full_name,
            'email': email,
            'password': new_password,
            'admin_email': settings.DEFAULT_FROM_EMAIL,
        })
        send_mail(
            subject,
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
