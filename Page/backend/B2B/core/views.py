"""
Vistas MVT principales del sistema B2B — Bazar B2B / ISBEN Solution.

Vistas incluidas:
  Auth:
    - LoginView              → Autenticación con sesión nativa
    - LogoutView             → Cierre de sesión
    - RegistroView           → Registro con subida de documento (RUC)
  Catálogo:
    - CatalogoView           → Listado de productos con precios por rol
  Carrito:
    - CarritoView            → Visualización del carrito de la sesión
    - AgregarAlCarritoView   → Agrega / actualiza producto en sesión
    - EliminarDelCarritoView → Elimina un producto del carrito
    - VaciarCarritoView      → Vacía completamente el carrito
  Checkout:
    - CheckoutView           → Divide el carrito y genera Pedidos por Mayorista
  Dashboard:
    - DashboardView          → Panel unificado (Mayorista / Minorista / Admin)
  Home:
    - HomeView               → Landing page
  ─── MÓDULOS NUEVOS ─────────────────────────────────────────────────────────
  Módulo 1 — Inventario:
    - InventarioMayoristaView → CRUD de productos exclusivo para Mayoristas
  Módulo 2 — Suscripciones:
    - SuscripcionesView       → Vista de planes disponibles (solo Mayoristas)
    - ActivarSuscripcionView  → Endpoint POST para simular activación
"""
import uuid
from datetime import date, timedelta

from django.shortcuts import render, redirect, get_object_or_404
from django.views import View
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from django.db import transaction
from django.http import HttpResponseForbidden

from catalog.models import Producto, Categoria
from orders.models import Pedido, DetallePedido
from subscriptions.models import PlanSuscripcion, Suscripcion
from users.models import CustomUser

from core.cart import CarritoB2B
from core.forms import (
    RegistroForm,
    AgregarAlCarritoForm,
    CheckoutForm,
    ProductoForm,
)


# ============================================================================
# MIXIN: Control de Acceso por Rol (Mayorista)
# ============================================================================

class MayoristaRequiredMixin(LoginRequiredMixin):
    """
    Mixin reutilizable que combina:
      1. Verificación de autenticación (LoginRequiredMixin)
      2. Verificación de rol MAYORISTA

    Si el usuario no es MAYORISTA → redirige al Dashboard con mensaje de error.
    """
    login_url = 'login'

    def dispatch(self, request, *args, **kwargs):
        # Primero verifica autenticación
        if not request.user.is_authenticated:
            messages.warning(request, 'Debes iniciar sesión para acceder a esta sección.')
            return self.handle_no_permission()

        # Luego verifica rol
        if request.user.rol != 'MAYORISTA' and not request.user.is_superuser:
            messages.error(
                request,
                '🚫 Acceso denegado. Esta sección es exclusiva para Mayoristas (Proveedores).'
            )
            return redirect('dashboard')

        return super().dispatch(request, *args, **kwargs)


# ============================================================================
# 1. AUTENTICACIÓN Y SESIONES
# ============================================================================

class LoginView(View):
    """Vista de inicio de sesión con autenticación de sesión nativa de Django."""
    template_name = 'auth/login.html'

    def get(self, request):
        if request.user.is_authenticated:
            return redirect('catalogo')
        return render(request, self.template_name)

    def post(self, request):
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        usuario = authenticate(request, username=username, password=password)

        if usuario is not None:
            login(request, usuario)
            messages.success(request, f'¡Bienvenido de vuelta, {usuario.first_name or usuario.username}!')
            next_url = request.GET.get('next', 'catalogo')
            return redirect(next_url)
        else:
            messages.error(request, 'Usuario o contraseña incorrectos. Intenta nuevamente.')
            return render(request, self.template_name, {'username': username})


class LogoutView(View):
    """Cierra la sesión del usuario y lo redirige al login."""

    def post(self, request):
        logout(request)
        messages.info(request, 'Has cerrado sesión correctamente.')
        return redirect('login')

    def get(self, request):
        logout(request)
        return redirect('login')


