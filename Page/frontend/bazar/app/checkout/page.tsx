"use client";
// ============================================================
// app/checkout/page.tsx — Resumen y confirmación de Orden
// ★ REAL AUTH: Usa user_id del JWT y Authorization header
// ============================================================
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart, AlertTriangle, CheckCircle, ArrowLeft,
  Package, Loader2, Lock, AlertCircle,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PanelCarrito } from "@/components/carrito/PanelCarrito";
import { Button } from "@/components/ui/Button";
import { useCarritoStore } from "@/store/carritoStore";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { crearPedido } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";

// ── Tipos del formulario de entrega ──────────────────────────
interface FormEntrega {
  direccion: string;
  notas: string;
}

export default function PaginaCheckout() {
  const router = useRouter();
  const toast  = useToastStore();

  // ★ REAL AUTH: extraer usuario y token del store JWT
  const { usuario, accessToken, estaAutenticado } = useAuthStore();

  const {
    items, subtotal, validaciones, carritoEsValido, vaciarCarrito,
    totalItems, checkoutEstado, setCheckoutEstado,
  } = useCarritoStore();

  const [form, setForm] = useState<FormEntrega>({ direccion: "", notas: "" });

  // ── Guardia: redirigir si el carrito está vacío ──────────
  useEffect(() => {
    if (items.length === 0) router.push("/");
  }, [items.length, router]);

  // ── Guardia: redirigir si no está autenticado ────────────
  useEffect(() => {
    if (!estaAutenticado) {
      toast.advertencia(
        "Debes iniciar sesión",
        "Para confirmar un pedido necesitas estar autenticado."
      );
      router.push("/auth/login");
    }
  }, [estaAutenticado, router, toast]);

  const esValido          = carritoEsValido();
  const validacionesMap   = Object.fromEntries(validaciones().map((v) => [v.itemId, v]));
  const estaCargando      = checkoutEstado === "loading";

  // ── Handler principal de confirmación ────────────────────
  const handleConfirmar = async () => {
    // Validaciones previas
    if (!esValido) {
      toast.error("Carrito inválido", "Corrige las cantidades antes de confirmar.");
      return;
    }
    if (!form.direccion.trim()) {
      toast.advertencia("Dirección requerida", "Ingresa la dirección de entrega.");
      return;
    }
    if (!usuario) {
      toast.error("Sin sesión", "Debes iniciar sesión para confirmar el pedido.");
      router.push("/auth/login");
      return;
    }

    setCheckoutEstado("loading");

    try {
      // ★ FIX REQ 1: Payload SIN "cliente" — el backend lo asigna automáticamente por el token JWT
      const payload = {
        direccion_entrega_final: form.direccion.trim(),
        notas_pedido:            form.notas.trim(),
        detalles: items.map((item) => ({
          producto:                  item.producto.id,
          cantidad:                  item.cantidad,
          precio_unitario_guardado:  item.precio_unitario.toFixed(2),
        })),
      };

      // ★ REAL: Inyección del header Authorization: Bearer <token>
      const pedido = await crearPedido(payload, accessToken ?? undefined);

      setCheckoutEstado("exito", undefined);
      vaciarCarrito();

      toast.exito(
        `¡Pedido #${pedido.id} creado!`,
        "Tu orden fue enviada al proveedor. Recibirás confirmación en breve."
      );

      router.push("/");

    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes("401")
          ? "Sesión expirada. Por favor, vuelve a iniciar sesión."
          : "No se pudo crear el pedido. Intenta de nuevo.";

      setCheckoutEstado("error", msg);
      toast.error("Error al confirmar pedido", msg);

      if (msg.includes("Sesión expirada")) {
        router.push("/auth/login");
      }
    }
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

        {/* ★ Banner de autenticación */}
        {estaAutenticado && usuario && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
            <Lock size={14} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">
              Pedido vinculado a{" "}
              <span className="font-bold">{usuario.username}</span>
              {" "}(ID: {usuario.id})
            </p>
          </div>
        )}

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

        {/* ★ Formulario de entrega */}
        <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E5E5E5] bg-[#F8F8F8]">
            <h2 className="font-bold text-[#111] text-sm">Datos de entrega</h2>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="checkout-direccion" className="text-sm font-semibold text-[#111]">
                Dirección de entrega <span className="text-[#FB4318]">*</span>
              </label>
              <input
                id="checkout-direccion"
                type="text"
                value={form.direccion}
                onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                placeholder="Av. Principal 123, Ciudad, País"
                disabled={estaCargando}
                className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                           focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                           placeholder:text-[#9CA3AF] transition-all disabled:opacity-60"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="checkout-notas" className="text-sm font-semibold text-[#111]">
                Notas del pedido <span className="text-[#9CA3AF] font-normal">(opcional)</span>
              </label>
              <textarea
                id="checkout-notas"
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                rows={3}
                placeholder="Instrucciones especiales, horarios de recepción, etc."
                disabled={estaCargando}
                className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8] resize-none
                           focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                           placeholder:text-[#9CA3AF] transition-all disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Error de checkout */}
        {checkoutEstado === "error" && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            Ocurrió un error al procesar tu pedido. Intenta de nuevo.
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/" className="flex-shrink-0">
            <Button variant="ghost" size="lg" disabled={estaCargando}>
              <ArrowLeft size={16} />
              Seguir comprando
            </Button>
          </Link>

          <button
            id="checkout-confirmar-btn"
            onClick={handleConfirmar}
            disabled={!esValido || estaCargando || !form.direccion.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                       gradient-brand text-white font-bold text-sm
                       hover:opacity-90 active:scale-[0.98] transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none
                       focus:ring-2 focus:ring-[#FB4318]/50"
          >
            {estaCargando
              ? <><Loader2 size={16} className="animate-spin" /> Enviando pedido...</>
              : esValido
                ? "✓ Confirmar Orden de Compra"
                : "⚠ Corrige las cantidades primero"
            }
          </button>
        </div>
      </main>
    </>
  );
}
