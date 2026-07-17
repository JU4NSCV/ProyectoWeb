"use client";
// ============================================================
// app/planes/pago/page.tsx — Pasarela de Pago (Mock)
// ★ REQ 6: Selectores de método de pago
//    - Transferencia Bancaria → muestra 2 QR + datos bancarios
//    - Tarjeta de Crédito / Débito → formulario simulado
//    Botón "Simular Pago y Activar Suscripción" → Toast de éxito
// ============================================================
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CreditCard, Repeat, ArrowLeft, CheckCircle,
  Building2, Smartphone, Loader2, Lock,
  ShieldCheck, QrCode,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PanelCarrito } from "@/components/carrito/PanelCarrito";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { activarSuscripcion } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

// ── Métodos de pago ──────────────────────────────────────────
type MetodoPago = "transferencia" | "tarjeta_credito" | "tarjeta_debito" | "payphone";

const METODOS: { id: MetodoPago; label: string; descripcion: string; icono: React.ReactNode }[] = [
  {
    id: "transferencia",
    label: "Transferencia Bancaria",
    descripcion: "Escanea el QR o usa los datos bancarios",
    icono: <Building2 size={20} />,
  },
  {
    id: "tarjeta_credito",
    label: "Tarjeta de Crédito",
    descripcion: "Visa, Mastercard, American Express",
    icono: <CreditCard size={20} />,
  },
  {
    id: "tarjeta_debito",
    label: "Tarjeta de Débito",
    descripcion: "Débito bancario directo",
    icono: <Repeat size={20} />,
  },
  {
    id: "payphone",
    label: "PayPhone",
    descripcion: "Paga desde tu móvil",
    icono: <Smartphone size={20} />,
  },
];

// ── Datos bancarios ──────────────────────────────────────────
const DATOS_BANCARIOS = [
  {
    banco: "Banco de Loja",
    titular: "Bazar B2B",
    tipo: "Cuenta Corriente",
    numero: "290192348",
    qr: "/qr_banco_loja.jpg",
    color: "from-orange-50 to-amber-50",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700",
  },
  {
    banco: "Banco Pichincha",
    titular: "Bazar B2B",
    tipo: "Cuenta de Ahorros",
    numero: "220019233",
    qr: "/qr_banco_pichincha.jpg",
    color: "from-yellow-50 to-orange-50",
    border: "border-yellow-300",
    badge: "bg-yellow-100 text-yellow-800",
  },
];

