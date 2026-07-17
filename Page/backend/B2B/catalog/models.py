from django.db import models
from django.conf import settings # Para referenciar a tu CustomUser
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError

class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True, help_text="Ej: Electrónica, Hogar, Ropa")
    descripcion = models.TextField(blank=True, null=True)
    slug = models.SlugField(max_length=100, unique=True, help_text="URL amigable para SEO")

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name_plural = "Categorías"

class Producto(models.Model):
    # --- 1. Relaciones Principales ---
    categoria = models.ForeignKey(
        Categoria, 
        on_delete=models.CASCADE, 
        related_name='productos'
    )
    # Unimos el producto al Mayorista que lo vende usando AUTH_USER_MODEL
    proveedor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        limit_choices_to={'rol': 'MAYORISTA'}, # Validamos que solo mayoristas publiquen
        related_name='productos_ofrecidos'
    )

    # --- 2. Información Básica ---
    nombre = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True, help_text="Código único de inventario")
    descripcion = models.TextField()
    stock_disponible = models.PositiveIntegerField(default=0)
    imagen = models.ImageField(upload_to='productos/', blank=True, null=True)
    
    # --- 3. Motor de Precios (B2B vs B2C) ---
    precio_publico = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0.01)],
        help_text="Precio para visitantes o consumidores finales"
    )
    precio_minorista = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0.01)],
        help_text="Precio con descuento exclusivo para tiendas (B2B)"
    )
    
    # --- 4. Reglas de Venta (El núcleo B2B) ---
    moq = models.PositiveIntegerField(
        default=1, 
        help_text="Cantidad Mínima de Pedido (Minimum Order Quantity)"
    )
    multiplo_lote = models.PositiveIntegerField(
        default=1, 
        help_text="Unidades por lote (Ej: Si es 6, solo se vende de 6 en 6)"
    )
    
    # --- 5. Metadatos del Sistema ---
    activo = models.BooleanField(default=True, help_text="Si es False, se oculta del catálogo")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.sku}] {self.nombre}"

    # Método de negocio: Devuelve el precio correcto según quién pregunte
    def obtener_precio_para(self, usuario):
        if usuario.is_authenticated and usuario.rol == 'MINORISTA' and usuario.empresa_verificada:
            return self.precio_minorista
        return self.precio_publico

    # Método de negocio: Valida si la transacción cumple las reglas B2B
    def validar_cantidad_compra(self, cantidad):
        if cantidad < self.moq:
            return False, f"La cantidad mínima permitida es {self.moq}."
        if cantidad % self.multiplo_lote != 0:
            return False, f"Solo se venden lotes en múltiplos de {self.multiplo_lote}."
        if cantidad > self.stock_disponible:
            return False, f"Stock insuficiente. Solo hay {self.stock_disponible} unidades."
        return True, "Cantidad válida."
    
    def clean(self):
        super().clean()
        # Esta validación solo corre cuando se está CREANDO un nuevo producto (no cuando se edita)
        # y cuando el proveedor ya ha sido asignado al objeto (evita fallo en validación de ModelForms)
        if not self.pk and getattr(self, 'proveedor_id', None):
            # 1. Verificamos si el proveedor tiene suscripción
            if not hasattr(self.proveedor, 'suscripcion_activa'):
                raise ValidationError("Este proveedor no tiene una suscripción asignada.")
            
            suscripcion = self.proveedor.suscripcion_activa
            
            # 2. Verificamos si está activa
            if not suscripcion.verificar_vigencia():
                raise ValidationError("La suscripción de este proveedor está vencida.")
            
            # 3. Contamos los productos y aplicamos el límite del plan
            productos_actuales = Producto.objects.filter(proveedor=self.proveedor).count()
            if productos_actuales >= suscripcion.plan.limite_productos:
                raise ValidationError(f"¡Límite alcanzado! El plan '{suscripcion.plan.nombre_plan}' solo permite publicar {suscripcion.plan.limite_productos} productos.")