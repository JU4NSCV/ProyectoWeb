"use client";
// ============================================================
// app/dashboard/productos/nuevo/page.tsx — Crear Producto
// ★ BUG FIX 3: ROUTE GUARD — Solo MAYORISTAS pueden acceder.
//   Si el rol del JWT NO es MAYORISTA → Acceso Denegado.
// ============================================================
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package, ArrowLeft, ShieldX, Lock, Save, Loader2,
  ImagePlus, DollarSign, Hash, FileText, Tag,
} from "lucide-react";
import { useRolJWT } from "@/hooks/useRolJWT";

// ── Componente de Acceso Denegado ─────────────────────────────
function AccesoDenegado() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6 items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
        <ShieldX size={44} className="text-red-500" />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold text-[#111]">Acceso Restringido</h1>
        <p className="text-[#6B6B6B] mt-2 text-sm max-w-sm mx-auto">
          Solo los usuarios con rol <strong className="text-purple-700">MAYORISTA</strong>{" "}
          pueden crear productos en el catálogo.
        </p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 max-w-sm text-left">
        <div className="flex items-start gap-2">
          <Lock size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Si necesitas publicar productos, contacta al administrador para actualizar tu rol a Mayorista.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          id="acceso-denegado-dashboard-btn"
          onClick={() => router.push("/dashboard")}
          className="px-6 py-2.5 rounded-xl gradient-brand text-white font-bold text-sm
                     hover:opacity-90 transition-all"
        >
          Ir al Dashboard
        </button>
        <Link href="/dashboard/pedidos">
          <button className="px-6 py-2.5 rounded-xl border border-[#E5E5E5] text-[#6B6B6B] font-semibold text-sm
                             hover:border-[#FB4318] hover:text-[#FB4318] transition-all">
            Ver mis Pedidos
          </button>
        </Link>
      </div>
    </div>
  );
}

// ── Formulario de creación de producto ────────────────────────
interface ProductoForm {
  nombre:      string;
  sku:         string;
  descripcion: string;
  precio:      string;
  stock:       string;
  categoria:   string;
  imagen:      File | null;
}

