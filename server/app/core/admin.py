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
from .models import SupportRequest,Message,ConversationState,SystemContext, IssueReport, Survey, SurveyQuestion, SurveyResponse, User, Violation,RoomType, Room, Student, Contract, CheckInOutLog, QRCode, Faculty, Bill, Building, Area, RoomRequest, Notification, UserNotification, PaymentMethod, PaymentTransaction
from .utils import generate_random_password
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import send_mail, EmailMessage
import requests
import os
from .templates import index
from django.http import HttpResponse
from django.db.models import Avg, Count
from django.db.models import Q
from datetime import timedelta
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import pandas as pd
from oauth2_provider.models import AccessToken, Application  # Thêm Application

class KTXAdminSite(admin.AdminSite):
    site_header = "HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ"
    site_title = "Admin KTX"
    index_title = "QUẢN LÝ KÝ TÚC XÁ"
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('ktx-stats/', self.admin_view(self.ktx_stats)),
            path('room-occupancy/', self.admin_view(self.room_occupancy)),
            path('survey-stats/<int:survey_id>/', self.admin_view(self.survey_stats_view), name='survey-stats'),
            path('bill-stats/', self.admin_view(self.bill_statistics_view), name='bill-stats'),
            path('qr-code-daily/', self.admin_view(self.qr_code_view), name='qr-code-daily'),
            path('dashboard/', self.admin_view(self.dashboard_view), name='dashboard'),
            path('navigation/', self.admin_view(self.navigation_view), name='navigation'),
            path('student-list/', self.admin_view(self.student_list_view), name='student_list'),
            path('export-pdf/', self.admin_view(self.export_pdf), name='export_pdf'),
            path('export-excel/', self.admin_view(self.export_excel), name='export_excel'),
            path('chat/', self.admin_view(self.chat_view), name='chat'),
        ]
        
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
        
    def survey_stats_view(self, request, survey_id):
        try:
            survey = Survey.objects.prefetch_related('questions__responses__student').get(id=survey_id)
        except Survey.DoesNotExist:
            return TemplateResponse(request, index.templates['a_survey_404'], {}, status=404)

        is_active = survey.is_active and survey.end_date >= timezone.now()
        status_text = "Đang hoạt động" if is_active else "Đã kết thúc"

        total_participants = survey.responses.values('student').distinct().count()

        questions = survey.questions.annotate(
            response_count=Count('responses'),
            avg_rating=Avg('responses__rating')
        )

        stats = []
        for question in questions:
            responses = question.responses.all()
            stat = {
                'question': question.content,
                'answer_type': question.answer_type,
                'response_count': question.response_count or 0,
            }
            if question.answer_type == 'RATING':
                stat['avg_rating'] = round(question.avg_rating or 0, 2)
                distribution = {str(i): 0 for i in range(1, 6)}
                for response in responses:
                    if response.rating:
                        distribution[str(response.rating)] += 1
                stat['distribution_with_percentage'] = {}
                for rating, count in distribution.items():
                    percentage = (count / stat['response_count'] * 100) if stat['response_count'] > 0 else 0
                    stat['distribution_with_percentage'][rating] = {
                        'count': count,
                        'percentage': round(percentage, 1)
                    }
                stat['distribution'] = distribution
            elif question.answer_type == 'TEXT':
                stat['text_responses'] = [
                    {'student': f"{r.student.full_name} ({r.student.student_id})", 'text': r.text_answer}
                    for r in responses if r.text_answer
                ]
            stats.append(stat)

        return TemplateResponse(request, index.templates['a_survey_stats'], {
            'survey': survey,
            'stats': stats,
            'status_text': status_text,
            'total_participants': total_participants,
        })
        
    def bill_statistics_view(self, request):
        option = request.GET.get('option', 'by_building')
        filter_type = request.GET.get('filter_type', 'month_year')
        try:
            year = int(request.GET.get('year', timezone.now().year))
            if filter_type == 'month_year':
                month = int(request.GET.get('month', timezone.now().month))
            else:
                month = None
        except (ValueError, TypeError):
            year = timezone.now().year
            month = timezone.now().month if filter_type == 'month_year' else None

        stats = []
        
        bill_filter = Q()
        if filter_type == 'month_year':
            bill_filter = Q(rooms__contracts__student__bills__month=month, 
                            rooms__contracts__student__bills__year=year)
        else:
            bill_filter = Q(rooms__contracts__student__bills__year=year)

        if option == 'by_building':
            buildings = Building.objects.select_related('area').annotate(
                total_amount=Sum('rooms__contracts__student__bills__amount', filter=bill_filter),
                bill_count=Count('rooms__contracts__student__bills', filter=bill_filter),
                avg_amount=Avg('rooms__contracts__student__bills__amount', filter=bill_filter),
                room_count=Count('rooms', filter=bill_filter, distinct=True)
            )
            for building in buildings:
                stats.append({
                    'name': f"{building.name} ({building.area.name})",
                    'area': building.area.name,
                    'gender': building.get_gender_display(),
                    'total_amount': building.total_amount or 0,
                    'bill_count': building.bill_count or 0,
                    'avg_amount': round(building.avg_amount or 0, 2),
                    'room_count': building.room_count or 0
                })

        elif option == 'by_room_type':
            room_types = RoomType.objects.annotate(
                total_amount=Sum('rooms__contracts__student__bills__amount', filter=bill_filter),
                bill_count=Count('rooms__contracts__student__bills', filter=bill_filter),
                avg_amount=Avg('rooms__contracts__student__bills__amount', filter=bill_filter),
                room_count=Count('rooms', filter=bill_filter, distinct=True),
                total_rooms=Count('rooms', distinct=True)
            )
            for room_type in room_types:
                stats.append({
                    'name': f"{room_type.name} ({room_type.capacity} người)",
                    'capacity': room_type.capacity,
                    'price': room_type.price,
                    'description': room_type.description,
                    'total_amount': room_type.total_amount or 0,
                    'bill_count': room_type.bill_count or 0,
                    'avg_amount': round(room_type.avg_amount or 0, 2),
                    'room_count': room_type.room_count or 0,
                    'total_rooms': room_type.total_rooms or 0
                })

        return TemplateResponse(request, index.templates['a_bill_stats'], {
            'stats': stats,
            'option': option,
            'filter_type': filter_type,
            'month': month,
            'year': year,
            'has_data': len(stats) > 0
        })
   
    def qr_code_view(self, request):
        today = timezone.now().date()
        qr_code = QRCode.objects.filter(date=today).first()
        return TemplateResponse(request, index.templates['a_qr_code_daily'], {
            'today': today,
            'qr_code': qr_code,
        })

    def dashboard_view(self, request):
        today = timezone.now().date()
        current_time = timezone.localtime(timezone.now()).strftime('%Y-%m-%d %H:%M:%S')
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        total_students = Student.objects.filter(
            contracts__end_date__gte=today,
            contracts__start_date__lte=today
        ).distinct().count()

        students_in = 0
        students_out = 0
        active_students = Student.objects.filter(
            contracts__end_date__gte=today,
            contracts__start_date__lte=today
        ).distinct()
        for student in active_students:
            last_log = CheckInOutLog.objects.filter(student=student, date__lte=today).order_by('-check_time').first()
            if last_log:
                if last_log.status == 'CHECK_IN':
                    students_in += 1
                else:
                    students_out += 1
            else:
                students_out += 1

        students_by_building = Building.objects.annotate(
            student_count=Count('rooms__contracts__student', filter=Q(
                rooms__contracts__end_date__gte=today,
                rooms__contracts__start_date__lte=today
            ))
        ).values('name', 'student_count')

        checkinout_day = {
            'labels': [f"{hour}:00" for hour in range(24)],
            'checkin': [0] * 24,
            'checkout': [0] * 24
        }
        logs_today = CheckInOutLog.objects.filter(date=today)
        for log in logs_today:
            hour = log.check_time.hour
            if log.status == 'CHECK_IN':
                checkinout_day['checkin'][hour] += 1
            else:
                checkinout_day['checkout'][hour] += 1

        checkinout_week = {
            'labels': [(week_start + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(7)],
            'checkin': [0] * 7,
            'checkout': [0] * 7
        }
        logs_week = CheckInOutLog.objects.filter(date__gte=week_start, date__lte=week_start + timedelta(days=6))
        for log in logs_week:
            day_index = (log.date - week_start).days
            if 0 <= day_index < 7:
                if log.status == 'CHECK_IN':
                    checkinout_week['checkin'][day_index] += 1
                else:
                    checkinout_week['checkout'][day_index] += 1

        days_in_month = (month_start.replace(day=28) + timedelta(days=4)).day
        checkinout_month = {
            'labels': [(month_start + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(days_in_month)],
            'checkin': [0] * days_in_month,
            'checkout': [0] * days_in_month
        }
        logs_month = CheckInOutLog.objects.filter(date__gte=month_start, date__lte=today)
        for log in logs_month:
            day_index = (log.date - month_start).days
            if 0 <= day_index < days_in_month:
                if log.status == 'CHECK_IN':
                    checkinout_month['checkin'][day_index] += 1
                else:
                    checkinout_month['checkout'][day_index] += 1

        return TemplateResponse(request, index.templates['a_dashboard'], {
            'total_students': int(total_students),
            'students_in': int(students_in),
            'students_out': int(students_out),
            'students_by_building': list(students_by_building),
            'checkinout_day': checkinout_day,
            'checkinout_week': checkinout_week,
            'checkinout_month': checkinout_month,
            'current_time': current_time,
        })

    def student_list_view(self, request):
        today = timezone.now().date()
        status = request.GET.get('status', 'ALL')
        active_students = Student.objects.filter(
            contracts__end_date__gte=today,
            contracts__start_date__lte=today
        ).distinct()

        student_list = []
        for student in active_students:
            last_log = CheckInOutLog.objects.filter(student=student, date__lte=today).order_by('-check_time').first()
            current_status = 'OUT' if not last_log or last_log.status == 'CHECK_OUT' else 'IN'
            if status == 'ALL' or (status == 'CHECK_IN' and current_status == 'IN') or (status == 'CHECK_OUT' and current_status == 'OUT'):
                student_list.append({
                    'full_name': student.full_name,
                    'student_id': student.student_id,
                    'status': current_status,
                    'last_check_time': last_log.check_time if last_log else None,
                })

        return TemplateResponse(request, index.templates['a_student_list'], {
            'student_list': student_list,
            'status': status,
            'current_time': timezone.localtime(timezone.now()).strftime('%Y-%m-%d %H:%M:%S'),
        })

    def export_pdf(self, request):
        today = timezone.now().date()
        status = request.GET.get('status', 'ALL')
        active_students = Student.objects.filter(
            contracts__end_date__gte=today,
            contracts__start_date__lte=today
        ).distinct()

        student_list = []
        for student in active_students:
            last_log = CheckInOutLog.objects.filter(student=student, date__lte=today).order_by('-check_time').first()
            current_status = 'OUT' if not last_log or last_log.status == 'CHECK_OUT' else 'IN'
            if status == 'ALL' or (status == 'CHECK_IN' and current_status == 'IN') or (status == 'CHECK_OUT' and current_status == 'OUT'):
                student_list.append([
                    student.full_name,
                    student.student_id,
                    current_status,
                    last_log.check_time.strftime('%Y-%m-%d %H:%M:%S') if last_log else 'N/A',
                ])

        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        font_path = os.path.join(base_dir, 'core', 'static', 'fonts')
        pdfmetrics.registerFont(TTFont('DejaVuSans', os.path.join(font_path, 'DejaVuSans.ttf')))
        pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', os.path.join(font_path, 'DejaVuSans-Bold.ttf')))

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=student_list_{status}_{today}.pdf'
        doc = SimpleDocTemplate(response, pagesize=letter)
        elements = []

        styles = getSampleStyleSheet()
        styles['Heading1'].fontName = 'DejaVuSans-Bold'
        styles['Normal'].fontName = 'DejaVuSans'
        title = Paragraph(f"Danh sách sinh viên - Trạng thái: {status} - Ngày: {timezone.localtime(timezone.now()).strftime('%Y-%m-%d %H:%M:%S')}", styles['Heading1'])
        elements.append(title)

        table_data = [['Họ và tên', 'Mã sinh viên', 'Trạng thái', 'Thời gian check cuối']] + student_list
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'DejaVuSans-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 1), (-1, -1), 'DejaVuSans'),
            ('FONTSIZE', (0, 1), (-1, -1), 12),
        ]))
        elements.append(table)

        doc.build(elements)
        return response

    def export_excel(self, request):
        today = timezone.now().date()
        status = request.GET.get('status', 'ALL')
        active_students = Student.objects.filter(
            contracts__end_date__gte=today,
            contracts__start_date__lte=today
        ).distinct()

        student_list = []
        for student in active_students:
            last_log = CheckInOutLog.objects.filter(student=student, date__lte=today).order_by('-check_time').first()
            current_status = 'OUT' if not last_log or last_log.status == 'CHECK_OUT' else 'IN'
            if status == 'ALL' or (status == 'CHECK_IN' and current_status == 'IN') or (status == 'CHECK_OUT' and current_status == 'OUT'):
                student_list.append({
                    'Họ và tên': student.full_name,
                    'Mã sinh viên': student.student_id,
                    'Trạng thái': current_status,
                    'Thời gian check cuối': last_log.check_time.strftime('%Y-%m-%d %H:%M:%S') if last_log else 'N/A',
                })

        df = pd.DataFrame(student_list)
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="student_list_{status}_{today}.xlsx"'
        df.to_excel(response, index=False, engine='openpyxl')
        return response
        
    def chat_view(self, request):
        if not request.user.is_authenticated or not request.user.is_admin:
            return HttpResponse("Unauthorized", status=401)

        try:
            access_token_obj = AccessToken.objects.filter(
                user=request.user,
                expires__gt=timezone.now()
            ).order_by('-created').first()

            if not access_token_obj:
                app, created = Application.objects.get_or_create(
                    name="Admin Chat Application",
                    client_type=Application.CLIENT_CONFIDENTIAL,
                    authorization_grant_type=Application.GRANT_CLIENT_CREDENTIALS,
                    user=request.user
                )

                access_token_obj = AccessToken.objects.create(
                    user=request.user,
                    application=app,
                    expires=timezone.now() + timedelta(hours=1),  
                    scope="read write"  
                )

            access_token = access_token_obj.token
            print(f"Access Token for {request.user.email}: {access_token}")

            return TemplateResponse(request, index.templates['a_chat'], {
                'access_token': access_token
            })
        except Exception as e:
            return TemplateResponse(request, index.templates['a_chat'], {
                'access_token': None,
                'error': f"Error retrieving or creating access token: {str(e)}"
            })
    
    def navigation_view(self, request):
        return TemplateResponse(request, index.templates['a_navigation'], {})



