from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from .views import user_me, change_password
from django.urls import re_path

router = DefaultRouter()
router.register(r'students', views.StudentViewSet)
router.register(r'areas', views.AreaViewSet)
router.register(r'buildings', views.BuildingViewSet)
router.register(r'room-types', views.RoomTypeViewSet)
router.register(r'rooms', views.RoomViewSet)
router.register(r'room-requests', views.RoomRequestViewSet)
router.register(r'contracts', views.ContractViewSet)
router.register(r'violations', views.ViolationViewSet)
router.register(r'bills', views.BillViewSet)
router.register(r'notifications', views.UserNotificationsViewSet)
router.register(r'support-requests', views.SupportRequestViewSet)
router.register(r'payment-methods', views.PaymentMethodViewSet)
router.register(r'payment-transactions', views.PaymentTransactionViewSet)
router.register(r'issue-reports', views.IssueReportViewSet, basename='issue-report')
router.register(r'surveys', views.SurveyViewSet, basename='survey')
router.register(r'survey-responses', views.SurveyResponseViewSet, basename='survey-response')
router.register(r'survey-questions', views.SurveyQuestionViewSet, basename='survey-question')
router.register(r'checkinout-logs', views.CheckInOutLogViewSet, basename='checkinout-log')
router.register(r'messages', views.MessageViewSet, basename='message')
router.register(r'conversations', views.ConversationStateViewSet, basename='conversation')

urlpatterns = [
    path('user/me/', user_me, name='user_me'),
    path('user/change_password/', change_password, name='change_password'),
    path('user/reset-password/', views.reset_password, name='reset_password'),
    path('request-otp/', views.request_otp, name='request_otp'),
    path('verify-otp/', views.verify_otp, name='verify_otp'),
    path('payment/initiate-payment/', views.initiate_payment, name='initiate_payment'),
    path('payment/payment_success/', views.payment_success, name='payment_success'),
    path("payment/payment_notify/", views.payment_notify, name="payment_notify"),
    path('', include(router.urls)),
]