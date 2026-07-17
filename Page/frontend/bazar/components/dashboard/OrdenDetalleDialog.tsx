"use client";
// ============================================================
// components/dashboard/OrdenDetalleDialog.tsx
// Dialog que muestra el desglose completo de un pedido.
// ★ EXTRA B2B: Si el usuario es MAYORISTA, muestra botón
//   "Marcar como Despachado" que hace PATCH al backend.
// ============================================================
import { useState } from "react";
import {
  Package, MapPin, FileText, Clock, Truck,
  CheckCircle, Loader2, User, Hash,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Button } from "@/components/ui/Button";
import { patchEstadoPedido } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Pedido } from "@/types";

// ── Helpers ──────────────────────────────────────────────────

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-EC", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function parsePrecio(valor: string | number | undefined): number {
  if (valor === undefined || valor === null) return 0;
  return typeof valor === "number" ? valor : parseFloat(valor) || 0;
}

// ── Componente ───────────────────────────────────────────────

interface OrdenDetalleDialogProps {
  pedido: Pedido | null;
  open: boolean;
  onClose: () => void;
  /** true si el usuario logueado es MAYORISTA */
  esMayorista: boolean;
  /** Access token JWT para el PATCH */
  accessToken: string | null;
  /** Callback para actualizar la lista cuando se despacha */
  onDespachado?: (pedidoActualizado: Pedido) => void;
}

