from rest_framework import serializers
from core import models

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
    class Meta:
        model = models.User
        fields = ['id', 'email', 'phone', 'avatar', 'is_admin']
        
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
        return obj.get_image_url()
    
class CheckInOutLogSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    building = BuildingSerializer(read_only=True)

    class Meta:
        model = models.CheckInOutLog
        fields = ['id', 'student', 'check_in_time', 'check_out_time', 'date', 'building']

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
        return obj.attachment.url if obj.attachment else None

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
    class Meta:
        model = models.PaymentMethod
        fields = ['id', 'name']
        
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