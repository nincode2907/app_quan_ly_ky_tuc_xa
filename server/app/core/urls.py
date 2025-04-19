from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from .views import user_me, change_password

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

urlpatterns = [
    path('user/me/', user_me, name='user_me'),
    path('user/change_password/', change_password, name='change_password'),
    path('', include(router.urls)),
]