from django.shortcuts import render
from rest_framework import viewsets, permissions, generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.parsers import MultiPartParser, FormParser
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError
from .models import Message, ConversationState, SystemContext, FavoriteRoom, Survey,CheckInOutLog,QRCode, SurveyResponse,SurveyQuestion, IssueReport, Notification, SupportRequest, User, Student, Area, Building, RoomType, Room, Contract, Violation, Bill, RoomRequest, UserNotification, PaymentMethod, PaymentTransaction
from core import serializers
from .perms import IsAdminOrSelf, IsAdminCustom
from .services.create_otp import OTPService
from .services import process_qr_scan
import random
import string
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.shortcuts import get_object_or_404
import re
from django.db.models import Avg, Count
from .services.payment import PaymentService
from core.services.send_email import EmailService
from django_ratelimit.decorators import ratelimit
from oauth2_provider.models import AccessToken, RefreshToken
from drf_yasg.utils import swagger_auto_schema
from django.db import transaction
from drf_yasg import openapi
from cloudinary.uploader import upload
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from oauth2_provider.contrib.rest_framework import OAuth2Authentication
# import openai

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
    @swagger_auto_schema(
        operation_description="Get current student's information.",
        responses={200: serializers.StudentSerializer, 400: openapi.Response('Error')}
    )
    @action(detail=False, methods=['get'], url_path='me')
    def get_student_info(self, request):
        try:
            student = request.user.students
        except Student.DoesNotExist:
            return Response({"error": "Không tìm thấy thông tin sinh viên."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = serializers.StudentSerializer(student)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(
        method='post',
        auto_schema=None
    )
    @action(detail=False, methods=['POST'], url_path='update-profile')
    def update_profile(self, request):
        user = request.user
        try:
            student = user.students
        except Student.DoesNotExist:
            return Response({"error": "Không tìm thấy thông tin sinh viên."}, status=status.HTTP_400_BAD_REQUEST)
        
        user_data = {}
        if 'phone' in request.data:
            user_data['phone'] = request.data.get('phone')
            
        avatar_file = request.data.get('avatar')
        if avatar_file:
            try:
                upload_result = upload(avatar_file)
                print(upload_result['public_id'])
                user_data['avatar'] = upload_result['public_id'] 
            except Exception as e:
                return Response({"error": f"Upload avatar failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            
        student_data = {}
        for field in ['home_town', 'date_of_birth', 'student_id', 'full_name']:
            if field in request.data:
                student_data[field] = request.data.get(field)
        
        user_serializer = serializers.UserSerializer(request.user, data=user_data, partial=True)
        student_serializer = serializers.StudentSerializer(student, data=student_data, partial=True)
        
        if user_serializer.is_valid() and student_serializer.is_valid():
            user_serializer.save()
            student_serializer.save()
            return Response({
                "message": "Cập nhật hồ sơ thành công.",
                "user": user_serializer.data,
                "student": student_serializer.data,
                "avatar_url": user_serializer.data.get('avatar')
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
        if not (16 <= day <= 20) and is_change_request:
            return Response({"error": "Chỉ được gửi yêu cầu chuyển phòng từ ngày 16 đến 20 hằng tháng."}, status=status.HTTP_400_BAD_REQUEST)
        
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

        favorite_room_ids = FavoriteRoom.objects.filter(student=student).values_list('room_id', flat=True)
        
        serializer = self.get_serializer(queryset, many=True)
        rooms_data = serializer.data
        
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
    
    @swagger_auto_schema(
        operation_description="Mark a notification as read.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'notification_id': openapi.Schema(type=openapi.TYPE_INTEGER),
            },
            required=['notification_id']
        ),
        responses={200: openapi.Response('Success'), 400: openapi.Response('Error'), 404: openapi.Response('Not Found')}
    )
    @action(detail=False, methods=['post'], url_path='mark-read')
    def mark_notification_read(self, request):
        notification_id = request.data.get('notification_id')
        if not notification_id:
            return Response({"error": "Thiếu thông tin."}, status=status.HTTP_400_BAD_REQUEST)
        
        if request.user.is_admin:
            return Response({"error": "Chỉ sinh viên mới có thể đánh dấu thông báo là đã đọc."}, status=status.HTTP_403_FORBIDDEN)

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
    
class IssueReportViewSet(viewsets.ModelViewSet):
    queryset = IssueReport.objects.all()
    serializer_class = serializers.IssueReportSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]

    def get_queryset(self):
        queryset = super().get_queryset().select_related('student')
        if not self.request.user.is_admin:
            try:
                student = self.request.user.students
                queryset = queryset.filter(student=student)
            except Student.DoesNotExist:
                return queryset.none()
        return queryset

    def perform_create(self, serializer):
        try:
            student = self.request.user.students
            serializer.save(student=student)
        except Student.DoesNotExist:
            raise ValidationError("Không tìm thấy thông tin sinh viên.")

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAdminUser])
    def resolve(self, request, pk=None):
        report = self.get_object()
        if report.status == 'RESOLVED':
            return Response({"error": "Phản ánh đã được xử lý."}, status=status.HTTP_400_BAD_REQUEST)

        response_text = request.data.get('response')
        if not response_text:
            return Response({"error": "Vui lòng cung cấp phản hồi."}, status=status.HTTP_400_BAD_REQUEST)
        
class SurveyQuestionViewSet(viewsets.ModelViewSet):
    queryset = SurveyQuestion.objects.all()
    serializer_class = serializers.SurveyQuestionSerializer
    permission_classes = [IsAdminCustom]
    
class SurveyViewSet(viewsets.ModelViewSet):
    queryset = Survey.objects.all()
    serializer_class = serializers.SurveySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'statistics']:
            return [IsAdminCustom()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset().prefetch_related('questions')
        if not self.request.user.is_admin:
            queryset = queryset.filter(is_active=True, end_date__gte=timezone.now())
        return queryset
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def perform_create(self, serializer):
        survey = serializer.save()
        notification = Notification.objects.create(
            title=f"{survey.title} - Khảo sát mới",
            content=f"Vui lòng tham gia khảo sát {survey.title}.",
            notification_type='NORMAL',
            target_type='ALL'
        )
        survey.notification = notification
        survey.save()

        print(f"Notification created for survey {survey.title} with ID {notification.id}")
        students = Student.objects.all()
        for student in students:
            UserNotification.objects.create(student=student, notification=notification)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def statistics(self, request, pk=None):
        survey = self.get_object()
        questions = survey.questions.all()
        stats = []

        for question in questions:
            responses = question.responses.all()
            if question.answer_type == 'RATING':
                avg_rating = responses.aggregate(Avg('rating'))['rating__avg'] or 0
                count = responses.count()
                stats.append({
                    'question': question.content,
                    'answer_type': question.answer_type,
                    'average_rating': round(avg_rating, 2),
                    'response_count': count
                })
            else:
                stats.append({
                    'question': question.content,
                    'answer_type': question.answer_type,
                    'responses': [r.text_answer for r in responses]
                })

        return Response(stats)

class SurveyResponseViewSet(viewsets.ModelViewSet):
    queryset = SurveyResponse.objects.all()
    serializer_class = serializers.SurveyResponseSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]

    def get_queryset(self):
        queryset = super().get_queryset().select_related('student', 'survey', 'question')
        if not self.request.user.is_admin:
            try:
                student = self.request.user.students
                queryset = queryset.filter(student=student)
            except Student.DoesNotExist:
                return queryset.none()
        return queryset

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        try:
            student = self.request.user.students
        except Student.DoesNotExist:
            return Response({"detail": "Không tìm thấy thông tin sinh viên."}, status=status.HTTP_400_BAD_REQUEST)

        if not isinstance(request.data, list):
            return Response({"detail": "Dữ liệu phải là một danh sách câu trả lời."}, status=status.HTTP_400_BAD_REQUEST)

        responses = []
        survey_id = request.data[0].get('survey') if request.data else None
        if not survey_id:
            return Response({"detail": "Không tìm thấy ID khảo sát."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            survey = Survey.objects.get(id=survey_id)
            if not survey.is_active or survey.end_date < timezone.now():
                return Response({"detail": "Khảo sát đã kết thúc hoặc không khả dụng."}, status=status.HTTP_400_BAD_REQUEST)
        except Survey.DoesNotExist:
            return Response({"detail": "Khảo sát không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        
        survey_serializer = serializers.SurveySerializer(survey, context={'request': request})
        if survey_serializer.data['is_completed']:
            return Response({"detail": "Bạn đã hoàn thành khảo sát này."}, status=status.HTTP_400_BAD_REQUEST)

        for response_data in request.data:
            if response_data.get('survey') != survey_id:
                return Response({"detail": "Tất cả câu trả lời phải thuộc cùng một khảo sát."}, status=status.HTTP_400_BAD_REQUEST)

        total_questions = survey.questions.count()
        if total_questions == 0:
            return Response({"detail": "Khảo sát không có câu hỏi để trả lời."}, status=status.HTTP_400_BAD_REQUEST)
        if len(request.data) != total_questions:
            return Response({"detail": f"Phải trả lời đúng {total_questions} câu hỏi, nhưng chỉ nhận được {len(request.data)} câu trả lời."}, status=status.HTTP_400_BAD_REQUEST)

        for response_data in request.data:
            response_data['student'] = student.id
            serializer = self.get_serializer(data=response_data)
            serializer.is_valid(raise_exception=True)

            existing_response = SurveyResponse.objects.filter(
                student=student,
                survey=survey,
                question=response_data['question']
            ).first()

            if existing_response:
                serializer = self.get_serializer(existing_response, data=response_data, partial=True)
                serializer.is_valid(raise_exception=True)
                response = serializer.save()
            else:
                response = serializer.save(student=student)
            responses.append(serializer.data)

        return Response(responses, status=status.HTTP_201_CREATED)
   
class CheckInOutLogViewSet(viewsets.ModelViewSet):
    queryset = CheckInOutLog.objects.all().select_related('student', 'building', 'qr_code').order_by('-check_time')
    serializer_class = serializers.CheckInOutLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]  

    @action(detail=False, methods=['post'], url_path='scan')
    def scan_qr(self, request):
        try:
            with transaction.atomic(): 
                data = request.data
                qr_token = data.get('qr_token')

                if not qr_token:
                    return Response({'status': 'error', 'message': 'Thiếu thông tin qr_token'}, status=status.HTTP_400_BAD_REQUEST)

                try:
                    student = request.user.students
                except (Student.DoesNotExist, AttributeError):
                    return Response({'status': 'error', 'message': 'Không tìm thấy thông tin sinh viên'}, status=status.HTTP_400_BAD_REQUEST)

                today = timezone.now().date()
                qr_code = QRCode.objects.filter(qr_token=qr_token, date=today).first()
                if not qr_code:
                    return Response({'status': 'error', 'message': 'Mã QR không hợp lệ hoặc hết hạn'}, status=status.HTTP_400_BAD_REQUEST)

                if qr_code.is_used:
                    return Response({'status': 'error', 'message': 'Mã QR đã được sử dụng'}, status=status.HTTP_400_BAD_REQUEST)

                building = student.room.building if student.room else None
                if not building:
                    return Response({'status': 'error', 'message': 'Sinh viên chưa có phòng'}, status=status.HTTP_400_BAD_REQUEST)

                last_log = CheckInOutLog.objects.filter(student=student, date=today).order_by('-check_time').first()
                new_status = 'CHECK_IN' if not last_log or last_log.status == 'CHECK_OUT' else 'CHECK_OUT'

                log = CheckInOutLog.objects.create(
                    student=student,
                    building=building,
                    qr_code=qr_code,
                    status=new_status,
                    check_time=timezone.now()
                )

                serializer = serializers.CheckInOutLogSerializer(log)
                return Response({
                    'status': 'success',
                    'message': f'{new_status.title()} thành công',
                    'action': new_status.lower(),
                    'data': serializer.data
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]

    def get_queryset(self):
        user = self.request.user
        conversation_state_id = self.request.query_params.get('conversation_state', None)

        if user.is_admin:
            if conversation_state_id:
                try:
                    conversation_state = ConversationState.objects.get(id=conversation_state_id)
                    messages = Message.objects.filter(conversation_state=conversation_state).order_by('-created_at')
                    print(f"Admin fetched {messages.count()} messages for conversation {conversation_state_id}")
                    return messages
                except ConversationState.DoesNotExist:
                    print(f"Conversation {conversation_state_id} not found for admin")
                    return Message.objects.none()
            print("No conversation_state_id provided for admin")
            return Message.objects.none()

        try:
            conversation_state = ConversationState.objects.filter(user=user).first()
            if not conversation_state:
                print(f"No conversation state found for user {user}")
                return Message.objects.none()
            messages = Message.objects.filter(conversation_state=conversation_state).order_by('-created_at')
            print(f"User {user} fetched {messages.count()} messages")
            return messages
        except Exception as e:
            print(f"Error fetching messages for user {user}: {e}")
            return Message.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        conversation_state, created = ConversationState.objects.get_or_create(user=user)
        conversation_state.last_message_at = timezone.now()
        conversation_state.save()

        message = serializer.save(
            conversation_state=conversation_state,
            sender=user
        )
        
        print(f"Message created by {user.username}: {message.content}")

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"chat_{user.id}",
            {
                "type": "chat_message",
                "message": serializers.MessageSerializer(message).data
            }
        )
        async_to_sync(channel_layer.group_send)(
            'chat_admin',
            {
                "type": "chat_message",
                "message": serializers.MessageSerializer(message).data
            }
        )

    @action(detail=False, methods=['get'], url_path='load-more')
    def load_more(self, request):
        user = request.user
        conversation_state_id = request.query_params.get('conversation_state', None)
        last_message_id = request.query_params.get('last_message_id', None)

        if not conversation_state_id:
            print("No conversation_state_id provided for load-more")
            return Response({"messages": [], "status": "no_conversation"}, status=status.HTTP_200_OK)

        try:
            conversation_state = ConversationState.objects.get(id=conversation_state_id)
            if user.is_admin or conversation_state.user == user:
                if last_message_id:
                    messages = Message.objects.filter(
                        conversation_state=conversation_state,
                        id__lt=last_message_id
                    ).order_by('-created_at')[:20]
                else:
                    messages = Message.objects.filter(
                        conversation_state=conversation_state
                    ).order_by('-created_at')[:20]

                print(f"Loaded {messages.count()} more messages for conversation {conversation_state_id}")
                
                if messages.count() == 0:
                    return Response({"messages": [], "status": "no_more_messages"}, status=status.HTTP_200_OK)

                return Response({
                    "messages": serializers.MessageSerializer(messages, many=True).data,
                    "status": "success"
                }, status=status.HTTP_200_OK)
            else:
                print(f"User {user} not authorized for conversation {conversation_state_id}")
                return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        except ConversationState.DoesNotExist:
            print(f"Conversation {conversation_state_id} not found")
            return Response({"messages": [], "status": "no_conversation"}, status=status.HTTP_200_OK)

class ConversationStateViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.ConversationStateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]
    authentication_classes = [OAuth2Authentication]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return ConversationState.objects.all().order_by('-last_message_at')
        return ConversationState.objects.filter(user=user)

    @action(detail=True, methods=['post'], url_path='mark-as-done')
    @csrf_exempt
    def mark_as_done(self, request, pk=None):
        conversation_state = self.get_object()
        if not request.user.is_admin:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        conversation_state.is_admin_handling = False
        conversation_state.save()
        return Response({"status": "Conversation marked as done"}, status=status.HTTP_200_OK)

# account
# /api/user/change_password/
@swagger_auto_schema(
    method='post',
    operation_description="Change user password.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'old_password': openapi.Schema(type=openapi.TYPE_STRING),
            'new_password': openapi.Schema(type=openapi.TYPE_STRING),
        },
        required=['new_password']
    ),
    responses={200: openapi.Response('Success'), 400: openapi.Response('Error')}
)
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
        
    if not re.match(password_pattern, new_password):
        return Response({
            "error": "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
        }, status=status.HTTP_400_BAD_REQUEST)
        
    user.set_password(new_password)
    user.is_first_login = False
    user.save()
    return Response({"message": "Đổi mật khẩu thành công."}, status=status.HTTP_200_OK)

