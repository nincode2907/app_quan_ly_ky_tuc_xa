# Generated by Django 5.1.7 on 2025-04-26 08:44

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_add_students'),
    ]

    operations = [
        migrations.RenameField(
            model_name='bill',
            old_name='paid_at',
            new_name='paid_date',
        ),
    ]
