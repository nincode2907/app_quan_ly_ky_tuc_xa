"""
URL configuration for app project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf import settings
from django.urls import path, include
from core.admin import admin_site
import debug_toolbar

urlpatterns = [
    path('jet/', include('jet.urls')),  # UI (bắt buộc)
    path('jet/dashboard/', include('jet.dashboard.urls', namespace='jet-dashboard')),
    path('o/', include('oauth2_provider.urls',namespace='oauth2_provider')),
    path('api/', include('core.urls')),
    path('admin/', admin_site.urls),
]

if settings.DEBUG:
    urlpatterns += [
        path('__debug__/', include(debug_toolbar.urls)),
    ]