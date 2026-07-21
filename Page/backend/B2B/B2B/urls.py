from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Router para los endpoints de administración de empresas (API)
from rest_framework.routers import DefaultRouter
from users.views import AdministracionEmpresasViewSet

router_admin = DefaultRouter()
router_admin.register(r'admin/empresas', AdministracionEmpresasViewSet, basename='admin-empresas')


urlpatterns = [
    # ------------------------------------------------------------------
    # ADMIN DJANGO
    # ------------------------------------------------------------------
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
    # ------------------------------------------------------------------
    # API REST (se mantiene para integraciones externas / apps móviles)
    # ------------------------------------------------------------------
    path('api/', include('catalog.urls')),
    path('api/', include('orders.urls')),
    path('api/', include(router_admin.urls)),
]

# Servir archivos de media en modo desarrollo (imágenes, documentos RUC)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)