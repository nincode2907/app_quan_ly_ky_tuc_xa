from django.db import migrations

def add_room_types(apps, schema_editor):
    RoomType = apps.get_model('core', 'RoomType')
    room_types = [
        {'name': 'A4', 'capacity': 8, 'price': 500000},
        {'name': 'A3', 'capacity': 6, 'price': 600000},
        {'name': 'A2', 'capacity': 4, 'price': 800000},
        {'name': 'A1', 'capacity': 2, 'price': 1200000},
        {'name': 'A0', 'capacity': 1, 'price': 2000000},
    ]
    for room_type in room_types:
        RoomType.objects.create(
            name=room_type['name'],
            capacity=room_type['capacity'],
            price=room_type['price']
        )

def remove_room_types(apps, schema_editor):
    RoomType = apps.get_model('core', 'RoomType')
    RoomType.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(add_room_types, remove_room_types),
    ]