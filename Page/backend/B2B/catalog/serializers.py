from rest_framework import serializers
from .models import Categoria, Producto

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'slug', 'descripcion']

class ProductoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.username')
    
    class Meta:
        model = Producto
        fields = [
            'id', 'sku', 'nombre', 'descripcion', 'imagen',
            'categoria', 'categoria_nombre',
            'proveedor', 'proveedor_nombre',
            'precio_publico', 'precio_minorista',
            'moq', 'multiplo_lote', 'stock_disponible', 'activo'
        ]
        # Hacemos que proveedor sea de solo lectura
        read_only_fields = ['proveedor']