export function OrdenDetalleDialog({
  pedido,
  open,
  onClose,
  esMayorista,
  accessToken,
  onDespachado,
}: OrdenDetalleDialogProps) {
  const [despachando, setDespachando] = useState(false);
  const [errorDespacho, setErrorDespacho] = useState<string | null>(null);

  if (!pedido) return null;

  // ── Calcular total desde los detalles si el backend no lo envía
  const totalCalculado = pedido.detalles.reduce((acc, d) => {
    const subtotal = d.subtotal
      ? parsePrecio(d.subtotal)
      : parsePrecio(d.precio_unitario_guardado) * d.cantidad;
    return acc + subtotal;
  }, 0);

  const totalFinal = pedido.total
    ? parsePrecio(pedido.total)
    : totalCalculado;

  // ── Determinar si se puede despachar
  const puedeDespachar =
    esMayorista &&
    accessToken &&
    pedido.estado !== "DESPACHADO" &&
    pedido.estado !== "entregado" &&
    pedido.estado !== "cancelado";

  const handleDespachar = async () => {
    if (!accessToken || !puedeDespachar) return;
    setDespachando(true);
    setErrorDespacho(null);
    try {
      // ★ PATCH /api/pedidos/{id}/ con { "estado": "DESPACHADO" }
      const actualizado = await patchEstadoPedido(
        pedido.id,
        { estado: "DESPACHADO" },
        accessToken
      );
      onDespachado?.(actualizado);
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message.replace("API Error", "Error API")
          : "No se pudo actualizar el estado. Intenta de nuevo.";
      setErrorDespacho(msg);
    } finally {
      setDespachando(false);
    }
  };

  // ── Footer del dialog
  const footer = puedeDespachar ? (
    <div className="flex flex-col gap-2">
      {errorDespacho && (
        <p className="text-xs text-red-600 font-medium">{errorDespacho}</p>
      )}
      <div className="flex gap-3">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={despachando}>
          Cerrar
        </Button>
        <button
          id={`despachar-btn-${pedido.id}`}
          onClick={handleDespachar}
          disabled={despachando}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                     bg-emerald-600 text-white font-bold text-sm
                     hover:bg-emerald-700 active:scale-[0.98] transition-all
                     disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none
                     focus:ring-2 focus:ring-emerald-500/50"
        >
          {despachando ? (
            <><Loader2 size={15} className="animate-spin" /> Actualizando...</>
          ) : (
            <><Truck size={15} /> Marcar como Despachado</>
          )}
        </button>
      </div>
    </div>
  ) : (
    <div className="flex justify-end">
      <Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Pedido #${pedido.numero_pedido ?? pedido.id}`}
      description={`Creado el ${formatFecha(pedido.created_at)}`}
      maxWidth="max-w-2xl"
      footer={footer}
    >
      <div className="flex flex-col gap-5">

        {/* ── Cabecera de estado y cliente ─────────────── */}
        <div className="flex flex-wrap gap-3 items-center justify-between
                        bg-[#F8F8F8] rounded-xl px-4 py-3 border border-[#E5E5E5]">
          <div className="flex items-center gap-3">
            <EstadoBadge estado={pedido.estado} />
            {pedido.updated_at && (
              <span className="text-xs text-[#9CA3AF] flex items-center gap-1">
                <Clock size={11} />
                Actualizado {formatFecha(pedido.updated_at)}
              </span>
            )}
          </div>
          {esMayorista && pedido.cliente_username && (
            <span className="text-xs text-[#6B6B6B] flex items-center gap-1 font-medium">
              <User size={12} />
              Cliente: <strong>{pedido.cliente_username}</strong>
            </span>
          )}
        </div>

        {/* ── Metadatos del pedido ─────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F8F8F8] border border-[#E5E5E5]">
            <MapPin size={14} className="text-[#FB4318] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">
                Dirección de entrega
              </p>
              <p className="text-sm text-[#111] mt-0.5">
                {pedido.direccion_entrega_final || "—"}
              </p>
            </div>
          </div>
          {pedido.notas_pedido && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F8F8F8] border border-[#E5E5E5]">
              <FileText size={14} className="text-[#FB4318] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">
                  Notas del pedido
                </p>
                <p className="text-sm text-[#111] mt-0.5">{pedido.notas_pedido}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Tabla de detalles / productos ────────────── */}
        <div>
          <h3 className="text-sm font-bold text-[#111] flex items-center gap-1.5 mb-3">
            <Package size={14} className="text-[#FB4318]" />
            Productos del pedido
            <span className="ml-1 text-[#9CA3AF] font-normal">
              ({pedido.detalles.length} {pedido.detalles.length === 1 ? "línea" : "líneas"})
            </span>
          </h3>

          {pedido.detalles.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] italic">Sin detalles registrados.</p>
          ) : (
            <div className="rounded-xl border border-[#E5E5E5] overflow-hidden">
              {/* Encabezado de la tabla */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 bg-[#F8F8F8]
                              px-4 py-2.5 border-b border-[#E5E5E5]">
                <span className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wide">
                  Producto
                </span>
                <span className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wide text-right pr-4">
                  P.Unit.
                </span>
                <span className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wide text-right pr-4">
                  Cant.
                </span>
                <span className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wide text-right">
                  Subtotal
                </span>
              </div>

              {/* Filas */}
              <div className="divide-y divide-[#F1F1F1]">
                {pedido.detalles.map((det) => {
                  const precio   = parsePrecio(det.precio_unitario_guardado);
                  const subtotal = det.subtotal
                    ? parsePrecio(det.subtotal)
                    : precio * det.cantidad;

                  return (
                    <div
                      key={det.id}
                      className="grid grid-cols-[1fr_auto_auto_auto] gap-0
                                 px-4 py-3 hover:bg-[#FAFAFA] transition-colors"
                    >
                      {/* Nombre + SKU */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111] truncate">
                          {det.producto_nombre ?? `Producto #${det.producto}`}
                        </p>
                        {det.producto_sku && (
                          <p className="text-xs text-[#9CA3AF] flex items-center gap-1 mt-0.5">
                            <Hash size={10} />
                            {det.producto_sku}
                          </p>
                        )}
                      </div>

                      <span className="text-sm text-[#6B6B6B] text-right pr-4 self-center">
                        {formatCurrency(precio)}
                      </span>
                      <span className="text-sm font-semibold text-[#111] text-right pr-4 self-center">
                        ×{det.cantidad}
                      </span>
                      <span className="text-sm font-bold text-[#111] text-right self-center">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="px-4 py-3 border-t border-[#E5E5E5] bg-[#F8F8F8]
                              flex justify-between items-center">
                <span className="text-sm font-bold text-[#111]">Total del pedido</span>
                <span className="text-lg font-extrabold text-[#FB4318]">
                  {formatCurrency(totalFinal)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Confirmación de despacho (solo si ya fue despachado) ─── */}
        {pedido.estado === "DESPACHADO" && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200
                          rounded-xl px-4 py-3">
            <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-800 font-medium">
              Este pedido ya fue marcado como <strong>Despachado</strong>.
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
