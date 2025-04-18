from django.db import migrations

def add_faculties(apps, schema_editor):
    Faculty = apps.get_model('core', 'Faculty')
    faculties = [
        {'name': 'Công nghệ Thông tin', 'code': 'CNTT'},
        {'name': 'Kỹ thuật Phần mềm', 'code': 'KTPM'},
        {'name': 'Khoa học Máy tính', 'code': 'KHMT'},
    ]
    for faculty in faculties:
        Faculty.objects.create(name=faculty['name'], code=faculty['code'])

def remove_faculties(apps, schema_editor):
    Faculty = apps.get_model('core', 'Faculty')
    Faculty.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0002_add_room_types'),
    ]

    operations = [
        migrations.RunPython(add_faculties, remove_faculties),
    ]