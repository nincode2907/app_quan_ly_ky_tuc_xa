from core.models import OTP, User
from core.utils import generate_otp, send_otp_email

class OTPService:
    @staticmethod
    def create_and_send_otp(user = None, email = None):
        email_addess = user.email if user else email
        if not User.objects.filter(email=email_addess).exists():
            raise ValueError("Email không tồn tại trong hệ thống.")

        otp_code = generate_otp()
        OTP.objects.create(email=email_addess, otp_hash=otp_code)
        send_otp_email(email_addess, otp_code)
        return otp_code

    @staticmethod
    def verify_otp(otp_code, user=None, email=None):
        email_addess = user.email if user else email
        if not User.objects.filter(email=email_addess).exists():
            raise ValueError("Email không tồn tại trong hệ thống.")
        
        otp = OTP.objects.filter(email=email_addess).order_by('-created_at').first()
        if not otp or not otp.is_valid(otp_code):
            return False
        
        otp.is_used = True
        otp.save()
        return True