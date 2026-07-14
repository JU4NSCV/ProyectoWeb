from rest_framework import serializers
from .models import Pedido, DetallePedido

class DetallePedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetallePedido
        fields = ['producto', 'cantidad', 'precio_unitario_guardado', 'subtotal']
        read_only_fields = ['subtotal']

class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(many=True) # Aceptamos un array de productos

    class Meta:
        model = Pedido
        fields = ['id', 'cliente', 'estado', 'total', 'direccion_entrega_final', 'notas_pedido', 'detalles', 'fecha_pedido']
        read_only_fields = ['estado', 'total', 'fecha_pedido']

    def create(self, validated_data):
        # 1. Extraemos los detalles del carrito
        detalles_data = validated_data.pop('detalles')
        
        # 2. Calculamos el total seguro en el backend
        total_calculado = sum([item['cantidad'] * item['precio_unitario_guardado'] for item in detalles_data])
        
        # 3. Creamos el Pedido principal
        pedido = Pedido.objects.create(total=total_calculado, **validated_data)
        
        # 4. Creamos las líneas de detalle asociadas a ese pedido
        for detalle_data in detalles_data:
            DetallePedido.objects.create(pedido=pedido, **detalle_data)
            
        return pedido