# /api/user/reset-password/
@api_view(['POST'])
@permission_classes([])
def reset_password(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    
    if not email or not otp:
        return Response({"error": "Vui lòng cung cấp email và mã OTP."}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        if not OTPService.verify_otp(otp, email=email):
            return Response({"error": "Mã OTP không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)
        
        EmailService.send_new_password(email)
        response_data = {"message": "Mật khẩu mới đã được gửi đến email của bạn."}
        if request.user.is_authenticated:
            AccessToken.objects.filter(user=request.user).delete()
            RefreshToken.objects.filter(user=request.user).delete()
            response_data["message"] = "Mật khẩu đã được đặt lại, vui lòng đăng nhập lại."
        
        return Response(response_data, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# /api/user/request-otp/
api_key_param = openapi.Parameter(
    'x-api-key',
    openapi.IN_HEADER,
    description="API Key để xác thực request",
    type=openapi.TYPE_STRING,
    required=True
)

@swagger_auto_schema(
    method='post',
    manual_parameters=[api_key_param],
    operation_description="Gửi mã OTP tới email để đặt lại mật khẩu.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['email'],
        properties={
            'email': openapi.Schema(
                type=openapi.TYPE_STRING,
                format='email',
                description="Địa chỉ email"
            ),
        }
    ),
    responses={
        200: openapi.Response(description="Thành công - OTP đã gửi"),
        400: openapi.Response(description="Thiếu dữ liệu"),
        401: openapi.Response(description="API Key sai hoặc thiếu"),
        500: openapi.Response(description="Lỗi máy chủ")
    }
)
@api_view(['POST'])
@permission_classes([])
# @ratelimit(key='ip', rate='5/m', method='POST')
def request_otp(request):
    api_key = request.headers.get('x-api-key')
    if api_key != settings.API_KEY:
        return Response({"error": "Invalid API Key."}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        email = request.data.get('email')
        if not email:
            return Response({"error": "Thông tin không đầy đủ."}, status=status.HTTP_400_BAD_REQUEST)
        OTPService.create_and_send_otp(email=email)

        return Response({"message": "Mã OTP đã được gửi đến email của bạn."}, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
# /api/user/verify-otp/
@swagger_auto_schema(
    method='post',
    manual_parameters=[api_key_param],
    operation_description="Kiểm tra tính hợp lệ của mã OTP đã được gửi tới email.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['email', 'otp'],
        properties={
            'email': openapi.Schema(type=openapi.TYPE_STRING, format='email', description="Địa chỉ email nhận OTP"),
            'otp': openapi.Schema(type=openapi.TYPE_STRING, description="Mã OTP cần xác minh"),
        }
    ),
    responses={
        200: openapi.Response(description="Mã OTP hợp lệ"),
        400: openapi.Response(description="Dữ liệu không hợp lệ hoặc OTP sai"),
        401: openapi.Response(description="API Key không hợp lệ"),
        500: openapi.Response(description="Lỗi hệ thống")
    }
)
@api_view(['POST'])
@permission_classes([])
def verify_otp(request):
    api_key = request.headers.get('x-api-key')
    if api_key != settings.API_KEY:
        return Response({"error": "Invalid API Key."}, status=status.HTTP_401_UNAUTHORIZED)
    
    otp = request.data.get('otp')
    if not otp:
        return Response({"error": "Vui lòng cung cấp mã OTP."}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        email = request.data.get('email')
        if not email:
            return Response({"error": "Thông tin không đầy đủ."}, status=status.HTTP_400_BAD_REQUEST)

        if OTPService.verify_otp(otp, email=email) == False:
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
@swagger_auto_schema(
    method='post',
    auto_schema=None
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminOrSelf])
def initiate_payment(request):
    bill_id = request.data.get('bill_id')
    payment_method_id = request.data.get('payment_method_id')

    bill = get_object_or_404(Bill, id=bill_id, student__user=request.user)
    payment_method = get_object_or_404(PaymentMethod, id=payment_method_id)

    try:
        service = PaymentService.get_service(payment_method.name)
        pay_url = service.create_payment(bill)
        return Response({'status': 'success', 'pay_url': pay_url})
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
@csrf_exempt
@swagger_auto_schema(
    method='get',
    auto_schema=None
)
@api_view(['GET'])
@permission_classes([])
def payment_success(request):
    transaction_id = request.query_params.get('orderId')
    transaction = get_object_or_404(PaymentTransaction, transaction_id=transaction_id)
    payment_method = transaction.payment_method
    
    try:
        service = PaymentService.get_service(payment_method.name)
        success = service.handle_callback(request.query_params)
        return Response({
            'status': 'success' if success else 'failed',
            'transaction_id': transaction.transaction_id,
            'bill_id': transaction.bill.id,
            'amount': transaction.amount,
            'status_transaction': transaction.status
        }, status=status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST)
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
