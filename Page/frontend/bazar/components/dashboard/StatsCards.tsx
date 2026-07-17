"use client";
// ============================================================
// components/dashboard/StatsCards.tsx
// Tarjetas de métricas rápidas del dashboard:
//   Total pedidos | Pendientes | Total facturado | Despachados
// ============================================================
import { ShoppingBag, Clock, DollarSign, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Pedido } from "@/types";

interface StatsCardsProps {
  pedidos:    Pedido[];
  cargando:   boolean;
  esMayorista: boolean;
}

function parsePrecio(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  return typeof val === "number" ? val : parseFloat(val) || 0;
}

function calcularTotal(p: Pedido): number {
  if (p.total) return parsePrecio(p.total);
  return p.detalles.reduce((acc, d) => {
    const sub = d.subtotal
      ? parsePrecio(d.subtotal)
      : parsePrecio(d.precio_unitario_guardado) * d.cantidad;
    return acc + sub;
  }, 0);
}

export function StatsCards({ pedidos, cargando, esMayorista }: StatsCardsProps) {
  const totalPedidos   = pedidos.length;
  const pendientes     = pedidos.filter((p) => p.estado === "pendiente").length;
  const despachados    = pedidos.filter(
    (p) => p.estado === "DESPACHADO" || p.estado === "enviado" || p.estado === "entregado"
  ).length;
  const totalFacturado = pedidos.reduce((acc, p) => acc + calcularTotal(p), 0);

  const stats = [
    {
      id:      "stat-total",
      label:   esMayorista ? "Pedidos recibidos" : "Mis pedidos",
      value:   cargando ? "—" : String(totalPedidos),
      icon:    ShoppingBag,
      color:   "text-[#FB4318]",
      bg:      "bg-[#FFF7ED]",
      isCount: true,
    },
    {
      id:      "stat-pendientes",
      label:   "Pendientes",
      value:   cargando ? "—" : String(pendientes),
      icon:    Clock,
      color:   "text-amber-600",
      bg:      "bg-amber-50",
      isCount: true,
    },
    {
      id:      "stat-facturado",
      label:   esMayorista ? "Total ventas" : "Total comprado",
      value:   cargando ? "—" : formatCurrency(totalFacturado),
      icon:    DollarSign,
      color:   "text-[#FB4318]",
      bg:      "bg-[#FFF7ED]",
      isCount: false,
    },
    {
      id:      "stat-despachados",
      label:   esMayorista ? "Despachados" : "Entregados",
      value:   cargando ? "—" : String(despachados),
      icon:    Truck,
      color:   "text-emerald-600",
      bg:      "bg-emerald-50",
      isCount: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.id}
          id={s.id}
          className="bg-white rounded-2xl border border-[#E5E5E5] px-5 py-4
                     flex flex-col gap-3 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">
              {s.label}
            </p>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.bg}`}>
              <s.icon size={16} className={s.color} />
            </div>
          </div>
          {cargando ? (
            <div className="skeleton h-7 w-20 rounded" />
          ) : (
            <p className={`text-2xl font-extrabold ${s.isCount ? "text-[#111]" : "text-[#FB4318]"}`}>
              {s.value}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
