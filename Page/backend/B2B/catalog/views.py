from rest_framework import viewsets
from rest_framework.permissions import AllowAny # Por ahora dejaremos que cualquiera vea el catálogo
from .models import Categoria, Producto
from .serializers import CategoriaSerializer, ProductoSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug' # Para que la URL sea /api/categorias/electronica en vez de /api/categorias/1

class ProductoViewSet(viewsets.ModelViewSet):
    # Solo mostramos los productos que estén marcados como 'activos'
    queryset = Producto.objects.filter(activo=True)
    serializer_class = ProductoSerializer
    permission_classes = [AllowAny]
    
    # Opcional: Permitir buscar productos por nombre o filtrar por categoría
    filterset_fields = ['categoria__slug']
    search_fields = ['nombre', 'sku']