class RegistroView(View):
    """
    Vista de registro de nuevo usuario.
    Soporta enctype multipart/form-data para subir el documento RUC.
    """
    template_name = 'auth/registro.html'

    def get(self, request):
        if request.user.is_authenticated:
            return redirect('catalogo')
        form = RegistroForm()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = RegistroForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save(commit=False)
            if 'documento_verificacion' in request.FILES:
                user.documento_verificacion = request.FILES['documento_verificacion']
            user.save()
            messages.success(
                request,
                'Cuenta creada con éxito. Tu perfil está en revisión. '
                'Recibirás acceso completo una vez que el administrador verifique tu empresa.'
            )
            return redirect('login')
        return render(request, self.template_name, {'form': form})


# ============================================================================
# 2. CATÁLOGO DE PRODUCTOS
# ============================================================================

class CatalogoView(View):
    """
    Vista del catálogo. Muestra precios diferenciados:
    - precio_minorista → para Minoristas verificados
    - precio_publico   → para todos los demás
    """
    template_name = 'catalog/catalogo.html'

    def get(self, request):
        productos = Producto.objects.filter(activo=True).select_related(
            'categoria', 'proveedor'
        ).order_by('-fecha_creacion')
        categorias = Categoria.objects.all()
        carrito = CarritoB2B(request)

        categoria_slug = request.GET.get('categoria', '')
        busqueda = request.GET.get('q', '')

        if categoria_slug:
            productos = productos.filter(categoria__slug=categoria_slug)
        if busqueda:
            productos = productos.filter(nombre__icontains=busqueda)

        productos_con_precio = []
        for p in productos:
            precio = p.obtener_precio_para(request.user)
            productos_con_precio.append({
                'producto': p,
                'precio_mostrar': precio,
                'en_carrito': str(p.id) in carrito.carrito,
            })

        context = {
            'productos_con_precio': productos_con_precio,
            'categorias': categorias,
            'categoria_activa': categoria_slug,
            'busqueda': busqueda,
        }
        return render(request, self.template_name, context)


# ============================================================================
# 3. CARRITO DE COMPRAS (Sessions)
# ============================================================================

class CarritoView(LoginRequiredMixin, View):
    """Muestra el carrito completo almacenado en la sesión."""
    template_name = 'cart/carrito.html'
    login_url = 'login'

    def get(self, request):
        carrito = CarritoB2B(request)
        context = {
            'items': carrito.items(),
            'total': carrito.total(),
            'total_items': len(carrito),
            'checkout_form': CheckoutForm(),
        }
        return render(request, self.template_name, context)


class AgregarAlCarritoView(LoginRequiredMixin, View):
    """Agrega o actualiza un producto en el carrito de la sesión."""
    login_url = 'login'

    def post(self, request):
        form = AgregarAlCarritoForm(request.POST)
        if form.is_valid():
            producto_id = form.cleaned_data['producto_id']
            cantidad = form.cleaned_data['cantidad']
            producto = get_object_or_404(Producto, id=producto_id, activo=True)

            carrito = CarritoB2B(request)
            resultado = carrito.agregar(producto, cantidad)

            if resultado['ok']:
                messages.success(request, resultado['mensaje'])
            else:
                messages.error(request, resultado['mensaje'])
        else:
            messages.error(request, 'Datos del formulario inválidos.')

        return redirect(request.META.get('HTTP_REFERER', 'catalogo'))


class EliminarDelCarritoView(LoginRequiredMixin, View):
    """Elimina un ítem del carrito de sesión."""
    login_url = 'login'

    def post(self, request, producto_id):
        carrito = CarritoB2B(request)
        resultado = carrito.eliminar(producto_id)

        if resultado['ok']:
            messages.success(request, resultado['mensaje'])
        else:
            messages.warning(request, resultado['mensaje'])

        return redirect('carrito')


