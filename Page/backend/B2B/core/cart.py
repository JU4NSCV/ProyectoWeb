"""
Gestor del Carrito de Compras usando Sesiones de Django.
Reemplaza el estado global de Zustand (React) por request.session['carrito'].
Incluye validaciones B2B críticas: MOQ y Múltiplos de Lote.
"""
from decimal import Decimal
from catalog.models import Producto


CART_SESSION_KEY = 'carrito'


class CarritoB2B:
    """
    Clase que gestiona el carrito almacenado en la sesión del usuario.
    Encapsula toda la lógica de negocio B2B: MOQ, múltiplos de lote y precios por rol.
    """

    def __init__(self, request):
        self.session = request.session
        self.usuario = request.user
        # Recupera el carrito existente o inicia uno nuevo
        carrito = self.session.get(CART_SESSION_KEY)
        if not carrito:
            carrito = {}
            self.session[CART_SESSION_KEY] = carrito
        self.carrito = carrito

    # ------------------------------------------------------------------
    # MÉTODO PRIVADO: Calcular precio correcto según el rol del usuario
    # ------------------------------------------------------------------
    def _obtener_precio(self, producto: Producto) -> Decimal:
        """Devuelve el precio adecuado según el rol del usuario."""
        if (
            self.usuario.is_authenticated
            and self.usuario.rol == 'MINORISTA'
            and self.usuario.empresa_verificada
        ):
            return producto.precio_minorista
        return producto.precio_publico

    # ------------------------------------------------------------------
    # AGREGAR / ACTUALIZAR UN PRODUCTO
    # ------------------------------------------------------------------
    def agregar(self, producto: Producto, cantidad: int) -> dict:
        """
        Agrega o actualiza un producto en el carrito.

        Aplica las reglas B2B:
          - MOQ (Cantidad Mínima de Pedido)
          - Múltiplo de Lote
          - Stock disponible

        Retorna un dict con:
          - 'ok': bool
          - 'mensaje': str
        """
        # 1. Validar reglas B2B sobre la cantidad deseada
        valido, mensaje = producto.validar_cantidad_compra(cantidad)
        if not valido:
            return {'ok': False, 'mensaje': mensaje}

        producto_id = str(producto.id)
        precio = self._obtener_precio(producto)

        # 2. Si el producto ya está en el carrito, actualizar; si no, crearlo
        self.carrito[producto_id] = {
            'producto_id': producto.id,
            'nombre': producto.nombre,
            'sku': producto.sku,
            'cantidad': cantidad,
            'precio_unitario': str(precio),
            'imagen': producto.imagen.url if producto.imagen else None,
            'moq': producto.moq,
            'multiplo_lote': producto.multiplo_lote,
            'proveedor_id': producto.proveedor.id,
            'proveedor_nombre': str(producto.proveedor),
        }

        self._guardar()
        return {'ok': True, 'mensaje': f'"{producto.nombre}" agregado al carrito.'}

    # ------------------------------------------------------------------
    # ELIMINAR UN PRODUCTO
    # ------------------------------------------------------------------
    def eliminar(self, producto_id: int) -> dict:
        """Elimina un producto del carrito por su ID."""
        key = str(producto_id)
        if key in self.carrito:
            nombre = self.carrito[key].get('nombre', 'Producto')
            del self.carrito[key]
            self._guardar()
            return {'ok': True, 'mensaje': f'"{nombre}" eliminado del carrito.'}
        return {'ok': False, 'mensaje': 'El producto no estaba en el carrito.'}

    # ------------------------------------------------------------------
    # VACIAR EL CARRITO COMPLETO
    # ------------------------------------------------------------------
    def vaciar(self):
        """Elimina todos los ítems del carrito de la sesión."""
        self.session[CART_SESSION_KEY] = {}
        self.carrito = {}
        self._guardar()

    # ------------------------------------------------------------------
    # CALCULAR TOTAL
    # ------------------------------------------------------------------
    def total(self) -> Decimal:
        """Calcula el total del carrito sumando precio × cantidad por ítem."""
        return sum(
            Decimal(item['precio_unitario']) * item['cantidad']
            for item in self.carrito.values()
        )

    # ------------------------------------------------------------------
    # OBTENER ÍTEMS COMO LISTA
    # ------------------------------------------------------------------
    def items(self) -> list:
        """
        Retorna los ítems del carrito como lista de diccionarios,
        añadiendo el subtotal calculado a cada ítem.
        """
        resultado = []
        for item in self.carrito.values():
            precio = Decimal(item['precio_unitario'])
            subtotal = precio * item['cantidad']
            resultado.append({
                **item,
                'precio_unitario_decimal': precio,
                'subtotal': subtotal,
            })
        return resultado

    # ------------------------------------------------------------------
    # AGRUPAR ÍTEMS POR PROVEEDOR (para el Checkout B2B)
    # ------------------------------------------------------------------
    def agrupar_por_proveedor(self) -> dict:
        """
        Retorna un diccionario: {proveedor_id: [lista de ítems]}
        Esto es lo que usa el CheckoutView para crear un Pedido por Mayorista.
        """
        agrupados = {}
        for item in self.carrito.values():
            prov_id = item['proveedor_id']
            if prov_id not in agrupados:
                agrupados[prov_id] = {
                    'proveedor_nombre': item['proveedor_nombre'],
                    'items': [],
                    'total_proveedor': Decimal('0.00'),
                }
            subtotal = Decimal(item['precio_unitario']) * item['cantidad']
            agrupados[prov_id]['items'].append({**item, 'subtotal': subtotal})
            agrupados[prov_id]['total_proveedor'] += subtotal
        return agrupados

    # ------------------------------------------------------------------
    # CANTIDAD TOTAL DE ÍTEMS (para el badge del navbar)
    # ------------------------------------------------------------------
    def __len__(self) -> int:
        """Devuelve la cantidad total de ítems (suma de cantidades)."""
        return sum(item['cantidad'] for item in self.carrito.values())

    # ------------------------------------------------------------------
    # PERSISTIR CAMBIOS EN LA SESIÓN
    # ------------------------------------------------------------------
    def _guardar(self):
        """Marca la sesión como modificada para que Django la persista."""
        self.session.modified = True
