// ============================================================
// lib/api.ts — Cliente HTTP hacia la API Django
// ============================================================
import type { PaginatedResponse, Producto, CrearOrdenPayload, OrdenRespuesta } from "@/types";

/** URL base de la API Django (configurable por variable de entorno) */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

/** Cabeceras comunes para todas las peticiones */
function getHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
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
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(token), ...(options.headers ?? {}) },
    // Importante: no cachear en SSR para que los precios siempre sean frescos
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API Error ${res.status}: ${error}`);
  }

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
 *
 * Payload exacto esperado por Django:
 * {
 *   "cliente": 1,
 *   "direccion_entrega_final": "...",
 *   "notas_pedido": "...",
 *   "detalles": [
 *     { "producto": 1, "cantidad": 12, "precio_unitario_guardado": "12.50" }
 *   ]
 * }
 */
export async function crearPedido(
  payload: import("@/types").CrearPedidoPayload,
  token?: string
): Promise<import("@/types").PedidoRespuesta> {
  return apiFetch<import("@/types").PedidoRespuesta>(
    "/pedidos/",
    {
      method: "POST",
      body: JSON.stringify(payload),
      // No cachear peticiones de escritura
      next: { revalidate: 0 },
    },
    token
  );
}

/** Alias de compatibilidad con el código anterior */
export const crearOrden = crearPedido;


// ──────────────────────────────────────────
// Endpoints de Autenticación
// ──────────────────────────────────────────

/**
 * Inicia sesión y devuelve un par de tokens JWT.
 */
export async function loginUsuario(
  email: string,
  password: string
): Promise<{ access: string; refresh: string }> {
  return apiFetch("/auth/token/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    next: { revalidate: 0 }, // No cachear login
  });
}

/**
 * Registra un nuevo usuario con rol de empresa (Minorista).
 */
export async function registrarEmpresa(data: unknown): Promise<{ id: number; email: string }> {
  return apiFetch("/auth/registro/", {
    method: "POST",
    body: JSON.stringify(data),
    next: { revalidate: 0 },
  });
}
