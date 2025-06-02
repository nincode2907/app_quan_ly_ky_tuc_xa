from django.utils import timezone
from django.contrib import admin
from django.urls import path
from django.template.response import TemplateResponse
from django.utils.html import format_html, mark_safe
from django.urls import reverse
from django.db import models
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .forms import CustomUserCreationForm, CustomUserChangeForm, SupportRequestAdminForm
from django.db.models import Count, Sum
from .models import SupportRequest, IssueReport, User, Violation,RoomType, Room, Student, Contract, CheckInOutLog, QRCode, Faculty, Bill, Building, Area, RoomRequest, Notification, UserNotification, PaymentMethod, PaymentTransaction
from .utils import generate_random_password
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import send_mail, EmailMessage
import requests
import os
from .templates import index

# Custom interface at admin page
class KTXAdminSite(admin.AdminSite):
    site_header = "HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ"
    site_title = "Admin KTX"
    index_title = "QUẢN LÝ KÝ TÚC XÁ"
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('ktx-stats/', self.admin_view(self.ktx_stats)),
            path('room-occupancy/', self.admin_view(self.room_occupancy)),
        ]
        
        # admin_view(): Bắt buộc để kiểm tra quyền truy cập
        # Thứ tự URL quan trọng (custom URLs nên đặt trước)
        return custom_urls + urls
    
    def ktx_stats(self, request):
        stats = {
            'total_students': Student.objects.count(),
            'active_contracts': Contract.objects.filter(is_active=True).count(),
            'total_violations': Violation.objects.count(),
            'unpaid_bills': Bill.objects.filter(status='unpaid').aggregate(total=Sum('amount'))['total'] or 0,
        }
        return TemplateResponse(request, 'admin/ktx_stats.html', {
            'stats': stats,
            'opts': self._build_app_dict(request)['core']
        }) 
        
    def room_occupancy(self, request):
        occupancy = Room.objects.annotate(current_occupancy=Count('contract__id', filter=models.Q(contract__is_active=True)))
        
        return TemplateResponse(request, 'admin/room_occupancy.html', {
            'occupancy': occupancy,
            'opts': self._build_app_dict(request)['core']
        })
        
admin_site = KTXAdminSite(name='ktx_admin')

