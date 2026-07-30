"""
Formularios Django para el sistema MVT B2B — Bazar B2B / ISBEN Solution.

Incluye:
  - RegistroForm         : Registro con subida de documento RUC
  - AgregarAlCarritoForm : Agregar producto al carrito de sesión
  - CheckoutForm         : Datos de envío para el checkout
  - ProductoForm         : Crear/editar productos (solo para Mayoristas)
"""
from django import forms
from django.contrib.auth.forms import UserCreationForm
from users.models import CustomUser
from catalog.models import Producto, Categoria


# ==========================================================================
# FORM DE REGISTRO (existente, sin cambios)
# ==========================================================================

class RegistroForm(UserCreationForm):
    """
    Formulario de registro extendido.
    Permite subir el documento_verificacion (RUC) con enctype multipart/form-data.
    """
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white '
                     'placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FFC22F] '
                     'focus:border-transparent transition-all',
            'placeholder': 'correo@empresa.com',
        })
    )
    razon_social = forms.CharField(
        max_length=255,
        required=False,
        label='Razón Social / Nombre Empresa',
        widget=forms.TextInput(attrs={
            'class': 'w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white '
                     'placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FFC22F] '
                     'focus:border-transparent transition-all',
            'placeholder': 'Distribuidora XYZ S.A.',
        })
    )
    ruc = forms.CharField(
        max_length=20,
        required=False,
        label='RUC / Identificación Fiscal',
        widget=forms.TextInput(attrs={
            'class': 'w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white '
                     'placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FFC22F] '
                     'focus:border-transparent transition-all',
            'placeholder': '1790000000001',
        })
    )
    documento_verificacion = forms.FileField(
        required=False,
        label='Documento RUC o Patente Comercial (PDF/JPG)',
        widget=forms.FileInput(attrs={
            'class': 'block w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 '
                     'file:rounded-lg file:border-0 file:bg-[#FB4318] file:text-white '
                     'file:cursor-pointer hover:file:bg-[#e03b14] transition-all',
            'accept': '.pdf,.jpg,.jpeg,.png',
        })
    )
    rol = forms.ChoiceField(
        choices=[
            ('MINORISTA', 'Minorista (Tienda B2B)'),
            ('MAYORISTA', 'Mayorista (Proveedor)'),
            ('CONSUMIDOR', 'Consumidor Final'),
        ],
        label='Tipo de cuenta',
        widget=forms.Select(attrs={
            'class': 'w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white '
                     'focus:outline-none focus:ring-2 focus:ring-[#FFC22F] '
                     'focus:border-transparent transition-all cursor-pointer '
                     '[&>option]:text-slate-900 [&>option]:bg-white',
        })
    )

    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password1', 'password2',
            'rol', 'razon_social', 'ruc', 'documento_verificacion',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        base_classes = (
            'w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white '
            'placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FFC22F] '
            'focus:border-transparent transition-all'
        )
        self.fields['username'].widget.attrs.update({'class': base_classes, 'placeholder': 'tu_usuario'})
        self.fields['password1'].widget.attrs.update({'class': base_classes, 'placeholder': '••••••••'})
        self.fields['password2'].widget.attrs.update({'class': base_classes, 'placeholder': '••••••••'})

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.rol = self.cleaned_data['rol']
        user.ruc = self.cleaned_data.get('ruc', '')
        user.razon_social = self.cleaned_data.get('razon_social', '')
        if commit:
            user.save()
        return user


