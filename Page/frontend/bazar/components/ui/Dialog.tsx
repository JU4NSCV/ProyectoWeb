"use client";
// ============================================================
// components/ui/Dialog.tsx — Dialog/Modal reutilizable
// Implementación propia con animación y accesibilidad
// ============================================================
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Ancho máximo del panel (Tailwind class, ej: "max-w-2xl") */
  maxWidth?: string;
  /** Slot para botones de acción en el footer */
  footer?: ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-2xl",
  footer,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Bloquear scroll del body mientras el dialog está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      {/* Overlay difuminado */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "relative z-10 w-full bg-white rounded-2xl shadow-2xl",
          "flex flex-col max-h-[90vh] animate-fade-in",
          maxWidth
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#E5E5E5] flex-shrink-0">
          <div>
            <h2
              id="dialog-title"
              className="text-lg font-extrabold text-[#111] leading-tight"
            >
              {title}
            </h2>
            {description && (
              <p className="text-sm text-[#6B6B6B] mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#111] hover:bg-[#F1F1F1]
                       transition-colors flex-shrink-0 focus-ring"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {children}
        </div>

        {/* Footer (opcional) */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-[#E5E5E5] bg-[#F8F8F8] rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