# Register your models here.
# @admin.register(User, site=admin_site)
# class UserAdmin(BaseUserAdmin):
#     model = User
#     add_form = CustomUserCreationForm
#     form = CustomUserChangeForm
#     list_display = ('email', 'is_staff', 'is_superuser', 'is_admin', 'is_first_login', 'get_student')
#     list_filter = ('is_staff', 'is_superuser', 'is_admin', 'is_first_login')
#     ordering = ('email',)
#     search_fields = ('email',)
#     fieldsets = (
#         (None, {'fields': ('email', 'password')}),
#         ('Thông tin cá nhân', {'fields': ('phone', 'avatar')}),
#         ('Phân quyền', {'fields': ('is_staff', 'is_superuser', 'is_admin', 'groups', 'user_permissions')}),
#     )
#     add_fieldsets = (
#         (None, {
#             'classes': ('wide',),
#             'fields': ('email', 'password1', 'password2', 'is_staff', 'is_superuser')}
#         ),
#     )
@admin.register(User, site=admin_site)
class UserAdmin(BaseUserAdmin):
    model = User
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    list_display = ('email', 'is_staff', 'is_superuser', 'is_admin', 'is_first_login', 'get_student')
    list_filter = ('is_staff', 'is_superuser', 'is_admin', 'is_first_login')
    ordering = ('email',)
    search_fields = ('email',)
    fieldsets = (
        (None, {'fields': ('email',)}),
        ('Thông tin cá nhân', {'fields': ('phone', 'avatar')}),
        ('Phân quyền', {'fields': ('is_staff', 'is_superuser', 'is_admin', 'is_first_login')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email','password1', 'password2', 'full_name', 'faculty', 'gender', 'year_start', 'is_staff', 'is_superuser', 'is_admin', 'is_first_login')}
        ),
    )
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if not obj:  # Khi tạo mới
            if 'email' in form.base_fields:
                form.base_fields['email'].label = 'Email (dùng để đăng nhập)'
        return form
    
    def get_student(self, obj):
        try:
            return obj.students
        except Student.DoesNotExist:
            return None
    get_student.short_description = "Sinh viên"
    
    def save_model(self, request, obj, form, change):
        if not change:
            # Tạo mật khẩu ngẫu nhiên cho người dùng mới
            # Nếu là sinh viên, tạo mật khẩu ngẫu nhiên và đánh dấu là lần đăng nhập đầu tiên
            obj.is_first_login = True
            obj.save()
            
            # Nhập thông tin sinh viên vào bảng Student
            student = Student.objects.create(
                full_name=form.cleaned_data['full_name'],
                gender=form.cleaned_data['gender'],
                faculty=form.cleaned_data['faculty'],
                year_start=form.cleaned_data['year_start'],
                user=obj
            )
            
            subject = 'Thông Tin Tài Khoản Mới Ký Túc Xá Sinh Viên'
            html_message = render_to_string(index.templates['e_welcome'], {
                'full_name': student.full_name,
                'email': obj.email,
                'password': form.cleaned_data['password1'],
                'admin_email': settings.DEFAULT_FROM_EMAIL,
            })
            try:
                send_mail(
                    subject,
                    message='',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[obj.email],
                    html_message=html_message,
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Error sending email: {str(e)}")  # In lỗi ra console
                raise  # Raise lại để thấy lỗi trong Django Admin
        else:
            super().save_model(request, obj, form, change)
            

@admin.register(Faculty, site=admin_site)
class FacutyAdmin(admin.ModelAdmin):
    list_display = ("name", "code", 'student_count')
    search_fields = ("name", "code")
    
    def student_count(self, obj):
        return obj.students.count()
    student_count.short_description = "Số sinh viên"
    
@admin.register(Student, site=admin_site)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("full_name", "year_start", "student_id", "course", "gender", "home_town", "faculty", "room", "violation_count", "is_blocked")
    list_filter = ("course", "gender", "home_town", "year_start", "room", "is_blocked", "faculty")
    search_fields = ("full_name", "student_id", "home_town", "user__email")
    readonly_fields = ("violation_count", "course", 'room')
    exclude = ('course', 'room')
    
@admin.register(Building, site=admin_site)
class BuildingAdmin(admin.ModelAdmin):
    list_display = ("name", "gender", "room_count")
    search_fields = ("name",)

    def room_count(self, obj):
        return obj.rooms.count()
    room_count.short_description = "Số Phòng"
    
@admin.register(RoomType, site=admin_site)
class RoomTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "capacity", "price_formatted")

    def price_formatted(self, obj):
        return f"{obj.price:,} VNĐ/month"
    price_formatted.short_description = "Price"

@admin.register(Room, site=admin_site)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("number", "building", "floor", "room_type", "price", "available_slots")
    list_filter = ("building", "floor", 'room_type')
    search_fields = ("number",)
    readonly_fields = ("available_slots", 'number')
    exclude = ('number',)
    
    def capacity(self, obj):
        return obj.room_type.capacity
    capacity.short_description = "Capacity"

    def price(self, obj):
        return f"{obj.room_type.price:,} VNĐ/month"
    price.short_description = "Price"
    
@admin.register(RoomRequest, site=admin_site)
class RoomRequestAdmin(admin.ModelAdmin):
    list_display = ('student', 'current_room', 'requested_room', 'reason', 'status', 'created_at')
    list_filter = ('status', 'created_at', 'reason')
    search_fields = ('student__full_name', 'student__student_id', 'reason')
    actions = ['approve_request', 'reject_request']

    def approve_request(self, request, queryset):
        for room_request in queryset:
            if room_request.status != 'PENDING':
                self.message_user(request, f"Yêu cầu của {room_request.student.full_name} đã được xử lý.")
                continue
            if room_request.requested_room.available_slots <= 0:
                self.message_user(request, f"Phòng {room_request.requested_room} đã hết giường trống.")
                continue
            if room_request.student.is_blocked:
                self.message_user(request, f"Sinh viên {room_request.student.full_name} đã bị khóa.")
                continue

            # Kết thúc hợp đồng cũ (nếu có)
            old_contract = Contract.objects.filter(student=room_request.student, end_date__isnull=True).first()
            if old_contract:
                old_contract.end_date = timezone.now()
                old_contract.save()
                old_room = old_contract.room
                old_room.available_slots += 1
                old_room.save()

            # Tạo hợp đồng mới
            Contract.objects.create(
                student=room_request.student,
                room=room_request.requested_room,
                start_date=timezone.now(),
                end_date=timezone.now() + timezone.timedelta(days=180)
            )

            room_request.status = 'APPROVED'
            room_request.save()

            # Gửi email thông báo
            subject = 'Thông Báo Phê Duyệt Yêu Cầu Phòng'
            html_message = render_to_string(index.templates['e_room_request_approved'], {
                'full_name': room_request.student.full_name,
                'room': room_request.requested_room,
                'admin_email': settings.DEFAULT_FROM_EMAIL,
            })
            send_mail(
                subject,
                message='',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[room_request.student.user.email],
                html_message=html_message,
                fail_silently=False,
            )

            self.message_user(request, f"Đã duyệt yêu cầu của {room_request.student.full_name}.")
    approve_request.short_description = "Duyệt yêu cầu phòng"

    def reject_request(self, request, queryset):
        for room_request in queryset:
            if room_request.status != 'PENDING':
                self.message_user(request, f"Yêu cầu của {room_request.student.full_name} đã được xử lý.")
                continue
            room_request.status = 'REJECTED'
            room_request.save()
            self.message_user(request, f"Đã từ chối yêu cầu của {room_request.student.full_name}.")
    reject_request.short_description = "Từ chối yêu cầu phòng"
    
@admin.register(Violation, site=admin_site)
class ViolationAdmin(admin.ModelAdmin):
    list_display = ("student", "time", "f__description")
    list_filter = ("time", "student")
    search_fields = ("student__user__email", "description")
    
    def f__description(self, obj):
        return obj.description[:100] + '...' if len(obj.description) > 100 else obj.description
    f__description.short_description = "Description"
    
@admin.register(QRCode, site=admin_site)
class QRCodeAdmin(admin.ModelAdmin):
    list_display = ("date", "display_image", "is_used")
    list_filter = ("date",)
    search_fields = ("qr_token",)
    readonly_fields = ("display_image", "image_url", "qr_token")

    def display_image(self, obj):
        if obj.image_url:
            return format_html('<img src="{}" width="50" height="50" />', obj.image_url.url)
        return "No Image"
    display_image.short_description = "QR Code"

@admin.register(CheckInOutLog, site=admin_site)
class CheckInOutLogAdmin(admin.ModelAdmin):
    list_display = ("student", "date", "check_in_time", "check_out_time")
    list_filter = ("date", "student")
    search_fields = ("student__user__email",)
    
@admin.register(Bill, site=admin_site)
class BillAdmin(admin.ModelAdmin):
    list_display = ("student", "f__amount", "status", "due_date", "paid_date")
    list_filter = ("status", "due_date")
    search_fields = ("student__user__email",)
    
    def f__amount(self, obj):
        return f"{obj.amount:,} VNĐ/tháng"
    f__amount.short_description = "Amount"
    
@admin.register(Contract, site=admin_site)
class ContractAdmin(admin.ModelAdmin):
    list_display = ("get_contract_id", "student", "room", "start_date", "end_date")
    list_filter = ("start_date", "end_date")
    search_fields = ("student__user__email", "room__number")
    readonly_fields = ("get_contract_id",)
    
@admin.register(Area, site=admin_site)
class AreaAdmin(admin.ModelAdmin):
    list_display = ("name", "building_count")
    search_fields = ("name",)

    def building_count(self, obj):
        return obj.buildings.count()
    building_count.short_description = "Số Tòa Nhà"
    
@admin.register(PaymentMethod, site=admin_site)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ("name",)
    
@admin.register(Notification, site=admin_site)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'notification_type', 'target_type', 'created_at')
    list_filter = ('notification_type', 'target_type', 'created_at')
    
    def send_notification(self, request, notification):
        if notification.target_type == 'INDIVIDUAL' and notification.target_student:
            students = Student.objects.filter(id=notification.target_student.id)
        else:
            students = Student.objects.all()
            if notification.target_type == 'AREA' and notification.target_area:
                students = students.filter(room__building__area=notification.target_area)
            elif notification.target_type == 'BUILDING' and notification.target_building:
                students = students.filter(room__building=notification.target_building)
            elif notification.target_type == 'ROOM' and notification.target_room:
                students = students.filter(room=notification.target_room)

        # Tạo UserNotification và gửi email
        for student in students:
            print(f"Sending notification to {student.full_name} ({student.user.email})")
            UserNotification.objects.create(
                student=student,
                notification=notification
            )
            subject = f"Thông Báo: {notification.title}"
            html_message = render_to_string(index.templates['e_notification'], {
                'full_name': student.full_name,
                'title': notification.title,
                'content': notification.content,
                'admin_email': settings.DEFAULT_FROM_EMAIL,
            })
            email = EmailMessage(
                subject=subject,
                body=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[student.user.email],
            )
            email.content_subtype = 'html'
            
            if notification.attachment:
                file_url = notification.attachment.url
                file_name = os.path.basename(file_url)
                response = requests.get(file_url)
                if response.status_code == 200:
                    email.attach(file_name, response.content, 'application/pdf')

            email.send(fail_silently=False)

        if notification.notification_type == 'URGENT':
            # TODO: Tích hợp Firebase/Twilio
            pass

        self.message_user(request, f"Đã gửi thông báo '{notification.title}' tới {students.count()} sinh viên.")
        
    def save_model(self, request, obj, form, change):
        obj.clean() 
        super().save_model(request, obj, form, change)
        self.send_notification(request, obj)
        
