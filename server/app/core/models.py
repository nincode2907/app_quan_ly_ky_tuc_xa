from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
import uuid
from django.conf import settings
from django.utils import timezone
from cloudinary.models import CloudinaryField
import cloudinary
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files import File
from django.core.exceptions import ValidationError
from ckeditor_uploader.fields import RichTextUploadingField
from django.contrib.auth.hashers import make_password, check_password

MAX_VIOLATIONS = settings.MAX_VIOLATIONS

# Create your models here.
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_admin', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    avatar = CloudinaryField(blank=True, null=True)
    is_admin = models.BooleanField(default=False)
    is_first_login = models.BooleanField(default=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    username = None

    objects = UserManager()

    def __str__(self):
        return self.email
    
class Student(models.Model):
    GENDER_CHOICES = (
        ('male', 'Nam'),
        ('female', 'Nữ'),
    )
    full_name = models.CharField(max_length=150)
    faculty = models.ForeignKey('Faculty', on_delete=models.CASCADE, related_name='students')
    year_start = models.IntegerField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    home_town = models.CharField(max_length=255)
    date_of_birth = models.DateField(null=True, blank=True)
    course = models.CharField(max_length=10, blank=True)
    student_id = models.CharField(max_length=10)
    room = models.ForeignKey('Room', on_delete=models.SET_NULL, blank=True, null=True)
    violation_count = models.IntegerField(default=0)
    is_blocked = models.BooleanField(default=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='students', blank=True, null=True)
    
    def __str__(self):
        return f"{self.full_name} ({self.student_id})"
    
class Faculty(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    
    def __str__(self):
        return self.name
    
class Area(models.Model):
    name = models.CharField(max_length=100, unique=True) 

    def __str__(self):
        return self.name
    
class Building(models.Model):
    GENDER_CHOICES = (
        ('male', 'Nam'),
        ('female', 'Nữ')
    )
    name = models.CharField(max_length=100, unique=True)
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='buildings')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    
    class Meta:
        unique_together = ['name', 'area']
    
    def __str__(self):
        return f"{self.name} ({self.area.name})"
    
class RoomType(models.Model):
    name = models.CharField(max_length=10, unique=True)
    capacity = models.IntegerField()
    price = models.IntegerField()
    description = models.TextField()
    
    def __str__(self):
        return f"{self.name} ({self.capacity} người)"
    
    def save(self, *args, **kwargs):
        if self.capacity <= 0:
            raise ValueError("Sức chứa phải lớn hơn 0!")
        if self.price < 0:
            raise ValueError("Giá phòng không thể âm!")
        super().save(*args, **kwargs)
    
class Room(models.Model):
    number = models.CharField(max_length=10, blank=True)
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='rooms')
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name='rooms')
    floor = models.IntegerField()
    available_slots = models.IntegerField()
    
    class Meta:
        unique_together = ['number', 'building']
    
    def __str__(self):
        return f"{self.number} - {self.building.name}"
    
    def save(self, *args, **kwargs):
        if self.floor < 0 or self.floor > 9:
            raise ValueError("Tầng phải từ 0 đến 9!")
        if not self.number:
            existing_rooms_count = Room.objects.filter(building=self.building, floor=self.floor).exclude(id=self.id).count()
            if existing_rooms_count >= 99:
                raise ValueError("Số phòng đã đạt giới hạn tối đa trên một tầng!")
            room_order = existing_rooms_count + 1
            self.number = f"{self.floor}{str(room_order).zfill(2)}"
            
            while Room.objects.filter(number=self.number).exclude(id=self.id).exists():
                room_order += 1
                self.number = f"{self.floor}{str(room_order).zfill(2)}"
            
        if Room.objects.filter(building=self.building, number=self.number).exclude(id=self.id).exists():
            raise ValueError(f"Room number {self.number} already exists in building {self.building.name}")
            
        if self.available_slots is None:
            self.available_slots = self.room_type.capacity
        if self.available_slots > self.room_type.capacity:
            self.available_slots = self.room_type.capacity
        super().save(*args, **kwargs)
        
class RoomRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Đang chờ'),
        ('APPROVED', 'Được duyệt'),
        ('REJECTED', 'Bị từ chối'),
    )
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='room_requests')
    current_room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='current_requests', null=True, blank=True)
    requested_room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='requested_requests')
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.full_name}: {self.current_room or 'No room'} -> {self.requested_room} ({self.status})"
    
class Contract(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='contracts')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='contracts')
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField()
    
    class Meta:
        unique_together = ['room', 'student']
        
    def save(self, *args, **kwargs):
        if self.end_date <= self.start_date:
            raise ValueError("End date must be after start date")
        
        if self.student.gender != self.room.building.gender:
            raise ValueError(f"Tòa {self.room.building.name} ({self.room.building.area.name}) chỉ dành cho {self.room.building.gender}!")
        
        if self.room.available_slots <= 0:
            raise ValueError(f"Phòng {self.room.number} ({self.room.building.name}) đã hết chỗ!")
        
        super().save(*args, **kwargs)
        
        if self.student.room != self.room:
            old_room = self.student.room
            self.student.room = self.room
            self.student.save()
            
            self.room.available_slots -= 1
            self.room.save()
            
            if old_room:
                old_room.available_slots += 1
                old_room.save()
    
    def get_contract_id(self):
        return f"HD{str(self.id).zfill(4)}"

    def __str__(self):
        return f"Contract {self.get_contract_id()} - {self.student.student_id}"
    
class Violation(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='violations')
    time = models.DateTimeField(default=timezone.now)
    description = models.TextField()
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.student.violation_count += 1
        if self.student.violation_count >= MAX_VIOLATIONS:
            self.student.is_blocked = True
        self.student.save()
    
    def __str__(self):
        email = self.student.user.email if self.student.user else "No User"
        return f"{email}: {self.description}"
    
class QRCode(models.Model):
    qr_token = models.CharField(max_length=36, unique=True, default=uuid.uuid4)
    date = models.DateField(default=timezone.now)
    is_used = models.BooleanField(default=False)
    image_url = CloudinaryField(blank=True, null=True)
    
    class Meta:
        unique_together = ('date',)
    
    def save(self, *args, **kwargs):
        if not self.image_url: 
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(self.qr_token)
            qr.make(fit=True)
            img = qr.make_image(fill='black', back_color='white')
            
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            
            try:
                file_name = f"qrcode_{self.qr_token}"
                response = cloudinary.uploader.upload(
                    buffer,
                    folder='qrcodes',
                    public_id=file_name,
                    resource_type='image'
                )
                self.image_url = response['public_id'] 
            except Exception as e:
                raise ValueError(f"Lỗi khi upload lên Cloudinary: {str(e)}")
        
        super().save(*args, **kwargs)
        
    def get_image_url(self):
        if self.image_url:
            return self.image_url.build_url()
        return None
        
    def __str__(self):
        return f"{self.qr_token} - {self.date}"
    
class CheckInOutLog(models.Model):
    STATUS_CHOICES = (
        ('CHECK_IN', 'Check-in'),
        ('CHECK_OUT', 'Check-out'),
    )

    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name="checkinout_logs")
    check_time = models.DateTimeField(default=timezone.now)
    date = models.DateField(editable=False) 
    building = models.ForeignKey('Building', on_delete=models.CASCADE, related_name="checkinout_logs")
    qr_code = models.ForeignKey('QRCode', on_delete=models.CASCADE, related_name="checkinout_logs")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)

    def save(self, *args, **kwargs):
        self.date = self.check_time.date()

        if self.student.is_blocked:
            raise ValidationError(f"Sinh viên {self.student.full_name} đã bị khóa, không thể check-in/out")

        if self.student.gender != self.building.gender:
            raise ValidationError(f"Sinh viên {self.student.full_name} ({self.student.gender}) không được phép vào tòa {self.building.name} ({self.building.area.name}) (dành cho {self.building.gender})")

        if not self.student.room or self.student.room.building != self.building:
            raise ValidationError(f"Sinh viên {self.student.full_name} không có phòng trong tòa {self.building.name} ({self.building.area.name})")

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.full_name} - {self.status} - {self.check_time}"

    class Meta:
        indexes = [
            models.Index(fields=['student', 'date']),
            models.Index(fields=['check_time']),
        ]
        ordering = ['-check_time']
    
