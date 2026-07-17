/**
 * hooks/useRolJWT.ts — Hook para extraer el rol del usuario desde el JWT
 *
 * ★ BUG FIX 2 & 3: Fuente de verdad única para el rol.
 * Se decodifica el JWT almacenado en authStore (Zustand) sin necesidad
 * de una llamada extra al backend.
 *
 * Retorna:
 *  - rol: string en uppercase ("MAYORISTA", "MINORISTA", "CONSUMIDOR", "")
 *  - esMayorista: boolean
 *  - esMinorista: boolean
 *  - hidratado: boolean (false durante SSR / primer render)
 */
"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export interface RolInfo {
  rol: string;
  esMayorista: boolean;
  esMinorista: boolean;
  esConsumidor: boolean;
  hidratado: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decodeJWTPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // base64url → base64 estándar
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    // Rellenar padding si falta
    const padded  = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRol(payload: Record<string, any> | null): string {
  if (!payload) return "";
  const raw =
    payload.role        ??  // Django SimpleJWT con campo personalizado 'role'
    payload.rol         ??  // Alternativa en español
    payload.rol_empresa ??  // Otro campo común
    payload.grupo       ??  // Grupos de Django
    "";
  return String(raw).toUpperCase().trim();
}

export function useRolJWT(): RolInfo {
  const { accessToken, estaAutenticado } = useAuthStore();
  const [hidratado, setHidratado] = useState(false);
  const [rol, setRol]             = useState("");

  useEffect(() => {
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    if (!estaAutenticado || !accessToken) {
      setRol("");
      return;
    }
    const payload = decodeJWTPayload(accessToken);
    setRol(extractRol(payload));
  }, [hidratado, accessToken, estaAutenticado]);

  return {
    rol,
    esMayorista:  rol === "MAYORISTA",
    esMinorista:  rol === "MINORISTA",
    esConsumidor: rol === "CONSUMIDOR" || rol === "CONSUMIDOR_FINAL",
    hidratado,
  };
}
