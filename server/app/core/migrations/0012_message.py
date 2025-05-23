# Generated by Django 5.1.7 on 2025-05-02 08:32

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_alter_paymentmethod_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('status', models.CharField(choices=[('PENDING_AI', 'Đang chờ AI'), ('PENDING_ADMIN', 'Đang chờ admin'), ('RESOLVED', 'Đã giải quyết')], default='PENDING_AI', max_length=20)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('is_from_admin', models.BooleanField(default=False)),
                ('receiver', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='received_messages', to=settings.AUTH_USER_MODEL)),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_messages', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['timestamp'],
            },
        ),
    ]
