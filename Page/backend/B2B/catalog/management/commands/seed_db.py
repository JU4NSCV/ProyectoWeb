from django.core.management.base import BaseCommand
from django.utils.text import slugify
from datetime import date, timedelta

# Importamos todos nuestros modelos de la arquitectura B2B
from users.models import CustomUser
from subscriptions.models import PlanSuscripcion, Suscripcion
from catalog.models import Categoria, Producto

class Command(BaseCommand):
    help = 'Puebla la base de datos con datos de prueba realistas para el MVP de Bazar B2B'

    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando el proceso de Seeding para BAZAR B2B...")

        # ---------------------------------------------------------
        # 1. CREAR PLANES DE SUSCRIPCIÓN
        # ---------------------------------------------------------
        plan_premium, _ = PlanSuscripcion.objects.get_or_create(
            nombre_plan="Premium B2B",
            defaults={'precio_mensual': 49.99, 'limite_productos': 500, 'destacado': True}
        )
        self.stdout.write(self.style.SUCCESS("✅ Planes de Suscripción listos."))

        # ---------------------------------------------------------
        # 2. CREAR MAYORISTAS (PROVEEDORES) Y SUSCRIBIRLOS
        # ---------------------------------------------------------
        proveedores_data = [
            {'user': 'tech_wholesale', 'razon': 'Tech Wholesale S.A.', 'ruc': '1100223344001'},
            {'user': 'home_distribuidora', 'razon': 'Distribuidora del Hogar', 'ruc': '0998877665001'}
        ]

        mayoristas = []
        for p in proveedores_data:
            mayorista, created = CustomUser.objects.get_or_create(
                username=p['user'],
                defaults={
                    'email': f"{p['user']}@bazar.com",
                    'rol': 'MAYORISTA',
                    'ruc': p['ruc'],
                    'razon_social': p['razon'],
                    'empresa_verificada': True
                }
            )
            if created:
                mayorista.set_password('bazar123') # Contraseña por defecto
                mayorista.save()
            
            # Le asignamos la suscripción para que las reglas de negocio no fallen
            Suscripcion.objects.get_or_create(
                usuario=mayorista,
                defaults={
                    'plan': plan_premium,
                    'fecha_fin': date.today() + timedelta(days=365),
                    'estado': 'ACTIVA'
                }
            )
            mayoristas.append(mayorista)
        
        self.stdout.write(self.style.SUCCESS("✅ Proveedores (Mayoristas) y Suscripciones listos."))

        # ---------------------------------------------------------
        # 3. CREAR CATEGORÍAS
        # ---------------------------------------------------------
        categorias = ['Electrónica', 'Hogar y Cocina', 'Ferretería', 'Oficina']
        cat_objs = {}
        for cat in categorias:
            obj, _ = Categoria.objects.get_or_create(
                nombre=cat, 
                defaults={'slug': slugify(cat), 'descripcion': f"Productos al por mayor de {cat}"}
            )
            cat_objs[cat] = obj

        self.stdout.write(self.style.SUCCESS("✅ Categorías listas."))

        # ---------------------------------------------------------
        # 4. CREAR PRODUCTOS (Catálogo B2B)
        # ---------------------------------------------------------
        productos_data = [
            {
                'categoria': cat_objs['Electrónica'], 'proveedor': mayoristas[0],
                'nombre': 'Auriculares Inalámbricos Bluetooth 5.0 (Lote x50)', 'sku': 'ELEC-AUD-001',
                'desc': 'Ideales para reventa. Batería de 12 horas. Empaque retail incluido.',
                'stock': 500, 'precio_pub': 25.00, 'precio_min': 12.50, 'moq': 50, 'lote': 50
            },
            {
                'categoria': cat_objs['Electrónica'], 'proveedor': mayoristas[0],
                'nombre': 'Cables Cargador USB-C de Carga Rápida', 'sku': 'ELEC-CAB-002',
                'desc': 'Cables mallados de alta resistencia. Venta en cajas de 100 unidades.',
                'stock': 2000, 'precio_pub': 5.00, 'precio_min': 1.20, 'moq': 100, 'lote': 100
            },
            {
                'categoria': cat_objs['Hogar y Cocina'], 'proveedor': mayoristas[1],
                'nombre': 'Set de Sartenes Antiadherentes (Caja x6)', 'sku': 'HOG-SAR-001',
                'desc': 'Set de 3 tamaños. Cerámica premium. La caja contiene 6 sets.',
                'stock': 120, 'precio_pub': 45.00, 'precio_min': 28.00, 'moq': 12, 'lote': 6
            },
            {
                'categoria': cat_objs['Hogar y Cocina'], 'proveedor': mayoristas[1],
                'nombre': 'Licuadoras Industriales 1500W', 'sku': 'HOG-LIC-002',
                'desc': 'Motor de alto rendimiento. Garantía de 1 año.',
                'stock': 40, 'precio_pub': 120.00, 'precio_min': 85.00, 'moq': 4, 'lote': 2
            },
            {
                'categoria': cat_objs['Ferretería'], 'proveedor': mayoristas[0],
                'nombre': 'Taladro Percutor 800W Profesional', 'sku': 'FER-TAL-001',
                'desc': 'Incluye maletín y set de brocas. Excelente margen de ganancia para ferreterías.',
                'stock': 80, 'precio_pub': 90.00, 'precio_min': 65.00, 'moq': 5, 'lote': 5
            },
            {
                'categoria': cat_objs['Oficina'], 'proveedor': mayoristas[1],
                'nombre': 'Resmas de Papel A4 75g (Caja x10)', 'sku': 'OFI-PAP-001',
                'desc': 'Papel ecológico. Alta blancura. Venta por pallet o media pallet.',
                'stock': 1000, 'precio_pub': 6.00, 'precio_min': 3.80, 'moq': 50, 'lote': 10
            }
        ]

        for prod in productos_data:
            Producto.objects.get_or_create(
                sku=prod['sku'],
                defaults={
                    'categoria': prod['categoria'],
                    'proveedor': prod['proveedor'],
                    'nombre': prod['nombre'],
                    'descripcion': prod['desc'],
                    'stock_disponible': prod['stock'],
                    'precio_publico': prod['precio_pub'],
                    'precio_minorista': prod['precio_min'],
                    'moq': prod['moq'],
                    'multiplo_lote': prod['lote'],
                    'activo': True
                }
            )

        self.stdout.write(self.style.SUCCESS("✅ ¡Catálogo de Productos generado con éxito!"))
        self.stdout.write(self.style.WARNING("👉 Contraseña para usuarios de prueba: 'bazar123'"))
        self.stdout.write(self.style.SUCCESS("🎉 LA BASE DE DATOS ESTÁ LISTA PARA EL FRONTEND."))