class Bill(models.Model):
    STATUS_CHOICES = (
        ('UNPAID', 'Chưa thanh toán'),
        ('PAID', 'Đã thanh toán'),
    )
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="bills")
    amount = models.IntegerField()
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UNPAID')
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    paid_date = models.DateTimeField(null=True, blank=True)
    month = models.IntegerField()
    year = models.IntegerField()
    
    def __str__(self):
        return f"Hóa đơn {self.student.full_name} - {self.amount} VNĐ - {self.status}"

class Notification(models.Model):
    TYPE_CHOICES = (
        ('NORMAL', 'Bình thường'),
        ('URGENT', 'Khẩn cấp'),
    )
    
    TARGET_CHOICES = (
        ('ALL', 'Tất cả sinh viên'),
        ('AREA', 'Theo khu vực'),
        ('BUILDING', 'Theo tòa nhà'),
        ('ROOM', 'Theo phòng'),
        ('INDIVIDUAL', 'Cá nhân'),
    )
    
    title = models.CharField(max_length=255)
    content = RichTextUploadingField()
    notification_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='NORMAL')
    target_type = models.CharField(max_length=10, choices=TARGET_CHOICES, default='ALL')
    target_area = models.ForeignKey(Area, on_delete=models.CASCADE, blank=True, null=True)
    target_building = models.ForeignKey(Building, on_delete=models.CASCADE, blank=True, null=True)
    target_room = models.ForeignKey(Room, on_delete=models.CASCADE, blank=True, null=True)
    target_student = models.ForeignKey(Student, on_delete=models.CASCADE, blank=True, null=True)
    attachment = CloudinaryField(blank=True, null=True, resource_type='raw')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def clean(self):
        """Kiểm tra trường bắt buộc dựa trên target_type"""
        if self.target_type == 'AREA' and not self.target_area:
            raise ValidationError({'target_area': 'Khu vực là bắt buộc khi chọn gửi theo khu vực.'})
        elif self.target_type == 'BUILDING' and not self.target_building:
            raise ValidationError({'target_building': 'Tòa nhà là bắt buộc khi chọn gửi theo tòa nhà.'})
        elif self.target_type == 'ROOM' and not self.target_room:
            raise ValidationError({'target_room': 'Phòng là bắt buộc khi chọn gửi theo phòng.'})
        elif self.target_type == 'INDIVIDUAL' and not self.target_student:
            raise ValidationError({'target_student': 'Sinh viên là bắt buộc khi chọn gửi cá nhân.'})
        elif self.target_type == 'ALL':
            pass
        else:
            if self.target_type != 'AREA' and self.target_area:
                self.target_area = None
            if self.target_type != 'BUILDING' and self.target_building:
                self.target_building = None
            if self.target_type != 'ROOM' and self.target_room:
                self.target_room = None
            if self.target_type != 'INDIVIDUAL' and self.target_student:
                self.target_student = None
                
    def __str__(self):
        return f"{self.title} - {self.target_type} - {self.created_at}"
    
class UserNotification(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='notifications')
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='user_notifications')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('student', 'notification')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.user.email} - {self.notification.title} - {self.is_read}"
    
class SupportRequest(models.Model):
    TYPE_CHOICES = (
        ('REPAIR', 'Sửa chữa'),
        ('FEEDBACK', 'Phản ánh'),
    )
    STATUS_CHOICES = (
        ('PENDING', 'Đang chờ'),
        ('APPROVED', 'Đã duyệt'),
        ('REJECTED', 'Đã từ chối'),
    )
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='support_requests')
    request_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    response = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.full_name} - {self.request_type} - {self.status}"
    
