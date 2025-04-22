from rest_framework import serializers
from .models import User, Student, Faculty, Area, Building, RoomType, Room, Contract, Violation, QRCode, CheckInOutLog, Bill, RoomRequest, Notification, UserNotification

class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ['id', 'name', 'code']
        
class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = ['id', 'name']
        
class BuildingSerializer(serializers.ModelSerializer):
    area = AreaSerializer(read_only=True)

    class Meta:
        model = Building
        fields = ['id', 'name', 'area', 'gender']
        
class RoomTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomType
        fields = ['id', 'name', 'capacity', 'price', 'description']
        
class RoomSerializer(serializers.ModelSerializer):
    building = BuildingSerializer(read_only=True)
    room_type = RoomTypeSerializer(read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'number', 'building', 'room_type', 'floor', 'available_slots']
        
class RoomRequestSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField()
    current_room = serializers.StringRelatedField()
    requested_room = serializers.StringRelatedField()

    class Meta:
        model = RoomRequest
        fields = ['id', 'student', 'current_room', 'requested_room', 'reason', 'status', 'created_at', 'updated_at']
        
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'phone', 'avatar', 'is_admin']
        
class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    faculty = FacultySerializer(read_only=True)
    room = RoomSerializer(read_only=True)

    class Meta:
        model = Student
        fields = ['id', 'full_name', 'faculty', 'year_start', 'gender', 'home_town', 'date_of_birth', 'course', 'student_id', 'room', 'violation_count', 'is_blocked', 'user']
        
        
class ContractSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    room = RoomSerializer(read_only=True)

    class Meta:
        model = Contract
        fields = ['id', 'student', 'room', 'start_date', 'end_date', 'get_contract_id']
        
class ViolationSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)

    class Meta:
        model = Violation
        fields = ['id', 'student', 'time', 'description']
        
class QRCodeSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = QRCode
        fields = ['id', 'qr_token', 'date', 'is_used', 'image_url']

    def get_image_url(self, obj):
        return obj.get_image_url()
    
class CheckInOutLogSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    building = BuildingSerializer(read_only=True)

    class Meta:
        model = CheckInOutLog
        fields = ['id', 'student', 'check_in_time', 'check_out_time', 'date', 'building']

class BillSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)

    class Meta:
        model = Bill
        fields = ['id', 'student', 'amount', 'due_date', 'paid_date', 'status']
        
class NotificationSerializer(serializers.ModelSerializer):
    attachment = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'title', 'content', 'notification_type', 'attachment', 'created_at']

    def get_attachment(self, obj):
        return obj.attachment.url if obj.attachment else None

class UserNotificationSerializer(serializers.ModelSerializer):
    notification = NotificationSerializer()

    class Meta:
        model = UserNotification
        fields = ['id', 'notification', 'is_read', 'created_at']