admin_site = KTXAdminSite(name='ktx_admin')

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
            'fields': ('email', 'password1', 'password2', 'full_name', 'faculty', 'gender', 'year_start', 'is_staff', 'is_superuser', 'is_admin', 'is_first_login')}
        ),
    )
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if not obj: 
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
            obj.is_first_login = True
            obj.save()
            
            year_suffix = str(form.cleaned_data['year_start'])[-2:]  
            faculty_code = form.cleaned_data['faculty'].code 
            existing_ids = Student.objects.filter(
                student_id__startswith=f"{year_suffix}{faculty_code}"
            ).values_list('student_id', flat=True)
            max_seq = 0
            for sid in existing_ids:
                seq = int(sid[-3:]) if sid[-3:].isdigit() else 0
                max_seq = max(max_seq, seq)
            next_seq = max_seq + 1
            student_id = f"{year_suffix}{faculty_code}{next_seq:03d}"  
            
            student = Student.objects.create(
                full_name=form.cleaned_data['full_name'],
                gender=form.cleaned_data['gender'],
                faculty=form.cleaned_data['faculty'],
                year_start=form.cleaned_data['year_start'],
                student_id=student_id,
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
                print(f"Error sending email: {str(e)}")
                raise
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

            old_contract = Contract.objects.filter(student=room_request.student, end_date__isnull=True).first()
            if old_contract:
                old_contract.end_date = timezone.now()
                old_contract.save()
                old_room = old_contract.room
                old_room.available_slots += 1
                old_room.save()

            Contract.objects.create(
                student=room_request.student,
                room=room_request.requested_room,
                start_date=timezone.now(),
                end_date=timezone.now() + timezone.timedelta(days=180)
            )

            room_request.status = 'APPROVED'
            room_request.save()

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
    list_display = ['student_display', 'building_display', 'check_time', 'status', 'date']
    list_filter = ['status', 'date', 'building']
    search_fields = ['student__full_name', 'student__student_id', 'building__name']
    date_hierarchy = 'date'

    def student_display(self, obj):
        return f"{obj.student.full_name} ({obj.student.student_id})"
    student_display.short_description = 'Sinh viên'

    def building_display(self, obj):
        return obj.building.name
    building_display.short_description = 'Tòa'
    
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

        super().save_model(request, obj, form, change)
        if (not change and obj.status in ['APPROVED', 'REJECTED']) or (change and old_status == 'PENDING' and obj.status in ['APPROVED', 'REJECTED']):
            response_type = form.cleaned_data.get('response_type')
            if obj.status == 'APPROVED':
                default_response = "Yêu cầu của bạn đã được duyệt. Chúng tôi sẽ xử lý sớm."
                title = "Yêu Cầu Hỗ Trợ Được Phê Duyệt"
            else:  
                default_response = "Yêu cầu của bạn đã bị từ chối do không đủ điều kiện."
                title = "Yêu Cầu Hỗ Trợ Bị Từ Chối"

            response = form.cleaned_data.get('custom_response') if response_type == 'custom' else default_response

            obj.response = response
            obj.save()

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
        
@admin.register(Survey, site=admin_site)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ['title', 'start_date', 'end_date', 'is_active', 'created_at', 'stats_link']
    list_filter = ['is_active', 'start_date']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at', 'notification']
    filter_horizontal = ['questions']
    actions = ['end_survey']

    def stats_link(self, obj):
        return format_html('<a href="/admin/survey-stats/{}">Xem thống kê</a>', obj.id)
    stats_link.short_description = 'Thống kê'

    def end_survey(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, "Đã kết thúc các khảo sát được chọn.")
    end_survey.short_description = "Kết thúc khảo sát"

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if not change: 
            notification = Notification.objects.create(
                title=f"{obj.title} - Khảo sát mới",
                content=f"Vui lòng tham gia khảo sát {obj.title}.",
                notification_type='NORMAL',
                target_type='ALL'
            )
            obj.notification = notification
            obj.save(update_fields=['notification'])
            print(f"Notification created for survey {obj.title} with ID {notification.id}")
            students = Student.objects.all()
            for student in students:
                UserNotification.objects.create(student=student, notification=notification)

@admin.register(SurveyQuestion, site=admin_site)
class SurveyQuestionAdmin(admin.ModelAdmin):
    list_display = ['content', 'answer_type']
    list_filter = ['answer_type']
    search_fields = ['content']

@admin.register(SurveyResponse, site=admin_site)
class SurveyResponseAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'survey', 'question', 'rating', 'text_answer', 'created_at']
    list_filter = ['survey', 'question__answer_type']
    search_fields = ['student__full_name', 'student__student_id', 'text_answer']

    def student_name(self, obj):
        return f"{obj.student.full_name} ({obj.student.student_id})"
    student_name.short_description = 'Sinh viên'
    
@admin.register(Message, site=admin_site)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'content', 'created_at', 'is_from_ai', 'is_pending_admin']
    list_filter = ['is_from_ai', 'is_pending_admin', 'created_at']
    search_fields = ['sender__email', 'content']

@admin.register(ConversationState, site=admin_site)
class ConversationStateAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_admin_handling', 'last_message_at']
    list_filter = ['is_admin_handling']
    search_fields = ['user__email']

@admin.register(SystemContext, site=admin_site)
class SystemContextAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_active', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['title', 'content']