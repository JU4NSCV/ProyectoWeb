"use client";
// ============================================================
// store/authStore.ts — Estado global de Autenticación JWT
//
// Responsabilidades:
//   - Guardar access_token y refresh_token en localStorage
//   - Decodificar el JWT para extraer user_id y username
//   - Exponer el estado de "logueado" para la Navbar y otros componentes
//   - Proveer acción de logout que limpia todo el estado
// ============================================================
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";

// ──────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────

/** Payload decodificado del JWT de Django (SimpleJWT) */
interface JWTPayload {
  token_type: "access" | "refresh";
  exp: number;          // Unix timestamp de expiración
  iat: number;          // Unix timestamp de emisión
  jti: string;          // JWT ID único
  user_id: number;      // ID del usuario en la BD Django
  username?: string;    // Opcional: algunas configs de SimpleJWT lo incluyen
  email?: string;       // Opcional: si se configura en SIMPLE_JWT settings
  rol?: string;         // Añadido por el backend
  empresa_verificada?: boolean; // Añadido por el backend
}

export interface UsuarioAuth {
  id: number;
  username: string;
  email: string;
  rol: string;
  empresa_verificada: boolean;
}

interface AuthState {
  /** Token de acceso JWT (corta duración) */
  accessToken: string | null;
  /** Token de refresco JWT (larga duración) */
  refreshToken: string | null;
  /** Datos del usuario decodificados del JWT */
  usuario: UsuarioAuth | null;
  /** true si hay un token válido y no expirado */
  estaAutenticado: boolean;

  // ── Acciones ──────────────────────────────────────────────
  /**
   * Guarda los tokens tras un login exitoso y decodifica el JWT
   * para extraer los datos del usuario.
   */
  login: (accessToken: string, refreshToken: string) => void;

  /** Limpia todo el estado de autenticación. */
  logout: () => void;

  /**
   * Retorna el access token actual.
   * Útil para inyectarlo en cabeceras de peticiones autenticadas.
   */
  getToken: () => string | null;

  /**
   * Verifica si el token actual ha expirado.
   * (No refresca automáticamente — MVP simple)
   */
  tokenExpirado: () => boolean;
}

// ──────────────────────────────────────────────────────────
// Helper: decodificar JWT y construir UsuarioAuth
// ──────────────────────────────────────────────────────────
function decodificarToken(token: string): UsuarioAuth | null {
  try {
    const payload = jwtDecode<JWTPayload>(token);
    return {
      id:       payload.user_id,
      username: payload.username ?? `usuario_${payload.user_id}`,
      email:    payload.email    ?? "",
      rol:      payload.rol ?? "VISITANTE",
      empresa_verificada: payload.empresa_verificada ?? false,
    };
  } catch {
    console.error("[authStore] Error al decodificar JWT:", token);
    return null;
  }
}

// ──────────────────────────────────────────────────────────
// Helper: verificar si un token ha expirado
// ──────────────────────────────────────────────────────────
function estaExpirado(token: string): boolean {
  try {
    const { exp } = jwtDecode<JWTPayload>(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true; // Si no se puede decodificar, lo consideramos expirado
  }
}

// ──────────────────────────────────────────────────────────
// Store Zustand con persistencia en localStorage
// ──────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken:     null,
      refreshToken:    null,
      usuario:         null,
      estaAutenticado: false,

      login: (accessToken, refreshToken) => {
        const usuario = decodificarToken(accessToken);
        set({
          accessToken,
          refreshToken,
          usuario,
          estaAutenticado: !!usuario && !estaExpirado(accessToken),
        });
      },

      logout: () => {
        set({
          accessToken:     null,
          refreshToken:    null,
          usuario:         null,
          estaAutenticado: false,
        });
      },

      getToken: () => get().accessToken,

      tokenExpirado: () => {
        const token = get().accessToken;
        if (!token) return true;
        return estaExpirado(token);
      },
    }),
    {
      name: "bazar-auth-v1",
      storage: createJSONStorage(() => localStorage),
      // Persistir tokens y usuario, no los métodos
      partialize: (state) => ({
        accessToken:     state.accessToken,
        refreshToken:    state.refreshToken,
        usuario:         state.usuario,
        estaAutenticado: state.estaAutenticado,
      }),
      // Al rehidratar, verificar si el token sigue siendo válido y re-decodificar
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          if (estaExpirado(state.accessToken)) {
            // Token expirado al recargar — limpiar sesión
            state.accessToken     = null;
            state.refreshToken    = null;
            state.usuario         = null;
            state.estaAutenticado = false;
          } else {
            // Re-decodificar para asegurar que tenemos todos los campos (como rol y empresa_verificada)
            const decoded = decodificarToken(state.accessToken);
            if (decoded) {
              state.usuario = decoded;
            }
          }
        }
      },
    }
  )
);

// ── Hooks de conveniencia ────────────────────────────────────
/** Retorna true si el usuario está autenticado con token vigente */
export const useEstaAutenticado = () =>
  useAuthStore((s) => s.estaAutenticado && !s.tokenExpirado());

/** Retorna los datos del usuario logueado (o null) */
export const useUsuario = () => useAuthStore((s) => s.usuario);

/** Retorna el access token actual */
export const useAccessToken = () => useAuthStore((s) => s.accessToken);
