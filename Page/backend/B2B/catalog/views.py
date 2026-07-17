from rest_framework import viewsets
from rest_framework.permissions import AllowAny # Por ahora dejaremos que cualquiera vea el catálogo
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.exceptions import PermissionDenied
from .models import Categoria, Producto
from .serializers import CategoriaSerializer, ProductoSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug' # Para que la URL sea /api/categorias/electronica en vez de /api/categorias/1

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.filter(activo=True)
    serializer_class = ProductoSerializer
    # Permitir lectura a todos, pero exigir token para crear/editar
    permission_classes = [IsAuthenticatedOrReadOnly] 
    
    filterset_fields = ['categoria__slug']
    search_fields = ['nombre', 'sku']

    # Aquí inyectamos la lógica B2B antes de guardar en Base de Datos
    def perform_create(self, serializer):
        if self.request.user.rol != 'MAYORISTA':
            raise PermissionDenied("Solo los Mayoristas pueden publicar productos.")
        # Guarda automáticamente al usuario logueado como el proveedor
        serializer.save(proveedor=self.request.user)