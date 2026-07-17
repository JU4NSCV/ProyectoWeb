// ============================================================
// lib/api.ts — Cliente HTTP hacia la API Django
// ============================================================
import type {
  PaginatedResponse, Producto, CrearOrdenPayload, OrdenRespuesta,
} from "@/types";

/** URL base de la API Django (configurable por variable de entorno) */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

/** Cabeceras comunes para peticiones JSON */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _getHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/** Cabeceras para peticiones con token (sin Content-Type, para FormData) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _getAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = { Accept: "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/** Wrapper genérico de fetch con manejo de errores */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();

  // ★ BUG FIX 1: Si es una mutación (POST/PATCH/PUT/DELETE) y no hay token,
  // lanzar error 401 inmediatamente antes de hacer la petición.
  // Esto evita que Next.js envíe la petición sin el header Authorization.
  if (["POST", "PATCH", "PUT", "DELETE"].includes(method) && !token) {
    throw new Error("API Error 401: No hay sesión activa. Inicia sesión para continuar.");
  }

  // ★ BUG FIX 1: Construir cabeceras explicitamente con el token del cliente.
  // IMPORTANTE: Authorization header se forma como 'Bearer ' + token (con espacio)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token && token.trim() !== "") {
    // Formato exacto requerido por Django SimpleJWT:
    headers["Authorization"] = "Bearer " + token.trim();
  }
  // Mezclar con headers opcionales del caller (sin sobreescribir Authorization)
  const headersFinales: Record<string, string> = {
    ...headers,
    ...(options.headers as Record<string, string> ?? {}),
  };

  // ★ BUG FIX 1: cache: 'no-store' garantiza que Next.js App Router
  // NUNCA cachee esta petición en el servidor (evita el strip de headers).
  // Usar cache por separado de 'next' para compatibilidad Fetch API estándar.
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: headersFinales,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }

  // 204 No Content — retornar objeto vacío tipado
  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}

// ──────────────────────────────────────────
// Endpoints del Catálogo
// ──────────────────────────────────────────

/**
 * Obtiene la lista de productos con filtros opcionales.
 * Soporta búsqueda, categoría y orden.
 */
export async function getProductos(params?: {
  busqueda?: string;
  categoria?: string;
  orden?: string;
  page?: number;
}): Promise<PaginatedResponse<Producto>> {
  const qs = new URLSearchParams();
  if (params?.busqueda)  qs.set("search", params.busqueda);
  if (params?.categoria) qs.set("categoria", params.categoria);
  if (params?.orden)     qs.set("ordering", params.orden);
  if (params?.page)      qs.set("page", String(params.page));

  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<PaginatedResponse<Producto>>(`/productos/${query}`);
}

/**
 * Obtiene el detalle de un producto por ID.
 */
export async function getProducto(id: number): Promise<Producto> {
  return apiFetch<Producto>(`/productos/${id}/`);
}

// ──────────────────────────────────────────
// Endpoints de Pedidos
// ──────────────────────────────────────────

/**
 * ★ Crea una nueva Orden de Compra (Pedido).
 * Endpoint: POST /api/pedidos/
 * ★ FIX: Elimina "cliente" del payload — el backend lo asigna por token JWT.
 */
export async function crearPedido(
  payload: import("@/types").CrearPedidoPayload,
  token?: string
): Promise<import("@/types").PedidoRespuesta> {
  // Omitir "cliente" del payload — el backend lo asigna por JWT
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { cliente: _cliente, ...payloadSinCliente } = payload;
  return apiFetch<import("@/types").PedidoRespuesta>(
    "/pedidos/",
    { method: "POST", body: JSON.stringify(payloadSinCliente) },
    token
  );
}

/** Alias de compatibilidad con el código anterior */
export const crearOrden = crearPedido;

// ──────────────────────────────────────────
// Endpoints del Dashboard (pedidos del usuario)
// ──────────────────────────────────────────

/**
 * ★ Obtiene la lista de pedidos del usuario autenticado.
 * Parámetro tipo: "compras" | "ventas"
 * Endpoint: GET /api/pedidos/?tipo=compras|ventas
 */
export async function getPedidos(
  token: string,
  tipo?: "compras" | "ventas"
): Promise<import("@/types").Pedido[]> {
  const qs = tipo ? `?tipo=${tipo}` : "";
  const res = await apiFetch<
    import("@/types").Pedido[] | import("@/types").PaginatedResponse<import("@/types").Pedido>
  >(
    `/pedidos/${qs}`,
    { method: "GET" },
    token
  );
  if (Array.isArray(res)) return res;
  if ("results" in res) return res.results;
  return [];
}

/**
 * ★ PATCH para actualizar el estado de un pedido.
 * Usado por el Mayorista para gestionar el estado de sus ventas.
 * Endpoint: PATCH /api/pedidos/{id}/
 */
