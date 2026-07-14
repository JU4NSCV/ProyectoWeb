"use client";
// ============================================================
// components/carrito/DrawerCarrito.tsx
//
// Panel/Drawer lateral del carrito con:
//   ★ Motor B2B: validación MOQ + lote por item
//   ★ Controles de cantidad que validan en tiempo real
//   ★ Checkout integrado a POST /api/pedidos/
//   ★ Estados: idle / loading / éxito / error
// ============================================================
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  X, ShoppingCart, AlertTriangle, CheckCircle, Trash2,
  Plus, Minus, Package, Loader2, Send, RotateCcw,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useCarritoStore } from "@/store/carritoStore";
import { useToastStore }   from "@/store/toastStore";
import { Button }          from "@/components/ui/Button";
import { crearPedido }     from "@/lib/api";
import type { CrearPedidoPayload } from "@/types";

// ── Constantes del MVP (hardcodeadas según requerimiento) ─────
const CLIENTE_ID_TEMPORAL   = 1;
const DIRECCION_PRUEBA       = "Dirección de prueba";
const NOTAS_PRUEBA           = "Prueba desde Next.js";

// ============================================================
export function DrawerCarrito() {
  const {
    items,
    isOpen,
    cerrarCarrito,
    eliminarItem,
    vaciarCarrito,
    subtotal,
    validaciones,
    carritoEsValido,
    totalItems,
    actualizarCantidad,
    checkoutEstado,
    setCheckoutEstado,
    setUltimoPedidoId,
    ultimoPedidoId,
  } = useCarritoStore();

  const toast = useToastStore();

  // Mapa de validaciones indexado por producto ID para O(1)
  const validacionesMap = Object.fromEntries(
    validaciones().map((v) => [v.itemId, v])
  );
  const esValido = carritoEsValido();

  // ── Bloquear scroll body cuando el drawer está abierto ───
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Manejador de cantidad con validación B2B en vivo ──────
  const handleCantidad = (
    productoId: number,
    nuevaCantidad: number,
    moq: number,
    multiplo_lote: number
  ) => {
    const resultado = actualizarCantidad(productoId, nuevaCantidad, moq, multiplo_lote);
    if (!resultado.actualizado && resultado.mensaje) {
      toast.advertencia("Cantidad inválida", resultado.mensaje);
    }
  };

  // ── ★ CHECKOUT — POST /api/pedidos/ ──────────────────────
  const handleCheckout = async () => {
    if (!esValido) {
      toast.error("Pedido bloqueado", "Corrige las cantidades marcadas en rojo.");
      return;
    }

    setCheckoutEstado("loading");

    // Construir el payload exacto que espera Django
    const payload: CrearPedidoPayload = {
      cliente: CLIENTE_ID_TEMPORAL,
      direccion_entrega_final: DIRECCION_PRUEBA,
      notas_pedido: NOTAS_PRUEBA,
      detalles: items.map((item) => ({
        producto: item.producto.id,
        cantidad: item.cantidad,
        // Django espera Decimal como string con 2 decimales
        precio_unitario_guardado: Number(item.precio_unitario).toFixed(2),
      })),
    };

    try {
      // Obtener token JWT si existe (opcional en MVP)
      const token = typeof window !== "undefined"
        ? localStorage.getItem("access_token") ?? undefined
        : undefined;

      const respuesta = await crearPedido(payload, token);

      setUltimoPedidoId(respuesta.id);
      setCheckoutEstado("exito");
      toast.exito(
        "¡Pedido creado! 🎉",
        `Tu orden #${respuesta.id} fue registrada. El proveedor la procesará en breve.`
      );

      // Vaciar carrito después de 1.5 s para que el usuario vea el éxito
      setTimeout(() => {
        vaciarCarrito();
        cerrarCarrito();
        setCheckoutEstado("idle");
      }, 2000);

    } catch (err: unknown) {
      const mensaje =
        err instanceof Error ? err.message : "Error de conexión con el servidor.";
      setCheckoutEstado("error", mensaje);
      toast.error("Error al crear pedido", mensaje);
    }
  };

  // ── Reintentar checkout ───────────────────────────────────
  const handleReintentar = () => setCheckoutEstado("idle");

  return (
    <>
      {/* ── Overlay oscuro ─────────────────────────────────── */}
      <div
        className="cart-overlay"
        onClick={cerrarCarrito}
        aria-hidden="true"
      />

      {/* ── Drawer lateral ─────────────────────────────────── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className="fixed right-0 top-0 bottom-0 w-full max-w-[440px] z-50 bg-white shadow-2xl flex flex-col animate-slide-in"
      >

        {/* ═══════════════════════════════════════════════════
            CABECERA
            ═══════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E5] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
              <ShoppingCart size={15} className="text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-[#111] leading-tight">Mi Pedido</h2>
              {totalItems() > 0 && (
                <p className="text-xs text-[#6B6B6B]">{items.length} proveedor(es) · {totalItems()} unidades</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {items.length > 0 && checkoutEstado === "idle" && (
              <button
                onClick={vaciarCarrito}
                className="flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={12} />
                Vaciar
              </button>
            )}
            <button
              onClick={cerrarCarrito}
              className="p-1.5 rounded-xl hover:bg-[#F1F1F1] transition-colors"
              aria-label="Cerrar carrito"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            ESTADO: CARGANDO CHECKOUT
            ═══════════════════════════════════════════════════ */}
        {checkoutEstado === "loading" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center animate-pulse">
              <Loader2 size={28} className="text-white animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-bold text-[#111] text-lg">Enviando pedido...</p>
              <p className="text-sm text-[#6B6B6B] mt-1">Conectando con el servidor, espera un momento.</p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            ESTADO: ÉXITO
            ═══════════════════════════════════════════════════ */}
        {checkoutEstado === "exito" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <div>
              <p className="font-extrabold text-[#111] text-xl">¡Pedido #{ultimoPedidoId} creado!</p>
              <p className="text-sm text-[#6B6B6B] mt-2">
                Tu Orden de Compra fue registrada exitosamente. El proveedor la procesará y se pondrá en contacto contigo.
              </p>
            </div>
            <div className="w-full bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
              💡 El pago se coordina directamente con el proveedor (transferencia o contra entrega).
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            ESTADO: ERROR DE CHECKOUT
            ═══════════════════════════════════════════════════ */}
        {checkoutEstado === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <div>
              <p className="font-bold text-[#111] text-lg">Error al enviar el pedido</p>
              <p className="text-xs text-[#6B6B6B] mt-1 break-words font-mono bg-[#F8F8F8] rounded-lg p-2">
                {useCarritoStore.getState().checkoutError}
              </p>
            </div>
            <Button onClick={handleReintentar} variant="outline" size="md">
              <RotateCcw size={14} />
              Reintentar
            </Button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            ESTADO NORMAL: CARRITO VACÍO
            ═══════════════════════════════════════════════════ */}
        {checkoutEstado === "idle" && items.length === 0 && (
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
              Explorar catálogo →
            </Button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            ESTADO NORMAL: LISTA DE ITEMS
            ═══════════════════════════════════════════════════ */}
        {checkoutEstado === "idle" && items.length > 0 && (
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">

            {/* ── Banner de estado B2B global ──────────────── */}
            <div className={cn(
              "flex items-start gap-2.5 p-3 rounded-xl text-sm border",
              esValido
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            )}>
              {esValido
                ? <CheckCircle size={15} className="flex-shrink-0 mt-0.5 text-green-600" />
                : <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-red-600" />
              }
              <p className="font-semibold text-xs leading-snug">
                {esValido
                  ? "✓ Todas las cantidades cumplen las reglas B2B — Listo para confirmar"
                  : "⚠ Ajusta las cantidades marcadas en rojo para continuar"}
              </p>
            </div>

            {/* ── Items del carrito ──────────────────────────── */}
            {items.map((item) => {
              const validacion   = validacionesMap[item.producto.id];
              const itemInvalido = validacion && !validacion.valido;

              return (
                <div
                  key={item.producto.id}
                  className={cn(
                    "rounded-2xl border p-3.5 flex flex-col gap-2.5 transition-all",
                    itemInvalido
                      ? "border-red-300 bg-red-50/60 ring-1 ring-red-200"
                      : "border-[#E5E5E5] bg-white"
                  )}
                >
                  {/* Fila superior: imagen + info + eliminar */}
                  <div className="flex gap-3">
                    {/* Imagen */}
                    <div className="w-14 h-14 rounded-xl bg-[#F8F8F8] flex-shrink-0 overflow-hidden relative border border-[#E5E5E5]">
                      {item.producto.imagen ? (
                        <Image
                          src={item.producto.imagen}
                          alt={item.producto.nombre}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package size={18} className="text-[#D1D5DB]" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#111] line-clamp-2 leading-tight">
                        {item.producto.nombre}
                      </p>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                        SKU: {item.producto.sku}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
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

                    {/* Botón eliminar */}
                    <button
                      onClick={() => eliminarItem(item.producto.id)}
                      className="p-1 rounded-lg hover:bg-red-100 hover:text-red-500 transition-colors text-[#9CA3AF] flex-shrink-0 self-start"
                      aria-label={`Eliminar ${item.producto.nombre}`}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Fila inferior: precio + controles de cantidad */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Precio */}
                    <div>
                      <span className="font-extrabold text-[#FB4318] text-base">
                        {formatCurrency(item.precio_unitario)}
                      </span>
                      <span className="text-[11px] text-[#9CA3AF] ml-1">/u.</span>
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                        Subtotal: {formatCurrency(item.precio_unitario * item.cantidad)}
                      </p>
                    </div>

                    {/* ★ Control de cantidad con validación B2B */}
                    <div className="flex items-center gap-1 bg-[#F8F8F8] rounded-xl border border-[#E5E5E5] p-0.5">
                      <button
                        onClick={() =>
                          handleCantidad(
                            item.producto.id,
                            item.cantidad - item.producto.multiplo_lote,
                            item.producto.moq,
                            item.producto.multiplo_lote
                          )
                        }
                        disabled={item.cantidad <= item.producto.moq}
                        className="p-2 rounded-lg hover:bg-[#E5E5E5] disabled:opacity-30 transition-colors"
                        aria-label="Reducir cantidad"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="min-w-[2.5rem] text-center text-sm font-bold text-[#111] tabular-nums">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() =>
                          handleCantidad(
                            item.producto.id,
                            item.cantidad + item.producto.multiplo_lote,
                            item.producto.moq,
                            item.producto.multiplo_lote
                          )
                        }
                        className="p-2 rounded-lg hover:bg-[#E5E5E5] transition-colors"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* ★ Alerta inline de regla B2B incumplida */}
                  {itemInvalido && (
                    <div className="flex items-start gap-1.5 bg-red-100 border border-red-200 rounded-xl px-3 py-2">
                      <AlertTriangle size={12} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 font-semibold leading-snug">
                        {validacion.mensaje}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            FOOTER: TOTALES + CTA CHECKOUT
            ═══════════════════════════════════════════════════ */}
        {checkoutEstado === "idle" && items.length > 0 && (
          <div className="border-t border-[#E5E5E5] px-5 py-4 flex flex-col gap-3 bg-[#FAFAFA] flex-shrink-0">

            {/* Desglose de totales */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-[#6B6B6B]">
                <span>{totalItems()} unidades en {items.length} producto(s)</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-[#111] text-base">Total estimado</span>
                <span className="font-extrabold text-2xl text-[#FB4318]">
                  {formatCurrency(subtotal())}
                </span>
              </div>
              <p className="text-[10px] text-[#9CA3AF]">
                * Pago coordinado directamente con el proveedor.
              </p>
            </div>

            {/* ★ Botón de checkout — bloqueado si B2B inválido */}
            <button
              onClick={handleCheckout}
              disabled={!esValido}
              id="checkout-btn"
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all",
                esValido
                  ? "gradient-brand text-white hover:opacity-90 active:scale-[0.98] shadow-lg"
                  : "bg-[#F1F1F1] text-[#9CA3AF] cursor-not-allowed"
              )}
            >
              {esValido ? (
                <>
                  <Send size={15} />
                  Confirmar Orden de Compra
                </>
              ) : (
                <>
                  <AlertTriangle size={15} />
                  Corrige las cantidades primero
                </>
              )}
            </button>

            {!esValido && (
              <p className="text-xs text-center text-red-600 font-medium">
                Los items marcados en rojo no cumplen con el MOQ o los lotes mínimos.
              </p>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
