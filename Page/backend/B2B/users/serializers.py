from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import CustomUser

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Añadimos datos personalizados al token seguro
        token['rol'] = user.rol
        token['empresa_verificada'] = user.empresa_verificada
        return token

class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # Exponemos campos, pero nota que ruc y rol son de solo lectura
        fields = ['id', 'username', 'email', 'rol', 'ruc', 'razon_social', 'direccion_matriz', 'telefono_contacto']
        read_only_fields = ['id', 'username', 'email', 'rol', 'ruc'] # El RUC NO se cambia aquí