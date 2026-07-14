"use client";
// ============================================================
// components/ui/ToastContainer.tsx
// Contenedor global de notificaciones toast
// Posición: esquina inferior derecha
// ============================================================
import { useEffect, useState } from "react";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toastStore";
import type { ToastTipo } from "@/types";

// ── Estilos por tipo de toast ─────────────────────────────────
const ESTILOS: Record<ToastTipo, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  error: {
    bg:     "bg-red-50",
    border: "border-red-300",
    text:   "text-red-800",
    icon:   <AlertCircle size={18} className="text-red-600 flex-shrink-0" />,
  },
  exito: {
    bg:     "bg-green-50",
    border: "border-green-300",
    text:   "text-green-800",
    icon:   <CheckCircle size={18} className="text-green-600 flex-shrink-0" />,
  },
  advertencia: {
    bg:     "bg-amber-50",
    border: "border-amber-300",
    text:   "text-amber-800",
    icon:   <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />,
  },
  info: {
    bg:     "bg-blue-50",
    border: "border-blue-300",
    text:   "text-blue-800",
    icon:   <Info size={18} className="text-blue-600 flex-shrink-0" />,
  },
};

// ── Item de toast individual ──────────────────────────────────
function ToastItem({
  id,
  tipo,
  titulo,
  descripcion,
}: {
  id: string;
  tipo: ToastTipo;
  titulo: string;
  descripcion?: string;
}) {
  const cerrar = useToastStore((s) => s.cerrar);
  const [visible, setVisible] = useState(false);

  // Animar entrada
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleCerrar = () => {
    setVisible(false);
    setTimeout(() => cerrar(id), 250);
  };

  const estilos = ESTILOS[tipo];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex items-start gap-3 w-full max-w-sm rounded-2xl border shadow-lg px-4 py-3",
        "transition-all duration-300",
        estilos.bg,
        estilos.border,
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4"
      )}
    >
      {/* Icono */}
      <div className="mt-0.5">{estilos.icon}</div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold text-sm leading-tight", estilos.text)}>
          {titulo}
        </p>
        {descripcion && (
          <p className={cn("text-xs mt-0.5 opacity-80", estilos.text)}>
            {descripcion}
          </p>
        )}
      </div>

      {/* Cerrar */}
      <button
        onClick={handleCerrar}
        className={cn("p-0.5 rounded-lg hover:bg-black/10 transition-colors flex-shrink-0", estilos.text)}
        aria-label="Cerrar notificación"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ── Contenedor global — montar en layout.tsx ─────────────────
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notificaciones"
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} />
        </div>
      ))}
    </div>
  );
}
