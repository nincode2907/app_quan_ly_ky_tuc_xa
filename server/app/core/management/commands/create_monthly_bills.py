from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import Student, Room, Contract, Bill, Notification, UserNotification
from django.core.mail import send_mail
from django.template.loader import render_to_string
import random
from core.templates import index
from django.conf import settings

class Command(BaseCommand):
    help = 'Tạo hóa đơn hàng tháng cho sinh viên vào ngày 15'
    MANAGEMENT_FEE = 25000 
    CLEANING_FEE = 50000
    
    def _get_or_create_fee(self, room_id, fees):
        for fee in fees:
            if fee['room_id'] == room_id:
                return fee
            
        electricity_fee = round(random.uniform(100000, 250000), -2)  # 100k-250k
        water_fee = round(random.uniform(50000, 150000), -2)        # 50k-150k
        
        new_fee = {
            'room_id': room_id,
            'electricity_fee': electricity_fee,
            'water_fee': water_fee,
        }
        
        fees.append(new_fee)
        return new_fee
        
    def _calculate_fees(self, room_price, fee, num_students_in_room, is_new_student, contract_start_date):
        fees_per_student = {
            'room_fee': room_price / num_students_in_room,
            'electricity_fee': fee['electricity_fee'] / num_students_in_room,
            'water_fee': fee['water_fee'] / num_students_in_room,
            'management_fee': self.MANAGEMENT_FEE / num_students_in_room,
            'cleaning_fee': self.CLEANING_FEE / num_students_in_room,
        }

        total_fee = sum(fees_per_student.values())
        discount_applied = is_new_student and 27 <= contract_start_date.day <= 28
        monthly_fee = total_fee * 0.5 if discount_applied else total_fee

        return fees_per_student, total_fee, monthly_fee, discount_applied
    
    def _create_bill_description(self, month, year, fees_per_student):
        return (
            f"Hóa đơn tháng {month}/{year}\n"
            f"- Tiền phòng: {fees_per_student['room_fee']:.2f} VNĐ\n"
            f"- Tiền điện: {fees_per_student['electricity_fee']:.2f} VNĐ\n"
            f"- Tiền nước: {fees_per_student['water_fee']:.2f} VNĐ\n"
            f"- Phí quản lý: {fees_per_student['management_fee']:.2f} VNĐ\n"
            f"- Phí vệ sinh: {fees_per_student['cleaning_fee']:.2f} VNĐ"
        )
        
    def _send_email(self, student, bill, month, year, fees_per_student, total_fee, monthly_fee, discount_applied):
        """Gửi email thông báo hóa đơn cho sinh viên."""
        email_context = {
            'student_name': student.full_name,
            'month': month,
            'year': year,
            'room_fee': f"{fees_per_student['room_fee']:.2f}",
            'electricity_fee': f"{fees_per_student['electricity_fee']:.2f}",
            'water_fee': f"{fees_per_student['water_fee']:.2f}",
            'management_fee': f"{fees_per_student['management_fee']:.2f}",
            'cleaning_fee': f"{fees_per_student['cleaning_fee']:.2f}",
            'total_fee' : f"{total_fee:.2f}",
            'total_amount': f"{monthly_fee:.2f}",
            'discount_note': "Bạn được giảm 50% số tiền do đăng ký mới" if discount_applied else "",
            'due_date': bill.due_date.strftime('%d/%m/%Y'),
        }
        html_message = render_to_string(index.templates['e_bill_notification'], email_context)

        try:
            email_address = student.user.email
            if not email_address:
                raise ValueError("Email không tồn tại.")
            send_mail(
                subject=f"Hóa đơn tháng {month}/{year} đã được tạo",
                message='',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email_address],
                html_message=html_message,
                fail_silently=False,
            )
            self.stdout.write(self.style.SUCCESS(f"Đã gửi email cho {student.full_name} ({email_address})"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Lỗi khi gửi email cho {student.full_name}: {str(e)}"))

    def handle(self, *args, **options):
        current_date = timezone.now()
        # if current_date.day != 15:
        #     return self.stdout.write(self.style.WARNING('Chỉ tạo hóa đơn vào ngày 15 hằng tháng.'))

        month, year = current_date.month, current_date.year
        students = Student.objects.filter(contracts__end_date__gte=timezone.now())
        
        count = 0
        students_with_bills, fees = [], []

        for student in students:
            if Bill.objects.filter(student=student, month=month, year=year).exists():
                self.stdout.write(self.style.WARNING(f"Hóa đơn tháng {month}/{year} đã tồn tại cho sinh viên {student.full_name}."))
                continue
            
            contract = student.contracts.get(end_date__gte=timezone.now())
            room = contract.room
            room_type = room.room_type
            num_students_in_room = room_type.capacity - room.available_slots

            # Tính phí
            room_price = float(room_type.price)
            fee = self._get_or_create_fee(room.id, fees)
            is_new_student = contract.start_date.year == year and contract.start_date.month == month
            fees_per_student, total_fee, monthly_fee, discount_applied = self._calculate_fees(
                room_price, fee, num_students_in_room, is_new_student, contract.start_date
            )
            
            description = self._create_bill_description(month, year, fees_per_student)
            bill = Bill.objects.create(
                student=student,
                amount=monthly_fee,
                description=description,
                due_date=timezone.now() + timedelta(days=10),
                month=month,
                year=year
            )
            
            count += 1
            students_with_bills.append(student)
            
            # Gửi email cho sinh viên
            self._send_email(student, bill, month, year, fees_per_student, total_fee, monthly_fee, discount_applied)
            
        # Tạo thông báo trong hệ thống
        if students_with_bills:
            notification = Notification.objects.create(
                title=f"Hóa đơn tháng {month}/{year} đã được tạo",
                content=f"Hóa đơn tháng {month}/{year} đã được tạo. Vui lòng kiểm tra và thanh toán trước ngày {bill.due_date.strftime('%d/%m/%Y')}.",
                notification_type='NORMAL',
                target_type='INDIVIDUAL',
            )
            UserNotification.objects.bulk_create([
                UserNotification(student=student, notification=notification)
                for student in students_with_bills
            ])
            self.stdout.write(self.style.SUCCESS(f"Đã tạo thông báo cho {len(students_with_bills)} sinh viên."))

        self.stdout.write(self.style.SUCCESS(f'Đã tạo thành công {count} hóa đơn.'))