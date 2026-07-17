"use client";
// ============================================================
// app/dashboard/layout.tsx — Layout del Dashboard Protegido
//
// ★ RUTA PROTEGIDA: Verifica el estado de autenticación del
//   authStore (Zustand). Si el usuario no está logueado,
//   redirige a /auth/login. Usa el hook useEffect para
//   compatibilidad con SSR del App Router.
//
// Estructura del layout:
//   - Sidebar de navegación (desktop) / top nav (mobile)
//   - Área de contenido principal
// ============================================================
import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard, ShoppingBag, LogOut, ArrowLeft,
  Menu, X, Truck, UserCircle2, Store, User, CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";

// ── Items de navegación del sidebar ──────────────────────────
const NAV_ITEMS = [
  {
    href:  "/dashboard",
    label: "Resumen",
    icon:  LayoutDashboard,
    exact: true,
  },
  {
    href:  "/dashboard/pedidos",
    label: "Historial de Pedidos",
    icon:  ShoppingBag,
    exact: false,
  },
  {
    href:  "/dashboard/perfil",
    label: "Mi Perfil",
    icon:  User,
    exact: false,
  },
];

// ── Componente ───────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const toast    = useToastStore();

  const { estaAutenticado, usuario, logout, tokenExpirado } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hidratado, setHidratado]     = useState(false);

  // Hidratación: Zustand con persist necesita un ciclo de render
  // para leer de localStorage en el cliente
  useEffect(() => {
    setHidratado(true);
  }, []);

  // ★ GUARD: redirigir si no está autenticado o token expirado
  useEffect(() => {
    if (!hidratado) return;
    if (!estaAutenticado || tokenExpirado()) {
      toast.advertencia(
        "Acceso restringido",
        "Debes iniciar sesión para acceder al dashboard."
      );
      router.replace("/auth/login");
    }
  }, [hidratado, estaAutenticado, tokenExpirado, router, toast]);

  const handleLogout = () => {
    logout();
    toast.info("Sesión cerrada", "Hasta pronto.");
    router.replace("/auth/login");
  };

  // No renderizar hasta hidratación (evita flash de contenido)
  if (!hidratado || !estaAutenticado) return null;

  return (
    <div className="min-h-screen flex bg-[#F8F8F8]">

      {/* ── SIDEBAR (desktop) ─────────────────────────── */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-[#E5E5E5] fixed inset-y-0 left-0 z-30">

        {/* Logo + título */}
        <div className="px-5 py-5 border-b border-[#E5E5E5]">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="ISBEN Bazar B2B"
              width={40}
              height={40}
              className="object-contain"
            />
            <div>
              <p className="text-sm font-extrabold text-[#111] group-hover:text-[#FB4318] transition-colors">
                Bazar B2B
              </p>
              <p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wider">
                Panel de gestión
              </p>
            </div>
          </Link>
        </div>

        {/* Perfil del usuario */}
        {usuario && (
          <div className="px-4 py-4 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#FFF7ED]">
              <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
                <UserCircle2 size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#111] truncate">{usuario.username}</p>
                <p className="text-xs text-[#9CA3AF] truncate">{usuario.email || `ID: ${usuario.id}`}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          <p className="px-3 py-1 text-[10px] text-[#9CA3AF] font-bold uppercase tracking-widest">
            Menú principal
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  isActive
                    ? "gradient-brand text-white shadow-sm"
                    : "text-[#6B6B6B] hover:bg-[#FFF7ED] hover:text-[#FB4318]"
                )}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}

          <div className="mt-auto pt-4">
            <p className="px-3 py-1 text-[10px] text-[#9CA3AF] font-bold uppercase tracking-widest">
              Accesos rápidos
            </p>
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                         text-[#6B6B6B] hover:bg-[#F1F1F1] transition-all"
            >
              <Store size={17} />
              Ir al Catálogo
            </Link>
            <Link
              href="/planes"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                         text-[#6B6B6B] hover:bg-[#FFF7ED] hover:text-[#FB4318] transition-all"
            >
              <CreditCard size={17} />
              Ver Planes
            </Link>
          </div>
        </nav>

        {/* Footer del sidebar */}
        <div className="px-4 py-4 border-t border-[#E5E5E5]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                       text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100
                       transition-all"
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MOBILE: Top bar + drawer ──────────────────── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-[#E5E5E5]">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft size={18} className="text-[#6B6B6B]" />
            <Image src="/logo.png" alt="Bazar B2B" width={28} height={28} className="object-contain" />
            <span className="text-sm font-bold text-[#111]">Dashboard</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-[#F1F1F1] transition-colors"
            aria-label="Menú"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Drawer mobile */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed top-14 left-0 bottom-0 w-72 bg-white border-r border-[#E5E5E5] z-50 animate-slide-in flex flex-col">
              {usuario && (
                <div className="px-4 py-3 border-b border-[#E5E5E5]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                      <UserCircle2 size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111]">{usuario.username}</p>
                    </div>
                  </div>
                </div>
              )}
              <nav className="flex-1 px-3 py-3 flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                        isActive
                          ? "gradient-brand text-white"
                          : "text-[#6B6B6B] hover:bg-[#FFF7ED] hover:text-[#FB4318]"
                      )}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
                <Link
                  href="/"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                             text-[#6B6B6B] hover:bg-[#F1F1F1] transition-all mt-2"
                >
                  <Store size={16} />
                  Ir al Catálogo
                </Link>
              </nav>
              <div className="px-3 py-3 border-t border-[#E5E5E5]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                             text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Contenido principal ───────────────────────── */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
