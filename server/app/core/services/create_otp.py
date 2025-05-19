from core.models import OTP, User
from core.utils import generate_otp, send_otp_email
from django.utils import timezone
from datetime import timedelta

class OTPService:
    @staticmethod
    def create_and_send_otp(email=None):
        if not email:
            raise ValueError("Phải cung cấp email")
        
        if not User.objects.filter(email=email).exists():
            raise ValueError("Email không tồn tại")
        
        one_minute_ago = timezone.now() - timedelta(minutes=1)
        latest_otp = OTP.objects.filter(email=email).order_by('-created_at').first()
        if latest_otp and latest_otp.created_at > one_minute_ago:
            raise ValueError("Vui lòng đợi ít nhất 1 phút trước khi yêu cầu OTP mới.")

        otp_code = generate_otp()
        OTP.objects.create(email=email, otp_hash=otp_code)
        send_otp_email(email, otp_code)
        return otp_code

    @staticmethod
    def verify_otp(otp_code, email=None):
        if not email:
            raise ValueError("Phải cung cấp email")

        if not User.objects.filter(email=email).exists():
            raise ValueError("Email không tồn tại trong hệ thống.")
        
        otp = OTP.objects.filter(email=email).order_by('-created_at').first()
        if not otp or not otp.is_valid(otp_code):
            return False
        
        otp.is_used = True
        otp.save()
        return True
    
 