class VaciarCarritoView(LoginRequiredMixin, View):
    """Vacía completamente el carrito."""
    login_url = 'login'

    def post(self, request):
        carrito = CarritoB2B(request)
        carrito.vaciar()
        messages.info(request, 'Carrito vaciado.')
        return redirect('carrito')


# ============================================================================
# 4. CHECKOUT — División de Órdenes por Proveedor
# ============================================================================

class CheckoutView(LoginRequiredMixin, View):
    """
    Procesa el checkout B2B.
    Agrupa los productos por Proveedor y crea un Pedido independiente por cada Mayorista.
    """
    login_url = 'login'

    def post(self, request):
        carrito = CarritoB2B(request)

        if len(carrito) == 0:
            messages.warning(request, 'Tu carrito está vacío. Agrega productos antes de continuar.')
            return redirect('carrito')

        form = CheckoutForm(request.POST)
        if not form.is_valid():
            messages.error(request, 'Por favor completa correctamente los datos de envío.')
            return redirect('carrito')

        direccion = form.cleaned_data['direccion_entrega_final']
        notas = form.cleaned_data.get('notas_pedido', '')
        pedidos_creados = []

        try:
            with transaction.atomic():
                agrupados = carrito.agrupar_por_proveedor()

                for prov_id, grupo in agrupados.items():
                    nuevo_pedido = Pedido.objects.create(
                        cliente=request.user,
                        total=grupo['total_proveedor'],
                        direccion_entrega_final=direccion,
                        notas_pedido=notas,
                        estado=Pedido.EstadosPedido.PENDIENTE,
                    )
                    for item in grupo['items']:
                        producto = get_object_or_404(Producto, id=item['producto_id'])
                        DetallePedido.objects.create(
                            pedido=nuevo_pedido,
                            producto=producto,
                            cantidad=item['cantidad'],
                            precio_unitario_guardado=item['precio_unitario'],
                        )
                    pedidos_creados.append(nuevo_pedido.id)

                carrito.vaciar()

        except Exception as e:
            messages.error(request, f'Error al procesar el pedido: {str(e)}')
            return redirect('carrito')

        ids_str = ', '.join([f'#{pid}' for pid in pedidos_creados])
        messages.success(
            request,
            f'✅ ¡Pedido(s) generado(s) con éxito! Se crearon {len(pedidos_creados)} '
            f'orden(es) separada(s): {ids_str}.'
        )
        return redirect('dashboard')


# ============================================================================
# 5. DASHBOARD UNIFICADO
# ============================================================================

class DashboardView(LoginRequiredMixin, View):
    """
    Dashboard Logístico y de Compras — Bazar B2B.

    Adapta su contenido según el rol del usuario:
      - MINORISTA / CONSUMIDOR → solo 'mis_compras' (pedidos donde son cliente)
      - MAYORISTA              → 'mis_compras' + 'mis_ventas' (pedidos con sus productos)
      - SUPERUSER / ADMIN      → vista completa + empresas pendientes
    """
    template_name = 'dashboard/dashboard.html'
    login_url = 'login'

    def get(self, request):
        user = request.user
        context = {
            'user': user,
            'estados_pedido': Pedido.EstadosPedido.choices,
        }

        # ── MIS COMPRAS (todos los roles autenticados ven sus propias compras) ──
        mis_compras = Pedido.objects.filter(
            cliente=user
        ).order_by('-fecha_pedido').prefetch_related(
            'detalles__producto__proveedor'
        )
        context.update({
            'mis_compras': mis_compras,
            'compras_pendientes': mis_compras.filter(estado='PENDIENTE').count(),
            'compras_entregadas': mis_compras.filter(estado='ENTREGADO').count(),
        })

        # ── MIS VENTAS (solo Mayoristas y Superadmins) ────────────────────────
        if user.rol == 'MAYORISTA' or user.is_superuser:
            mis_productos = Producto.objects.filter(
                proveedor=user, activo=True
            ).select_related('categoria').order_by('-fecha_creacion')

            # Pedidos que contienen al menos un producto de este proveedor
            mis_ventas = Pedido.objects.filter(
                detalles__producto__proveedor=user
            ).distinct().order_by('-fecha_pedido').prefetch_related(
                'detalles__producto',
                'cliente'
            )

            context.update({
                'mis_ventas': mis_ventas,
                'mis_productos': mis_productos,
                'ventas_pendientes_count': mis_ventas.filter(
                    estado__in=['PENDIENTE', 'APROBADO']
                ).count(),
                'total_ventas': mis_ventas.count(),
                'total_productos': mis_productos.count(),
            })

        # ── PANEL ADMIN: Empresas Pendientes de Verificación ─────────────────
        if user.is_superuser or user.rol == 'ADMIN':
            empresas_pendientes = CustomUser.objects.filter(
                rol__in=['MINORISTA', 'MAYORISTA'],
                empresa_verificada=False
            ).order_by('-date_joined')
            context['empresas_pendientes'] = empresas_pendientes

        return render(request, self.template_name, context)


