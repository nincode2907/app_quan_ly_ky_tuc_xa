from core.models import QRCode, CheckInOutLog, Student
from django.utils import timezone
from django.core.exceptions import ValidationError


def process_qr_scan(qr_token, student_id):
    today = timezone.now().date()

    try:
        qr_code = QRCode.objects.get(qr_token=qr_token)
    except QRCode.DoesNotExist:
        raise ValidationError("QR code không tồn tại.")

    if qr_code.date != today:
        raise ValidationError("QR code không hợp lệ cho ngày hôm nay.")

    if qr_code.is_used:
        raise ValidationError("QR code đã được sử dụng.")

    try:
        student = Student.objects.get(student_id=student_id)
    except Student.DoesNotExist:
        raise ValidationError("Sinh viên không tồn tại.")

    last_log = CheckInOutLog.objects.filter(student=student).order_by('-time').first()
    is_check_in = True 
    if last_log and last_log.is_check_in:
        is_check_in = False

    log = CheckInOutLog.objects.create(
        student=student,
        qr_code=qr_code,
        time=timezone.now(),
        is_check_in=is_check_in
    )

    qr_code.is_used = True
    qr_code.save()

    return {
        "status": "success",
        "action": "Check-In" if is_check_in else "Check-Out",
        "student": student.student_id,
        "time": log.time
    }