class EditarPerfilForm(forms.ModelForm):
    """
    Formulario para editar el perfil del usuario.
    Se adapta a cualquier rol, pero resalta los campos corporativos para B2B.
    """
    class Meta:
        model = CustomUser
        fields = [
            'first_name', 'last_name', 'email', 
            'telefono_contacto', 'direccion_matriz', 
            'razon_social', 'ruc'
        ]
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Clases de estilos genéricas (usadas también en ProductoForm)
        input_classes = (
            'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 '
            'placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FB4318] '
            'focus:border-transparent transition-all text-sm'
        )
        textarea_classes = (
            'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 '
            'placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FB4318] '
            'focus:border-transparent resize-none transition-all text-sm'
        )
        
        # Configuración de todos los widgets y labels
        self.fields['first_name'].widget.attrs.update({'class': input_classes, 'placeholder': 'Ej: Juan'})
        self.fields['first_name'].label = 'Nombres'
        
        self.fields['last_name'].widget.attrs.update({'class': input_classes, 'placeholder': 'Ej: Pérez'})
        self.fields['last_name'].label = 'Apellidos'
        
        self.fields['email'].widget.attrs.update({'class': input_classes, 'placeholder': 'correo@ejemplo.com'})
        self.fields['email'].label = 'Correo Electrónico'
        
        self.fields['telefono_contacto'].widget.attrs.update({'class': input_classes, 'placeholder': 'Ej: 0991234567'})
        self.fields['telefono_contacto'].label = 'Teléfono de Contacto'
        
        self.fields['direccion_matriz'].widget.attrs = forms.Textarea(attrs={'class': textarea_classes, 'rows': 3, 'placeholder': 'Dirección completa...'}).attrs
        self.fields['direccion_matriz'].label = 'Dirección'
        
        self.fields['razon_social'].widget.attrs.update({'class': input_classes, 'placeholder': 'Nombre de tu Empresa / Local'})
        self.fields['razon_social'].label = 'Razón Social (Opcional)'
        
        self.fields['ruc'].widget.attrs.update({'class': input_classes, 'placeholder': 'Ej: 1790000000001'})
        self.fields['ruc'].label = 'RUC (Opcional)'
        
        # Eliminar campos de empresa si el usuario es Consumidor Final
        if self.instance and self.instance.rol == 'CONSUMIDOR':
            self.fields.pop('razon_social', None)
            self.fields.pop('ruc', None)


# ==========================================================================
# FORM DE CARRITO (existente, sin cambios)
# ==========================================================================

class AgregarAlCarritoForm(forms.Form):
    """Formulario mínimo para agregar un producto al carrito."""
    producto_id = forms.IntegerField(widget=forms.HiddenInput())
    cantidad = forms.IntegerField(
        min_value=1,
        widget=forms.NumberInput(attrs={
            'class': 'w-20 text-center px-3 py-2 rounded-lg border border-slate-300 '
                     'focus:outline-none focus:ring-2 focus:ring-[#FB4318] font-semibold',
        })
    )


class CheckoutForm(forms.Form):
    """Formulario de datos de envío para el checkout."""
    direccion_entrega_final = forms.CharField(
        label='Dirección de Entrega',
        widget=forms.Textarea(attrs={
            'rows': 3,
            'class': 'w-full px-4 py-3 rounded-xl border border-slate-200 '
                     'focus:outline-none focus:ring-2 focus:ring-[#FB4318] '
                     'focus:border-transparent resize-none transition-all',
            'placeholder': 'Av. República 123, Quito, Ecuador',
        })
    )
    notas_pedido = forms.CharField(
        label='Notas adicionales (opcional)',
        required=False,
        widget=forms.Textarea(attrs={
            'rows': 2,
            'class': 'w-full px-4 py-3 rounded-xl border border-slate-200 '
                     'focus:outline-none focus:ring-2 focus:ring-[#FB4318] '
                     'focus:border-transparent resize-none transition-all',
            'placeholder': 'Instrucciones especiales para el despacho...',
        })
    )


# ==========================================================================
# MÓDULO 1: FORM DE PRODUCTO (para Mayoristas)
# ==========================================================================

# Clases base reutilizables con colores de marca ISBEN
_INPUT_CLASSES = (
    'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 '
    'placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FB4318] '
    'focus:border-transparent transition-all text-sm'
)
_SELECT_CLASSES = (
    'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 '
    'focus:outline-none focus:ring-2 focus:ring-[#FB4318] focus:border-transparent '
    'transition-all text-sm cursor-pointer'
)
_TEXTAREA_CLASSES = (
    'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 '
    'placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FB4318] '
    'focus:border-transparent resize-none transition-all text-sm'
)