export async function patchEstadoPedido(
  id: number,
  payload: import("@/types").PatchEstadoPedido,
  token: string
): Promise<import("@/types").Pedido> {
  return apiFetch<import("@/types").Pedido>(
    `/pedidos/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );
}

/**
 * ★ PATCH para cancelar un pedido PENDIENTE.
 * Endpoint: PATCH /api/pedidos/{id}/cancelar/
 */
export async function cancelarPedido(
  id: number,
  token: string
): Promise<import("@/types").Pedido> {
  return apiFetch<import("@/types").Pedido>(
    `/pedidos/${id}/cancelar/`,
    { method: "PATCH" },
    token
  );
}

// ──────────────────────────────────────────
// Endpoints de Autenticación
// ──────────────────────────────────────────

/**
 * Inicia sesión y devuelve un par de tokens JWT.
 * Endpoint: POST /api/token/
 */
export async function loginUsuario(
  username: string,
  password: string
): Promise<{ access: string; refresh: string }> {
  // Login no requiere token — usamos fetch directo para evitar el guard de mutación
  const res = await fetch(`${API_BASE}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, password }),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Error ${res.status}: ${err}`);
  }
  return res.json();
}

/**
 * Registra un nuevo usuario (Minorista, Mayorista o Consumidor Final).
 * Usa FormData para soportar upload de documento_verificacion (RUC).
 */
export async function registrarEmpresa(data: FormData): Promise<{ id: number; email: string }> {
  // FormData: NO incluir Content-Type manual — el browser lo pone con boundary automáticamente
  const res = await fetch(`${API_BASE}/auth/registro/`, {
    method: "POST",
    body: data,
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API Error ${res.status}: ${error}`);
  }
  return res.json();
}

// ──────────────────────────────────────────
// Endpoints de Perfil
// ──────────────────────────────────────────

export interface PerfilUsuario {
  id: number;
  ruc: string;
  razon_social: string;
  direccion_matriz: string;
  telefono_contacto: string;
  rol: string;
  email?: string;
}

/**
 * GET /api/perfil/ — Obtiene el perfil del usuario autenticado.
 */
export async function getPerfil(token: string): Promise<PerfilUsuario> {
  return apiFetch<PerfilUsuario>("/perfil/", { method: "GET" }, token);
}

/**
 * PATCH /api/perfil/ — Actualiza los datos del perfil.
 */
export async function patchPerfil(
  data: Partial<Pick<PerfilUsuario, "razon_social" | "direccion_matriz" | "telefono_contacto">>,
  token: string
): Promise<PerfilUsuario> {
  return apiFetch<PerfilUsuario>(
    "/perfil/",
    { method: "PATCH", body: JSON.stringify(data) },
    token
  );
}

// ──────────────────────────────────────────
// Endpoints de Planes / Suscripciones
// ──────────────────────────────────────────

export interface PlanSuscripcion {
  id: number;
  nombre: string;
  precio: number;
  moneda: string;
  descripcion: string;
  caracteristicas: string[];
  popular?: boolean;
}

/**
 * GET /api/planes/ — Lista de planes disponibles.
 * Si el endpoint no existe, usa datos hardcodeados.
 */
export async function getPlanes(): Promise<PlanSuscripcion[]> {
  try {
    const res = await apiFetch<PlanSuscripcion[] | PaginatedResponse<PlanSuscripcion>>(
      "/planes/",
      { method: "GET" }
    );
    if (Array.isArray(res)) return res;
    if ("results" in res) return res.results;
    return [];
  } catch {
    // Fallback hardcodeado si la API no está lista
    return PLANES_HARDCODEADOS;
  }
}

/**
 * POST /api/suscripciones/ — Simula la activación de un plan.
 */
export async function activarSuscripcion(
  planId: number,
  metodoPago: string,
  token: string
): Promise<{ mensaje: string; activo: boolean }> {
  return apiFetch<{ mensaje: string; activo: boolean }>(
    "/suscripciones/",
    { method: "POST", body: JSON.stringify({ plan: planId, metodo_pago: metodoPago }) },
    token
  );
}

// Planes hardcodeados para el Mock
export const PLANES_HARDCODEADOS: PlanSuscripcion[] = [
  {
    id: 1,
    nombre: "Starter",
    precio: 0,
    moneda: "USD",
    descripcion: "Ideal para empezar a explorar la plataforma.",
    caracteristicas: [
      "Catálogo de productos visible",
      "Hasta 5 pedidos/mes",
      "Soporte por email",
      "Sin acceso a precios mayoristas",
    ],
  },
  {
    id: 2,
    nombre: "Minorista Pro",
    precio: 29.99,
    moneda: "USD",
    descripcion: "Para tiendas que compran regularmente.",
    popular: true,
    caracteristicas: [
      "Precios mayoristas exclusivos",
      "Pedidos ilimitados",
      "Panel de historial completo",
      "Soporte prioritario",
      "Gestión de perfil empresarial",
    ],
  },
  {
    id: 3,
    nombre: "Mayorista Enterprise",
    precio: 79.99,
    moneda: "USD",
    descripcion: "Para distribuidores y fabricantes.",
    caracteristicas: [
      "Todo lo de Minorista Pro",
      "Publicación de catálogo propio",
      "Dashboard dual (Compras + Ventas)",
      "Cambio de estado de pedidos",
      "Reportes avanzados",
      "Soporte dedicado 24/7",
    ],
  },
];