// ── Componente interno (necesita Suspense por useSearchParams) ──
function PasarelaContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const toast        = useToastStore();
  const { accessToken, estaAutenticado } = useAuthStore();

  const planId     = searchParams.get("plan_id");
  const planNombre = searchParams.get("plan_nombre") ?? "Plan";
  const planPrecio = parseFloat(searchParams.get("plan_precio") ?? "0");

  const [metodoPago, setMetodoPago]   = useState<MetodoPago>("transferencia");
  const [procesando, setProcesando]   = useState(false);
  const [exitoso, setExitoso]         = useState(false);

  // Datos tarjeta (mock)
  const [tarjeta, setTarjeta] = useState({
    numero: "", nombre: "", expira: "", cvv: "",
  });

  // ── Simular pago ──────────────────────────────────────────
  const handleSimularPago = async () => {
    if (!planId) return;
    setProcesando(true);

    // Simular delay de procesamiento
    await new Promise((r) => setTimeout(r, 1800));

    try {
      if (accessToken) {
        await activarSuscripcion(parseInt(planId), metodoPago, accessToken);
      }
    } catch {
      // Ignorar error en mock — siempre simular éxito
    }

    setProcesando(false);
    setExitoso(true);
    toast.exito(
      "🎉 ¡Suscripción Activada!",
      `Tu plan ${planNombre} está activo. Bienvenido a Bazar B2B Premium.`
    );
  };

  // ── Pantalla de éxito ────────────────────────────────────
  if (exitoso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8] px-4">
        <div className="bg-white rounded-3xl border border-[#E5E5E5] p-10 max-w-md w-full text-center flex flex-col gap-5 shadow-xl">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center animate-bounce">
            <CheckCircle size={44} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#111]">¡Pago Exitoso!</h2>
            <p className="text-[#6B6B6B] mt-2">
              Tu plan <strong className="text-[#FB4318]">{planNombre}</strong> ha sido activado.
              Ahora tienes acceso a todas las funciones premium.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left">
            <div className="flex items-center gap-2 text-green-700 text-sm font-semibold mb-2">
              <ShieldCheck size={16} /> Confirmación de suscripción
            </div>
            <p className="text-xs text-green-600">Plan: {planNombre}</p>
            <p className="text-xs text-green-600">Método: {metodoPago.replace("_", " ")}</p>
            <p className="text-xs text-green-600">Monto: {formatCurrency(planPrecio)}/mes</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/dashboard">
              <button className="w-full py-3 rounded-xl gradient-brand text-white font-bold text-sm hover:opacity-90 transition-all">
                Ir al Dashboard
              </button>
            </Link>
            <Link href="/">
              <button className="w-full py-3 rounded-xl border border-[#E5E5E5] text-[#6B6B6B] font-semibold text-sm hover:border-[#FB4318] hover:text-[#FB4318] transition-all">
                Volver al Catálogo
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />
      <PanelCarrito />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#6B6B6B] mb-6">
          <Link href="/planes" className="hover:text-[#FB4318] flex items-center gap-1 transition-colors">
            <ArrowLeft size={14} />
            Planes
          </Link>
          <span>/</span>
          <span className="text-[#111] font-medium">Pasarela de Pago</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Panel izquierdo: Métodos y formulario ────── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Header */}
            <div>
              <h1 className="text-2xl font-extrabold text-[#111] flex items-center gap-2">
                <Lock size={20} className="text-[#FB4318]" />
                Pasarela de Pago Segura
              </h1>
              <p className="text-sm text-[#6B6B6B] mt-1">
                Todos los pagos son procesados de forma segura y encriptada.
              </p>
            </div>

            {/* Selección de método de pago */}
            <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E5E5E5] bg-[#F8F8F8]">
                <h2 className="font-bold text-[#111] text-sm">Método de Pago</h2>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {METODOS.map((m) => (
                  <button
                    key={m.id}
                    id={`metodo-${m.id}`}
                    onClick={() => setMetodoPago(m.id)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      metodoPago === m.id
                        ? "border-[#FB4318] bg-[#FFF7ED]"
                        : "border-[#E5E5E5] hover:border-[#FB4318]/40"
                    }`}
                  >
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      metodoPago === m.id ? "bg-[#FB4318] text-white" : "bg-[#F1F1F1] text-[#6B6B6B]"
                    }`}>
                      {m.icono}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111]">{m.label}</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">{m.descripcion}</p>
                    </div>
                    {metodoPago === m.id && (
                      <CheckCircle size={16} className="text-[#FB4318] flex-shrink-0 ml-auto mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── TRANSFERENCIA BANCARIA ─────────────────── */}
            {metodoPago === "transferencia" && (
              <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#E5E5E5] bg-[#F8F8F8] flex items-center gap-2">
                  <QrCode size={16} className="text-[#FB4318]" />
                  <h2 className="font-bold text-[#111] text-sm">
                    Escanea el QR o usa los datos bancarios
                  </h2>
                </div>
                <div className="p-5 flex flex-col gap-5">
                  {DATOS_BANCARIOS.map((banco, i) => (
                    <div
                      key={i}
                      className={`bg-gradient-to-br ${banco.color} rounded-2xl border ${banco.border} p-5`}
                    >
                      <div className="flex flex-col sm:flex-row gap-5 items-start">
                        {/* QR */}
                        <div className="flex-shrink-0">
                          <div className="w-36 h-36 bg-white rounded-xl border-2 border-white shadow-md overflow-hidden relative">
                            <Image
                              src={banco.qr}
                              alt={`QR ${banco.banco}`}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                          <p className="text-xs text-center mt-2 font-semibold text-[#6B6B6B]">
                            Escanear QR
                          </p>
                        </div>

                        {/* Datos bancarios */}
                        <div className="flex-1">
                          <div className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold mb-3 ${banco.badge}`}>
                            {banco.banco}
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { label: "Titular", value: banco.titular },
                              { label: "Tipo de cuenta", value: banco.tipo },
                              { label: "Número de cuenta", value: banco.numero },
                            ].map((item) => (
                              <div key={item.label} className="bg-white/70 rounded-lg px-3 py-2">
                                <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide">
                                  {item.label}
                                </p>
                                <p className="text-sm font-bold text-[#111] font-mono mt-0.5">
                                  {item.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
                    <p className="font-semibold mb-1">📌 Instrucciones:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Realiza la transferencia al banco de tu preferencia</li>
                      <li>Incluye tu correo como referencia del pago</li>
                      <li>Haz clic en &ldquo;Simular Pago&rdquo; para activar tu suscripción</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* ── TARJETA (Crédito / Débito) ─────────────── */}
            {(metodoPago === "tarjeta_credito" || metodoPago === "tarjeta_debito") && (
              <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#E5E5E5] bg-[#F8F8F8] flex items-center gap-2">
                  <CreditCard size={16} className="text-[#FB4318]" />
                  <h2 className="font-bold text-[#111] text-sm">
                    Datos de {metodoPago === "tarjeta_credito" ? "Tarjeta de Crédito" : "Tarjeta de Débito"}
                  </h2>
                  <span className="ml-auto text-xs text-[#9CA3AF] bg-[#F1F1F1] px-2 py-0.5 rounded-md">
                    🎭 Simulación
                  </span>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  {/* Número de tarjeta */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wide">
                      Número de tarjeta
                    </label>
                    <input
                      id="tarjeta-numero"
                      type="text"
                      value={tarjeta.numero}
                      onChange={(e) => setTarjeta((t) => ({
                        ...t,
                        numero: e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 16)
                          .replace(/(\d{4})/g, "$1 ").trim()
                      }))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8] font-mono
                                 focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                                 placeholder:text-[#9CA3AF] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wide">
                      Nombre del titular
                    </label>
                    <input
                      id="tarjeta-nombre"
                      type="text"
                      value={tarjeta.nombre}
                      onChange={(e) => setTarjeta((t) => ({ ...t, nombre: e.target.value.toUpperCase() }))}
                      placeholder="JUAN PÉREZ"
                      className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                                 focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                                 placeholder:text-[#9CA3AF] transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wide">
                        Fecha de expiración
                      </label>
                      <input
                        id="tarjeta-expira"
                        type="text"
                        value={tarjeta.expira}
                        onChange={(e) => setTarjeta((t) => ({
                          ...t,
                          expira: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 4)
                            .replace(/(\d{2})(\d)/, "$1/$2")
                        }))}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8] font-mono
                                   focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                                   placeholder:text-[#9CA3AF] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wide">
                        CVV
                      </label>
                      <input
                        id="tarjeta-cvv"
                        type="password"
                        value={tarjeta.cvv}
                        onChange={(e) => setTarjeta((t) => ({
                          ...t,
                          cvv: e.target.value.replace(/\D/g, "").slice(0, 4)
                        }))}
                        placeholder="•••"
                        maxLength={4}
                        className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8] font-mono
                                   focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                                   placeholder:text-[#9CA3AF] transition-all"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[#9CA3AF] flex items-center gap-1">
                    <Lock size={10} /> Datos cifrados con SSL/TLS 256-bit (solo simulación)
                  </p>
                </div>
              </div>
            )}

            {/* ── PAYPHONE ───────────────────────────────── */}
            {metodoPago === "payphone" && (
              <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#E5E5E5] bg-[#F8F8F8]">
                  <h2 className="font-bold text-[#111] text-sm flex items-center gap-2">
                    <Smartphone size={16} className="text-[#FB4318]" />
                    PayPhone
                  </h2>
                </div>
                <div className="p-5 flex flex-col items-center gap-4 text-center py-10">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                    <Smartphone size={30} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-[#111]">Pago por PayPhone</p>
                    <p className="text-sm text-[#6B6B6B] mt-1">
                      Se enviará un enlace de pago a tu número de teléfono registrado.
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 w-full text-left">
                    📱 Abre la app PayPhone → Confirma el pago → ¡Listo!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Panel derecho: Resumen ────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden sticky top-6">
              <div className="px-5 py-4 border-b border-[#E5E5E5] bg-[#F8F8F8]">
                <h2 className="font-bold text-[#111] text-sm">Resumen del Pedido</h2>
              </div>
              <div className="p-5 flex flex-col gap-4">
                {/* Plan seleccionado */}
                <div className="bg-[#FFF7ED] border border-[#FDBA74] rounded-xl p-4">
                  <p className="text-xs text-[#9CA3AF] uppercase tracking-wide font-bold">Plan</p>
                  <p className="text-lg font-extrabold text-[#111] mt-1">{planNombre}</p>
                  <p className="text-xs text-[#6B6B6B] mt-1">Suscripción mensual</p>
                </div>

                {/* Precio */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm text-[#6B6B6B]">
                    <span>Subtotal</span>
                    <span>{formatCurrency(planPrecio)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#6B6B6B]">
                    <span>IVA (0%)</span>
                    <span>$0.00</span>
                  </div>
                  <div className="border-t border-[#E5E5E5] pt-2 flex justify-between font-extrabold text-lg text-[#111]">
                    <span>Total</span>
                    <span className="text-[#FB4318]">{formatCurrency(planPrecio)}<span className="text-xs font-normal text-[#9CA3AF]">/mes</span></span>
                  </div>
                </div>

                {/* Badges de seguridad */}
                <div className="flex flex-wrap gap-2">
                  {["🔒 Seguro", "✅ SSL", "🛡️ Cifrado"].map((b) => (
                    <span key={b} className="text-xs font-semibold bg-[#F1F1F1] text-[#6B6B6B] px-2 py-1 rounded-md">
                      {b}
                    </span>
                  ))}
                </div>

                {/* ★ BOTÓN PRINCIPAL: Simular Pago */}
                <button
                  id="btn-simular-pago"
                  onClick={handleSimularPago}
                  disabled={procesando}
                  className="w-full py-4 rounded-xl gradient-brand text-white font-extrabold text-sm
                             hover:opacity-90 active:scale-[0.98] transition-all
                             disabled:opacity-70 disabled:cursor-not-allowed
                             focus:outline-none focus:ring-2 focus:ring-[#FB4318]/50
                             shadow-lg shadow-[#FB4318]/30"
                >
                  {procesando ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Procesando pago...
                    </span>
                  ) : (
                    "🚀 Simular Pago y Activar Suscripción"
                  )}
                </button>

                <p className="text-xs text-center text-[#9CA3AF]">
                  Al confirmar, aceptas los Términos de Servicio. Simulación con fines educativos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Export con Suspense (requerido por useSearchParams en Next.js 14+) ──
export default function PaginaPago() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#FB4318]" />
      </div>
    }>
      <PasarelaContent />
    </Suspense>
  );
}
