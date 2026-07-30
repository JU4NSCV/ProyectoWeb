from django.db import models, transaction
from django.conf import settings
from datetime import date, timedelta
import uuid

class SuscripcionManager(models.Manager):
    def activar_suscripcion(self, usuario, plan):
        with transaction.atomic():
            transaccion_id = f'SIM-{uuid.uuid4().hex[:12].upper()}'
            suscripcion, creada = self.update_or_create(
                usuario=usuario,
                defaults={
                    'plan': plan,
                    'fecha_fin': date.today() + timedelta(days=30),
                    'estado': self.model.Estados.ACTIVA,
                    'transaccion_pasarela_id': transaccion_id,
                }
            )
        return suscripcion, creada, transaccion_id


class PlanSuscripcion(models.Model):
    nombre_plan = models.CharField(max_length=100, help_text="Ej: Básico, Premium, VIP")
    precio_mensual = models.DecimalField(max_digits=10, decimal_places=2)
    limite_productos = models.PositiveIntegerField(help_text="Cantidad máxima de productos que puede publicar")
    destacado = models.BooleanField(default=False, help_text="Si es True, se resalta en el frontend")

    def __str__(self):
        return f"{self.nombre_plan} ({self.limite_productos} prod.)"

    class Meta:
        verbose_name_plural = "Planes de Suscripción"

class Suscripcion(models.Model):
    class Estados(models.TextChoices):
        ACTIVA = 'ACTIVA', 'Activa'
        VENCIDA = 'VENCIDA', 'Vencida'

    # Un usuario solo puede tener una suscripción activa a la vez
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='suscripcion_activa',
        limit_choices_to={'rol': 'MAYORISTA'} # Solo los mayoristas se suscriben
    )
    plan = models.ForeignKey(PlanSuscripcion, on_delete=models.PROTECT)
    
    fecha_inicio = models.DateField(auto_now_add=True)
    fecha_fin = models.DateField(help_text="Fecha en la que expira el plan")
    estado = models.CharField(max_length=20, choices=Estados.choices, default=Estados.ACTIVA)
    transaccion_pasarela_id = models.CharField(max_length=100, blank=True, null=True, help_text="ID del pago en Stripe/PayPal")

    objects = SuscripcionManager()

    def __str__(self):
        return f"{self.usuario.username} - {self.plan.nombre_plan} [{self.estado}]"

    def verificar_vigencia(self):
        """Método de negocio: Cambia el estado a vencido si ya pasó la fecha fin"""
        if self.fecha_fin < date.today() and self.estado == 'ACTIVA':
            self.estado = 'VENCIDA'
            self.save()
            return False
        return self.estado == 'ACTIVA'

    def puede_publicar_producto(self, total_productos_actuales):
        if not self.verificar_vigencia():
            return False, 'Tu suscripción ha vencido. Renueva tu plan para publicar más productos.'
        if total_productos_actuales >= self.plan.limite_productos:
            return False, f'Has alcanzado el límite de tu plan ({self.plan.limite_productos} productos). Mejora tu suscripción para publicar más.'
        return True, ''