# ============================================================================
# 5b. ACTUALIZAR ESTADO DE PEDIDO (Mayorista)
# ============================================================================

class ActualizarEstadoPedidoView(LoginRequiredMixin, View):
    """
    Endpoint POST que permite a un Mayorista actualizar el estado de un pedido.

    Seguridad:
      1. El usuario debe estar autenticado (LoginRequiredMixin).
      2. Solo usuarios con rol 'MAYORISTA' o superusuarios pueden proceder.
      3. Se verifica que el Mayorista sea dueño de al menos un producto dentro
         del pedido antes de permitir la actualización (anti-IDOR).
    """
    login_url = 'login'

    def post(self, request):
        user = request.user

        pedido_id = request.POST.get('pedido_id')
        nuevo_estado = request.POST.get('nuevo_estado')

        # ── Validar que el nuevo estado sea válido ────────────────────────────
        estados_validos = [e[0] for e in Pedido.EstadosPedido.choices]
        if nuevo_estado not in estados_validos:
            messages.error(request, f'Estado inválido: "{nuevo_estado}".')
            return redirect('dashboard')

        # ── Obtener el pedido o 404 ───────────────────────────────────────────
        pedido = get_object_or_404(Pedido, id=pedido_id)

        # ── Verificación de propiedad (anti-IDOR) ─────────────────────────────
        es_dueno = pedido.detalles.filter(producto__proveedor=user).exists()
        es_cliente = (pedido.cliente == user)

        if not es_dueno and not es_cliente and not user.is_superuser:
            messages.error(
                request,
                f'No puedes actualizar el Pedido #{pedido.id}: no tienes permisos.'
            )
            return redirect('dashboard')

        if es_cliente and not es_dueno and not user.is_superuser:
            if nuevo_estado != 'CANCELADO':
                messages.error(request, 'Solo puedes cancelar tu pedido, no puedes cambiarlo a otro estado.')
                return redirect('dashboard')
            if pedido.estado != 'PENDIENTE':
                messages.error(request, 'Solo puedes cancelar pedidos que estén pendientes de aprobación.')
                return redirect('dashboard')

        # ── Actualizar estado ─────────────────────────────────────────────────
        estado_anterior = pedido.get_estado_display()
        pedido.estado = nuevo_estado
        pedido.save(update_fields=['estado'])

        messages.success(
            request,
            f'✅ Pedido #{pedido.id} actualizado: {estado_anterior} → {pedido.get_estado_display()}'
        )
        return redirect('dashboard')


# ============================================================================
# 6. HOME
# ============================================================================

