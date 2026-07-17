"use client";
// ============================================================
// app/dashboard/pedidos/page.tsx — Historial de Pedidos
// ★ REQ 4: Dashboard Dual para Mayoristas (Tabs: Mis Compras / Mis Ventas)
// ★ REQ 5: Botón Cancelar Orden (estado PENDIENTE)
// ============================================================
import { useCallback, useEffect, useState } from "react";
import {
  ShoppingBag, RefreshCw, AlertCircle, Loader2, ArrowLeft,
  ShoppingCart, Store,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { getPedidos, patchEstadoPedido, cancelarPedido } from "@/lib/api";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { TablaPedidos } from "@/components/dashboard/TablaPedidos";
import { OrdenDetalleDialog } from "@/components/dashboard/OrdenDetalleDialog";
import type { Pedido, EstadoPedido } from "@/types";

// ── Detectar rol del usuario ─────────────────────────────────
// El rol puede venir del JWT extendido (campo 'role' o 'rol')
// Fallback: comparamos el username para MVP
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectarRol(jwtPayloadExtra?: Record<string, any>): string {
  return (
    jwtPayloadExtra?.role ??
    jwtPayloadExtra?.rol ??
    jwtPayloadExtra?.rol_empresa ??
    ""
  ).toUpperCase();
}

function esMayoristaRol(rol: string): boolean {
  return rol === "MAYORISTA";
}

// ── Componente ───────────────────────────────────────────────
export default function PaginaPedidos() {
  const { accessToken, usuario } = useAuthStore();
  const toast = useToastStore();

  // Tabs para mayoristas
  const [tabActiva, setTabActiva] = useState<"compras" | "ventas">("compras");

  const [pedidosCompras, setPedidosCompras] = useState<Pedido[]>([]);
  const [pedidosVentas, setPedidosVentas]   = useState<Pedido[]>([]);
  const [cargando, setCargando]             = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [refrescando, setRefrescando]       = useState(false);

  // Dialog de detalle
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [dialogAbierto, setDialogAbierto]           = useState(false);

  // Detectar rol — en producción el JWT de Django debería incluir el campo 'role'
  // Para MVP también se puede detectar por is_staff
  const rolStr   = detectarRol();
  const esMayorista = esMayoristaRol(rolStr);

  // ── Fetch de pedidos ─────────────────────────────────────────
  const cargarPedidos = useCallback(async (silencioso = false) => {
    if (!accessToken) return;
    if (!silencioso) setCargando(true);
    else setRefrescando(true);
    setError(null);

    try {
      if (esMayorista) {
        // Mayorista: carga compras Y ventas en paralelo
        const [compras, ventas] = await Promise.all([
          getPedidos(accessToken, "compras"),
          getPedidos(accessToken, "ventas"),
        ]);
        setPedidosCompras(compras);
        setPedidosVentas(ventas);
      } else {
        // Minorista / Consumidor: solo compras
        const compras = await getPedidos(accessToken, "compras");
        setPedidosCompras(compras);
      }
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes("401")
          ? "Tu sesión ha expirado. Por favor vuelve a iniciar sesión."
          : "No se pudieron cargar los pedidos. Verifica tu conexión.";
      setError(msg);
      if (!silencioso) toast.error("Error al cargar pedidos", msg);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [accessToken, esMayorista, toast]);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleVerDetalle = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setDialogAbierto(true);
  };

  const handleCerrarDialog = () => {
    setDialogAbierto(false);
    setTimeout(() => setPedidoSeleccionado(null), 200);
  };

  /** Callback cuando el mayorista cambia el estado de una venta */
  const handleCambioEstado = (pedidoActualizado: Pedido) => {
    setPedidosVentas((prev) =>
      prev.map((p) => (p.id === pedidoActualizado.id ? pedidoActualizado : p))
    );
    toast.exito(
      `Pedido #${pedidoActualizado.id} actualizado`,
      `Estado cambiado a: ${pedidoActualizado.estado}`
    );
  };

  /** ★ REQ 5: Cancelar orden PENDIENTE */
  const handleCancelarOrden = async (pedido: Pedido) => {
    if (!accessToken) return;
    const confirmado = window.confirm(
      `¿Estás seguro de cancelar el Pedido #${pedido.id}? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    try {
      const actualizado = await cancelarPedido(pedido.id, accessToken);
      // Actualizar en la lista correspondiente
      setPedidosCompras((prev) =>
        prev.map((p) => (p.id === actualizado.id ? actualizado : p))
      );
      if (esMayorista) {
        setPedidosVentas((prev) =>
          prev.map((p) => (p.id === actualizado.id ? actualizado : p))
        );
      }
      toast.exito(
        `Pedido #${pedido.id} cancelado`,
        "El pedido fue cancelado exitosamente."
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo cancelar el pedido.";
      toast.error("Error al cancelar", msg);
    }
  };

  // Pedidos según la tab activa
  const pedidosMostrados = tabActiva === "ventas" ? pedidosVentas : pedidosCompras;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* ── Cabecera ─────────────────────────── */}
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
            <Link href="/dashboard" className="hover:text-[#FB4318] transition-colors flex items-center gap-1">
              <ArrowLeft size={13} />
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#6B6B6B]">Pedidos</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#111] flex items-center gap-2">
            <ShoppingBag size={22} className="text-[#FB4318]" />
            {esMayorista ? "Gestión de Pedidos" : "Mis Pedidos"}
          </h1>
          <p className="text-sm text-[#6B6B6B]">
            {esMayorista
              ? `Dashboard dual — Usuario: ${usuario?.username ?? ""}`
              : `Tu historial de compras B2B — Usuario: ${usuario?.username ?? ""}`}
          </p>
        </div>

        <button
          id="btn-refrescar-pedidos"
          onClick={() => cargarPedidos(true)}
          disabled={cargando || refrescando}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E5E5]
                     text-sm font-semibold text-[#6B6B6B] bg-white hover:border-[#FB4318]
                     hover:text-[#FB4318] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {refrescando ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {refrescando ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {/* ── Indicador de rol ─────────────────── */}
      <div className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium
        ${esMayorista
          ? "bg-purple-50 border-purple-200 text-purple-800"
          : "bg-[#FFF7ED] border-[#FDBA74] text-[#9A3412]"
        }
      `}>
        <span className={`w-2 h-2 rounded-full ${esMayorista ? "bg-purple-500" : "bg-[#FB4318]"}`} />
        {esMayorista
          ? "Vista MAYORISTA — Puedes gestionar tus Compras y tus Ventas."
          : "Vista MINORISTA / CONSUMIDOR — Historial de tus compras B2B."
        }
      </div>

      {/* ★ REQ 4: Tabs para MAYORISTA ────────── */}
      {esMayorista && (
        <div className="flex gap-1 p-1 bg-[#F1F1F1] rounded-xl w-fit">
          <button
            id="tab-mis-compras"
            onClick={() => setTabActiva("compras")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tabActiva === "compras"
                ? "bg-white text-[#FB4318] shadow-sm"
                : "text-[#6B6B6B] hover:text-[#111]"
            }`}
          >
            <ShoppingCart size={15} />
            Mis Compras
            {pedidosCompras.length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tabActiva === "compras"
                  ? "bg-[#FB4318] text-white"
                  : "bg-[#E5E5E5] text-[#6B6B6B]"
              }`}>
                {pedidosCompras.length}
              </span>
            )}
          </button>
          <button
            id="tab-mis-ventas"
            onClick={() => setTabActiva("ventas")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tabActiva === "ventas"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-[#6B6B6B] hover:text-[#111]"
            }`}
          >
            <Store size={15} />
            Mis Ventas
            {pedidosVentas.length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tabActiva === "ventas"
                  ? "bg-purple-600 text-white"
                  : "bg-[#E5E5E5] text-[#6B6B6B]"
              }`}>
                {pedidosVentas.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── Error de carga ────────────────────── */}
      {error && !cargando && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
          <button
            onClick={() => cargarPedidos()}
            className="text-xs font-bold text-red-600 hover:underline flex-shrink-0"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Stats cards ────────────────────────── */}
      <StatsCards
        pedidos={pedidosMostrados}
        cargando={cargando}
        esMayorista={esMayorista && tabActiva === "ventas"}
      />

      {/* ── Tabla de pedidos ────────────────────── */}
      <TablaPedidos
        pedidos={pedidosMostrados}
        cargando={cargando}
        onVerDetalle={handleVerDetalle}
        esMayorista={esMayorista && tabActiva === "ventas"}
        onCancelarOrden={handleCancelarOrden}
        accessToken={accessToken}
      />

      {/* ── Dialog de detalle ─────────────────── */}
      <OrdenDetalleDialog
        pedido={pedidoSeleccionado}
        open={dialogAbierto}
        onClose={handleCerrarDialog}
        esMayorista={esMayorista && tabActiva === "ventas"}
        accessToken={accessToken}
        onDespachado={handleCambioEstado}
      />
    </div>
  );
}
