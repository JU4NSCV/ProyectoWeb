from django.db import models
from django.conf import settings

class Pedido(models.Model):
    # Estados lógicos para la gestión operativa (Módulo Backoffice)
    class EstadosPedido(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente de Aprobación'
        APROBADO = 'APROBADO', 'Aprobado / En Preparación'
        DESPACHADO = 'DESPACHADO', 'Despachado / En Envío'
        ENTREGADO = 'ENTREGADO', 'Entregado con Éxito'
        CANCELADO = 'CANCELADO', 'Cancelado'

    # Relación: Quién hace la compra (Minorista o Consumidor Final)
    cliente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mis_pedidos'
    )
    
    # Datos Estáticos de la Transacción (Por seguridad e historial fiscal)
    fecha_pedido = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(
        max_length=20,
        choices=EstadosPedido.choices,
        default=EstadosPedido.PENDIENTE
    )
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    direccion_entrega_final = models.TextField(help_text="Dirección física exacta para este despacho")
    notas_pedido = models.TextField(blank=True, null=True, help_text="Instrucciones especiales")

    def __str__(self):
        return f"Pedido #{self.id} - {self.cliente.username} ({self.get_estado_display()})"

    class Meta:
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"


class DetallePedido(models.Model):
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name='detalles' # Permite hacer: pedido.detalles.all()
    )
    # Usamos PROTECT para que si el mayorista borra un producto, no se altere el historial de ventas anterior
    producto = models.ForeignKey(
        'catalog.Producto',
        on_delete=models.PROTECT,
        related_name='unidades_vendidas'
    )
    cantidad = models.PositiveIntegerField()
    
    # ¡Súper Crítico en B2B! El precio se guarda estático aquí en el momento exacto del checkout.
    # Así, si el mayorista cambia el precio mañana, la orden de compra vieja mantiene el valor original acordado.
    precio_unitario_guardado = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.cantidad}x {self.producto.nombre} (Pedido #{self.pedido.id})"

    # Propiedad calculada para sacar el subtotal de la línea
    @property
    def subtotal(self):
        # Validamos que ambos campos tengan un valor antes de multiplicar
        if self.cantidad is not None and self.precio_unitario_guardado is not None:
            return self.cantidad * self.precio_unitario_guardado
        return 0.00

    class Meta:
        verbose_name = "Detalle de Pedido"
        verbose_name_plural = "Detalles de Pedidos"