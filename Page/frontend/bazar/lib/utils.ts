// ============================================================
// lib/utils.ts — Utilidades compartidas del proyecto
// ============================================================
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind de forma segura, resolviendo conflictos.
 * Equivalente a la utilidad cn() de Shadcn UI.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número como moneda (USD por defecto).
 */
export function formatCurrency(
  amount: number,
  currency = "USD",
  locale = "es-EC"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Redondea una cantidad al múltiplo de lote más cercano (hacia arriba).
 */
export function roundToLote(cantidad: number, multiplo_lote: number): number {
  if (multiplo_lote <= 0) return cantidad;
  return Math.ceil(cantidad / multiplo_lote) * multiplo_lote;
}

/**
 * Verifica si una cantidad cumple con el MOQ y el múltiplo de lote.
 */
export function validarReglasB2B(
  cantidad: number,
  moq: number,
  multiplo_lote: number
): { valido: boolean; mensaje: string } {
  if (cantidad < moq) {
    return {
      valido: false,
      mensaje: `La cantidad mínima de pedido (MOQ) es ${moq} unidades.`,
    };
  }
  if (multiplo_lote > 1 && cantidad % multiplo_lote !== 0) {
    return {
      valido: false,
      mensaje: `Las cantidades deben ser múltiplos de ${multiplo_lote} (ej: ${multiplo_lote}, ${multiplo_lote * 2}, ${multiplo_lote * 3}...).`,
    };
  }
  return { valido: true, mensaje: "" };
}
