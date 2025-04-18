# core/migrations/0007_add_students.py
from django.db import migrations
from django.utils import timezone
from django.contrib.auth.hashers import make_password

def add_students(apps, schema_editor):
    Faculty = apps.get_model('core', 'Faculty')
    Student = apps.get_model('core', 'Student')
    User = apps.get_model('core', 'User')
    
    # Lấy khoa
    cntt = Faculty.objects.get(code='CNTT')
    ktpm = Faculty.objects.get(code='KTPM')
    
    # Tạo user
    user1 = User.objects.create(
        email='nguyenvana@example.com',
        first_name='Nguyễn',
        last_name='Văn A',
        password=make_password('123')
    )
    user1.save()
    
    user2 = User.objects.create(
        email='tranthib@example.com',
        first_name='Trần',
        last_name='Thị B',
        password=make_password('123')
    )
    user2.save()
    
    # Tạo sinh viên
    students = [
        {
            'full_name': 'Nguyễn Văn A',
            'faculty': cntt,
            'year_start': 2023,
            'gender': 'male',
            'home_town': 'Hà Nội',
            'date_of_birth': timezone.datetime(2000, 1, 1).date(),
            'student_id': 'SV001',
            'violation_count': 0,
            'is_blocked': False,
            'user': user1,
        },
        {
            'full_name': 'Trần Thị B',
            'faculty': ktpm,
            'year_start': 2023,
            'gender': 'female',
            'home_town': 'TP.HCM',
            'date_of_birth': timezone.datetime(2000, 1, 1).date(),
            'student_id': 'SV002',
            'violation_count': 0,
            'is_blocked': False,
            'user': user2,
        },
    ]
    Student.objects.bulk_create([Student(**student) for student in students])

def remove_students(apps, schema_editor):
    Student = apps.get_model('core', 'Student')
    User = apps.get_model('core', 'User')
    Student.objects.all().delete()
    User.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0006_add_rooms'),
    ]

    operations = [
        migrations.RunPython(add_students, remove_students),
    ]