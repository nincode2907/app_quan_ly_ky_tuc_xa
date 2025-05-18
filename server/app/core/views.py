from django.shortcuts import render
from rest_framework import viewsets, permissions, generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.parsers import MultiPartParser, FormParser
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError
from .models import FavoriteRoom, SupportRequest, User, Student, Area, Building, RoomType, Room, Message, Contract, Violation, Bill, RoomRequest, UserNotification, PaymentMethod, PaymentTransaction
from core import serializers
from .perms import IsAdminOrSelf
from .services.create_otp import OTPService
from .services import process_qr_scan
import random
import string
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.shortcuts import get_object_or_404
import re
from django.contrib.auth.models import AnonymousUser
from .services.payment import PaymentService

# Create your views here.
class StudentViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Student.objects.none()
    serializer_class = serializers.StudentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]
    parser_classes = (MultiPartParser, FormParser)
    
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
        
        user_data = {
        'phone': request.data.get('phone'),
        'avatar': request.data.get('avatar')
        }
        student_data = {
            'gender': request.data.get('gender'),
            'home_town': request.data.get('home_town'),
            'date_of_birth': request.data.get('date_of_birth'),
            'student_id': request.data.get('student_id')
        }
        
        user_serializer = serializers.UserSerializer(request.user, data=user_data, partial=True)
        student_serializer = serializers.StudentSerializer(student, data=student_data, partial=True)
        
        if user_serializer.is_valid() and student_serializer.is_valid():
            user_serializer.save()
            student_serializer.save()
            return Response({
                "message": "Cập nhật hồ sơ thành công.",
                "user": user_serializer.data,
                "student": student_serializer.data
            }, status=status.HTTP_200_OK)
        else:
            errors = {**user_serializer.errors, **student_serializer.errors}
            return Response({"error": errors}, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=False, methods=['POST'], url_path='room-request')
    def room_request(self, request):
        try:
            student = request.user.students
        except Student.DoesNotExist:
            return Response({"error": "Không tìm thấy thông tin sinh viên."}, status=status.HTTP_400_BAD_REQUEST)
        
        if student.is_blocked:
            return Response({"error": "Bạn đã bị khóa tài khoản. Vui lòng liên hệ với quản trị viên."}, status=status.HTTP_403_FORBIDDEN)
        
        current_date = timezone.now()
        day = current_date.day
        month = current_date.month
        year = current_date.year
        
        is_change_request = student.room is not None    
        # if not (16 <= day <= 20) and is_change_request:
        #     return Response({"error": "Chỉ được gửi yêu cầu chuyển phòng từ ngày 16 đến 20 hằng tháng."}, status=status.HTTP_400_BAD_REQUEST)
        
        unpaid_bills = Bill.objects.filter(
            student = student,
            status='UNPAID'
        )
        
        if unpaid_bills.exists():
            return Response({"error": "Bạn cần thanh toán hóa đơn để gửi yêu cầu chuyển phòng."}, status=status.HTTP_400_BAD_REQUEST)
        
        existing_requests = RoomRequest.objects.filter(
            student=student,
            created_at__year=year,
            created_at__month=month
        )
        
        if existing_requests.exists():
            return Response({"error": "Bạn chỉ được gửi 1 yêu cầu chuyển phòng mỗi tháng."}, status=status.HTTP_400_BAD_REQUEST)
        
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
        
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        try:
            student = request.user.students
        except Student.DoesNotExist:
            return Response({"error": "Không tìm thấy thông tin sinh viên."}, status=status.HTTP_400_BAD_REQUEST)

        # Lấy danh sách phòng yêu thích của sinh viên
        favorite_room_ids = FavoriteRoom.objects.filter(student=student).values_list('room_id', flat=True)
        
        # Serialize dữ liệu phòng
        serializer = self.get_serializer(queryset, many=True)
        rooms_data = serializer.data
        
        # Thêm trạng thái is_favorite vào mỗi phòng
        for room_data in rooms_data:
            room_data['is_favorite'] = room_data['id'] in favorite_room_ids

        return Response(rooms_data, status=status.HTTP_200_OK)
    @action(detail=False, methods=['get'], url_path='favorites')
    def favorite_rooms(self, request):
        try:
            student = request.user.students
        except Student.DoesNotExist:
            return Response({"error": "Không tìm thấy thông tin sinh viên."}, status=status.HTTP_400_BAD_REQUEST)

        favorite_rooms = Room.objects.filter(
            favorited_by__student=student
        ).select_related('building__area', 'room_type').order_by('favorited_by__created_at')
        
        serializer = self.get_serializer(favorite_rooms, many=True)
        rooms_data = serializer.data
        for room_data in rooms_data:
            room_data['is_favorite'] = True  

        return Response(rooms_data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['POST'], url_path='toggle-favorite')
    def toggle_favorite(self, request):
        try:
            student = request.user.students
        except Student.DoesNotExist:
            return Response({"error": "Không tìm thấy thông tin sinh viên."}, status=status.HTTP_400_BAD_REQUEST)

        room_id = request.data.get('room_id')
        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response({"error": "Phòng không tồn tại."}, status=status.HTTP_400_BAD_REQUEST)

        if room.building.gender != student.gender:
            return Response({"error": "Phòng không phù hợp với giới tính của bạn."}, status=status.HTTP_400_BAD_REQUEST)

        favorite_room = FavoriteRoom.objects.filter(student=student, room=room).first()
        if favorite_room:
            favorite_room.delete()
            return Response({"message": "Đã xóa phòng khỏi danh sách yêu thích.", "is_favorite": False}, status=status.HTTP_200_OK)
        else:
            if room.available_slots <= 0:
                return Response({"error": "Phòng đã hết giường trống."}, status=status.HTTP_400_BAD_REQUEST)
            favorite_room = FavoriteRoom.objects.create(student=student, room=room)
            return Response({"message": "Đã thêm phòng vào danh sách yêu thích.", "is_favorite": True}, status=status.HTTP_201_CREATED)

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
                'current_room__building__area',
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
    
class UserNotificationsViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = UserNotification.objects.none()
    serializer_class = serializers.UserNotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]
    
    def get_queryset(self):
        if self.request.user.is_admin:
            return UserNotification.objects.all().select_related(
                'student__user',
                'student__faculty',
                'student__room__room_type',
                'student__room__building__area').order_by('id')
        return UserNotification.objects.filter(student__user=self.request.user).select_related('student__user')
    
    # API đánh dấu thông báo đã đọc
    @action(detail=False, methods=['post'], url_path='mark-read')
    def mark_notification_read(self, request):
        notification_id = request.data.get('notification_id')
        if not notification_id:
            return Response({"error": "Thiếu thông tin."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_notification = UserNotification.objects.get(student__user=request.user, id=notification_id)
            user_notification.is_read = True
            user_notification.save()
            return Response({"message": "Đã đánh dấu thông báo là đã đọc."}, status=status.HTTP_200_OK)
        except UserNotification.DoesNotExist:
            return Response({"error": "Thông báo không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        
class SupportRequestViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView):
    queryset = SupportRequest.objects.none()
    serializer_class = serializers.SupportRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]

    def get_queryset(self):
        return SupportRequest.objects.filter(student__user=self.request.user).order_by('-created_at')

    def create(self, request):
        try:
            student = request.user.students
        except Student.DoesNotExist:
            return Response({"error": "Không tìm thấy thông tin sinh viên."}, status=status.HTTP_400_BAD_REQUEST)

        pending_requests = SupportRequest.objects.filter(student=student, status='PENDING')
        if pending_requests.exists():
            return Response({"error": "Bạn có một yêu cầu đang chờ xử lý. Vui lòng chờ phản hồi trước khi gửi yêu cầu mới."}, status=status.HTTP_400_BAD_REQUEST)
        
        request_type = request.data.get('request_type')
        description = request.data.get('description')

        if not request_type or not description:
            return Response({"error": "Vui lòng cung cấp loại yêu cầu và mô tả."}, status=status.HTTP_400_BAD_REQUEST)

        if request_type not in ['REPAIR', 'FEEDBACK']:
            return Response({"error": "Loại yêu cầu không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        support_request = SupportRequest.objects.create(
            student=student,
            request_type=request_type,
            description=description
        )

        serializer = self.get_serializer(support_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
class PaymentMethodViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = PaymentMethod.objects.none()
    serializer_class = serializers.PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PaymentMethod.objects.all().order_by('id')
    
class PaymentTransactionViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = PaymentTransaction.objects.none()
    serializer_class = serializers.PaymentTransactionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]

    def get_queryset(self):
        if self.request.user.is_admin:
            return PaymentTransaction.objects.all().select_related(
                'bill__student__user',
                'bill__student__faculty',
                'bill__student__room__room_type',
                'bill__student__room__building__area').order_by('id')
        return PaymentTransaction.objects.filter(bill__student__user=self.request.user).select_related('bill__student__user')
    
class FavoriteRoomViewSet(viewsets.ViewSet, generics.CreateAPIView, generics.DestroyAPIView):
    queryset = FavoriteRoom.objects.none()
    serializer_class = serializers.FavoriteRoomSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]

    # def get_queryset(self):
    #     try:
    #         student = self.request.user.students
    #     except Student.DoesNotExist:
    #         raise ValidationError("Không tìm thấy thông tin sinh viên.")
    #     return FavoriteRoom.objects.filter(student=student).select_related('room__building__area', 'room__room_type').order_by('-created_at')

    def create(self, request):
        try:
            student = request.user.students
        except Student.DoesNotExist:
            return Response({"error": "Không tìm thấy thông tin sinh viên."}, status=status.HTTP_400_BAD_REQUEST)

        room_id = request.data.get('room_id')
        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response({"error": "Phòng không tồn tại."}, status=status.HTTP_400_BAD_REQUEST)

        if room.building.gender != student.gender:
            return Response({"error": "Phòng không phù hợp với giới tính của bạn."}, status=status.HTTP_400_BAD_REQUEST)

        if FavoriteRoom.objects.filter(student=student, room=room).exists():
            return Response({"error": "Phòng đã có trong danh sách yêu thích."}, status=status.HTTP_400_BAD_REQUEST)

        favorite_room = FavoriteRoom.objects.create(student=student, room=room)
        serializer = self.get_serializer(favorite_room)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='remove')
    def remove_favorite(self, request, pk=None):
        try:
            student = request.user.students
        except Student.DoesNotExist:
            return Response({"error": "Không tìm thấy thông tin sinh viên."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            favorite_room = FavoriteRoom.objects.get(id=pk, student=student)
        except FavoriteRoom.DoesNotExist:
            return Response({"error": "Phòng không có trong danh sách yêu thích."}, status=status.HTTP_404_NOT_FOUND)

        favorite_room.delete()
        return Response({"message": "Đã xóa phòng khỏi danh sách yêu thích."}, status=status.HTTP_200_OK)
    
# account
# /api/user/change_password/
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminOrSelf])
def change_password(request):
    user = request.user
    new_password = request.data.get('new_password')
    old_password = request.data.get('old_password')
    password_pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
    
    if user.is_first_login:
        if not new_password:
            return Response({"error": "Vui lòng cung cấp mật khẩu mới."}, status=status.HTTP_400_BAD_REQUEST)
    else:
        if not all([old_password, new_password]):
            return Response({"error": "Vui lòng cung cấp mật khẩu cũ và mật khẩu mới."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.check_password(old_password):
            return Response({"error": "Mật khẩu cũ không đúng."}, status=status.HTTP_400_BAD_REQUEST)
        
        if user.check_password(new_password):
            return Response({"error": "Mật khẩu mới không được giống mật khẩu cũ."}, status=status.HTTP_400_BAD_REQUEST)
        
    # if not re.match(password_pattern, new_password):
    #     return Response({
    #         "error": "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
    #     }, status=status.HTTP_400_BAD_REQUEST)
        
    user.set_password(new_password)
    user.is_first_login = False
    user.save()
    return Response({"message": "Đổi mật khẩu thành công."}, status=status.HTTP_200_OK)

# /api/user/request-otp/
@api_view(['POST'])
@permission_classes([])
def request_otp(request):
    user = request.user
    try:
        if isinstance(user, AnonymousUser):
            email = request.data.get('email')
            if not email:
                return Response({"error": "Thông tin không đầy đủ."}, status=status.HTTP_400_BAD_REQUEST)
            OTPService.create_and_send_otp(email = email)
        else:
            OTPService.create_and_send_otp(user = user)
            
        return Response({"message": "Mã OTP đã được gửi đến email của bạn."}, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
# /api/user/verify-otp/
@api_view(['POST'])
@permission_classes([])
def verify_otp(request):
    user = request.user
    otp = request.data.get('otp')
    if not otp:
        return Response({"error": "Vui lòng cung cấp mã OTP."}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        if isinstance(user, AnonymousUser):
            email = request.data.get('email')
            if not email:
                return Response({"error": "Thông tin không đầy đủ."}, status=status.HTTP_400_BAD_REQUEST)
            
            if OTPService.verify_otp(otp, email = email) == False:
                return Response({"error": "Mã OTP không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)
        
        elif OTPService.verify_otp(otp, user = user) == False:
            return Response({"error": "Mã OTP không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"message": "Mã OTP hợp lệ."}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    
# /api/payment/initiate-payment/
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminOrSelf])
def initiate_payment(request):
    bill_id = request.data.get('bill_id')
    payment_method_id = request.data.get('payment_method_id')

    bill = get_object_or_404(Bill, id=bill_id)
    payment_method = get_object_or_404(PaymentMethod, id=payment_method_id)

    try:
        service = PaymentService.get_service(payment_method.name)
        pay_url = service.create_payment(bill)
        return Response({'status': 'success', 'pay_url': pay_url})
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
@csrf_exempt
@api_view(['GET'])
@permission_classes([])
def payment_return(request):
    transaction_id = request.query_params.get('orderId')
    transaction = get_object_or_404(PaymentTransaction, transaction_id=transaction_id)
    payment_method = transaction.payment_method
    
    try:
        service = PaymentService.get_service(payment_method.name)
        success = service.handle_callback(request.query_params)
        return Response({'status': 'success' if success else 'failed'}, status=status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
@csrf_exempt
@api_view(['POST'])
@permission_classes([])
def payment_notify(request):
    transaction_id = request.data.get('orderId')
    transaction = get_object_or_404(PaymentTransaction, transaction_id=transaction_id)
    payment_method = transaction.payment_method

    try:
        service = PaymentService.get_service(payment_method.name)
        service.handle_callback(request.data)
        return Response(status=status.HTTP_200_OK)
    except Exception as e:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    
# API cho admin lấy danh sách sinh viên có tin nhắn cần trả lời
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def pending_students(request):
    # Lấy danh sách sinh viên có tin nhắn PENDING_ADMIN
    pending_messages = Message.objects.filter(status='PENDING_ADMIN').select_related('sender')
    students = {}
    for message in pending_messages:
        student = message.sender
        if student.id not in students:
            students[student.id] = {
                'id': student.id,
                'username': student.username,
                'full_name': student.student.full_name if hasattr(student, 'student') else student.username,
                'latest_message': message.content,
                'timestamp': message.timestamp.isoformat()
            }

    return Response(list(students.values()))

# API cho admin lấy lịch sử chat với một sinh viên
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def chat_history(request, student_id):
    student = get_object_or_404(User, id=student_id)
    messages = Message.objects.filter(
        models.Q(sender=student, receiver__isnull=True) |  # Tin nhắn từ sinh viên
        models.Q(sender=student, receiver=request.user) |  # Tin nhắn từ sinh viên gửi admin
        models.Q(sender=request.user, receiver=student)    # Tin nhắn từ admin gửi sinh viên
    ).order_by('timestamp')

    message_data = [
        {
            'id': msg.id,
            'content': msg.content,
            'sender': msg.sender.username,
            'is_from_admin': msg.is_from_admin,
            'timestamp': msg.timestamp.isoformat()
        } for msg in messages
    ]
    return Response(message_data)

