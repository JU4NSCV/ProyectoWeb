"use client";
// ============================================================
// app/dashboard/page.tsx — Página principal del Dashboard
// ★ BUG FIX 3: Card "Crear Producto" SOLO visible para MAYORISTAS
//   Card "Planes" SOLO visible para MAYORISTAS
// ============================================================
import Link from "next/link";
import {
  ShoppingBag, ArrowRight, LayoutDashboard,
  TrendingUp, Clock, Truck, Plus, CreditCard, User,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRolJWT } from "@/hooks/useRolJWT";

export default function PaginaDashboard() {
  const { usuario } = useAuthStore();
  // ★ BUG FIX 3: usar el hook de rol para todas las decisiones de visibilidad
  const { esMayorista, hidratado } = useRolJWT();

  const horaActual = new Date().getHours();
  const saludo =
    horaActual < 12 ? "Buenos días" :
    horaActual < 18 ? "Buenas tardes" : "Buenas noches";

  // Accesos siempre visibles para todos
  const accesosBase = [
    {
      id:          "acceso-pedidos",
      href:        "/dashboard/pedidos",
      icon:        ShoppingBag,
      titulo:      "Historial de Pedidos",
      descripcion: "Consulta y gestiona todos tus pedidos B2B.",
      color:       "gradient-brand",
      textColor:   "text-white",
    },
    {
      id:          "acceso-perfil",
      href:        "/dashboard/perfil",
      icon:        User,
      titulo:      "Mi Perfil",
      descripcion: "Actualiza tus datos empresariales y de contacto.",
      color:       "bg-[#1a1a2e]",
      textColor:   "text-white",
    },
  ];

  // ★ BUG FIX 3: accesos exclusivos para MAYORISTAS
  const accesosMayorista = esMayorista ? [
    {
      id:          "acceso-crear-producto",
      href:        "/dashboard/productos/nuevo",
      icon:        Plus,
      titulo:      "Crear Producto",
      descripcion: "Publica nuevos productos en tu catálogo mayorista.",
      color:       "bg-purple-700",
      textColor:   "text-white",
    },
    {
      id:          "acceso-planes",
      href:        "/planes",
      icon:        CreditCard,
      titulo:      "Planes y Suscripciones",
      descripcion: "Gestiona tu suscripción y accede a funciones premium.",
      color:       "bg-gradient-to-br from-purple-900 to-indigo-800",
      textColor:   "text-white",
    },
  ] : [];

  const accesos = [...accesosBase, ...accesosMayorista];

  return (
    <div className="flex flex-col gap-8 animate-fade-in">

      {/* ── Cabecera de bienvenida ───────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
          <LayoutDashboard size={14} />
          <span>Panel de gestión operativa</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111]">
          {saludo}, {usuario?.username ?? "usuario"} 👋
        </h1>
        <p className="text-[#6B6B6B] text-sm">
          {esMayorista
            ? "Panel MAYORISTA — Gestiona pedidos, catálogo de productos y suscripciones."
            : "Desde aquí puedes gestionar tus pedidos, consultar tu historial y actualizar estados."
          }
        </p>

        {/* Badge de rol — muestra el rol activo del JWT */}
        {hidratado && esMayorista && (
          <div className="mt-2 inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 px-3 py-1.5 rounded-xl text-xs font-bold w-fit">
            🏭 Rol: MAYORISTA — Acceso completo al panel
          </div>
        )}
      </div>

      {/* ── Tarjetas de acceso rápido ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accesos.map((a) => (
          <Link
            key={a.id}
            id={a.id}
            href={a.href}
            className={`
              group relative overflow-hidden rounded-2xl p-6 flex flex-col gap-3
              ${a.color} hover:opacity-95 hover:shadow-lg transition-all duration-200
            `}
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <a.icon size={22} className={a.textColor} />
            </div>
            <div>
              <h2 className={`text-lg font-extrabold ${a.textColor}`}>{a.titulo}</h2>
              <p className={`text-sm mt-0.5 ${a.textColor} opacity-80`}>{a.descripcion}</p>
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${a.textColor} mt-auto`}>
              <span>Ir ahora</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </div>
            {/* Decoración de fondo */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10" />
          </Link>
        ))}

        {/* Card de estado del sistema */}
        <div className="rounded-2xl p-6 bg-white border border-[#E5E5E5] flex flex-col gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <TrendingUp size={22} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#111]">Estado del sistema</h2>
            <p className="text-sm text-[#6B6B6B] mt-0.5">
              API conectada a <code className="text-xs bg-[#F1F1F1] px-1 py-0.5 rounded">127.0.0.1:8000</code>
            </p>
          </div>
          <div className="flex items-center gap-2 mt-auto">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-700 font-semibold">Operativo</span>
          </div>
        </div>
      </div>

      {/* ── Guía rápida ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6">
        <h2 className="text-base font-extrabold text-[#111] mb-4">
          Guía rápida del panel
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon:  ShoppingBag,
              color: "text-[#FB4318]",
              bg:    "bg-[#FFF7ED]",
              title: "Ver pedidos",
              desc:  "Accede al historial completo de pedidos filtrados por estado.",
            },
            {
              icon:  Clock,
              color: "text-amber-600",
              bg:    "bg-amber-50",
              title: "Seguimiento en tiempo real",
              desc:  "Cada pedido muestra su estado actualizado desde el backend.",
            },
            {
              icon:  Truck,
              color: "text-emerald-600",
              bg:    "bg-emerald-50",
              title: esMayorista ? "Gestión de ventas" : "Acción de despacho",
              desc:  esMayorista
                ? "Como Mayorista puedes ver Mis Compras y Mis Ventas en tabs separadas."
                : "Los mayoristas pueden marcar pedidos como despachados con un clic.",
            },
          ].map((g) => (
            <div key={g.title} className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl ${g.bg} flex items-center justify-center flex-shrink-0`}>
                <g.icon size={17} className={g.color} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#111]">{g.title}</p>
                <p className="text-xs text-[#6B6B6B] mt-0.5 leading-relaxed">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ★ BUG FIX 3: Sección de Mayorista — solo visible con rol MAYORISTA */}
      {hidratado && esMayorista && (
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold">🏭 Herramientas de Mayorista</h2>
              <p className="text-purple-200 text-sm mt-1">
                Tienes acceso exclusivo a la creación de productos y gestión de suscripciones.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/productos/nuevo">
                <button
                  id="btn-crear-producto-dashboard"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-purple-800
                             font-bold text-sm hover:bg-purple-50 transition-all focus:outline-none
                             focus:ring-2 focus:ring-white/50"
                >
                  <Plus size={16} />
                  Crear Producto
                </button>
              </Link>
              <Link href="/planes">
                <button
                  id="btn-planes-dashboard"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/30
                             text-white font-bold text-sm hover:bg-white/10 transition-all
                             focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <CreditCard size={16} />
                  Ver Planes
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
