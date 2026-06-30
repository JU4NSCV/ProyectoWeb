from django.contrib import admin
from .models import Pedido, DetallePedido

# Esto permite que los detalles aparezcan incrustados dentro del formulario del Pedido principal
class DetallePedidoInline(admin.TabularInline):
    model = DetallePedido
    extra = 0 # No añade filas vacías por defecto
    readonly_fields = ('subtotal',)

class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'cliente', 'fecha_pedido', 'estado', 'total')
    list_filter = ('estado', 'fecha_pedido')
    search_fields = ('cliente__username', 'id')
    # Añadimos los detalles dentro de la misma vista del pedido
    inlines = [DetallePedidoInline]
    
    # Pequeño truco automatizado: El admin no puede editar el total a mano, se calcula solo
    readonly_fields = ('total',)

admin.site.register(Pedido, PedidoAdmin)