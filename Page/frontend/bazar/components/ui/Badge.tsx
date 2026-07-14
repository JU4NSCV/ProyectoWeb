"use client";
// ============================================================
// components/ui/Badge.tsx — Etiquetas de estado y rol
// ============================================================
import { cn } from "@/lib/utils";
import type { RolUsuario } from "@/types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "moq" | "lote" | "destacado" | "categoria" | "rol";
  rol?: RolUsuario;
  className?: string;
}

export function Badge({ children, variant = "categoria", rol, className }: BadgeProps) {
  const base = "inline-flex items-center gap-1 rounded-md font-semibold text-xs px-2 py-0.5 leading-none";

  const variantClass = {
    moq:       "tag-moq",
    lote:      "tag-lote",
    destacado: "bg-amber-400 text-amber-900",
    categoria: "bg-slate-100 text-slate-600 border border-slate-200",
    rol:       rol === "minorista"
                  ? "badge-minorista"
                  : rol === "consumidor"
                  ? "badge-consumidor"
                  : "badge-visitante",
  }[variant];

  return (
    <span className={cn(base, variantClass, className)}>
      {children}
    </span>
  );
}
