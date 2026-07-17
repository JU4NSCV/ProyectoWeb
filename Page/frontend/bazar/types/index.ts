// ============================================================
// types/index.ts — Interfaces TypeScript del dominio B2B
// ============================================================

/** Roles de usuario disponibles en la plataforma */
export type RolUsuario = "visitante" | "consumidor" | "minorista" | "mayorista" | "MINORISTA" | "MAYORISTA" | "CONSUMIDOR";

/** Interfaz principal de un Producto del catálogo */
export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  descripcion: string;
  /** Precio visible para visitantes y consumidores finales */
  precio_publico: number;
  /** Precio exclusivo para minoristas verificados */
  precio_minorista: number;
  /** Cantidad Mínima de Pedido */
  moq: number;
  /** Unidad de venta: los pedidos deben ser múltiplos de este valor */
  multiplo_lote: number;
  stock: number;
  imagen: string | null;
  categoria: string;
  mayorista_nombre: string;
  destacado: boolean;
  activo: boolean;
}

/** Item dentro del carrito de compras */
export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  /** Precio unitario en el momento de agregar al carrito */
  precio_unitario: number;
}

/** Validación de un item del carrito contra reglas B2B */
export interface ValidacionCarrito {
  itemId: number;
  valido: boolean;
  mensaje: string;
}

// ──────────────────────────────────────────────────────────────
// Pedidos — Payload exacto para POST /api/pedidos/ (Django)
// ──────────────────────────────────────────────────────────────

/** Detalle de cada producto dentro del pedido */
export interface DetallePedidoPayload {
  producto: number;               // ID del producto
  cantidad: number;
  precio_unitario_guardado: string; // Decimal como string (ej: "12.50")
}

/** Payload completo para POST /api/pedidos/ */
export interface CrearPedidoPayload {
  /** @deprecated El backend lo asigna automáticamente por el token JWT (REQ 1) */
  cliente?: number;
  direccion_entrega_final: string;
  notas_pedido: string;
  detalles: DetallePedidoPayload[];
}

/** Respuesta de la API al crear un pedido */
export interface PedidoRespuesta {
  id: number;
  numero_pedido?: string;
  estado: "pendiente" | "en_preparacion" | "enviado" | "entregado" | "cancelado";
  total?: number;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────
// Pedidos — Modelo completo con detalles (para el Dashboard)
// ──────────────────────────────────────────────────────────────

/** Estados posibles de un pedido en el sistema B2B */
export type EstadoPedido =
  | "pendiente"
  | "PENDIENTE"
  | "en_preparacion"
  | "EN_PREPARACION"
  | "enviado"
  | "ENVIADO"
  | "entregado"
  | "ENTREGADO"
  | "cancelado"
  | "CANCELADO"
  | "DESPACHADO"
  | "preparando"
  | "PREPARANDO";

/** Detalle de un producto dentro de un pedido (respuesta del API) */
export interface DetallePedido {
  id: number;
  producto: number;               // ID del producto
  producto_nombre?: string;       // Nombre desnormalizado (si el API lo incluye)
  producto_sku?: string;          // SKU desnormalizado
  cantidad: number;
  precio_unitario_guardado: string; // Decimal como string "12.50"
  subtotal?: string;              // Calculado por el backend
}

/** Pedido completo con detalles anidados (respuesta del API de lista/detalle) */
export interface Pedido {
  id: number;
  numero_pedido?: string;
  cliente: number;                // ID del cliente
  cliente_username?: string;      // Username desnormalizado
  estado: EstadoPedido;
  direccion_entrega_final: string;
  notas_pedido: string;
  total?: string | number;
  detalles: DetallePedido[];
  created_at: string;
  updated_at?: string;
}

/** Payload para PATCH /api/pedidos/{id}/ — actualizar estado */
export interface PatchEstadoPedido {
  estado: EstadoPedido;
}

/** Estados que un Mayorista puede asignar a sus ventas */
export type EstadoVentaMayorista = "PREPARANDO" | "ENVIADO" | "ENTREGADO";

// Alias de compatibilidad (usado en checkout legacy)
export type CrearOrdenPayload = CrearPedidoPayload;
export type OrdenRespuesta    = PedidoRespuesta;

// ──────────────────────────────────────────────────────────────
// Toast — Notificaciones del sistema
// ──────────────────────────────────────────────────────────────

export type ToastTipo = "error" | "exito" | "advertencia" | "info";

export interface ToastMessage {
  id: string;
  tipo: ToastTipo;
  titulo: string;
  descripcion?: string;
}

/** Formulario de registro de empresa (Minorista, Mayorista o Consumidor Final) */
export interface FormularioRegistroEmpresa {
  razon_social: string;
  ruc: string;
  email: string;
  password: string;
  password_confirm: string;
  direccion: string;
  telefono: string;
  /** Rol que el usuario solicita */
  rol_solicitado: "minorista" | "mayorista" | "consumidor_final";
  /** Documento de verificación RUC (solo Minorista/Mayorista) */
  documento_verificacion?: File | null;
}

/** Respuesta paginada de la API */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Filtros del catálogo */
export interface FiltrosCatalogo {
  busqueda: string;
  categoria: string;
  orden: "precio_asc" | "precio_desc" | "nombre" | "destacado";
}
