from rest_framework import viewsets
from rest_framework.permissions import AllowAny # Temporalmente abierto para el MVP
from .models import Pedido
from .serializers import PedidoSerializer

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    permission_classes = [AllowAny] 