"use client";
// ============================================================
// app/auth/registro/page.tsx — Registro de Empresa B2B
// ★ REQ 2: Roles Minorista, Mayorista y Consumidor Final
//    Si es Minorista/Mayorista → muestra input de archivo RUC
//    Envía como FormData para soportar el archivo
// ============================================================
import { useState, useRef, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Eye, EyeOff, Building2, AlertCircle, CheckCircle,
  Upload, FileText, X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { registrarEmpresa } from "@/lib/api";
import type { FormularioRegistroEmpresa } from "@/types";

// ── Configuración de roles ────────────────────────────────────
const CAMPOS_ROL: Record<
  FormularioRegistroEmpresa["rol_solicitado"],
  { titulo: string; descripcion: string; icono: string }
> = {
  minorista: {
    titulo: "Minorista",
    descripcion: "Tiendas y supermercados. Accede a precios mayoristas exclusivos.",
    icono: "🏪",
  },
  mayorista: {
    titulo: "Mayorista",
    descripcion: "Fabricantes y distribuidores. Publica tu catálogo y recibe pedidos.",
    icono: "🏭",
  },
  consumidor_final: {
    titulo: "Consumidor Final",
    descripcion: "Compra para uso personal. Precios de catálogo público.",
    icono: "🛒",
  },
};

const ROLES_CON_RUC: FormularioRegistroEmpresa["rol_solicitado"][] = [
  "minorista",
  "mayorista",
];

export default function PaginaRegistro() {
  const [form, setForm] = useState<FormularioRegistroEmpresa>({
    razon_social:     "",
    ruc:              "",
    email:            "",
    password:         "",
    password_confirm: "",
    direccion:        "",
    telefono:         "",
    rol_solicitado:   "minorista",
    documento_verificacion: null,
  });

  const [verPass, setVerPass]   = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [exito, setExito]       = useState(false);
  const [paso, setPaso]         = useState<1 | 2>(1);
  const fileRef = useRef<HTMLInputElement>(null);

  const necesitaRUC = ROLES_CON_RUC.includes(form.rol_solicitado);

  const updateField = <K extends keyof FormularioRegistroEmpresa>(
    field: K,
    value: FormularioRegistroEmpresa[K]
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    updateField("documento_verificacion", file);
  };

  const handleRemoveFile = () => {
    updateField("documento_verificacion", null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const validarPaso1 = (): string | null => {
    if (!form.rol_solicitado) return "Selecciona un tipo de cuenta.";
    if (necesitaRUC) {
      if (!form.razon_social.trim()) return "Ingresa la razón social de tu empresa.";
      if (!/^\d{13}$/.test(form.ruc)) return "El RUC debe tener exactamente 13 dígitos.";
    }
    return null;
  };

  const handleSiguiente = () => {
    const err = validarPaso1();
    if (err) { setError(err); return; }
    setError(null);
    setPaso(2);
  };

  const validarPaso2 = (): string | null => {
    if (!form.email.includes("@")) return "Ingresa un correo electrónico válido.";
    if (form.password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    if (form.password !== form.password_confirm) return "Las contraseñas no coinciden.";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validarPaso2();
    if (err) { setError(err); return; }

    setError(null);
    setCargando(true);
    try {
      // ★ REQ 2: Construir FormData para soportar archivo
      const formData = new FormData();
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("password_confirm", form.password_confirm);
      formData.append("rol_solicitado", form.rol_solicitado);
      if (necesitaRUC) {
        formData.append("razon_social", form.razon_social);
        formData.append("ruc", form.ruc);
        formData.append("direccion", form.direccion);
        formData.append("telefono", form.telefono);
        if (form.documento_verificacion) {
          formData.append("documento_verificacion", form.documento_verificacion);
        }
      }
      await registrarEmpresa(formData);
      setExito(true);
    } catch {
      setError("Error al registrar. Verifica que el RUC o correo no estén ya registrados.");
    } finally {
      setCargando(false);
    }
  };

  // ── Estado de éxito ────────────────────────────────────────
  if (exito) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8] px-6">
        <div className="bg-white rounded-3xl border border-[#E5E5E5] p-10 max-w-md w-full text-center flex flex-col gap-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={36} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#111]">¡Solicitud enviada!</h2>
          <p className="text-[#6B6B6B]">
            {form.rol_solicitado === "consumidor_final"
              ? "Tu cuenta fue creada. Ya puedes iniciar sesión."
              : "Tu registro fue recibido. Un administrador validará tus documentos y activará tu acceso a los precios mayoristas en breve."}
          </p>
          <Link href="/auth/login">
            <Button fullWidth variant="primary">Ir a Iniciar Sesión</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — Branding */}
      <div className="hidden lg:flex w-[40%] gradient-brand-dark flex-col items-center justify-center p-12 gap-8">
        <Image src="/logo.png" alt="ISBEN Solution" width={180} height={180} className="object-contain drop-shadow-xl" />
        <div className="text-white text-center">
          <h2 className="text-3xl font-extrabold">Únete a Bazar B2B</h2>
          <p className="mt-2 text-white/80">
            La plataforma mayorista digital que conecta toda la cadena de suministro.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-3">
          {[
            { icono: "🏪", texto: "Minoristas: acceso a precios de distribuidores" },
            { icono: "🏭", texto: "Mayoristas: publica tu catálogo en minutos" },
            { icono: "🛒", texto: "Consumidores: explora el catálogo de productos" },
            { icono: "🔒", texto: "Validación segura de RUC por el equipo ISBEN" },
          ].map((item) => (
            <div key={item.icono} className="flex items-start gap-2 text-white/90 text-sm">
              <span>{item.icono}</span>
              <span>{item.texto}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — Formulario */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/logo.png" alt="ISBEN Solution" width={120} height={48} className="object-contain" />
          </div>

          {/* Cabecera */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-[#111]">Registrar Cuenta</h1>
            <p className="text-sm text-[#6B6B6B] mt-1">
              ¿Ya tienes cuenta?{" "}
              <Link href="/auth/login" className="text-[#FB4318] font-semibold hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>

          {/* Indicador de pasos */}
          <div className="flex items-center gap-3 mb-6">
            {[1, 2].map((p) => (
              <div key={p} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    paso >= p
                      ? "gradient-brand text-white"
                      : "bg-[#F1F1F1] text-[#9CA3AF]"
                  }`}
                >
                  {p}
                </div>
                <span className={`text-xs font-medium ${paso >= p ? "text-[#FB4318]" : "text-[#9CA3AF]"}`}>
                  {p === 1 ? "Tipo de cuenta" : "Acceso y contacto"}
                </span>
                {p === 1 && <div className={`flex-1 h-0.5 ml-2 ${paso >= 2 ? "bg-[#FB4318]" : "bg-[#E5E5E5]"}`} />}
              </div>
            ))}
          </div>

          {/* ── PASO 1: Tipo de cuenta ─────────────────────── */}
          {paso === 1 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              {/* Selector de tipo de cuenta — 3 opciones */}
              <div>
                <label className="text-sm font-semibold text-[#111] block mb-2">
                  Tipo de cuenta <span className="text-[#FB4318]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(Object.entries(CAMPOS_ROL) as [FormularioRegistroEmpresa["rol_solicitado"], typeof CAMPOS_ROL.minorista][]).map(
                    ([rol, info]) => (
                      <button
                        key={rol}
                        type="button"
                        id={`reg-rol-${rol}`}
                        onClick={() => {
                          updateField("rol_solicitado", rol);
                          // Limpiar archivo si cambia a consumidor
                          if (rol === "consumidor_final") {
                            updateField("documento_verificacion", null);
                          }
                        }}
                        className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all text-center ${
                          form.rol_solicitado === rol
                            ? "border-[#FB4318] bg-[#FFF7ED]"
                            : "border-[#E5E5E5] hover:border-[#FB4318]/50 bg-white"
                        }`}
                      >
                        <span className="text-2xl">{info.icono}</span>
                        <span className="text-sm font-bold text-[#111]">{info.titulo}</span>
                        <span className="text-xs text-[#6B6B6B] leading-tight">{info.descripcion}</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Campos solo para Minorista/Mayorista */}
              {necesitaRUC && (
                <>
                  {/* Razón Social */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-razon" className="text-sm font-semibold text-[#111]">
                      Razón Social <span className="text-[#FB4318]">*</span>
                    </label>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      <input
                        id="reg-razon"
                        type="text"
                        value={form.razon_social}
                        onChange={(e) => updateField("razon_social", e.target.value)}
                        placeholder="Ej: Distribuidora Los Andes S.A."
                        required
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                                   focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                                   placeholder:text-[#9CA3AF] transition-all"
                      />
                    </div>
                  </div>

                  {/* RUC */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-ruc" className="text-sm font-semibold text-[#111]">
                      RUC (13 dígitos) <span className="text-[#FB4318]">*</span>
                    </label>
                    <input
                      id="reg-ruc"
                      type="text"
                      value={form.ruc}
                      onChange={(e) => updateField("ruc", e.target.value.replace(/\D/g, "").slice(0, 13))}
                      placeholder="1234567890001"
                      maxLength={13}
                      required
                      className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8] font-mono
                                 focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                                 placeholder:text-[#9CA3AF] transition-all"
                    />
                    <p className="text-xs text-[#9CA3AF]">
                      Tu RUC será validado por el equipo ISBEN antes de activar el acceso mayorista.
                    </p>
                  </div>

                  {/* ★ REQ 2: Input de archivo documento_verificacion */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#111]">
                      Documento de verificación (RUC){" "}
                      <span className="text-[#9CA3AF] font-normal">(opcional)</span>
                    </label>
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${
                        form.documento_verificacion
                          ? "border-green-400 bg-green-50"
                          : "border-[#E5E5E5] bg-[#F8F8F8] hover:border-[#FB4318]/50"
                      }`}
                    >
                      {form.documento_verificacion ? (
                        <div className="flex items-center gap-3">
                          <FileText size={20} className="text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-800 truncate">
                              {form.documento_verificacion.name}
                            </p>
                            <p className="text-xs text-green-600">
                              {(form.documento_verificacion.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-1 rounded-lg hover:bg-green-100 text-green-700 transition-colors"
                            aria-label="Eliminar archivo"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="reg-doc" className="flex flex-col items-center gap-2 cursor-pointer">
                          <Upload size={20} className="text-[#9CA3AF]" />
                          <span className="text-sm text-[#6B6B6B]">
                            Sube tu RUC en PDF o imagen
                          </span>
                          <span className="text-xs text-[#9CA3AF]">PNG, JPG, PDF — Máx. 5 MB</span>
                        </label>
                      )}
                      <input
                        ref={fileRef}
                        id="reg-doc"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        aria-label="Subir documento de verificación RUC"
                      />
                    </div>
                  </div>

                  {/* Dirección */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-dir" className="text-sm font-semibold text-[#111]">
                      Dirección comercial
                    </label>
                    <input
                      id="reg-dir"
                      type="text"
                      value={form.direccion}
                      onChange={(e) => updateField("direccion", e.target.value)}
                      placeholder="Av. Principal 123, Quito, Ecuador"
                      className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                                 focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                                 placeholder:text-[#9CA3AF] transition-all"
                    />
                  </div>
                </>
              )}

              {/* Info para consumidor final */}
              {form.rol_solicitado === "consumidor_final" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">🛒 Consumidor Final:</span> Solo necesitas un correo y contraseña.
                    Tendrás acceso al catálogo con precios públicos.
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button onClick={handleSiguiente} fullWidth size="lg" className="mt-2">
                Continuar →
              </Button>
            </div>
          )}

          {/* ── PASO 2: Datos de acceso ──────────────────── */}
          {paso === 2 && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-fade-in" noValidate>
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-email" className="text-sm font-semibold text-[#111]">
                  Correo electrónico <span className="text-[#FB4318]">*</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="contacto@empresa.com"
                  required
                  autoComplete="email"
                  className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                             focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                             placeholder:text-[#9CA3AF] transition-all"
                />
              </div>

              {/* Teléfono (solo Minorista/Mayorista) */}
              {necesitaRUC && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-tel" className="text-sm font-semibold text-[#111]">
                    Teléfono de contacto
                  </label>
                  <input
                    id="reg-tel"
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => updateField("telefono", e.target.value)}
                    placeholder="+593 99 999 9999"
                    className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                               focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                               placeholder:text-[#9CA3AF] transition-all"
                  />
                </div>
              )}

              {/* Contraseña */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-pass" className="text-sm font-semibold text-[#111]">
                  Contraseña <span className="text-[#FB4318]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reg-pass"
                    type={verPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                    required
                    autoComplete="new-password"
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                               focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                               placeholder:text-[#9CA3AF] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPass(!verPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B6B6B]"
                  >
                    {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-pass2" className="text-sm font-semibold text-[#111]">
                  Confirmar contraseña <span className="text-[#FB4318]">*</span>
                </label>
                <input
                  id="reg-pass2"
                  type={verPass ? "text" : "password"}
                  value={form.password_confirm}
                  onChange={(e) => updateField("password_confirm", e.target.value)}
                  placeholder="Repite tu contraseña"
                  required
                  autoComplete="new-password"
                  className={`px-4 py-3 rounded-xl border text-sm bg-[#F8F8F8]
                             focus:outline-none focus:ring-2 transition-all placeholder:text-[#9CA3AF] ${
                               form.password_confirm && form.password !== form.password_confirm
                                 ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                                 : "border-[#E5E5E5] focus:border-[#FB4318] focus:ring-[#FB4318]/20"
                             }`}
                />
                {form.password_confirm && form.password !== form.password_confirm && (
                  <p className="text-xs text-red-500 font-medium">Las contraseñas no coinciden.</p>
                )}
              </div>

              {/* Error global */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setPaso(1); setError(null); }}
                  className="flex-shrink-0"
                >
                  ← Atrás
                </Button>
                <Button type="submit" loading={cargando} fullWidth size="lg">
                  Enviar Solicitud de Registro
                </Button>
              </div>

              <p className="text-xs text-center text-[#9CA3AF] mt-2">
                Al registrarte, aceptas los{" "}
                <a href="#" className="underline hover:text-[#FB4318]">Términos de uso</a>
                {" "}y autorizas la verificación de tu información.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
