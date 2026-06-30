from django.contrib import admin
from .models import Categoria, Producto

# Hacemos que la tabla de Productos se vea elegante en el admin
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('sku', 'nombre', 'precio_publico', 'precio_minorista', 'stock_disponible', 'activo')
    list_filter = ('categoria', 'activo')
    search_fields = ('nombre', 'sku')

admin.site.register(Categoria)
admin.site.register(Producto, ProductoAdmin)