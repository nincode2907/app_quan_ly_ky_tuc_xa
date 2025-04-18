from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import QRCode
import uuid

class Command(BaseCommand):
    help = 'Tạo QR code hàng ngày nếu chưa có'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        
        existing_qr_code = QRCode.objects.filter(date=today).first()
        if existing_qr_code:
            self.stdout.write(self.style.SUCCESS(f'QR code cho ngày ({today}) đã có.'))
            return 
        try:
            qr_token = str(uuid.uuid4())
            QRCode.objects.create(
                qr_token=qr_token,
                date=today
            )
            self.stdout.write(self.style.SUCCESS(f'Tạo QR code thành công cho ngày {today}.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Lỗi khi tạo QR code: {str(e)}'))