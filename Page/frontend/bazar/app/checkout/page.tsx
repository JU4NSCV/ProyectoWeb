"use client";
// ============================================================
// app/checkout/page.tsx — Resumen y confirmación de Orden
// ============================================================
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, AlertTriangle, CheckCircle, ArrowLeft, Package } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PanelCarrito } from "@/components/carrito/PanelCarrito";
import { Button } from "@/components/ui/Button";
import { useCarritoStore } from "@/store/carritoStore";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";

export default function PaginaCheckout() {
  const router = useRouter();
  const { items, subtotal, validaciones, carritoEsValido, vaciarCarrito, totalItems } = useCarritoStore();

  // Redirigir si el carrito está vacío
  useEffect(() => {
    if (items.length === 0) router.push("/");
  }, [items.length, router]);

  const esValido = carritoEsValido();
  const validacionesMap = Object.fromEntries(validaciones().map((v) => [v.itemId, v]));

  const handleConfirmar = () => {
    // TODO: Integrar con POST /api/ordenes/
    alert("✅ Orden de Compra generada. El proveedor la procesará en breve.");
    vaciarCarrito();
    router.push("/");
  };

  if (items.length === 0) return null;

  return (
    <>
      <Navbar />
      <PanelCarrito />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
          <Link href="/" className="hover:text-[#FB4318] transition-colors flex items-center gap-1">
            <ArrowLeft size={14} />
            Catálogo
          </Link>
          <span>/</span>
          <span className="text-[#111] font-medium">Confirmar Pedido</span>
        </div>

        <h1 className="text-2xl font-extrabold text-[#111] flex items-center gap-2">
          <ShoppingCart size={24} className="text-[#FB4318]" />
          Confirmar Orden de Compra
        </h1>

        {/* Banner de validación global */}
        <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
          esValido ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
        }`}>
          {esValido
            ? <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            : <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          }
          <div>
            <p className={`font-semibold ${esValido ? "text-green-800" : "text-amber-800"}`}>
              {esValido
                ? "✓ Todos los productos cumplen las reglas de compra B2B"
                : "⚠ Hay productos que no cumplen el MOQ o los lotes mínimos"
              }
            </p>
            <p className={`text-sm mt-0.5 ${esValido ? "text-green-700" : "text-amber-700"}`}>
              {esValido
                ? "Puedes proceder a confirmar el pedido."
                : "Vuelve al catálogo o ajusta las cantidades en el carrito."}
            </p>
          </div>
        </div>

        {/* Lista de items */}
        <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E5E5E5] bg-[#F8F8F8]">
            <h2 className="font-bold text-[#111] text-sm">
              {items.length} {items.length === 1 ? "producto" : "productos"} · {totalItems()} unidades totales
            </h2>
          </div>

          <div className="divide-y divide-[#F1F1F1]">
            {items.map((item) => {
              const v = validacionesMap[item.producto.id];
              return (
                <div key={item.producto.id} className={`flex gap-4 px-5 py-4 ${
                  v && !v.valido ? "bg-red-50" : ""
                }`}>
                  {/* Imagen */}
                  <div className="w-14 h-14 rounded-lg bg-[#F8F8F8] flex-shrink-0 overflow-hidden relative">
                    {item.producto.imagen ? (
                      <Image src={item.producto.imagen} alt={item.producto.nombre} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package size={18} className="text-[#D1D5DB]" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#111] text-sm">{item.producto.nombre}</p>
                    <p className="text-xs text-[#9CA3AF]">SKU: {item.producto.sku} · {item.producto.mayorista_nombre}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="tag-moq" style={{ fontSize: "10px" }}>MOQ {item.producto.moq}</span>
                      {item.producto.multiplo_lote > 1 && (
                        <span className="tag-lote" style={{ fontSize: "10px" }}>x{item.producto.multiplo_lote}</span>
                      )}
                    </div>
                    {v && !v.valido && (
                      <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                        <AlertTriangle size={11} /> {v.mensaje}
                      </p>
                    )}
                  </div>

                  {/* Cantidades y precio */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-[#9CA3AF]">{item.cantidad} u. × {formatCurrency(item.precio_unitario)}</p>
                    <p className="font-bold text-[#111]">{formatCurrency(item.precio_unitario * item.cantidad)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totales */}
          <div className="px-5 py-4 border-t border-[#E5E5E5] bg-[#F8F8F8] flex flex-col gap-1">
            <div className="flex justify-between text-sm text-[#6B6B6B]">
              <span>Subtotal ({totalItems()} unidades)</span>
              <span>{formatCurrency(subtotal())}</span>
            </div>
            <div className="flex justify-between font-extrabold text-lg text-[#111] mt-1">
              <span>Total Estimado</span>
              <span className="text-[#FB4318]">{formatCurrency(subtotal())}</span>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1">
              * El pago se coordina directamente con cada proveedor vía transferencia o contra entrega.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/" className="flex-shrink-0">
            <Button variant="ghost" size="lg">
              <ArrowLeft size={16} />
              Seguir comprando
            </Button>
          </Link>
          <Button
            onClick={handleConfirmar}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!esValido}
          >
            {esValido ? "✓ Confirmar Orden de Compra" : "⚠ Corrige las cantidades primero"}
          </Button>
        </div>
      </main>
    </>
  );
}
