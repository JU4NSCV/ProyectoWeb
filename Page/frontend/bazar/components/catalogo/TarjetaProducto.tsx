"use client";
// ============================================================
// components/catalogo/TarjetaProducto.tsx
// Tarjeta de producto con precios dinámicos por rol B2B
//
// ★ v2: agregarProducto ahora devuelve {agregado, mensaje}
//       Si es rechazado → toast de error inmediato
// ============================================================
import Image from "next/image";
import { useState } from "react";
import { ShoppingCart, Package, AlertCircle, Star, Plus, Minus, Check } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useRolStore }     from "@/store/rolStore";
import { useCarritoStore } from "@/store/carritoStore";
import { useToastStore }   from "@/store/toastStore";
import { Badge }           from "@/components/ui/Badge";
import { Button }          from "@/components/ui/Button";
import type { Producto }   from "@/types";

interface TarjetaProductoProps {
  producto: Producto;
}

export function TarjetaProducto({ producto }: TarjetaProductoProps) {
  const { rol }                           = useRolStore();
  const { agregarProducto, abrirCarrito } = useCarritoStore();
  const toast                             = useToastStore();

  // Cantidad inicial = MOQ (cumple reglas B2B desde el primer momento)
  const [cantidad, setCantidad] = useState(producto.moq);
  const [estado, setEstado]     = useState<"idle" | "ok" | "error">("idle");

  const esMinorista  = rol === "minorista";
  const precioActual = esMinorista ? producto.precio_minorista : producto.precio_publico;
  const descuento    = esMinorista
    ? Math.round((1 - producto.precio_minorista / producto.precio_publico) * 100)
    : 0;
  const sinStock     = producto.stock === 0;

  // ── Control de cantidad: siempre en múltiplos del lote ──
  const incrementar = () => {
    setCantidad((prev) => prev + producto.multiplo_lote);
  };

  const decrementar = () => {
    setCantidad((prev) => {
      const siguiente = prev - producto.multiplo_lote;
      return siguiente < producto.moq ? producto.moq : siguiente;
    });
  };

  // ── ★ Agregar al carrito con validación B2B ─────────────
  const handleAgregar = () => {
    if (sinStock) return;

    const resultado = agregarProducto(producto, cantidad, precioActual);

    if (!resultado.agregado) {
      // ★ El store rechazó la acción → mostrar toast de error
      setEstado("error");
      toast.error("Cantidad inválida", resultado.mensaje);
      setTimeout(() => setEstado("idle"), 2000);
      return;
    }

    // Éxito
    setEstado("ok");
    toast.exito(
      "Agregado al pedido",
      `${cantidad} u. de "${producto.nombre}" → ${formatCurrency(precioActual * cantidad)}`
    );
    setTimeout(() => {
      setEstado("idle");
      abrirCarrito();
    }, 900);
  };

  return (
    <article
      className={cn(
        "bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden flex flex-col",
        "card-hover animate-fade-in",
        sinStock && "opacity-60"
      )}
    >
      {/* ── Imagen ──────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] bg-[#F8F8F8] overflow-hidden">
        {producto.imagen ? (
          <Image
            src={producto.imagen}
            alt={producto.nombre}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#D1D5DB]">
            <Package size={40} />
            <span className="text-xs mt-2 font-medium">Sin imagen</span>
          </div>
        )}

        {/* Badges superiores */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {producto.destacado && (
            <span className="flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-md">
              <Star size={10} fill="currentColor" />
              DESTACADO
            </span>
          )}
          {sinStock && (
            <span className="bg-gray-800/80 text-white text-xs font-bold px-2 py-0.5 rounded-md">
              SIN STOCK
            </span>
          )}
        </div>

        {/* Badge descuento minorista */}
        {esMinorista && descuento > 0 && (
          <div className="absolute top-2 right-2">
            <span className="gradient-brand text-white text-xs font-bold px-2 py-1 rounded-lg">
              -{descuento}%
            </span>
          </div>
        )}
      </div>

      {/* ── Contenido ─────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Categoría + SKU */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="categoria">{producto.categoria}</Badge>
          <span className="text-[10px] font-mono text-[#9CA3AF]">SKU: {producto.sku}</span>
        </div>

        {/* Nombre y proveedor */}
        <div>
          <h3 className="font-bold text-[#111] text-base leading-tight line-clamp-2">
            {producto.nombre}
          </h3>
          <p className="text-xs text-[#9CA3AF] mt-0.5">por {producto.mayorista_nombre}</p>
        </div>

        {/* Descripción */}
        <p className="text-xs text-[#6B6B6B] line-clamp-2 leading-relaxed">
          {producto.descripcion}
        </p>

        {/* ── Reglas B2B visibles ─────────────────────────── */}
        <div className="flex flex-wrap gap-1.5">
          <span className="tag-moq">
            <Package size={10} />
            MOQ: {producto.moq} u.
          </span>
          {producto.multiplo_lote > 1 && (
            <span className="tag-lote">
              Lote ×{producto.multiplo_lote}
            </span>
          )}
        </div>

        {/* ── Precio dinámico por rol ──────────────────────── */}
        <div className="mt-auto pt-2 border-t border-[#F1F1F1]">
          {esMinorista ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-[#FB4318]">
                  {formatCurrency(producto.precio_minorista)}
                </span>
                <span className="text-sm text-[#9CA3AF] line-through">
                  {formatCurrency(producto.precio_publico)}
                </span>
              </div>
              <p className="text-xs text-green-600 font-semibold mt-0.5">
                💰 Precio mayorista exclusivo
              </p>
            </div>
          ) : (
            <div>
              <span className="text-2xl font-extrabold text-[#111]">
                {formatCurrency(precioActual)}
              </span>
              {rol === "visitante" && (
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  🔒{" "}
                  <span className="font-medium text-[#FB4318]">Inicia sesión</span>{" "}
                  para ver precio mayorista
                </p>
              )}
            </div>
          )}
          <p className="text-[10px] text-[#9CA3AF] mt-1">
            por unidad · subtotal: {formatCurrency(precioActual * cantidad)}
          </p>
        </div>

        {/* ── Controles de cantidad + botón agregar ───────── */}
        {!sinStock && (
          <div className="flex items-center justify-between gap-3 mt-1">
            {/* Spinner de cantidad */}
            <div className="flex items-center gap-1 bg-[#F8F8F8] rounded-xl border border-[#E5E5E5] p-1">
              <button
                onClick={decrementar}
                disabled={cantidad <= producto.moq}
                className="p-1.5 rounded-lg hover:bg-[#E5E5E5] disabled:opacity-30 transition-colors"
                aria-label="Reducir cantidad"
              >
                <Minus size={13} />
              </button>
              <span className="min-w-[2.5rem] text-center text-sm font-bold text-[#111] tabular-nums">
                {cantidad}
              </span>
              <button
                onClick={incrementar}
                className="p-1.5 rounded-lg hover:bg-[#E5E5E5] transition-colors"
                aria-label="Aumentar cantidad"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* ★ Botón agregar con feedback visual */}
            <Button
              onClick={handleAgregar}
              variant={estado === "ok" ? "secondary" : estado === "error" ? "danger" : "primary"}
              size="sm"
              className="flex-1 transition-all"
            >
              {estado === "ok" ? (
                <>
                  <Check size={14} />
                  Agregado
                </>
              ) : estado === "error" ? (
                <>
                  <AlertCircle size={14} />
                  Inválido
                </>
              ) : (
                <>
                  <ShoppingCart size={14} />
                  Agregar
                </>
              )}
            </Button>
          </div>
        )}

        {/* Aviso para visitante sin cuenta */}
        {!esMinorista && (
          <div className="flex items-start gap-1.5 text-[10px] text-[#6B6B6B] bg-[#F8F8F8] rounded-lg px-2 py-1.5">
            <AlertCircle size={10} className="mt-0.5 flex-shrink-0 text-[#FFC22F]" />
            <span>Regístrate como minorista para desbloquear precios especiales.</span>
          </div>
        )}
      </div>
    </article>
  );
}
