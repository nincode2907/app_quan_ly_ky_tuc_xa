from core.models import QRCode, CheckInOutLog, Student
from django.utils import timezone
from django.core.exceptions import ValidationError


def process_qr_scan(qr_token, student_id):
    """
    Xử lý khi sinh viên quét QR code để check-in hoặc check-out.
    Args:
        qr_token: Token của QR code được quét
        student_id: Mã sinh viên (student_id)
    Returns:
        dict: Kết quả xử lý (thành công hoặc lỗi)
    Raises:
        ValidationError: Nếu QR code không hợp lệ
    """
    today = timezone.now().date()

    # Kiểm tra QR code
    try:
        qr_code = QRCode.objects.get(qr_token=qr_token)
    except QRCode.DoesNotExist:
        raise ValidationError("QR code không tồn tại.")

    # Kiểm tra ngày
    if qr_code.date != today:
        raise ValidationError("QR code không hợp lệ cho ngày hôm nay.")

    # Kiểm tra trạng thái sử dụng
    if qr_code.is_used:
        raise ValidationError("QR code đã được sử dụng.")

    # Kiểm tra sinh viên
    try:
        student = Student.objects.get(student_id=student_id)
    except Student.DoesNotExist:
        raise ValidationError("Sinh viên không tồn tại.")

    # Kiểm tra trạng thái check-in/check-out hiện tại của sinh viên
    last_log = CheckInOutLog.objects.filter(student=student).order_by('-time').first()
    is_check_in = True  # Mặc định là check-in
    if last_log and last_log.is_check_in:
        is_check_in = False  # Nếu lần trước là check-in, lần này là check-out

    # Tạo bản ghi CheckInOutLog
    log = CheckInOutLog.objects.create(
        student=student,
        qr_code=qr_code,
        time=timezone.now(),
        is_check_in=is_check_in
    )

    # Đánh dấu QR code là đã sử dụng
    qr_code.is_used = True
    qr_code.save()

    return {
        "status": "success",
        "action": "Check-In" if is_check_in else "Check-Out",
        "student": student.student_id,
        "time": log.time
    }