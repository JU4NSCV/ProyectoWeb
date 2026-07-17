from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    # 1. Configurar las columnas que se ven en la lista general de usuarios
    list_display = ('username', 'email', 'rol', 'ruc', 'razon_social', 'empresa_verificada', 'is_staff')
    list_filter = ('rol', 'empresa_verificada', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'ruc', 'razon_social')
    ordering = ('username',)

    # 2. Agregar tus campos B2B personalizados al formulario de edición del Admin
    # Esto divide el formulario en secciones elegantes (fieldsets)
    fieldsets = UserAdmin.fieldsets + (
        ('Información Comercial B2B', {
            'fields': ('rol', 'ruc', 'razon_social', 'direccion_matriz', 'telefono_contacto', 'empresa_verificada', 'documento_verificacion'),
        }),
    )

    # 3. Agregar tus campos B2B al formulario de creación de un usuario nuevo
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información Comercial B2B', {
            'fields': ('rol', 'ruc', 'razon_social', 'direccion_matriz', 'telefono_contacto', 'empresa_verificada'),
        }),
    )

# Registrar el modelo de usuario personalizado con su configuración avanzada
admin.site.register(CustomUser, CustomUserAdmin)