from django.db import migrations

def add_buildings(apps, schema_editor):
    Area = apps.get_model('core', 'Area')
    Building = apps.get_model('core', 'Building')
    
    khu_a = Area.objects.get(name='Khu A')
    khu_b = Area.objects.get(name='Khu B')
    
    buildings = [
        {'name': 'A1', 'area': khu_a, 'gender': 'male'},
        {'name': 'A2', 'area': khu_a, 'gender': 'female'},
        {'name': 'B1', 'area': khu_b, 'gender': 'male'},
        {'name': 'B2', 'area': khu_b, 'gender': 'female'},
    ]
    for building in buildings:
        Building.objects.create(
            name=building['name'],
            area=building['area'],
            gender=building['gender']
        )

def remove_buildings(apps, schema_editor):
    Building = apps.get_model('core', 'Building')
    Building.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0004_add_areas'),
    ]

    operations = [
        migrations.RunPython(add_buildings, remove_buildings),
    ]