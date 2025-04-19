from django.shortcuts import render
from rest_framework import viewsets, permissions, generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError
from .models import User, Student, Area, Building, RoomType, Room, Contract, Violation, Bill, RoomRequest
from core import serializers
from .perms import IsAdminOrSelf
from .services import process_qr_scan
import random
import string
from django.utils import timezone
from django.conf import settings
import re

# Create your views here.
class StudentViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Student.objects.none()
    serializer_class = serializers.StudentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]
    
    def get_queryset(self):
        if self.request.user.is_admin:
            return Student.objects.all().select_related('user', 'faculty', 'room__room_type', 'room__building__area').order_by('id')
        return Student.objects.filter(user=self.request.user).select_related('user')
    
    @action(detail=False, methods=['get'], url_path='me')
    def get_student_info(self, request):
        try:
            student = request.user.students
        except Student.DoesNotExist:
            return Response({"error": "Không tìm thấy thông tin sinh viên."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = serializers.StudentSerializer(student)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['POST'], url_path='update-profile')
    def update_profile(self, request):
        user = request.user
        try:
            student = user.students
        except Student.DoesNotExist:
            return Response({"error": "Không tìm thấy thông tin sinh viên."}, status=status.HTTP_400_BAD_REQUEST)
        
        phone = request.data.get('phone')
        avatar = request.data.get('avatar')
        gender = request.data.get('gender')
        home_town = request.data.get('home_town')
        date_of_birth = request.data.get('date_of_birth')
        student_id = request.data.get('student_id')
        
        if not all([phone, gender, home_town, date_of_birth, student_id]):
            return Response({"error": "Vui lòng cung cấp đầy đủ thông tin: số điện thoại, giới tính, quê quán, ngày sinh, mã sinh viên."}, status=status.HTTP_400_BAD_REQUEST)
        
        user.phone = phone
        if avatar:
            user.avatar = avatar
        user.save()
        
        student.gender = gender
        student.home_town = home_town
        student.date_of_birth = date_of_birth
        student.student_id = student_id
        student.save()
        
        return Response({
            "message": "Cập nhật hồ sơ thành công.",
            "user": {
                "id": user.id,
                "email": user.email,
                "phone": user.phone,
            },
            "student": {
                "full_name": student.full_name,
                "faculty": student.faculty.name,
                "year_start": student.year_start,
                "gender": student.gender,
                "home_town": student.home_town,
                "date_of_birth": str(student.date_of_birth),
                "student_id": student.student_id,
            }
        }, status=status.HTTP_200_OK)
        
    @action(detail=False, methods=['POST'], url_path='room-request')
    def room_request(self, request):
        try:
            student = request.user.students
        except Student.DoesNotExist:
            return Response({"error": "Không tìm thấy thông tin sinh viên."}, status=status.HTTP_400_BAD_REQUEST)
        
        if student.is_blocked:
            return Response({"error": "Bạn đã bị khóa tài khoản. Vui lòng liên hệ với quản trị viên."}, status=status.HTTP_403_FORBIDDEN)
        
        requested_room_id = request.data.get('requested_room_id')
        reason = request.data.get('reason')
        try:
            requested_room = Room.objects.get(id=requested_room_id)
        except Room.DoesNotExist:
            return Response({"error": "Phòng yêu cầu không tồn tại."}, status=status.HTTP_400_BAD_REQUEST)
        
        if requested_room.building.gender != student.gender:
            return Response({"error": "Phòng yêu cầu không phù hợp với giới tính của bạn."}, status=status.HTTP_400_BAD_REQUEST)
        
        if requested_room.available_slots <= 0:
            return Response({"error": "Phòng yêu cầu đã hết giường trống.."}, status=status.HTTP_400_BAD_REQUEST)
        
        if RoomRequest.objects.filter(student=student, status='PENDING').exists():
            return Response({"error": "Bạn đã có một yêu cầu đang chờ xử lý."}, status=status.HTTP_400_BAD_REQUEST)
        
        is_change_request = student.room is not None
        if is_change_request and not reason:
            return Response({"error": "Lý do đổi phòng là bắt buộc."}, status=status.HTTP_400_BAD_REQUEST)
        
        RoomRequest.objects.create(
            student=student,
            current_room=student.room,
            requested_room=requested_room,
            reason=reason if is_change_request else ''
        )
        
        return Response({"message": "Yêu cầu đã được gửi."}, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['POST'], url_path='room-requests')
    def room_requests(self, request):
        try:
            student = request.user.students
        except Student.DoesNotExist:
            return Response({"error": "Không tìm thấy thông tin sinh viên."}, status=status.HTTP_400_BAD_REQUEST)
        
        if student.is_blocked:
            return Response({"error": "Bạn đã bị khóa tài khoản. Vui lòng liên hệ với quản trị viên."}, status=status.HTTP_403_FORBIDDEN)
        
        requests = RoomRequest.objects.filter(student=student).select_related('current_room', 'requested_room')
        serializer = serializers.RoomRequestSerializer(requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class AreaViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Area.objects.none()
    serializer_class = serializers.AreaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Area.objects.all()
    
    # def create(self, request, *args, **kwargs):
    #     if not request.user.is_admin:
    #         return Response({"error": "Chỉ admin mới có thể tạo khu vực."}, status=status.HTTP_403_FORBIDDEN)
    #     return super().create(request, *args, **kwargs)
    
class BuildingViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Building.objects.none()
    serializer_class = serializers.BuildingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Building.objects.all().select_related('area').order_by('id')
    
    
class RoomTypeViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = RoomType.objects.none()
    serializer_class = serializers.RoomTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return RoomType.objects.all()
    
class RoomViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Room.objects.none()
    serializer_class = serializers.RoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_admin:
            return Room.objects.all().select_related('building__area', 'room_type').order_by('id')
        
        try:
            student = self.request.user.students
        except Student.DoesNotExist:
            return Response({"error": "Không tìm thấy thông tin sinh viên."}, status=status.HTTP_400_BAD_REQUEST)

        return Room.objects.filter(
            building__gender=student.gender,
            available_slots__gt=0
        ).select_related('building__area', 'room_type').order_by('room_type__capacity', 'available_slots')
        
class RoomRequestViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = RoomRequest.objects.none()
    serializer_class = serializers.RoomRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]
    
    def get_queryset(self):
        if self.request.user.is_admin:
            return RoomRequest.objects.all().select_related(
                'student__user',
                'student__faculty',
                'student__room__room_type',
                'student__room__building__area',
                'current_room__room_type',
                'current_room__building__area'
                'requested_room__room_type',
                'requested_room__building__area').order_by('id')
        return RoomRequest.objects.filter(student__user=self.request.user).select_related('student__user')
        
class ContractViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Contract.objects.none()
    serializer_class = serializers.ContractSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]
    
    def get_queryset(self):
        if self.request.user.is_admin:
            return Contract.objects.all().select_related(
                'student__user',
                'student__faculty',
                'student__room__room_type',
                'student__room__building__area',
                'room__room_type',
                'room__building__area').order_by('id')
        return Contract.objects.filter(student__user=self.request.user).select_related('student__user')
    
class ViolationViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Violation.objects.none()
    serializer_class = serializers.ViolationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]
    
    def get_queryset(self):
        if self.request.user.is_admin:
            return Violation.objects.all().select_related(
                'student__user',
                'student__faculty',
                'student__room__room_type',
                'student__room__building__area').order_by('id')
        return Violation.objects.filter(student__user=self.request.user).select_related('student__user')
    
class BillViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Bill.objects.none()
    serializer_class = serializers.BillSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]
    
    def get_queryset(self):
        if self.request.user.is_admin:
            return Bill.objects.all().select_related(
                'student__user',
                'student__faculty',
                'student__room__room_type',
                'student__room__building__area').order_by('id')
        return Bill.objects.filter(student__user=self.request.user).select_related('student__user')
    
# account
# /api/user/change_password/
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminOrSelf])
def change_password(request):
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not all([old_password, new_password]):
        return Response({"error": "Vui lòng cung cấp mật khẩu cũ và mật khẩu mới."}, status=status.HTTP_400_BAD_REQUEST)
    
    if not user.check_password(old_password):
        return Response({"error": "Mật khẩu cũ không đúng."}, status=status.HTTP_400_BAD_REQUEST)
    
    if user.check_password(new_password):
        return Response({"error": "Mật khẩu mới không được giống mật khẩu cũ."}, status=status.HTTP_400_BAD_REQUEST)
    
    if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$', new_password):
        return Response({
            "error": "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)."
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(new_password)
    user.is_first_login = False
    user.save()
    
    return Response({"message": "Đổi mật khẩu thành công."}, status=status.HTTP_200_OK)

# /api/user/me/
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdminOrSelf])
def user_me(request):
    user = request.user
    return Response({
        "id": user.id,
        "email": user.email,
        "is_admin": user.is_admin,
        "is_first_login": user.is_first_login,
    }, status=status.HTTP_200_OK)