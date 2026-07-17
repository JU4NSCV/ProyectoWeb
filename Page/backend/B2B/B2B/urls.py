from users.views import MiPerfilView
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from users.views import AdministracionEmpresasViewSet


router_admin = DefaultRouter()
router_admin.register(r'admin/empresas', AdministracionEmpresasViewSet, basename='admin-empresas')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Rutas de Seguridad JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Rutas de la App
    path('api/', include('catalog.urls')),
    path('api/', include('orders.urls')),
    path('api/perfil/', MiPerfilView.as_view(), name='mi-perfil'),
    path('api/', include(router_admin.urls)),
]