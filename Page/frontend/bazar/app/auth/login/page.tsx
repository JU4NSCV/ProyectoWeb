"use client";
// ============================================================
// app/auth/login/page.tsx — Página de Inicio de Sesión B2B
// ★ REAL AUTH: Conectado con Django JWT + authStore + Toasts
// ============================================================
import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { loginUsuario } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";

export default function PaginaLogin() {
  const router = useRouter();
  const { login } = useAuthStore();
  const toast    = useToastStore();

  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [verPass, setVerPass]     = useState(false);
  const [cargando, setCargando]   = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación básica en cliente
    if (!username.trim()) {
      setError("Ingresa tu nombre de usuario.");
      return;
    }
    if (!password) {
      setError("Ingresa tu contraseña.");
      return;
    }

    setCargando(true);
    try {
      // ★ Petición REAL a Django: POST /api/token/
      const tokens = await loginUsuario(username.trim(), password);

      // ★ Guardar en authStore (que persiste en localStorage y decodifica JWT)
      login(tokens.access, tokens.refresh);

      // ★ Toast de éxito
      toast.exito(
        "¡Sesión iniciada!",
        "Bienvenido de vuelta. Redirigiendo al catálogo..."
      );

      // ★ Redirigir al catálogo tras login exitoso
      router.push("/");
      router.refresh(); // Forzar re-render del layout para actualizar Navbar

    } catch (err) {
      // ★ Django devuelve 401 con credenciales inválidas
      const mensaje =
        err instanceof Error && err.message.includes("401")
          ? "Credenciales incorrectas. Verifica tu usuario y contraseña."
          : "No se pudo conectar con el servidor. Intenta más tarde.";

      setError(mensaje);
      toast.error("Error al iniciar sesión", mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Panel izquierdo — Branding ───────────────────────── */}
      <div className="hidden lg:flex w-[45%] gradient-brand flex-col items-center justify-center p-12 gap-8">
        <Image
          src="/logo.png"
          alt="ISBEN Solution"
          width={200}
          height={200}
          className="object-contain drop-shadow-xl"
        />
        <div className="text-white text-center">
          <h2 className="text-3xl font-extrabold">Bienvenido de vuelta</h2>
          <p className="mt-2 text-white/80 text-lg">
            Accede a precios mayoristas exclusivos y gestiona tus pedidos.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {[
            "✓ Precios mayoristas verificados",
            "✓ Gestión de pedidos 24/7",
            "✓ Catálogo B2B + D2C",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-white/90 text-sm">
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel derecho — Formulario ───────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src="/logo.png"
              alt="ISBEN Solution"
              width={140}
              height={56}
              className="object-contain"
            />
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

            {/* Usuario */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-username" className="text-sm font-semibold text-[#111]">
                Usuario
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu nombre de usuario en Django"
                required
                autoComplete="username"
                disabled={cargando}
                className="px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                           focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                           placeholder:text-[#9CA3AF] transition-all disabled:opacity-60"
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
                  disabled={cargando}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-[#E5E5E5] text-sm bg-[#F8F8F8]
                             focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                             placeholder:text-[#9CA3AF] transition-all disabled:opacity-60"
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

            {/* Error inline */}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 animate-fade-in"
              >
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={cargando}
              className="mt-2 w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                         gradient-brand text-white font-bold text-sm
                         hover:opacity-90 active:scale-[0.98] transition-all
                         disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none
                         focus:ring-2 focus:ring-[#FB4318]/50"
            >
              {cargando
                ? <><Loader2 size={16} className="animate-spin" /> Iniciando sesión...</>
                : <><LogIn size={16} /> Iniciar Sesión</>
              }
            </button>

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