@admin.register(SupportRequest, site=admin_site)
class SupportRequestAdmin(admin.ModelAdmin):
    form = SupportRequestAdminForm
    list_display = ('student', 'request_type', 'description', 'status', 'created_at')
    list_filter = ('request_type', 'status', 'created_at')
    search_fields = ('student__full_name', 'description')

    def save_model(self, request, obj, form, change):
        old_status = obj.status if change else None

        # Lưu đối tượng trước để lấy trạng thái mới
        super().save_model(request, obj, form, change)

        # Nếu trạng thái thay đổi thành APPROVED hoặc REJECTED, gửi thông báo
        if (not change and obj.status in ['APPROVED', 'REJECTED']) or (change and old_status == 'PENDING' and obj.status in ['APPROVED', 'REJECTED']):
            # Xác định phản hồi
            response_type = form.cleaned_data.get('response_type')
            if obj.status == 'APPROVED':
                default_response = "Yêu cầu của bạn đã được duyệt. Chúng tôi sẽ xử lý sớm."
                title = "Yêu Cầu Hỗ Trợ Được Phê Duyệt"
            else:  # REJECTED
                default_response = "Yêu cầu của bạn đã bị từ chối do không đủ điều kiện."
                title = "Yêu Cầu Hỗ Trợ Bị Từ Chối"

            response = form.cleaned_data.get('custom_response') if response_type == 'custom' else default_response

            # Cập nhật phản hồi
            obj.response = response
            obj.save()

            # Tạo thông báo cá nhân
            notification = Notification.objects.create(
                title=title,
                content=f"Yêu cầu {obj.request_type} của bạn đã được xử lý: {response}",
                notification_type='NORMAL',
                target_type='INDIVIDUAL',
                target_student=obj.student
            )
            UserNotification.objects.create(
                student=obj.student,
                notification=notification
            )

            self.message_user(request, f"Đã xử lý yêu cầu của {obj.student.full_name}.")
            
@admin.register(IssueReport, site=admin_site)
class IssueReportAdmin(admin.ModelAdmin):
    list_display = ['title', 'student_name', 'report_type', 'status', 'created_at']
    list_filter = ['report_type', 'status', 'student']
    search_fields = ['title', 'description', 'student__full_name', 'student__student_id']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['status']
    actions = ['mark_as_resolved']

    def student_name(self, obj):
        return f"{obj.student.full_name} ({obj.student.student_id})"
    student_name.short_description = 'Sinh viên'

    def mark_as_resolved(self, request, queryset):
        queryset.update(status='RESOLVED')
        self.message_user(request, "Đã đánh dấu các phản ánh được chọn là đã xử lý.")
    mark_as_resolved.short_description = "Đánh dấu là đã xử lý"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('student')

    def save_model(self, request, obj, form, change):
        if 'response' in form.changed_data and not obj.response:
            obj.response = form.cleaned_data['response']
        if obj.status == 'RESOLVED' and not obj.response:
            self.message_user(request, "Vui lòng nhập phản hồi trước khi đánh dấu đã xử lý.", level='error')
            return
        super().save_model(request, obj, form, change)