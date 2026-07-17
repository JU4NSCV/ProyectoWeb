"use client";
// ============================================================
// components/dashboard/TablaPedidos.tsx
// ★ REQ 5: Botón "Cancelar Orden" para pedidos PENDIENTES
// ★ REQ 4: Selector de estado para Mayoristas (en pestaña Ventas)
// ============================================================
import { useState, useMemo } from "react";
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  ShoppingBag, Search, ChevronLeft, ChevronRight,
  XCircle, ChevronDown as ChevDown,
} from "lucide-react";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { patchEstadoPedido } from "@/lib/api";
import { useToastStore } from "@/store/toastStore";
import type { Pedido, EstadoPedido } from "@/types";

// ── Constantes ───────────────────────────────────────────────
const FILAS_POR_PAGINA = 10;

const ESTADOS_FILTRO: { valor: string; label: string }[] = [
  { valor: "",               label: "Todos" },
  { valor: "pendiente",      label: "Pendiente" },
  { valor: "PENDIENTE",      label: "Pendiente" },
  { valor: "en_preparacion", label: "En preparación" },
  { valor: "enviado",        label: "Enviado" },
  { valor: "DESPACHADO",     label: "Despachado" },
  { valor: "entregado",      label: "Entregado" },
  { valor: "cancelado",      label: "Cancelado" },
];

// Estados disponibles para un Mayorista en pestaña Ventas
const ESTADOS_VENTA: { valor: EstadoPedido; label: string }[] = [
  { valor: "PREPARANDO", label: "Preparando" },
  { valor: "ENVIADO",    label: "Enviado" },
  { valor: "ENTREGADO",  label: "Entregado" },
];

// Deduplicar filtros para no mostrar duplicados
const ESTADOS_FILTRO_UNICOS = [
  { valor: "",               label: "Todos" },
  { valor: "pendiente",      label: "Pendiente" },
  { valor: "en_preparacion", label: "En preparación" },
  { valor: "enviado",        label: "Enviado" },
  { valor: "DESPACHADO",     label: "Despachado" },
  { valor: "entregado",      label: "Entregado" },
  { valor: "cancelado",      label: "Cancelado" },
];

// ── Helpers ──────────────────────────────────────────────────

function formatFechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-EC", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function parsePrecio(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  return typeof val === "number" ? val : parseFloat(val) || 0;
}

function calcularTotal(pedido: Pedido): number {
  if (pedido.total) return parsePrecio(pedido.total);
  return pedido.detalles.reduce((acc, d) => {
    const sub = d.subtotal
      ? parsePrecio(d.subtotal)
      : parsePrecio(d.precio_unitario_guardado) * d.cantidad;
    return acc + sub;
  }, 0);
}

function esPendiente(estado: EstadoPedido | string): boolean {
  return estado === "pendiente" || estado === "PENDIENTE";
}

// ── Tipos ────────────────────────────────────────────────────
type SortKey = "id" | "created_at" | "estado" | "total";
type SortDir = "asc" | "desc";

interface SortState {
  key: SortKey;
  dir: SortDir;
}

interface TablaPedidosProps {
  pedidos:      Pedido[];
  cargando:     boolean;
  onVerDetalle: (pedido: Pedido) => void;
  esMayorista:  boolean;
  onCancelarOrden?: (pedido: Pedido) => void;
  accessToken?: string | null;
}

