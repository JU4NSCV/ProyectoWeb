"use client";
// ============================================================
// app/auth/login/page.tsx — Página de Inicio de Sesión B2B
// ============================================================
import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { loginUsuario } from "@/lib/api";

export default function PaginaLogin() {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [verPass, setVerPass]     = useState(false);
  const [cargando, setCargando]   = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const tokens = await loginUsuario(email, password);
      // Guardar tokens JWT y redirigir al catálogo
      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);
      window.location.href = "/";
    } catch {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — Branding */}
      <div className="hidden lg:flex w-[45%] gradient-brand flex-col items-center justify-center p-12 gap-8">
        <Image src="/logo.png" alt="ISBEN Solution" width={200} height={200} className="object-contain drop-shadow-xl" />
        <div className="text-white text-center">
          <h2 className="text-3xl font-extrabold">Bienvenido de vuelta</h2>
          <p className="mt-2 text-white/80 text-lg">
            Accede a precios mayoristas exclusivos y gestiona tus pedidos.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {["✓ Precios mayoristas verificados", "✓ Gestión de pedidos 24/7", "✓ Catálogo B2B + D2C"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-white/90 text-sm">
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — Formulario */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/logo.png" alt="ISBEN Solution" width={140} height={56} className="object-contain" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-[#111]">Iniciar Sesión</h1>
            <p className="text-sm text-[#6B6B6B] mt-1">
              ¿No tienes cuenta?{" "}
              <Link href="/auth/registro" className="text-[#FB4318] font-semibold hover:underline">
                Registra tu empresa
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-sm font-semibold text-[#111]">
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="empresa@ejemplo.com"
                required
                autoComplete="email"
                className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                           focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                           placeholder:text-[#9CA3AF] transition-all"
              />
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-sm font-semibold text-[#111]">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={verPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                             focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                             placeholder:text-[#9CA3AF] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setVerPass(!verPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B6B6B]"
                  aria-label={verPass ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" loading={cargando} fullWidth size="lg" className="mt-2">
              <LogIn size={16} />
              Iniciar Sesión
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-[#9CA3AF]">
            Al ingresar aceptas nuestros{" "}
            <a href="#" className="underline hover:text-[#FB4318]">Términos de uso</a>
            {" "}y la{" "}
            <a href="#" className="underline hover:text-[#FB4318]">Política de privacidad</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
