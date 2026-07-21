from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import PlanSuscripcion

class PlanViewSet(viewsets.ReadOnlyModelViewSet): # Solo lectura para el frontend
    queryset = PlanSuscripcion.objects.all()
    permission_classes = [AllowAny]