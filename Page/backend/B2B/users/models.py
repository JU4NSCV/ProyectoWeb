from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager

class CustomUserManager(UserManager):
    def empresas_pendientes(self):
        return self.filter(
            rol__in=['MINORISTA', 'MAYORISTA'],
            empresa_verificada=False
        ).order_by('-date_joined')

class CustomUser(AbstractUser):

    # 1. Definición de Roles (Opciones fijas)
    class Roles(models.TextChoices):
        VISITANTE = 'VISITANTE', 'Visitante'
        CONSUMIDOR = 'CONSUMIDOR', 'Consumidor Final'
        MINORISTA = 'MINORISTA', 'Minorista (Tienda B2B)'
        MAYORISTA = 'MAYORISTA', 'Mayorista (Proveedor)'
        ADMIN = 'ADMIN', 'Super Administrador'

    rol = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.VISITANTE,
        help_text="Rol del usuario en la plataforma"
    )

    # 2. Atributos Fiscales (Van en blanco si es un visitante o consumidor normal)
    ruc = models.CharField(max_length=20, blank=True, null=True, help_text="RUC o Identificación fiscal")
    razon_social = models.CharField(max_length=255, blank=True, null=True)
    direccion_matriz = models.TextField(blank=True, null=True)
    telefono_contacto = models.CharField(max_length=20, blank=True, null=True)

    # 2.5 Atributos de Suscripción (Nuevo)
    plan_actual = models.CharField(
        max_length=50, 
        default='PRUEBA_GRATUITA', 
        help_text="Plan activo del usuario"
    )
    fecha_fin_suscripcion = models.DateTimeField(null=True, blank=True)
    
    # 3. Validaciones de Seguridad (LOPD / B2B)
    empresa_verificada = models.BooleanField(
        default=False,
        help_text="Indica si el admin ya revisó el RUC y aprobó a esta empresa"
    )
    documento_verificacion = models.FileField(upload_to='documentos_fiscales/', blank=True, null=True, help_text="Sube RUC o Patente Comercial")
    
    objects = CustomUserManager()
    
    def __str__(self):
        return f"{self.username} - {self.get_rol_display()}"