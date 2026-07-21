"""
URLs del sistema MVT B2B — Bazar B2B / ISBEN Solution.
"""
from django.urls import path
from core import views
from core.views import ActualizarEstadoPedidoView

urlpatterns = [
    # ------------------------------------------------------------------
    # HOME
    # ------------------------------------------------------------------
    path('', views.HomeView.as_view(), name='home'),

    # ------------------------------------------------------------------
    # AUTENTICACIÓN (Session-based)
    # ------------------------------------------------------------------
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('registro/', views.RegistroView.as_view(), name='registro'),

    # ------------------------------------------------------------------
    # CATÁLOGO
    # ------------------------------------------------------------------
    path('catalogo/', views.CatalogoView.as_view(), name='catalogo'),

    # ------------------------------------------------------------------
    # CARRITO (Sesiones Django)
    # ------------------------------------------------------------------
    path('carrito/', views.CarritoView.as_view(), name='carrito'),
    path('carrito/agregar/', views.AgregarAlCarritoView.as_view(), name='agregar_carrito'),
    path('carrito/eliminar/<int:producto_id>/', views.EliminarDelCarritoView.as_view(), name='eliminar_carrito'),
    path('carrito/vaciar/', views.VaciarCarritoView.as_view(), name='vaciar_carrito'),

    # ------------------------------------------------------------------
    # CHECKOUT
    # ------------------------------------------------------------------
    path('checkout/', views.CheckoutView.as_view(), name='checkout'),

    # ------------------------------------------------------------------
    # DASHBOARD
    # ------------------------------------------------------------------
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),

    # ------------------------------------------------------------------
    # MÓDULO 1: INVENTARIO (solo Mayoristas)
    # ------------------------------------------------------------------
    path('inventario/', views.InventarioMayoristaView.as_view(), name='inventario'),

    # ------------------------------------------------------------------
    # MÓDULO 3: ACTUALIZACIÓN DE ESTADO DE PEDIDO (Mayoristas)
    # ------------------------------------------------------------------
    path('dashboard/pedido/actualizar/', ActualizarEstadoPedidoView.as_view(), name='actualizar_estado'),

    # ------------------------------------------------------------------
    # MÓDULO 2: SUSCRIPCIONES (solo Mayoristas)
    # ------------------------------------------------------------------
    path('suscripciones/', views.SuscripcionesView.as_view(), name='suscripciones'),
    path('suscripciones/activar/', views.ActivarSuscripcionView.as_view(), name='activar_suscripcion'),
]
