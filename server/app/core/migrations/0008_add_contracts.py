# core/migrations/0008_add_contracts.py
from django.db import migrations
from django.utils import timezone

def add_contracts(apps, schema_editor):
    Student = apps.get_model('core', 'Student')
    Room = apps.get_model('core', 'Room')
    Contract = apps.get_model('core', 'Contract')
    
    # Lấy sinh viên và phòng
    student1 = Student.objects.get(student_id='SV001')  # Nguyễn Văn A
    student2 = Student.objects.get(student_id='SV002')  # Trần Thị B
    room_101 = Room.objects.get(number='101')  # Tòa A1, tầng 1
    room_201 = Room.objects.get(number='201')  # Tòa A2, tầng 2
    
    # Tạo hợp đồng
    contracts = [
        {
            'student': student1,
            'room': room_101,
            'start_date': timezone.datetime(2025, 1, 1).date(),
            'end_date': timezone.datetime(2025, 12, 31).date(),
        },
        {
            'student': student2,
            'room': room_201,
            'start_date': timezone.datetime(2025, 1, 1).date(),
            'end_date': timezone.datetime(2025, 12, 31).date(),
        },
    ]
    Contract.objects.bulk_create([Contract(**contract) for contract in contracts])

def remove_contracts(apps, schema_editor):
    Contract = apps.get_model('core', 'Contract')
    Contract.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0007_add_students'),
    ]

    operations = [
        migrations.RunPython(add_contracts, remove_contracts),
    ]