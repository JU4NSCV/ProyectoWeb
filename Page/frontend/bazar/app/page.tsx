"use client";
// ============================================================
// app/page.tsx — Página Principal: Catálogo B2B
// Fetch client-side para que los precios respondan al rol en vivo
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { HeroBanner } from "@/components/HeroBanner";
import { TarjetaProducto } from "@/components/catalogo/TarjetaProducto";
import { FiltroCatalogo } from "@/components/catalogo/FiltroCatalogo";
import { SkeletonGrid } from "@/components/catalogo/SkeletonTarjeta";
import { DrawerCarrito } from "@/components/carrito/DrawerCarrito";
import { Button } from "@/components/ui/Button";
import { getProductos } from "@/lib/api";
import type { Producto, FiltrosCatalogo } from "@/types";

// ── Datos de muestra para desarrollo sin backend ─────────────
const PRODUCTOS_DEMO: Producto[] = [
  {
    id: 1, sku: "BEB-001", nombre: "Agua Mineral 500ml (Caja x24)",
    descripcion: "Agua mineral natural purificada. Ideal para distribución a supermercados y tiendas de conveniencia.",
    precio_publico: 12.50, precio_minorista: 9.80, moq: 24, multiplo_lote: 24,
    stock: 500, imagen: null, categoria: "Bebidas",
    mayorista_nombre: "Distribuidora Los Andes", destacado: true, activo: true,
  },
  {
    id: 2, sku: "LIM-002", nombre: "Detergente en Polvo 5kg",
    descripcion: "Detergente de alta espuma para lavado de ropa. Fórmula concentrada con suavizante.",
    precio_publico: 18.00, precio_minorista: 14.20, moq: 12, multiplo_lote: 12,
    stock: 200, imagen: null, categoria: "Limpieza",
    mayorista_nombre: "Quimiproductos EC", destacado: false, activo: true,
  },
  {
    id: 3, sku: "ALI-003", nombre: "Arroz Extra Fino 50kg (Quintal)",
    descripcion: "Arroz blanco grado extra, sin piedras. Perfecto para tiendas y micromercados.",
    precio_publico: 42.00, precio_minorista: 36.50, moq: 5, multiplo_lote: 5,
    stock: 120, imagen: null, categoria: "Alimentos",
    mayorista_nombre: "Arrocera El Granero", destacado: true, activo: true,
  },
  {
    id: 4, sku: "BEB-004", nombre: "Gaseosa Cola 2L (Pack x12)",
    descripcion: "Bebida gaseosa sabor cola. Pack de 12 botellas de 2 litros. Alta rotación en puntos de venta.",
    precio_publico: 22.80, precio_minorista: 18.60, moq: 12, multiplo_lote: 12,
    stock: 350, imagen: null, categoria: "Bebidas",
    mayorista_nombre: "Distribuidora Los Andes", destacado: false, activo: true,
  },
  {
    id: 5, sku: "HIG-005", nombre: "Papel Higiénico Doble Hoja (x48 rollos)",
    descripcion: "Papel higiénico suave, doble hoja, 250 hojas por rollo. Empaque de 48 unidades.",
    precio_publico: 35.00, precio_minorista: 29.00, moq: 48, multiplo_lote: 48,
    stock: 80, imagen: null, categoria: "Higiene",
    mayorista_nombre: "Papelera Nacional", destacado: true, activo: true,
  },
  {
    id: 6, sku: "ALI-006", nombre: "Aceite de Palma 1L (Caja x20)",
    descripcion: "Aceite vegetal refinado, apto para frituras. Caja de 20 unidades de 1 litro.",
    precio_publico: 48.00, precio_minorista: 40.00, moq: 20, multiplo_lote: 20,
    stock: 0, imagen: null, categoria: "Alimentos",
    mayorista_nombre: "Oleaginosas EC", destacado: false, activo: true,
  },
];

