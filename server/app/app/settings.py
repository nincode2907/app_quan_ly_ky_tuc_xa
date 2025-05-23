"""
Django settings for app project.

Generated by 'django-admin startproject' using Django 5.1.7.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

from pathlib import Path
from decouple import config
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = config('DEBUG_MODE', default=False, cast=bool)
SECRET_KEY = config('SECRET_KEY', cast=str)
ALLOWED_HOSTS = ['*']

AUTH_USER_MODEL = 'core.User'

# Cloudinary
import cloudinary

cloudinary.config(
    cloud_name=config('CLOUDINARY_CLOUD_NAME'),
    api_key=config('CLOUDINARY_API_KEY'),
    api_secret=config('CLOUDINARY_API_SECRET'),
    secure=True
)

# Configuration
cloudinary.config(
    cloud_name = "dxxwcby8l",
    api_key = "448651448423589",
    api_secret = "ftGud0r1TTqp0CGp5tjwNmkAm-A", # Click 'View API Keys' above to copy your API secret
    secure=True
)


# Application definition

INSTALLED_APPS = [
    'jet.dashboard',
    'jet',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    "cloudinary",
    'cloudinary_storage',
    "core.apps.CoreConfig",
    'rest_framework',
    'oauth2_provider',
    'debug_toolbar',
    'ckeditor',
    'ckeditor_uploader',
    'channels',
    'drf_yasg',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

ROOT_URLCONF = 'app.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'app.wsgi.application'

ASGI_APPLICATION = 'app.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],  # Redis server
        },
    },
}

SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'OAuth2': {
            'type': 'oauth2',
            'flow': 'accessCode',
            'authorizationUrl': '/o/authorize/',
            'tokenUrl': '/o/token/',
            'scopes': {
                'read': 'Read scope',
                'write': 'Write scope',
            },
        },
    },
    'DEFAULT_INFO': 'core.swagger.swagger_info',
    'USE_SESSION_AUTH': False,
    'PERSIST_AUTH': True,
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
        'oauth2_provider.contrib.rest_framework.OAuth2Authentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated', 
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

OAUTH2_PROVIDER = {
    'OAUTH2_BACKEND_CLASS': 'oauth2_provider.oauth2_backends.JSONOAuthLibCore',
    'ACCESS_TOKEN_EXPIRE_SECONDS': 3600,  # Access token hết hạn sau 1 giờ
    'REFRESH_TOKEN_EXPIRE_SECONDS': 1209600,  # Refresh token hết hạn sau 14 ngày
    'SCOPES': {
        'read': 'Read scope',
        'write': 'Write scope',
    },
}



JET_THEMES = [
    {
        'theme': 'default', 
        'color': '#47bac1', 
        'title': 'Default' 
    },
    {
        'theme': 'green',
        'color': '#44b78b',
        'title': 'Green'
    },
    {
        'theme': 'light-green',
        'color': '#2faa60',
        'title': 'Light Green'
    },
    {
        'theme': 'light-violet',
        'color': '#a464c4',
        'title': 'Light Violet'
    },
    {
        'theme': 'light-blue',
        'color': '#5EADDE',
        'title': 'Light Blue'
    },
    {
        'theme': 'light-gray',
        'color': '#222',
        'title': 'Light Gray'
    }
]

JET_APP_INDEX_DASHBOARD = 'jet.dashboard.dashboard.DefaultAppIndexDashboard'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

CKEDITOR_UPLOAD_PATH = "uploads/"
CKEDITOR_IMAGE_BACKEND = "pillow"
CKEDITOR_CONFIGS = {
    'default': {
        'toolbar': 'Full',
        'height': 300,
        'width': '100%',
    },
}

# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    # {
    #     'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    # },
    # {
    #     'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    # },
    # {
    #     'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    # },
    # {
    #     'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    # },
]

# settings Gmail SMTP
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com') 
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int) 
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool) 
EMAIL_HOST_USER = config('EMAIL_HOST_USER') 
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD') 
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL') 

# setting payment momo url
SANDBOX_REDIRECT_URL="https://" + ALLOWED_HOSTS[0] + "/api/payment_success/"
SANDBOX_IPN_URL="https://" + ALLOWED_HOSTS[0] + "/api/momo_notify/"

# API KEY
API_KEY = config('API_KEY')

INTERNAL_IPS = [
    '127.0.0.1',
]

MAX_VIOLATIONS = config('MAX_VIOLATIONS_BEFORE_BLOCK', default=8, cast=int)
RATELIMIT_VIEW = 'yourapp.views.ratelimit_view'

# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Ho_Chi_Minh'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CLIENT_ID = 'ltfXMk4dMHw5Nf4ftDx5Jpr49OoxH0rMJ9rCf8X3',
CLIENT_SECRET = '2GpfrO6XBVCiK5tdSFXWtmMXNPhOC1Q5VR5AcHeCDfoQPqUAJGEXe9hd1yytqMDtjhfjPLu0JyGOqTK40swSxG9FwivoHYRonxFNUV5ADqIihcirJQgHbpyXrZ74pmIJ',