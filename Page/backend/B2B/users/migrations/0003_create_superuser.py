from django.db import migrations
from django.contrib.auth.hashers import make_password

def create_superuser(apps, schema_editor):
    User = apps.get_model('users', 'CustomUser')
    if not User.objects.filter(username='admin').exists():
        User.objects.create(
            username='admin',
            email='admin@admin.com',
            password=make_password('admin123'),
            is_superuser=True,
            is_staff=True,
            is_active=True,
            rol='ADMIN'
        )

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_customuser_documento_verificacion_and_more'),
    ]

    operations = [
        migrations.RunPython(create_superuser),
    ]