// ── Componente principal ──────────────────────────────────────
export default function PaginaCatalogo() {
  const [productos, setProductos]   = useState<Producto[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [busqueda, setBusqueda]     = useState("");
  const [filtros, setFiltros] = useState<FiltrosCatalogo>({
    busqueda: "",
    categoria: "",
    orden: "destacado",
  });

  // ── Fetch de productos ────────────────────────────────────
  const fetchProductos = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getProductos({
        busqueda: filtros.busqueda,
        categoria: filtros.categoria,
        orden: filtros.orden,
      });
      // Manejar respuesta tanto si es paginada (.results) como si es un array directo
      setProductos(Array.isArray(data) ? data : (data?.results || []));
    } catch {
      // Si la API no está disponible, usamos datos de demo
      console.warn("API no disponible, usando datos de demostración.");
      setProductos(PRODUCTOS_DEMO);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  // ── Filtros client-side sobre los datos cargados ──────────
  const productosFiltrados = useMemo(() => {
    let lista = [...(productos || [])];

    // Filtro de búsqueda local (por nombre o SKU)
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      lista = lista.filter(
        (p) =>
          (p.nombre || "").toLowerCase().includes(termino) ||
          (p.sku || "").toLowerCase().includes(termino) ||
          (p.categoria || "").toLowerCase().includes(termino) ||
          (p.mayorista_nombre || "").toLowerCase().includes(termino)
      );
    }

    // Ordenamiento local
    switch (filtros.orden) {
      case "precio_asc":
        lista.sort((a, b) => a.precio_publico - b.precio_publico);
        break;
      case "precio_desc":
        lista.sort((a, b) => b.precio_publico - a.precio_publico);
        break;
      case "nombre":
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case "destacado":
        lista.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));
        break;
    }

    return lista;
  }, [productos, busqueda, filtros.orden]);

  // Categorías únicas para el selector
  const categorias = useMemo(
    () => [...new Set((productos || []).map((p) => p.categoria))].sort(),
    [productos]
  );

  const handleFiltrosChange = (nuevo: Partial<FiltrosCatalogo>) => {
    setFiltros((prev) => ({ ...prev, ...nuevo }));
  };

  return (
    <>
      {/* Navbar persistente */}
      <Navbar
        busqueda={busqueda}
        onBusqueda={setBusqueda}
      />

      {/* Drawer del carrito con checkout integrado */}
      <DrawerCarrito />

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">

        {/* Hero Banner */}
        <HeroBanner />

        {/* Sección del catálogo */}
        <section id="catalogo" className="scroll-mt-20">
          <div className="flex flex-col gap-5">

            {/* Cabecera de sección */}
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#111]">
                  Catálogo Mayorista
                </h2>
                <p className="text-sm text-[#6B6B6B] mt-1">
                  Todos los productos tienen reglas de compra mínima (MOQ) y lotes.
                </p>
              </div>
              <button
                onClick={fetchProductos}
                className="flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#FB4318]
                           transition-colors p-2 rounded-lg hover:bg-[#FFF7ED]"
                title="Actualizar catálogo"
              >
                <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
                Actualizar
              </button>
            </div>

            {/* Barra de filtros */}
            <FiltroCatalogo
              filtros={filtros}
              categorias={categorias}
              onChange={handleFiltrosChange}
              totalResultados={productosFiltrados.length}
            />

            {/* Estado: Cargando */}
            {cargando && <SkeletonGrid count={8} />}

            {/* Estado: Error */}
            {error && !cargando && (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-[#111]">Error al cargar el catálogo</p>
                  <p className="text-sm text-[#6B6B6B] mt-1">{error}</p>
                </div>
                <Button onClick={fetchProductos} variant="outline" size="sm">
                  Reintentar
                </Button>
              </div>
            )}

            {/* Estado: Vacío */}
            {!cargando && !error && productosFiltrados.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <p className="text-4xl">📦</p>
                <div>
                  <p className="font-semibold text-[#111]">No se encontraron productos</p>
                  <p className="text-sm text-[#6B6B6B] mt-1">
                    Intenta con otra búsqueda o elimina los filtros.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setBusqueda("");
                    setFiltros({ busqueda: "", categoria: "", orden: "destacado" });
                  }}
                  variant="outline"
                  size="sm"
                >
                  Limpiar filtros
                </Button>
              </div>
            )}

            {/* ★ Grid de productos */}
            {!cargando && !error && productosFiltrados.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {productosFiltrados.map((producto) => (
                  <TarjetaProducto key={producto.id} producto={producto} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#E5E5E5] bg-[#F8F8F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-sm text-[#6B6B6B]">
            © 2025 <span className="font-semibold text-[#FB4318]">ISBEN Solution</span> · Bazar B2B + D2C ·
            Todos los derechos reservados.
          </p>
          <div className="flex gap-4 justify-center mt-3 text-xs text-[#9CA3AF]">
            <a href="#" className="hover:text-[#FB4318] transition-colors">Términos de uso</a>
            <a href="#" className="hover:text-[#FB4318] transition-colors">Privacidad</a>
            <a href="/auth/registro" className="hover:text-[#FB4318] transition-colors">Registro de proveedores</a>
          </div>
        </div>
      </footer>
    </>
  );
}
