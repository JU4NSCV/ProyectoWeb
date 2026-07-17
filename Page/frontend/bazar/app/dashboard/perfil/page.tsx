"use client";
// ============================================================
// app/dashboard/perfil/page.tsx — Perfil del Usuario
// ★ REQ 3: GET /api/perfil/ con token, PATCH para actualizar
//    RUC se muestra en read-only
// ============================================================
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { getPerfil, patchPerfil, type PerfilUsuario } from "@/lib/api";
import {
  User, Building2, MapPin, Phone, Hash,
  Save, Loader2, RefreshCw, Lock,
} from "lucide-react";

// ── Componente ───────────────────────────────────────────────
export default function PaginaPerfil() {
  const { accessToken, usuario } = useAuthStore();
  const toast = useToastStore();

  const [perfil, setPerfil]     = useState<PerfilUsuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Form controlado (campos editables)
  const [form, setForm] = useState({
    razon_social:     "",
    direccion_matriz: "",
    telefono_contacto: "",
  });

  // ── Cargar perfil ────────────────────────────────────────
  const cargarPerfil = useCallback(async () => {
    if (!accessToken) return;
    setCargando(true);
    setError(null);
    try {
      const data = await getPerfil(accessToken);
      setPerfil(data);
      setForm({
        razon_social:     data.razon_social     ?? "",
        direccion_matriz: data.direccion_matriz ?? "",
        telefono_contacto: data.telefono_contacto ?? "",
      });
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : "No se pudo cargar el perfil.";
      setError(msg);
      toast.error("Error al cargar perfil", msg);
    } finally {
      setCargando(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  // ── Guardar cambios ──────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setGuardando(true);
    setError(null);
    try {
      const actualizado = await patchPerfil(
        {
          razon_social:     form.razon_social.trim()      || undefined,
          direccion_matriz: form.direccion_matriz.trim()  || undefined,
          telefono_contacto: form.telefono_contacto.trim() || undefined,
        },
        accessToken
      );
      setPerfil(actualizado);
      toast.exito("Perfil actualizado", "Tus datos fueron guardados correctamente.");
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : "No se pudieron guardar los cambios.";
      setError(msg);
      toast.error("Error al guardar", msg);
    } finally {
      setGuardando(false);
    }
  };

  // ── Skeleton ─────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="skeleton h-8 w-64 rounded" />
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="skeleton h-3 w-32 rounded" />
              <div className="skeleton h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-[#111] flex items-center gap-2">
            <User size={22} className="text-[#FB4318]" />
            Mi Perfil
          </h1>
          <p className="text-sm text-[#6B6B6B]">
            Actualiza tus datos empresariales — usuario: <strong>{usuario?.username}</strong>
          </p>
        </div>
        <button
          onClick={cargarPerfil}
          disabled={cargando}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5E5E5]
                     text-sm text-[#6B6B6B] hover:border-[#FB4318] hover:text-[#FB4318]
                     transition-all disabled:opacity-50"
          aria-label="Recargar perfil"
        >
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>

      {/* Banner de rol */}
      {perfil && (
        <div className="flex items-center gap-2 bg-[#FFF7ED] border border-[#FDBA74] rounded-xl px-4 py-3">
          <span className="w-2 h-2 rounded-full bg-[#FB4318]" />
          <p className="text-sm text-[#9A3412] font-medium">
            Rol: <strong>{perfil.rol}</strong>
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E5E5] bg-[#F8F8F8]">
          <h2 className="font-bold text-[#111] text-sm">Datos empresariales</h2>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* RUC — Read Only */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#111] flex items-center gap-1.5">
              <Hash size={13} className="text-[#9CA3AF]" />
              RUC
              <span className="ml-1 flex items-center gap-0.5 text-[10px] font-normal text-[#9CA3AF] bg-[#F1F1F1] px-1.5 py-0.5 rounded-md">
                <Lock size={9} /> Solo lectura
              </span>
            </label>
            <input
              type="text"
              value={perfil?.ruc ?? "—"}
              readOnly
              disabled
              className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F1F1F1]
                         text-[#9CA3AF] font-mono cursor-not-allowed select-all"
              title="El RUC no se puede modificar"
            />
            <p className="text-xs text-[#9CA3AF]">
              Para modificar tu RUC, contacta al administrador de ISBEN.
            </p>
          </div>

          {/* Razón Social */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="perfil-razon" className="text-sm font-semibold text-[#111] flex items-center gap-1.5">
              <Building2 size={13} className="text-[#9CA3AF]" />
              Razón Social
            </label>
            <input
              id="perfil-razon"
              type="text"
              value={form.razon_social}
              onChange={(e) => setForm((f) => ({ ...f, razon_social: e.target.value }))}
              placeholder="Ej: Distribuidora Los Andes S.A."
              disabled={guardando}
              className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                         focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                         placeholder:text-[#9CA3AF] transition-all disabled:opacity-60"
            />
          </div>

          {/* Dirección Matriz */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="perfil-dir" className="text-sm font-semibold text-[#111] flex items-center gap-1.5">
              <MapPin size={13} className="text-[#9CA3AF]" />
              Dirección Matriz
            </label>
            <input
              id="perfil-dir"
              type="text"
              value={form.direccion_matriz}
              onChange={(e) => setForm((f) => ({ ...f, direccion_matriz: e.target.value }))}
              placeholder="Av. Principal 123, Quito, Ecuador"
              disabled={guardando}
              className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                         focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                         placeholder:text-[#9CA3AF] transition-all disabled:opacity-60"
            />
          </div>

          {/* Teléfono */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="perfil-tel" className="text-sm font-semibold text-[#111] flex items-center gap-1.5">
              <Phone size={13} className="text-[#9CA3AF]" />
              Teléfono de Contacto
            </label>
            <input
              id="perfil-tel"
              type="tel"
              value={form.telefono_contacto}
              onChange={(e) => setForm((f) => ({ ...f, telefono_contacto: e.target.value }))}
              placeholder="+593 99 999 9999"
              disabled={guardando}
              className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                         focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                         placeholder:text-[#9CA3AF] transition-all disabled:opacity-60"
            />
          </div>

          {/* Submit */}
          <button
            id="perfil-guardar-btn"
            type="submit"
            disabled={guardando}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                       gradient-brand text-white font-bold text-sm
                       hover:opacity-90 active:scale-[0.98] transition-all
                       disabled:opacity-60 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-[#FB4318]/50"
          >
            {guardando
              ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
              : <><Save size={16} /> Guardar Cambios</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
