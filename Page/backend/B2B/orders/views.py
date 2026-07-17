from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Pedido, DetallePedido
from .serializers import PedidoSerializer
from catalog.models import Producto

class PedidoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        tipo = self.request.query_params.get('tipo', 'compras')

        if user.is_superuser:
            return Pedido.objects.all()
        if user.rol == 'MAYORISTA' and tipo == 'ventas':
            return Pedido.objects.filter(detalles__producto__proveedor=user).distinct().order_by('-fecha_pedido')
            
        return Pedido.objects.filter(cliente=user).order_by('-fecha_pedido')

    # MAGIA B2B: Sobrescribimos el método crear para dividir el carrito
    def create(self, request, *args, **kwargs):
        detalles = request.data.get('detalles', [])
        if not detalles:
            return Response({"error": "El carrito está vacío"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Agrupar los productos por Proveedor (Mayorista)
        pedidos_por_proveedor = {}
        for item in detalles:
            producto = Producto.objects.get(id=item['producto'])
            prov_id = producto.proveedor.id
            if prov_id not in pedidos_por_proveedor:
                pedidos_por_proveedor[prov_id] = []
            pedidos_por_proveedor[prov_id].append(item)

        # 2. Crear un Pedido Padre/Independiente por cada Proveedor
        pedidos_creados = []
        for prov_id, items in pedidos_por_proveedor.items():
            # Calcular el total solo para los productos de este proveedor
            total_pedido = sum([float(i['cantidad']) * float(i['precio_unitario_guardado']) for i in items])

            nuevo_pedido = Pedido.objects.create(
                cliente=request.user, # El usuario logueado es el comprador
                total=total_pedido,
                direccion_entrega_final=request.data.get('direccion_entrega_final', ''),
                notas_pedido=request.data.get('notas_pedido', '')
            )

            # Insertar los detalles
            for i in items:
                DetallePedido.objects.create(
                    pedido=nuevo_pedido,
                    producto_id=i['producto'],
                    cantidad=i['cantidad'],
                    precio_unitario_guardado=i['precio_unitario_guardado']
                )
            pedidos_creados.append(nuevo_pedido.id)

        return Response({"status": "Pedidos generados y divididos con éxito", "ids": pedidos_creados}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def cancelar(self, request, pk=None):
        pedido = self.get_object()
        if pedido.cliente == request.user and pedido.estado == 'PENDIENTE':
            pedido.estado = 'CANCELADO'
            pedido.save()
            return Response({'status': 'Pedido cancelado'})
        return Response({'error': 'No se puede cancelar'}, status=400)