from django.db import migrations

def add_areas(apps, schema_editor):
    Area = apps.get_model('core', 'Area')
    areas = [
        {'name': 'Khu A'},
        {'name': 'Khu B'},
    ]
    for area in areas:
        Area.objects.create(name=area['name'])

def remove_areas(apps, schema_editor):
    Area = apps.get_model('core', 'Area')
    Area.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0003_add_faculties'),
    ]

    operations = [
        migrations.RunPython(add_areas, remove_areas),
    ]