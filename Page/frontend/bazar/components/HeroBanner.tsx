"use client";
// ============================================================
// components/HeroBanner.tsx — Banner principal del catálogo
// ============================================================
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Shield, Clock, Package } from "lucide-react";
import { useRolStore } from "@/store/rolStore";
import { Button } from "@/components/ui/Button";

const PILLS = [
  { icon: <Shield size={13} />, text: "Precios verificados" },
  { icon: <Clock size={13} />, text: "Pedidos 24/7" },
  { icon: <Package size={13} />, text: "Compra por lotes" },
];

export function HeroBanner() {
  const { rol } = useRolStore();

  const esMinorista  = rol === "minorista";
  const esConsumidor = rol === "consumidor";

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a0a00] via-[#2d0f00] to-[#0d0500] px-6 py-10 md:px-12 md:py-14">
      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20"
             style={{ background: "radial-gradient(circle, #FB4318 0%, transparent 70%)" }} />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-15"
             style={{ background: "radial-gradient(circle, #FFC22F 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full opacity-10"
             style={{ background: "radial-gradient(circle, #FB4318 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        {/* Texto principal */}
        <div className="flex-1 text-center md:text-left">
          {/* Badge de rol activo */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-4 text-xs text-white/80">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: esMinorista ? "#FFC22F" : "#fff" }} />
            {esMinorista
              ? "👋 Viendo precios MAYORISTAS exclusivos"
              : esConsumidor
              ? "👁 Viendo catálogo al público"
              : "👁 Catálogo público — Inicia sesión para ver más"}
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
            El Mercado{" "}
            <span className="text-gradient" style={{
              backgroundImage: "linear-gradient(135deg, #FFC22F, #FB4318)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Mayorista Digital
            </span>
            {" "}del Ecuador
          </h1>

          <p className="mt-4 text-white/70 text-base md:text-lg max-w-lg">
            Conectamos fabricantes y distribuidores con tiendas y compradores por volumen.
            Precios de mayorista, pedidos mínimos garantizados.
          </p>

          {/* Pills de beneficios */}
          <div className="flex flex-wrap gap-2 mt-5 justify-center md:justify-start">
            {PILLS.map((pill) => (
              <span
                key={pill.text}
                className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20
                           text-white/80 text-xs px-3 py-1.5 rounded-full font-medium"
              >
                <span className="text-[#FFC22F]">{pill.icon}</span>
                {pill.text}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
            {!esMinorista && (
              <Link href="/auth/registro">
                <Button variant="secondary" size="lg" className="shadow-lg">
                  Registrar mi empresa
                  <ArrowRight size={16} />
                </Button>
              </Link>
            )}
            <Link href="#catalogo">
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
              >
                Ver catálogo →
              </Button>
            </Link>
          </div>
        </div>

        {/* Logo / ilustración */}
        <div className="flex-shrink-0 opacity-80 hidden md:block">
          <Image
            src="/logo.png"
            alt="Bazar B2B"
            width={200}
            height={200}
            className="object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="relative z-10 mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
        {[
          { numero: "500+", label: "Productos" },
          { numero: "24/7", label: "Disponibilidad" },
          { numero: "MOQ", label: "Garantizado" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-xl md:text-2xl font-extrabold text-[#FFC22F]">{stat.numero}</div>
            <div className="text-xs text-white/50 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