export default function PaginaCrearProducto() {
  const router = useRouter();
  const { esMayorista, hidratado } = useRolJWT();

  const [form, setForm] = useState<ProductoForm>({
    nombre: "", sku: "", descripcion: "", precio: "",
    stock: "", categoria: "", imagen: null,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const updateField = <K extends keyof ProductoForm>(k: K, v: ProductoForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError("El nombre del producto es requerido."); return; }
    if (!form.precio || isNaN(parseFloat(form.precio))) { setError("Ingresa un precio válido."); return; }
    setError(null);
    setGuardando(true);
    // TODO: Conectar al endpoint POST /api/productos/ cuando esté listo en el backend
    await new Promise((r) => setTimeout(r, 1200));
    setGuardando(false);
    alert("Producto creado exitosamente (simulado). Conectar al endpoint /api/productos/");
    router.push("/dashboard");
  };

  // Pantalla de espera durante hidratación del cliente
  if (!hidratado) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-[#FB4318]" />
      </div>
    );
  }

  // ★ BUG FIX 3: Guard en la propia ruta — nunca renderiza el form si no es Mayorista
  if (!esMayorista) {
    return <AccesoDenegado />;
  }

  // ── Formulario (solo para Mayoristas) ───────────────────────
  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl">

      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-[#9CA3AF] mb-1">
          <Link href="/dashboard" className="hover:text-[#FB4318] flex items-center gap-1 transition-colors">
            <ArrowLeft size={13} />
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-[#111] font-medium">Crear Producto</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#111] flex items-center gap-2">
          <Package size={22} className="text-[#FB4318]" />
          Nuevo Producto
        </h1>
        <p className="text-sm text-[#6B6B6B] mt-1">
          Publica un nuevo producto en tu catálogo mayorista.
        </p>
      </div>

      {/* Badge de acceso */}
      <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 px-3 py-1.5 rounded-xl text-xs font-bold w-fit">
        🏭 Zona exclusiva — Mayorista verificado
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E5E5] bg-[#F8F8F8]">
          <h2 className="font-bold text-[#111] text-sm">Información del producto</h2>
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prod-nombre" className="text-sm font-semibold text-[#111] flex items-center gap-1.5">
              <Tag size={13} className="text-[#9CA3AF]" />
              Nombre del producto <span className="text-[#FB4318]">*</span>
            </label>
            <input
              id="prod-nombre"
              type="text"
              value={form.nombre}
              onChange={(e) => updateField("nombre", e.target.value)}
              placeholder="Ej: Harina de trigo premium 50kg"
              required
              className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                         focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                         placeholder:text-[#9CA3AF] transition-all"
            />
          </div>

          {/* SKU y Precio en grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prod-sku" className="text-sm font-semibold text-[#111] flex items-center gap-1.5">
                <Hash size={13} className="text-[#9CA3AF]" />
                SKU
              </label>
              <input
                id="prod-sku"
                type="text"
                value={form.sku}
                onChange={(e) => updateField("sku", e.target.value.toUpperCase())}
                placeholder="PROD-001"
                className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8] font-mono
                           focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                           placeholder:text-[#9CA3AF] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prod-precio" className="text-sm font-semibold text-[#111] flex items-center gap-1.5">
                <DollarSign size={13} className="text-[#9CA3AF]" />
                Precio unitario <span className="text-[#FB4318]">*</span>
              </label>
              <input
                id="prod-precio"
                type="number"
                step="0.01"
                min="0"
                value={form.precio}
                onChange={(e) => updateField("precio", e.target.value)}
                placeholder="0.00"
                required
                className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                           focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                           placeholder:text-[#9CA3AF] transition-all"
              />
            </div>
          </div>

          {/* Stock y Categoría */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prod-stock" className="text-sm font-semibold text-[#111]">
                Stock disponible
              </label>
              <input
                id="prod-stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => updateField("stock", e.target.value)}
                placeholder="0"
                className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                           focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                           placeholder:text-[#9CA3AF] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prod-categoria" className="text-sm font-semibold text-[#111]">
                Categoría
              </label>
              <select
                id="prod-categoria"
                value={form.categoria}
                onChange={(e) => updateField("categoria", e.target.value)}
                className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                           focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                           text-[#111] transition-all"
              >
                <option value="">Seleccionar…</option>
                <option value="alimentos">Alimentos y Bebidas</option>
                <option value="limpieza">Limpieza e Higiene</option>
                <option value="electronicos">Electrónicos</option>
                <option value="herramientas">Herramientas</option>
                <option value="textiles">Textiles</option>
                <option value="otros">Otros</option>
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prod-desc" className="text-sm font-semibold text-[#111] flex items-center gap-1.5">
              <FileText size={13} className="text-[#9CA3AF]" />
              Descripción del producto
            </label>
            <textarea
              id="prod-desc"
              value={form.descripcion}
              onChange={(e) => updateField("descripcion", e.target.value)}
              placeholder="Describe las características, presentación, unidad de medida, etc."
              rows={4}
              className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                         focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                         placeholder:text-[#9CA3AF] transition-all resize-none"
            />
          </div>

          {/* Imagen */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#111] flex items-center gap-1.5">
              <ImagePlus size={13} className="text-[#9CA3AF]" />
              Imagen del producto
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                form.imagen
                  ? "border-green-400 bg-green-50"
                  : "border-[#E5E5E5] bg-[#F8F8F8] hover:border-[#FB4318]/50"
              }`}
            >
              {form.imagen ? (
                <p className="text-sm font-medium text-green-800">
                  ✓ {form.imagen.name}
                </p>
              ) : (
                <label htmlFor="prod-imagen" className="flex flex-col items-center gap-2 cursor-pointer">
                  <ImagePlus size={22} className="text-[#9CA3AF]" />
                  <span className="text-sm text-[#6B6B6B]">Subir imagen del producto</span>
                  <span className="text-xs text-[#9CA3AF]">PNG, JPG, WEBP — Máx. 5 MB</span>
                </label>
              )}
              <input
                id="prod-imagen"
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(e) => updateField("imagen", e.target.files?.[0] ?? null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="Subir imagen del producto"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3">
            <Link href="/dashboard" className="flex-shrink-0">
              <button
                type="button"
                className="px-5 py-3 rounded-xl border border-[#E5E5E5] text-[#6B6B6B] font-semibold text-sm
                           hover:border-[#FB4318] hover:text-[#FB4318] transition-all"
              >
                Cancelar
              </button>
            </Link>
            <button
              id="btn-guardar-producto"
              type="submit"
              disabled={guardando}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                         gradient-brand text-white font-bold text-sm
                         hover:opacity-90 active:scale-[0.98] transition-all
                         disabled:opacity-60 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-[#FB4318]/50"
            >
              {guardando
                ? <><Loader2 size={16} className="animate-spin" /> Guardando…</>
                : <><Save size={16} /> Publicar Producto</>
              }
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
