from rest_framework import permissions
from .models import Student

class IsAdminOrSelf(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        if isinstance(obj, Student):
            return obj.user == request.user
        if hasattr(obj, 'student') and obj.student.user:
            return obj.student.user == request.user
        return False
    
class IsAdminCustom(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and getattr(request.user, 'is_admin', False)