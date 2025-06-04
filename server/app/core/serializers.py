from rest_framework import serializers
from core import models
from django.utils import timezone
import cloudinary.uploader

class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Faculty
        fields = ['id', 'name', 'code']
        
class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Area
        fields = ['id', 'name']
        
class BuildingSerializer(serializers.ModelSerializer):
    area = AreaSerializer(read_only=True)

    class Meta:
        model = models.Building
        fields = ['id', 'name', 'area', 'gender']
        
class RoomTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.RoomType
        fields = ['id', 'name', 'capacity', 'price', 'description']
        
class RoomSerializer(serializers.ModelSerializer):
    building = BuildingSerializer(read_only=True)
    room_type = RoomTypeSerializer(read_only=True)
    is_favorite = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = models.Room
        fields = ['id', 'number', 'building', 'room_type', 'floor', 'available_slots', 'is_favorite']
        
class RoomRequestSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField()
    current_room = serializers.StringRelatedField()
    requested_room = serializers.StringRelatedField()

    class Meta:
        model = models.RoomRequest
        fields = ['id', 'student', 'current_room', 'requested_room', 'reason', 'status', 'created_at', 'updated_at']
        
class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = models.User
        fields = ['id', 'email', 'phone', 'avatar', 'is_admin']
        
    def get_avatar(self, obj):
        if obj.avatar:
            return cloudinary.utils.cloudinary_url(obj.avatar.public_id, secure=True)[0]
        return None
        
class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    faculty = FacultySerializer(read_only=True)
    room = RoomSerializer(read_only=True)

    class Meta:
        model = models.Student
        fields = ['id', 'full_name', 'faculty', 'year_start', 'gender', 'home_town', 'date_of_birth', 'course', 'student_id', 'room', 'violation_count', 'is_blocked', 'user']
        
        
class ContractSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    room = RoomSerializer(read_only=True)

    class Meta:
        model = models.Contract
        fields = ['id', 'student', 'room', 'start_date', 'end_date', 'get_contract_id']
        
class ViolationSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)

    class Meta:
        model = models.Violation
        fields = ['id', 'student', 'time', 'description']
        
class QRCodeSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = models.QRCode
        fields = ['id', 'qr_token', 'date', 'is_used', 'image_url']

    def get_image_url(self, obj):
        if obj.image_url:
            return cloudinary.utils.cloudinary_url(obj.image_url.public_id, secure=True)[0]
        return None
    
class CheckInOutLogSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    building = BuildingSerializer(read_only=True)
    qr_code = QRCodeSerializer(read_only=True)  

    class Meta:
        model = models.CheckInOutLog
        fields = ['id', 'student', 'check_time', 'date', 'building', 'status', 'qr_code']

class BillSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)

    class Meta:
        model = models.Bill
        fields = ['id', 'student', 'amount', 'due_date', 'paid_date', 'status', 'description']
        
class NotificationSerializer(serializers.ModelSerializer):
    attachment = serializers.SerializerMethodField()

    class Meta:
        model = models.Notification
        fields = ['id', 'title', 'content', 'notification_type', 'attachment', 'created_at']

    def get_attachment(self, obj):
        if obj.attachment:
            return cloudinary.utils.cloudinary_url(obj.attachment.public_id, secure=True)[0]
        return None

class UserNotificationSerializer(serializers.ModelSerializer):
    notification = NotificationSerializer()

    class Meta:
        model = models.UserNotification
        fields = ['id', 'notification', 'is_read', 'created_at']
        
class SupportRequestSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField()

    class Meta:
        model = models.SupportRequest
        fields = ['id', 'student', 'request_type', 'description', 'status', 'response', 'created_at']
        
class PaymentMethodSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    class Meta:
        model = models.PaymentMethod
        fields = ['id', 'name', 'image']
        
    def get_image(self, obj):
        if obj.image:
            return cloudinary.utils.cloudinary_url(obj.image.public_id, secure=True)[0]
        return None
        
class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.PaymentTransaction
        fields = ['id', 'transaction_id', 'amount', 'status', 'bill', 'response_data']
        
class FavoriteRoomSerializer(serializers.ModelSerializer):
    room = RoomSerializer(read_only=True)
    student = StudentSerializer(read_only=True)

    class Meta:
        model = models.FavoriteRoom
        fields = ['id', 'student', 'room', 'created_at']
        
class IssueReportSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)

    class Meta:
        model = models.IssueReport
        fields = [
            'id', 'title', 'description', 'report_type', 'status',
            'response', 'student', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'response', 'student', 'created_at', 'updated_at']
        
class SurveyQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SurveyQuestion
        fields = ['id', 'content', 'answer_type']

class SurveyResponseSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    question = serializers.PrimaryKeyRelatedField(queryset=models.SurveyQuestion.objects.all())

    class Meta:
        model = models.SurveyResponse
        fields = ['id', 'student', 'survey', 'question', 'rating', 'text_answer', 'created_at']
        read_only_fields = ['id', 'student', 'created_at']

    def validate(self, data):
        question = data['question'] 
        if question.answer_type == 'RATING':
            if data.get('rating') is None or data['rating'] < 1 or data['rating'] > 5:
                raise serializers.ValidationError({'rating': 'Điểm đánh giá phải từ 1 đến 5.'})
        elif question.answer_type == 'TEXT':
            if not data.get('text_answer'):
                raise serializers.ValidationError({'text_answer': 'Câu trả lời văn bản là bắt buộc.'})
        return data

class SurveySerializer(serializers.ModelSerializer):
    questions = SurveyQuestionSerializer(many=True, read_only=True)
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = models.Survey
        fields = [
             'id', 'title', 'description', 'start_date', 'end_date',
            'is_active', 'questions', 'is_completed', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def get_is_completed(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False

        try:
            student = request.user.students
        except models.Student.DoesNotExist:
            return False

        total_questions = obj.questions.count()
        if total_questions == 0:
            return False

        response_count = models.SurveyResponse.objects.filter(
            student=student,
            survey=obj
        ).count()

        return response_count == total_questions

    def validate(self, data):
        if data['end_date'] <= data['start_date']:
            raise serializers.ValidationError({'end_date': 'Thời gian kết thúc phải sau thời gian bắt đầu.'})
        if data['end_date'] < timezone.now() and data.get('is_active', True):
            raise serializers.ValidationError({'is_active': 'Không thể kích hoạt khảo sát đã kết thúc.'})
        return data
    
class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    conversation_state = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = models.Message
        fields = ['id', 'sender', 'content', 'created_at', 'is_from_ai', 'is_pending_admin', "conversation_state"]

    def get_sender(self, obj):
        if obj.is_from_ai:
            return {"id": None, "email": "AI Assistant", "is_admin": True}
        return {"id": obj.sender.id, "email": obj.sender.email, "is_admin": obj.sender.is_admin, "full_name": obj.sender.students.full_name if hasattr(obj.sender, 'students') else None}
    
class ConversationStateSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = models.ConversationState
        fields = ['id', 'user', 'is_admin_handling', 'last_message', 'last_message_at', 'updated_at']

    def get_user(self, obj):
        student = getattr(obj.user, 'students', None)
        if student:
            return {"id": obj.user.id, "email": obj.user.email, "full_name": student.full_name, "student_id": student.student_id}
        return {"id": obj.user.id, "email": obj.user.email, "full_name": None, "student_id": None}

    def get_last_message(self, obj):
        last_message = obj.messages.first()
        if last_message:
            return MessageSerializer(last_message).data
        return None