class HomeView(View):
    """Página de aterrizaje. Redirige al catálogo si ya está logueado."""

    def get(self, request):
        if request.user.is_authenticated:
            return redirect('catalogo')
        features = [
            {
                'icon': '🏭',
                'title': 'Distribución Directa',
                'desc': 'Conecta mayoristas con minoristas eliminando intermediarios. Precios reales de fábrica.',
            },
            {
                'icon': '📦',
                'title': 'Control de MOQ y Lotes',
                'desc': 'Reglas B2B automáticas: cantidad mínima de pedido y múltiplos de lote configurables.',
            },
            {
                'icon': '🛒',
                'title': 'Carrito Inteligente',
                'desc': 'El carrito valida automáticamente cada regla B2B antes de permitir el checkout.',
            },
            {
                'icon': '📊',
                'title': 'Dashboard Unificado',
                'desc': 'Panel diferenciado para mayoristas (ventas) y minoristas (compras) en un solo lugar.',
            },
            {
                'icon': '💰',
                'title': 'Precios por Rol',
                'desc': 'Precios exclusivos para minoristas B2B verificados. Visitantes ven precio público.',
            },
            {
                'icon': '✅',
                'title': 'Verificación de Empresas',
                'desc': 'Proceso de validación de RUC y documentos fiscales para garantizar compras seguras.',
            },
        ]
        return render(request, 'home.html', {'features': features})


# ============================================================================
# MÓDULO 1: INVENTARIO Y PUBLICACIÓN (Exclusivo para Mayoristas)
# ============================================================================

class InventarioMayoristaView(MayoristaRequiredMixin, View):
    """
    Vista protegida de gestión de inventario para Mayoristas.

    Seguridad en capas:
      1. MayoristaRequiredMixin verifica autenticación Y rol MAYORISTA
      2. El queryset filtra SOLO los productos del usuario logueado
      3. El form excluye el campo 'proveedor' → se asigna como request.user

    GET  → Muestra tabla de inventario + formulario de creación
    POST → Procesa la creación de un nuevo producto
    """
    template_name = 'inventario/inventario.html'

    def get(self, request):
        form = ProductoForm()
        mis_productos = self._get_mis_productos(request)
        suscripcion = self._get_suscripcion(request)
        context = {
            'form': form,
            'mis_productos': mis_productos,
            'total_productos': mis_productos.count(),
            'suscripcion': suscripcion,
        }
        return render(request, self.template_name, context)

    def post(self, request):
        form = ProductoForm(request.POST, request.FILES)
        mis_productos = self._get_mis_productos(request)
        suscripcion = self._get_suscripcion(request)

        if form.is_valid():
            # ────────────────────────────────────────────────────────────────
            # Verificación de límite de suscripción antes de guardar
            # ────────────────────────────────────────────────────────────────
            if suscripcion:
                if not suscripcion.verificar_vigencia():
                    messages.error(
                        request,
                        '❌ Tu suscripción ha vencido. Renueva tu plan para publicar más productos.'
                    )
                    return render(request, self.template_name, {
                        'form': form,
                        'mis_productos': mis_productos,
                        'total_productos': mis_productos.count(),
                        'suscripcion': suscripcion,
                    })

                if mis_productos.count() >= suscripcion.plan.limite_productos:
                    messages.error(
                        request,
                        f'❌ Has alcanzado el límite de tu plan '
                        f'({suscripcion.plan.limite_productos} productos). '
                        f'Mejora tu suscripción para publicar más.'
                    )
                    return render(request, self.template_name, {
                        'form': form,
                        'mis_productos': mis_productos,
                        'total_productos': mis_productos.count(),
                        'suscripcion': suscripcion,
                    })

            # ────────────────────────────────────────────────────────────────
            # Asignar proveedor = usuario logueado y guardar
            # ────────────────────────────────────────────────────────────────
            producto = form.save(commit=False)
            producto.proveedor = request.user   # ← Asignación crítica de seguridad
            producto.save()

            messages.success(
                request,
                f'✅ ¡Producto "{producto.nombre}" publicado con éxito! '
                f'Ya aparece en el catálogo con SKU: {producto.sku}.'
            )
            return redirect('inventario')

        else:
            # Formulario inválido → devuelve con errores
            messages.error(
                request,
                '❌ Hay errores en el formulario. Por favor revisa los campos marcados en rojo.'
            )
            context = {
                'form': form,
                'mis_productos': mis_productos,
                'total_productos': mis_productos.count(),
                'suscripcion': suscripcion,
                'mostrar_modal': True,  # Reabre el modal automáticamente
            }
            return render(request, self.template_name, context)

    # ── Métodos auxiliares privados ─────────────────────────────────────────

    def _get_mis_productos(self, request):
        """Retorna SOLO los productos del mayorista logueado, nunca los de otros."""
        return Producto.objects.filter(
            proveedor=request.user
        ).select_related('categoria').order_by('-fecha_creacion')

    def _get_suscripcion(self, request):
        """Retorna la suscripción activa del mayorista, o None si no tiene."""
        return getattr(request.user, 'suscripcion_activa', None)


