from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from .serializers import PerfilSerializer
from rest_framework import viewsets, status
from rest_framework.permissions import IsAdminUser # Protege el puerto: Solo SuperAdmins
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import CustomUser
from .serializers import PerfilSerializer

class MiPerfilView(RetrieveUpdateAPIView):
    serializer_class = PerfilSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user # Devuelve automáticamente el usuario logueado

class AdministracionEmpresasViewSet(viewsets.ModelViewSet):
    serializer_class = PerfilSerializer
    permission_classes = [IsAdminUser] # <-- Si no tiene is_superuser=True, DRF tira 403 Forbidden

    def get_queryset(self):
        # El Administrador no necesita ver visitantes o consumidores comunes aquí,
        # solo listamos los perfiles comerciales que requieren control documental.
        return CustomUser.objects.filter(rol__in=['MINORISTA', 'MAYORISTA']).order_by('-date_joined')

    # Acción personalizada para verificar/autenticar la empresa con un solo clic
    @action(detail=True, methods=['patch'])
    def verificar_empresa(self, request, pk=None):
        empresa = self.get_object()
        # Leemos el estado enviado desde el frontend (True o False)
        verificada = request.data.get('empresa_verificada', True)
        
        empresa.empresa_verificada = verificada
        empresa.save()
        
        return Response({
            'status': f"Empresa '{empresa.razon_social}' actualizada correctamente.",
            'empresa_verificada': empresa.empresa_verificada
        }, status=status.HTTP_200_OK)