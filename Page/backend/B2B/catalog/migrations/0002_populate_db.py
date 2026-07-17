from django.db import migrations
from django.utils.text import slugify
from django.contrib.auth.hashers import make_password
from datetime import date, timedelta
import random

def populate_database(apps, schema_editor):
    Categoria = apps.get_model('catalog', 'Categoria')
    Producto = apps.get_model('catalog', 'Producto')
    PlanSuscripcion = apps.get_model('subscriptions', 'PlanSuscripcion')
    Suscripcion = apps.get_model('subscriptions', 'Suscripcion')
    CustomUser = apps.get_model('users', 'CustomUser')

    # 1. Crear Categorías
    categorias_nombres = ["Electrónica", "Hogar", "Ferretería", "Ropa"]
    categorias = []
    for nombre in categorias_nombres:
        cat, created = Categoria.objects.get_or_create(
            nombre=nombre,
            defaults={'slug': slugify(nombre), 'descripcion': f'Productos de {nombre}'}
        )
        categorias.append(cat)

    # 2. Crear Planes de Suscripción
    planes_data = [
        {'nombre_plan': 'Freemium', 'precio_mensual': 0.00, 'limite_productos': 50, 'destacado': False},
        {'nombre_plan': 'Plan Básico', 'precio_mensual': 39.00, 'limite_productos': 150, 'destacado': True},
        {'nombre_plan': 'Plan Pro', 'precio_mensual': 99.00, 'limite_productos': 1000, 'destacado': False},
    ]
    planes = []
    for data in planes_data:
        plan, created = PlanSuscripcion.objects.get_or_create(
            nombre_plan=data['nombre_plan'],
            defaults=data
        )
        planes.append(plan)

    # 3. Crear 2 Mayoristas
    mayoristas_data = [
        {'username': 'distribuidora_sur', 'email': 'sur@ejemplo.com', 'razon_social': 'Distribuidora del Sur S.A.'},
        {'username': 'importaciones_norte', 'email': 'norte@ejemplo.com', 'razon_social': 'Importaciones Norte Ltda.'}
    ]
    mayoristas = []
    for data in mayoristas_data:
        user, created = CustomUser.objects.get_or_create(
            username=data['username'],
            defaults={
                'email': data['email'],
                'password': make_password('mayorista123'),
                'rol': 'MAYORISTA',
                'empresa_verificada': True,
                'razon_social': data['razon_social'],
                'is_active': True
            }
        )
        mayoristas.append(user)

    # 4. Asignar Suscripciones a los Mayoristas
    for user in mayoristas:
        # Asignar Plan Básico (index 1) o Pro (index 2)
        Suscripcion.objects.get_or_create(
            usuario=user,
            defaults={
                'plan': planes[1], # Plan Básico
                'fecha_fin': date.today() + timedelta(days=365),
                'estado': 'ACTIVA',
                'transaccion_pasarela_id': f'SIM-POPULATE-{user.id}'
            }
        )

    # 5. Crear 10 Productos para cada Mayorista
    for i, mayorista in enumerate(mayoristas):
        for j in range(1, 11):
            sku = f"PROD-{mayorista.username[:3].upper()}-{j:03d}"
            Producto.objects.get_or_create(
                sku=sku,
                defaults={
                    'nombre': f'Producto Genial {j} de {mayorista.razon_social}',
                    'categoria': random.choice(categorias),
                    'proveedor': mayorista,
                    'descripcion': f'Este es un excelente producto vendido por {mayorista.razon_social}. Calidad garantizada.',
                    'stock_disponible': random.randint(50, 500),
                    'precio_publico': round(random.uniform(20.0, 100.0), 2),
                    'precio_minorista': round(random.uniform(10.0, 18.0), 2),
                    'moq': random.choice([1, 5, 10]),
                    'multiplo_lote': random.choice([1, 5]),
                }
            )

class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0001_initial'),
        ('subscriptions', '0001_initial'),
        ('users', '0003_create_superuser'),
    ]

    operations = [
        migrations.RunPython(populate_database),
    ]