// ── Selector de estado (Mayorista en Ventas) ─────────────────
function SelectorEstado({
  pedido,
  accessToken,
  onActualizado,
}: {
  pedido: Pedido;
  accessToken: string | null | undefined;
  onActualizado: (p: Pedido) => void;
}) {
  const [cargando, setCargando] = useState(false);
  const toast = useToastStore();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const nuevoEstado = e.target.value as EstadoPedido;
    if (!accessToken || !nuevoEstado) return;
    setCargando(true);
    try {
      const actualizado = await patchEstadoPedido(pedido.id, { estado: nuevoEstado }, accessToken);
      onActualizado(actualizado);
      toast.exito("Estado actualizado", `Pedido #${pedido.id} → ${nuevoEstado}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al actualizar estado";
      toast.error("Error", msg);
    } finally {
      setCargando(false);
    }
  };

  // No mostrar selector si ya está entregado o cancelado
  const estadoActual = (pedido.estado ?? "").toUpperCase();
  const noEditable = ["ENTREGADO", "CANCELADO"].includes(estadoActual);
  if (noEditable) {
    return <EstadoBadge estado={pedido.estado as EstadoPedido} />;
  }

  return (
    <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
      <select
        value=""
        onChange={handleChange}
        disabled={cargando}
        className="appearance-none text-xs font-semibold px-3 py-1.5 pr-7 rounded-lg
                   border border-purple-300 bg-purple-50 text-purple-700
                   cursor-pointer hover:border-purple-500 transition-all
                   focus:outline-none focus:ring-2 focus:ring-purple-400/40
                   disabled:opacity-60 disabled:cursor-not-allowed"
        title="Cambiar estado del pedido"
      >
        <option value="" disabled>Cambiar estado…</option>
        {ESTADOS_VENTA.map((e) => (
          <option key={e.valor} value={e.valor}>{e.label}</option>
        ))}
      </select>
      <ChevDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-500 pointer-events-none" />
      {cargando && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
          <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────

export function TablaPedidos({
  pedidos, cargando, onVerDetalle, esMayorista, onCancelarOrden, accessToken,
}: TablaPedidosProps) {
  const [sort, setSort]               = useState<SortState>({ key: "created_at", dir: "desc" });
  const [filtroEstado, setFiltroEstado] = useState("");
  const [busqueda, setBusqueda]       = useState("");
  const [pagina, setPagina]           = useState(1);
  const [pedidosLocales, setPedidosLocales] = useState<Pedido[]>([]);

  // Sync pedidos locales (para reflejar cambios de estado inline)
  useMemo(() => {
    setPedidosLocales(pedidos);
  }, [pedidos]);

  const handleActualizadoInline = (actualizado: Pedido) => {
    setPedidosLocales((prev) =>
      prev.map((p) => (p.id === actualizado.id ? actualizado : p))
    );
  };

  // ── Ordenar y filtrar ───────────────────────────────────────
  const pedidosFiltrados = useMemo(() => {
    let lista = [...pedidosLocales];

    if (filtroEstado) {
      lista = lista.filter((p) =>
        p.estado === filtroEstado ||
        p.estado.toLowerCase() === filtroEstado.toLowerCase()
      );
    }

    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      lista = lista.filter(
        (p) =>
          String(p.id).includes(q) ||
          (p.numero_pedido?.toLowerCase().includes(q) ?? false) ||
          (p.cliente_username?.toLowerCase().includes(q) ?? false)
      );
    }

    lista.sort((a, b) => {
      let va: string | number = 0;
      let vb: string | number = 0;
      switch (sort.key) {
        case "id":         va = a.id;            vb = b.id;            break;
        case "created_at": va = a.created_at;    vb = b.created_at;    break;
        case "estado":     va = a.estado;        vb = b.estado;        break;
        case "total":      va = calcularTotal(a); vb = calcularTotal(b); break;
      }
      if (va < vb) return sort.dir === "asc" ? -1 : 1;
      if (va > vb) return sort.dir === "asc" ?  1 : -1;
      return 0;
    });

    return lista;
  }, [pedidosLocales, filtroEstado, busqueda, sort]);

  // ── Paginación ──────────────────────────────────────────────
  const totalPaginas  = Math.ceil(pedidosFiltrados.length / FILAS_POR_PAGINA);
  const paginaActual  = Math.min(pagina, Math.max(totalPaginas, 1));
  const inicio        = (paginaActual - 1) * FILAS_POR_PAGINA;
  const pedidosPagina = pedidosFiltrados.slice(inicio, inicio + FILAS_POR_PAGINA);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    );
    setPagina(1);
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sort.key !== k) return <ChevronsUpDown size={13} className="text-[#C4C4C4]" />;
    return sort.dir === "asc"
      ? <ChevronUp size={13} className="text-[#FB4318]" />
      : <ChevronDown size={13} className="text-[#FB4318]" />;
  };

  // ── Skeleton ────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E5E5]">
          <div className="skeleton h-4 w-48 rounded" />
        </div>
        <div className="divide-y divide-[#F1F1F1]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-5 py-4">
              <div className="skeleton h-4 w-12 rounded" />
              <div className="skeleton h-4 w-32 rounded flex-1" />
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-4 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Estado vacío ─────────────────────────────────────────────
  if (!cargando && pedidosLocales.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E5E5] flex flex-col items-center
                      justify-center py-20 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center">
          <ShoppingBag size={28} className="text-white" />
        </div>
        <h3 className="text-lg font-bold text-[#111]">
          {esMayorista ? "Sin ventas recibidas" : "Aún no tienes pedidos"}
        </h3>
        <p className="text-sm text-[#6B6B6B] max-w-xs">
          {esMayorista
            ? "Cuando los minoristas hagan pedidos de tus productos, aparecerán aquí."
            : "Explora el catálogo y realiza tu primer pedido mayorista."}
        </p>
      </div>
    );
  }

  // Calcular número de columnas para colspan
  const numCols = (esMayorista ? 6 : 5) + (esMayorista ? 1 : 1); // +1 para Cancelar

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden flex flex-col gap-0">

      {/* ── Barra de filtros ──────────────────────────── */}
      <div className="px-5 py-4 border-b border-[#E5E5E5] bg-[#FAFAFA]
                      flex flex-wrap gap-3 items-center justify-between">
        {/* Buscador */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            id="tabla-busqueda"
            type="search"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
            placeholder="Buscar por ID, N° pedido..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-[#E5E5E5] rounded-xl
                       focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                       placeholder:text-[#C4C4C4] transition-all"
          />
        </div>

        {/* Filtro de estado */}
        <div className="flex gap-1.5 flex-wrap">
          {ESTADOS_FILTRO_UNICOS.map((e) => (
            <button
              key={e.valor}
              onClick={() => { setFiltroEstado(e.valor); setPagina(1); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                filtroEstado === e.valor
                  ? "gradient-brand text-white border-transparent"
                  : "bg-white text-[#6B6B6B] border-[#E5E5E5] hover:border-[#FB4318] hover:text-[#FB4318]"
              )}
            >
              {e.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-[#9CA3AF] whitespace-nowrap">
          {pedidosFiltrados.length} resultado{pedidosFiltrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Tabla ─────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#F8F8F8]">
              <th className="text-left px-5 py-3">
                <button
                  onClick={() => toggleSort("id")}
                  className="flex items-center gap-1 text-xs font-bold text-[#6B6B6B]
                             uppercase tracking-wide hover:text-[#FB4318] transition-colors"
                >
                  ID <SortIcon k="id" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#6B6B6B] uppercase tracking-wide">
                N° Pedido
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort("created_at")}
                  className="flex items-center gap-1 text-xs font-bold text-[#6B6B6B]
                             uppercase tracking-wide hover:text-[#FB4318] transition-colors"
                >
                  Fecha <SortIcon k="created_at" />
                </button>
              </th>
              {esMayorista && (
                <th className="text-left px-4 py-3 text-xs font-bold text-[#6B6B6B] uppercase tracking-wide">
                  Cliente
                </th>
              )}
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort("estado")}
                  className="flex items-center gap-1 text-xs font-bold text-[#6B6B6B]
                             uppercase tracking-wide hover:text-[#FB4318] transition-colors"
                >
                  Estado <SortIcon k="estado" />
                </button>
              </th>
              <th className="text-right px-5 py-3">
                <button
                  onClick={() => toggleSort("total")}
                  className="flex items-center gap-1 ml-auto text-xs font-bold text-[#6B6B6B]
                             uppercase tracking-wide hover:text-[#FB4318] transition-colors"
                >
                  Total <SortIcon k="total" />
                </button>
              </th>
              {/* Columna Acciones */}
              <th className="px-4 py-3 text-xs font-bold text-[#6B6B6B] uppercase tracking-wide text-center">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F1F1F1]">
            {pedidosPagina.length === 0 ? (
              <tr>
                <td
                  colSpan={numCols}
                  className="px-5 py-12 text-center text-sm text-[#9CA3AF]"
                >
                  Sin resultados para la búsqueda actual.
                </td>
              </tr>
            ) : (
              pedidosPagina.map((pedido) => (
                <tr
                  key={pedido.id}
                  id={`pedido-row-${pedido.id}`}
                  onClick={() => onVerDetalle(pedido)}
                  className="group cursor-pointer hover:bg-[#FFF7ED] transition-colors"
                >
                  {/* ID */}
                  <td className="px-5 py-4">
                    <span className="text-sm font-mono font-bold text-[#FB4318]">
                      #{pedido.id}
                    </span>
                  </td>

                  {/* N° Pedido */}
                  <td className="px-4 py-4">
                    <span className="text-sm text-[#111] font-medium">
                      {pedido.numero_pedido ?? `PED-${String(pedido.id).padStart(5, "0")}`}
                    </span>
                  </td>

                  {/* Fecha */}
                  <td className="px-4 py-4">
                    <span className="text-sm text-[#6B6B6B]">
                      {formatFechaCorta(pedido.created_at)}
                    </span>
                  </td>

                  {/* Cliente (solo mayorista) */}
                  {esMayorista && (
                    <td className="px-4 py-4">
                      <span className="text-sm text-[#111]">
                        {pedido.cliente_username ?? `#${pedido.cliente}`}
                      </span>
                    </td>
                  )}

                  {/* Estado + Selector para Mayorista */}
                  <td className="px-4 py-4" onClick={(e) => esMayorista ? e.stopPropagation() : undefined}>
                    <div className="flex flex-col gap-1.5">
                      <EstadoBadge estado={pedido.estado as EstadoPedido} />
                      {esMayorista && (
                        <SelectorEstado
                          pedido={pedido}
                          accessToken={accessToken}
                          onActualizado={handleActualizadoInline}
                        />
                      )}
                    </div>
                  </td>

                  {/* Total */}
                  <td className="px-5 py-4 text-right">
                    <span className="text-sm font-bold text-[#111]">
                      {formatCurrency(calcularTotal(pedido))}
                    </span>
                  </td>

                  {/* ★ REQ 5: Botón Cancelar Orden */}
                  <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    {esPendiente(pedido.estado) && onCancelarOrden && (
                      <button
                        id={`cancelar-btn-${pedido.id}`}
                        onClick={() => onCancelarOrden(pedido)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                   text-xs font-bold bg-red-50 text-red-600 border border-red-200
                                   hover:bg-red-100 hover:border-red-400 transition-all
                                   active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400/30"
                        title="Cancelar este pedido"
                      >
                        <XCircle size={13} />
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginación ────────────────────────────────── */}
      {totalPaginas > 1 && (
        <div className="px-5 py-3 border-t border-[#E5E5E5] bg-[#FAFAFA]
                        flex items-center justify-between gap-4">
          <span className="text-xs text-[#9CA3AF]">
            Pág. {paginaActual} de {totalPaginas} ·{" "}
            {pedidosFiltrados.length} pedidos
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="p-1.5 rounded-lg border border-[#E5E5E5] text-[#6B6B6B]
                         hover:border-[#FB4318] hover:text-[#FB4318] transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Página anterior"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(totalPaginas, 5) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPagina(p)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-semibold border transition-all",
                    paginaActual === p
                      ? "gradient-brand text-white border-transparent"
                      : "border-[#E5E5E5] text-[#6B6B6B] hover:border-[#FB4318] hover:text-[#FB4318]"
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="p-1.5 rounded-lg border border-[#E5E5E5] text-[#6B6B6B]
                         hover:border-[#FB4318] hover:text-[#FB4318] transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Página siguiente"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