class OTP(models.Model):
    email = models.EmailField()
    otp_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expired_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
 
    def save(self, *args, **kwargs):
        if not self.expired_at: 
            self.expired_at = timezone.now() + timedelta(minutes=5)
            
        if not self.otp_hash.startswith('pbkdf2_sha256$'):
            self.otp_hash = make_password(self.otp_hash)
        super().save(*args, **kwargs)
    
    def is_valid(self, otp_code):
        return (
            not self.is_used and
            self.expired_at > timezone.now() and
            check_password(otp_code, self.otp_hash)
        )
        
    def __str__(self):
        return f"OTP for {self.email}"
        
class PaymentMethod(models.Model):
    name = models.CharField(max_length=255, null=False, unique=True)
    image = CloudinaryField(blank=True, null=True)

    def __str__(self):
        return self.name
      
class PaymentTransaction(models.Model):
    TRANSACTION_STATUS_CHOICES = (
        ('PENDING', 'Đang chờ xử lý'),
        ('SUCCESS', 'Thành công'),
        ('FAILED', 'Thất bại'),
    )

    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='transactions')
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True)
    amount = models.IntegerField()
    transaction_id = models.CharField(max_length=100, unique=True)  
    status = models.CharField(max_length=20, choices=TRANSACTION_STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    response_data = models.JSONField(null=True, blank=True)  

    def __str__(self):
        return f"Giao dịch {self.transaction_id} - {self.status}"
    
class IssueReport(models.Model):
    REPORT_TYPE_CHOICES = (
        ('REPAIR', 'Yêu cầu sửa chữa'),
        ('ISSUE', 'Báo cáo sự cố'),
    )
    STATUS_CHOICES = (
        ('PENDING', 'Chưa xử lý'),
        ('RESOLVED', 'Đã xử lý'),
    )

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='issue_reports')
    title = models.CharField(max_length=255)
    description = models.TextField()
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    response = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.student.full_name}"
    
class Survey(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    questions = models.ManyToManyField('SurveyQuestion', related_name='surveys', blank=True)
    notification = models.ForeignKey(Notification, on_delete=models.SET_NULL, null=True, blank=True, related_name='surveys')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def clean(self):
        if self.end_date <= self.start_date:
            raise ValidationError({'end_date': 'Thời gian kết thúc phải sau thời gian bắt đầu.'})
        if self.end_date < timezone.now():
            self.is_active = False

    def save(self, *args, **kwargs):
        self.full_clean()
        if timezone.now() > self.end_date:
            self.is_active = False
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.start_date} - {self.end_date})"

class SurveyQuestion(models.Model):
    ANSWER_TYPE_CHOICES = (
        ('RATING', 'Thang điểm (1-5)'),
        ('TEXT', 'Câu trả lời văn bản'),
    )

    content = models.CharField(max_length=255)
    answer_type = models.CharField(max_length=10, choices=ANSWER_TYPE_CHOICES)

    def __str__(self):
        return f"{self.content} ({self.get_answer_type_display()})"

class SurveyResponse(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='survey_responses')
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(SurveyQuestion, on_delete=models.CASCADE, related_name='responses')
    rating = models.IntegerField(null=True, blank=True, choices=[(i, str(i)) for i in range(1, 6)])
    text_answer = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'survey', 'question']

    def clean(self):
        if self.question.answer_type == 'RATING' and (self.rating is None or self.rating < 1 or self.rating > 5):
            raise ValidationError({'rating': 'Điểm đánh giá phải từ 1 đến 5.'})
        if self.question.answer_type == 'TEXT' and not self.text_answer:
            raise ValidationError({'text_answer': 'Câu trả lời văn bản là bắt buộc.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.full_name} - {self.question.content}"
    
class FavoriteRoom(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='favorite_rooms')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'room'] 
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.full_name} - {self.room.number} ({self.room.building.name})"
    
class SystemContext(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
    
class ConversationState(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='conversation_state')
    is_admin_handling = models.BooleanField(default=False)  
    last_message_at = models.DateTimeField(null=True, blank=True)  
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation state for {self.user.email}"

class Message(models.Model):
    conversation_state = models.ForeignKey(ConversationState, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages', null=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_from_ai = models.BooleanField(default=False)
    is_pending_admin = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        if self.sender:
            return f"Message from {self.sender.email} at {self.created_at}"
        return f"Message from AI at {self.created_at}"

