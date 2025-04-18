from django.db import migrations

def add_rooms(apps, schema_editor):
    Building = apps.get_model('core', 'Building')
    RoomType = apps.get_model('core', 'RoomType')
    Room = apps.get_model('core', 'Room')
    
    a1 = Building.objects.get(name='A1')
    a2 = Building.objects.get(name='A2')
    b1 = Building.objects.get(name='B1')
    b2 = Building.objects.get(name='B2')
    
    ra4 = RoomType.objects.get(name='A4')
    ra3 = RoomType.objects.get(name='A3')
    ra2 = RoomType.objects.get(name='A2')
    ra1 = RoomType.objects.get(name='A1')
    ra0 = RoomType.objects.get(name='A0')
    
    rooms = [
        {'number': '101', 'building': a1, 'room_type': ra4, 'floor': 1},
        {'number': '102', 'building': a1, 'room_type': ra3, 'floor': 1},
        {'number': '201', 'building': a2, 'room_type': ra4, 'floor': 2},
        {'number': '202', 'building': a2, 'room_type': ra3, 'floor': 2},
        {'number': '301', 'building': b1, 'room_type': ra2, 'floor': 3},
        {'number': '302', 'building': b1, 'room_type': ra1, 'floor': 3},
        {'number': '401', 'building': b2, 'room_type': ra2, 'floor': 4},
        {'number': '402', 'building': b2, 'room_type': ra0, 'floor': 4},
    ]
    for room in rooms:
        Room.objects.create(
            number=room['number'],
            building=room['building'],
            room_type=room['room_type'],
            floor=room['floor'],
            available_slots=room['room_type'].capacity
        )

def remove_rooms(apps, schema_editor):
    Room = apps.get_model('core', 'Room')
    Room.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0005_add_buildings'),
        ('core', '0002_add_room_types'),
    ]

    operations = [
        migrations.RunPython(add_rooms, remove_rooms),
    ]