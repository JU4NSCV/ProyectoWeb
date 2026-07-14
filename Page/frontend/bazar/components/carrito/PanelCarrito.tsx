"use client";
// ============================================================
// components/carrito/PanelCarrito.tsx
// Panel lateral del carrito con motor de validación B2B
// ============================================================
import { useEffect } from "react";
import { X, ShoppingCart, AlertTriangle, CheckCircle, Trash2, Plus, Minus, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { useCarritoStore } from "@/store/carritoStore";
import { Button } from "@/components/ui/Button";

export function PanelCarrito() {
  const {
    items,
    isOpen,
    cerrarCarrito,
    actualizarCantidad,
    eliminarItem,
    vaciarCarrito,
    subtotal,
    validaciones,
    carritoEsValido,
    totalItems,
  } = useCarritoStore();

  const validacionesMap = Object.fromEntries(
    validaciones().map((v) => [v.itemId, v])
  );

  const esValido = carritoEsValido();

  // Bloquear scroll del body cuando el carrito está abierto
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="cart-overlay"
        onClick={cerrarCarrito}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 bottom-0 w-full max-w-[420px] z-50",
          "bg-white shadow-2xl flex flex-col animate-slide-in"
        )}
        aria-label="Carrito de compras"
      >
        {/* ── Cabecera ───────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-[#FB4318]" />
            <h2 className="font-bold text-lg text-[#111]">Mi Pedido</h2>
            {totalItems() > 0 && (
              <span className="gradient-brand text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItems()} u.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={vaciarCarrito}
                className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} />
                Vaciar
              </button>
            )}
            <button
              onClick={cerrarCarrito}
              className="p-1.5 rounded-lg hover:bg-[#F1F1F1] transition-colors"
              aria-label="Cerrar carrito"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Contenido ──────────────────────────────── */}
        {items.length === 0 ? (
          /* Estado vacío */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-[#F8F8F8] flex items-center justify-center">
              <ShoppingCart size={36} className="text-[#D1D5DB]" />
            </div>
            <div>
              <p className="font-semibold text-[#111] text-lg">Tu pedido está vacío</p>
              <p className="text-sm text-[#6B6B6B] mt-1">
                Agrega productos del catálogo para generar una Orden de Compra.
              </p>
            </div>
            <Button onClick={cerrarCarrito} variant="outline" size="sm">
              Explorar catálogo
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

            {/* ★ Banner del motor B2B */}
            <div
              className={cn(
                "flex items-start gap-2 p-3 rounded-xl text-sm border",
                esValido
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              )}
            >
              {esValido ? (
                <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-green-600" />
              ) : (
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
              )}
              <div>
                <p className="font-semibold">
                  {esValido
                    ? "✓ Pedido válido — Listo para confirmar"
                    : "Hay productos con reglas B2B incumplidas"}
                </p>
                {!esValido && (
                  <p className="text-xs mt-0.5 opacity-80">
                    Ajusta las cantidades para cumplir con el MOQ y los lotes exigidos.
                  </p>
                )}
              </div>
            </div>

            {/* ── Lista de items ─────────────────────── */}
            {items.map((item) => {
              const validacion = validacionesMap[item.producto.id];
              const itemInvalido = validacion && !validacion.valido;

              return (
                <div
                  key={item.producto.id}
                  className={cn(
                    "rounded-xl border p-3 flex flex-col gap-2 transition-colors",
                    itemInvalido
                      ? "border-red-200 bg-red-50/50"
                      : "border-[#E5E5E5] bg-white"
                  )}
                >
                  <div className="flex gap-3">
                    {/* Imagen */}
                    <div className="w-16 h-16 rounded-lg bg-[#F8F8F8] flex-shrink-0 overflow-hidden relative">
                      {item.producto.imagen ? (
                        <Image
                          src={item.producto.imagen}
                          alt={item.producto.nombre}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package size={20} className="text-[#D1D5DB]" />
                        </div>
                      )}
                    </div>

                    {/* Info del producto */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#111] line-clamp-2 leading-tight">
                        {item.producto.nombre}
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">SKU: {item.producto.sku}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="tag-moq" style={{ fontSize: "10px" }}>
                          MOQ {item.producto.moq}
                        </span>
                        {item.producto.multiplo_lote > 1 && (
                          <span className="tag-lote" style={{ fontSize: "10px" }}>
                            x{item.producto.multiplo_lote}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Eliminar */}
                    <button
                      onClick={() => eliminarItem(item.producto.id)}
                      className="p-1 rounded-lg hover:bg-red-100 hover:text-red-500 transition-colors text-[#9CA3AF] flex-shrink-0"
                      aria-label={`Eliminar ${item.producto.nombre}`}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Precio y controles */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#FB4318]">
                        {formatCurrency(item.precio_unitario)}
                      </span>
                      <span className="text-xs text-[#9CA3AF] ml-1">/u.</span>
                    </div>

                    {/* Controles de cantidad */}
                    <div className="flex items-center gap-1 bg-[#F8F8F8] rounded-lg border border-[#E5E5E5] p-0.5">
                      <button
                        onClick={() =>
                          actualizarCantidad(
                            item.producto.id,
                            item.cantidad - item.producto.multiplo_lote,
                            item.producto.moq,
                            item.producto.multiplo_lote
                          )
                        }
                        className="p-1.5 rounded hover:bg-[#E5E5E5] transition-colors"
                        aria-label="Reducir"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-bold text-[#111]">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() =>
                          actualizarCantidad(
                            item.producto.id,
                            item.cantidad + item.producto.multiplo_lote,
                            item.producto.moq,
                            item.producto.multiplo_lote
                          )
                        }
                        className="p-1.5 rounded hover:bg-[#E5E5E5] transition-colors"
                        aria-label="Aumentar"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Subtotal del item */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#6B6B6B]">Subtotal:</span>
                    <span className="text-sm font-semibold text-[#111]">
                      {formatCurrency(item.precio_unitario * item.cantidad)}
                    </span>
                  </div>

                  {/* ★ Alerta de regla B2B incumplida */}
                  {itemInvalido && (
                    <div className="flex items-start gap-1.5 bg-red-100 border border-red-200 rounded-lg px-2.5 py-2">
                      <AlertTriangle size={12} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 font-medium">
                        {validacion.mensaje}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer del carrito ─────────────────────── */}
        {items.length > 0 && (
          <div className="border-t border-[#E5E5E5] px-5 py-4 flex flex-col gap-3 bg-white">
            {/* Totales */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6B6B]">
                  {items.length} {items.length === 1 ? "proveedor" : "proveedores"} ·{" "}
                  {totalItems()} unidades
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#111] text-lg">Total estimado</span>
                <span className="font-extrabold text-2xl text-[#FB4318]">
                  {formatCurrency(subtotal())}
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF]">
                * El pago se coordina directamente con cada proveedor.
              </p>
            </div>

            {/* CTA principal */}
            <Link href="/checkout" onClick={cerrarCarrito}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!esValido}
                className={cn(!esValido && "opacity-50 cursor-not-allowed")}
              >
                {esValido ? "Confirmar Orden de Compra →" : "⚠ Corrige las cantidades"}
              </Button>
            </Link>

            {!esValido && (
              <p className="text-xs text-center text-red-600 font-medium">
                Ajusta los items marcados en rojo para poder continuar.
              </p>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