class ProductoForm(forms.ModelForm):
    """
    Formulario para crear y editar productos del catálogo B2B.

    El campo 'proveedor' está EXCLUIDO: se asigna automáticamente
    en la vista como request.user (el Mayorista logueado).

    Incluye todos los campos B2B críticos:
      - MOQ (Cantidad Mínima de Pedido)
      - Múltiplo de Lote
      - Precio público vs. precio minorista
      - Stock disponible
      - Imagen del producto
    """

    class Meta:
        model = Producto
        # Excluimos 'proveedor' intencionalmente — se asigna en la vista
        exclude = ['proveedor', 'fecha_creacion', 'fecha_actualizacion']
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': _INPUT_CLASSES,
                'placeholder': 'Ej: Aceite Vegetal La Favorita x24',
            }),
            'sku': forms.TextInput(attrs={
                'class': _INPUT_CLASSES,
                'placeholder': 'Ej: ACE-VEG-024',
            }),
            'descripcion': forms.Textarea(attrs={
                'class': _TEXTAREA_CLASSES,
                'rows': 3,
                'placeholder': 'Descripción del producto, contenido del lote, etc.',
            }),
            'categoria': forms.Select(attrs={
                'class': _SELECT_CLASSES,
            }),
            'precio_publico': forms.NumberInput(attrs={
                'class': _INPUT_CLASSES,
                'step': '0.01',
                'min': '0.01',
                'placeholder': '0.00',
            }),
            'precio_minorista': forms.NumberInput(attrs={
                'class': _INPUT_CLASSES,
                'step': '0.01',
                'min': '0.01',
                'placeholder': '0.00',
            }),
            'stock_disponible': forms.NumberInput(attrs={
                'class': _INPUT_CLASSES,
                'min': '0',
                'placeholder': '0',
            }),
            'moq': forms.NumberInput(attrs={
                'class': _INPUT_CLASSES,
                'min': '1',
                'placeholder': '1',
            }),
            'multiplo_lote': forms.NumberInput(attrs={
                'class': _INPUT_CLASSES,
                'min': '1',
                'placeholder': '1',
            }),
            'imagen': forms.FileInput(attrs={
                'class': (
                    'block w-full text-sm text-slate-500 '
                    'file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 '
                    'file:text-sm file:font-semibold file:bg-[#FB4318] file:text-white '
                    'file:cursor-pointer hover:file:bg-[#e03b14] transition-all'
                ),
                'accept': 'image/*',
            }),
            'activo': forms.CheckboxInput(attrs={
                'class': 'w-4 h-4 rounded border-slate-300 text-[#FB4318] '
                         'focus:ring-[#FB4318] focus:ring-2 cursor-pointer',
            }),
        }
        labels = {
            'nombre': 'Nombre del Producto',
            'sku': 'SKU (Código Único)',
            'descripcion': 'Descripción',
            'categoria': 'Categoría',
            'precio_publico': 'Precio Público ($)',
            'precio_minorista': 'Precio Minorista B2B ($)',
            'stock_disponible': 'Stock Disponible (u.)',
            'moq': 'MOQ — Cantidad Mínima de Pedido',
            'multiplo_lote': 'Múltiplo de Lote (Ej: 6, 12, 24)',
            'imagen': 'Imagen del Producto',
            'activo': 'Producto visible en el catálogo',
        }
        help_texts = {
            'moq': 'Los clientes deben pedir al menos esta cantidad.',
            'multiplo_lote': 'Solo se venden en múltiplos de este número (Ej: 12 → solo 12, 24, 36...).',
            'precio_minorista': 'Precio exclusivo para Minoristas verificados.',
        }

    def clean(self):
        """Validación cruzada: el precio minorista debe ser menor al público."""
        cleaned_data = super().clean()
        precio_publico = cleaned_data.get('precio_publico')
        precio_minorista = cleaned_data.get('precio_minorista')
        moq = cleaned_data.get('moq')
        multiplo_lote = cleaned_data.get('multiplo_lote')

        if precio_publico and precio_minorista:
            if precio_minorista >= precio_publico:
                self.add_error(
                    'precio_minorista',
                    'El precio minorista debe ser MENOR al precio público.'
                )

        if moq and multiplo_lote:
            if moq % multiplo_lote != 0:
                self.add_error(
                    'moq',
                    f'El MOQ ({moq}) debe ser múltiplo del lote ({multiplo_lote}). '
                    f'Ej: si el lote es {multiplo_lote}, el MOQ podría ser {multiplo_lote}, '
                    f'{multiplo_lote * 2}, {multiplo_lote * 3}...'
                )
        return cleaned_data
