// ============================================================
// components/ui/EstadoBadge.tsx — Badge semántico de estado de pedido
// Mapea cada EstadoPedido a colores y etiquetas en español
// ============================================================
import { cn } from "@/lib/utils";
import type { EstadoPedido } from "@/types";

interface EstadoBadgeProps {
  estado: EstadoPedido;
  className?: string;
}

const CONFIG: Record<
  string,
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  pendiente: {
    label:  "Pendiente",
    dot:    "bg-amber-400",
    bg:     "bg-amber-50",
    text:   "text-amber-800",
    border: "border-amber-200",
  },
  en_preparacion: {
    label:  "En preparación",
    dot:    "bg-blue-400",
    bg:     "bg-blue-50",
    text:   "text-blue-800",
    border: "border-blue-200",
  },
  enviado: {
    label:  "Enviado",
    dot:    "bg-purple-400",
    bg:     "bg-purple-50",
    text:   "text-purple-800",
    border: "border-purple-200",
  },
  entregado: {
    label:  "Entregado",
    dot:    "bg-green-500",
    bg:     "bg-green-50",
    text:   "text-green-800",
    border: "border-green-200",
  },
  cancelado: {
    label:  "Cancelado",
    dot:    "bg-red-400",
    bg:     "bg-red-50",
    text:   "text-red-700",
    border: "border-red-200",
  },
  DESPACHADO: {
    label:  "Despachado",
    dot:    "bg-emerald-500",
    bg:     "bg-emerald-50",
    text:   "text-emerald-800",
    border: "border-emerald-200",
  },
};

export function EstadoBadge({ estado, className }: EstadoBadgeProps) {
  const cfg = CONFIG[estado] ?? {
    label:  estado,
    dot:    "bg-gray-400",
    bg:     "bg-gray-100",
    text:   "text-gray-700",
    border: "border-gray-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
        cfg.bg, cfg.text, cfg.border,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}
