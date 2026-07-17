"use client";
// ============================================================
// app/planes/page.tsx — Catálogo de Planes de Suscripción
// ★ BUG FIX 2: ROUTE GUARD — Solo MAYORISTAS.
//   Usa el hook useRolJWT como fuente de verdad del rol.
// ============================================================
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, Zap, ArrowLeft, Loader2,
  ShieldX, Lock,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PanelCarrito } from "@/components/carrito/PanelCarrito";
import { useAuthStore } from "@/store/authStore";
import { useRolJWT } from "@/hooks/useRolJWT";
import { getPlanes, type PlanSuscripcion } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

// ── Componente de Acceso Denegado ────────────────────────────
function AccesoDenegado({ onVolver }: { onVolver: () => void }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border-2 border-red-200 p-10 max-w-md w-full text-center flex flex-col gap-5 shadow-xl">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
          <ShieldX size={44} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#111]">Acceso Restringido</h1>
          <p className="text-[#6B6B6B] mt-2 text-sm leading-relaxed">
            La sección de <strong>Planes y Suscripciones</strong> es exclusiva para usuarios
            con rol <strong className="text-purple-700">MAYORISTA</strong>.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left">
          <div className="flex items-start gap-2">
            <Lock size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Si crees que deberías tener acceso, contacta al administrador para
              actualizar tu rol a <strong>Mayorista</strong> en el sistema.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            id="acceso-denegado-volver-btn"
            onClick={onVolver}
            className="w-full py-3 rounded-xl gradient-brand text-white font-bold text-sm
                       hover:opacity-90 transition-all"
          >
            Volver al Inicio
          </button>
          <Link href="/dashboard">
            <button className="w-full py-3 rounded-xl border border-[#E5E5E5] text-[#6B6B6B] font-semibold text-sm
                               hover:border-[#FB4318] hover:text-[#FB4318] transition-all">
              Ir al Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────
export default function PaginaPlanes() {
  const router = useRouter();
  const { estaAutenticado } = useAuthStore();
  // ★ BUG FIX 2: Hook centralizado para leer el rol del JWT
  const { esMayorista, hidratado } = useRolJWT();

  const [planes, setPlanes]     = useState<PlanSuscripcion[]>([]);
  const [cargando, setCargando] = useState(true);

  // Cargar planes solo si es Mayorista y está autenticado
  useEffect(() => {
    if (!hidratado) return;
    if (!estaAutenticado || !esMayorista) {
      setCargando(false);
      return;
    }
    getPlanes()
      .then((data) => setPlanes(data))
      .finally(() => setCargando(false));
  }, [hidratado, estaAutenticado, esMayorista]);

  // ── Pantalla de hidratación ──────────────────────────────
  if (!hidratado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <Loader2 size={32} className="animate-spin text-[#FB4318]" />
      </div>
    );
  }

  // No autenticado → login
  if (!estaAutenticado) {
    router.replace("/auth/login");
    return null;
  }

  // ★ BUG FIX 2: NO es Mayorista → Pantalla de Acceso Denegado
  if (!esMayorista) {
    return (
      <>
        <Navbar />
        <main className="bg-[#F8F8F8] min-h-screen">
          <AccesoDenegado onVolver={() => router.push("/")} />
        </main>
      </>
    );
  }

  // ── Vista para MAYORISTAS ──────────────────────────────────
  return (
    <>
      <Navbar />
      <PanelCarrito />

      <main className="min-h-screen bg-gradient-to-b from-[#1a0a00] via-[#2d1000] to-[#F8F8F8] pt-0">
        {/* Hero */}
        <section className="px-4 pt-16 pb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Link href="/" className="text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors">
              <ArrowLeft size={14} />
              Volver al catálogo
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border border-purple-500/30">
            🏭 Zona Exclusiva Mayoristas
          </div>

          <div className="inline-flex items-center gap-2 bg-[#FB4318]/20 text-[#FB4318] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-[#FB4318]/30">
            <Zap size={12} />
            Suscripciones B2B
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Elige tu Plan
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Desbloquea el dashboard dual, gestión de ventas y mucho más con nuestros planes empresariales.
          </p>
        </section>

        {/* Cards de planes */}
        <section className="max-w-5xl mx-auto px-4 pb-20">
          {cargando ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-[#FB4318]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {planes.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-3xl border-2 p-6 flex flex-col gap-4 transition-all duration-300
                    hover:shadow-2xl hover:-translate-y-1
                    ${plan.popular
                      ? "border-[#FB4318] shadow-[0_0_40px_rgba(251,67,24,0.25)]"
                      : "border-[#E5E5E5] hover:border-[#FB4318]/50"
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <div className="gradient-brand text-white text-[11px] font-extrabold px-4 py-1 rounded-full shadow-lg uppercase tracking-wider">
                        ⭐ Más Popular
                      </div>
                    </div>
                  )}

                  <div>
                    <h2 className="text-xl font-extrabold text-[#111]">{plan.nombre}</h2>
                    <p className="text-sm text-[#6B6B6B] mt-1">{plan.descripcion}</p>
                  </div>

                  <div className="flex items-end gap-1">
                    {plan.precio === 0 ? (
                      <span className="text-3xl font-extrabold text-[#111]">Gratis</span>
                    ) : (
                      <>
                        <span className="text-3xl font-extrabold text-[#111]">
                          {formatCurrency(plan.precio)}
                        </span>
                        <span className="text-sm text-[#9CA3AF] mb-1">/mes</span>
                      </>
                    )}
                  </div>

                  <ul className="flex flex-col gap-2 flex-1">
                    {plan.caracteristicas.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-[#444]">{c}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    id={`elegir-plan-${plan.id}`}
                    onClick={() =>
                      router.push(
                        `/planes/pago?plan_id=${plan.id}&plan_nombre=${encodeURIComponent(plan.nombre)}&plan_precio=${plan.precio}`
                      )
                    }
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98]
                      focus:outline-none focus:ring-2 focus:ring-offset-2
                      ${plan.popular
                        ? "gradient-brand text-white hover:opacity-90 focus:ring-[#FB4318]/50 shadow-lg"
                        : "border-2 border-[#FB4318] text-[#FB4318] hover:bg-[#FFF7ED] focus:ring-[#FB4318]/30"
                      }`}
                  >
                    {plan.precio === 0 ? "Comenzar Gratis" : "Elegir Plan"}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <p className="text-[#6B6B6B] text-sm">
              💳 Pago seguro · 🔒 SSL · ✅ Cancela cuando quieras
            </p>
            <p className="text-[#9CA3AF] text-xs mt-2">
              Todos los precios en USD. Renovación mensual automática.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