# ============================================================================
# MÓDULO 2: SUSCRIPCIONES Y PASARELA DE PAGO (Solo Mayoristas)
# ============================================================================

class SuscripcionesView(MayoristaRequiredMixin, View):
    """
    Vista de planes de suscripción para Mayoristas.

    GET → Muestra todos los PlanSuscripcion activos con su suscripción actual.
    """
    template_name = 'suscripciones/suscripciones.html'

    def get(self, request):
        planes = PlanSuscripcion.objects.all().order_by('precio_mensual')
        suscripcion_actual = getattr(request.user, 'suscripcion_activa', None)

        # Verificar vigencia si existe
        if suscripcion_actual:
            suscripcion_actual.verificar_vigencia()

        context = {
            'planes': planes,
            'suscripcion_actual': suscripcion_actual,
        }
        return render(request, self.template_name, context)


class ActivarSuscripcionView(MayoristaRequiredMixin, View):
    """
    Endpoint POST que simula la activación de una suscripción.

    Recibe:
      - plan_id        : ID del PlanSuscripcion seleccionado
      - metodo_pago    : 'transferencia' | 'tarjeta' | etc.

    Lógica:
      1. Busca o crea la Suscripcion para este usuario
      2. Genera un ID de transacción simulado
      3. Activa la suscripción por 30 días
      4. Devuelve mensaje de éxito
    """

    def post(self, request):
        plan_id = request.POST.get('plan_id')
        metodo_pago = request.POST.get('metodo_pago', 'transferencia')

        if not plan_id:
            messages.error(request, 'Error: No se seleccionó ningún plan.')
            return redirect('suscripciones')

        plan = get_object_or_404(PlanSuscripcion, id=plan_id)

        try:
            with transaction.atomic():
                # ID de transacción simulado (en producción vendría de Stripe/PayPal)
                transaccion_id = f'SIM-{uuid.uuid4().hex[:12].upper()}'

                # Crea o actualiza la suscripción del usuario
                suscripcion, creada = Suscripcion.objects.update_or_create(
                    usuario=request.user,
                    defaults={
                        'plan': plan,
                        'fecha_fin': date.today() + timedelta(days=30),
                        'estado': Suscripcion.Estados.ACTIVA,
                        'transaccion_pasarela_id': transaccion_id,
                    }
                )

            accion = 'activada' if creada else 'renovada'
            messages.success(
                request,
                f'🎉 ¡Suscripción {accion} con éxito! '
                f'Plan: {plan.nombre_plan} | '
                f'Válido hasta: {suscripcion.fecha_fin.strftime("%d/%m/%Y")} | '
                f'ID de transacción: {transaccion_id}'
            )

        except Exception as e:
            messages.error(request, f'Error al procesar la suscripción: {str(e)}')

        return redirect('suscripciones')
