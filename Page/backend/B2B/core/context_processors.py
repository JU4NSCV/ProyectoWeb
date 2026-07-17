"""
Context Processors globales del sistema B2B.

Estos processors inyectan variables automáticamente en TODOS los templates,
sin necesidad de pasarlas manualmente en cada vista.
"""
from core.cart import CarritoB2B


def carrito_global(request):
    """
    Inyecta el total de ítems del carrito en cada template.
    Permite que el badge del Navbar siempre esté actualizado.

    Uso en templates:
        {{ total_carrito }}  → número total de unidades en el carrito
        {{ carrito_count }}  → alias semántico
    """
    carrito = CarritoB2B(request)
    total = len(carrito)
    return {
        'total_carrito': total,
        'carrito_count': total,
    }
