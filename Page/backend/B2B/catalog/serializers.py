from rest_framework import serializers
from .models import Categoria, Producto

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'slug', 'descripcion']

class ProductoSerializer(serializers.ModelSerializer):
    # Agregamos este campo extra de solo lectura para que Next.js reciba el nombre de la categoría y no solo un ID numérico
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.username')

    class Meta:
        model = Producto
        # Exponemos todos los campos importantes para el Módulo de Escaparate y Transacción
        fields = [
            'id', 'sku', 'nombre', 'descripcion', 'imagen',
            'categoria', 'categoria_nombre',
            'proveedor', 'proveedor_nombre',
            'precio_publico', 'precio_minorista',
            'moq', 'multiplo_lote', 'stock_disponible', 'activo'
        ]