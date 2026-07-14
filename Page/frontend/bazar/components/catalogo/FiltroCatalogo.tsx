"use client";
// ============================================================
// components/catalogo/FiltroCatalogo.tsx
// Barra de filtros: búsqueda, categoría y orden
// ============================================================
import { Filter, SortAsc } from "lucide-react";
import type { FiltrosCatalogo } from "@/types";

interface FiltroCatalogoProps {
  filtros: FiltrosCatalogo;
  categorias: string[];
  onChange: (filtros: Partial<FiltrosCatalogo>) => void;
  totalResultados: number;
}

const OPCIONES_ORDEN = [
  { valor: "destacado",   etiqueta: "Destacados" },
  { valor: "nombre",      etiqueta: "A → Z" },
  { valor: "precio_asc",  etiqueta: "Precio: menor" },
  { valor: "precio_desc", etiqueta: "Precio: mayor" },
] as const;

export function FiltroCatalogo({
  filtros,
  categorias,
  onChange,
  totalResultados,
}: FiltroCatalogoProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between
                    bg-white border border-[#E5E5E5] rounded-2xl px-4 py-3">
      {/* Información de resultados */}
      <p className="text-sm text-[#6B6B6B] flex-shrink-0">
        <span className="font-bold text-[#111]">{totalResultados}</span>{" "}
        {totalResultados === 1 ? "producto" : "productos"} encontrados
      </p>

      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        {/* Filtro por categoría */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#6B6B6B] flex-shrink-0" />
          <select
            id="filtro-categoria"
            value={filtros.categoria}
            onChange={(e) => onChange({ categoria: e.target.value })}
            className="text-sm border border-[#E5E5E5] rounded-lg px-3 py-1.5 bg-white
                       focus:outline-none focus:border-[#FB4318] cursor-pointer
                       text-[#111] min-w-[130px]"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Ordenamiento */}
        <div className="flex items-center gap-2">
          <SortAsc size={14} className="text-[#6B6B6B] flex-shrink-0" />
          <select
            id="filtro-orden"
            value={filtros.orden}
            onChange={(e) =>
              onChange({ orden: e.target.value as FiltrosCatalogo["orden"] })
            }
            className="text-sm border border-[#E5E5E5] rounded-lg px-3 py-1.5 bg-white
                       focus:outline-none focus:border-[#FB4318] cursor-pointer
                       text-[#111] min-w-[130px]"
          >
            {OPCIONES_ORDEN.map((op) => (
              <option key={op.valor} value={op.valor}>
                {op.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
