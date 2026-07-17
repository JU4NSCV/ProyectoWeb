"use client";
// ============================================================
// components/Navbar.tsx — Barra de navegación persistente
// Incluye: Logo, Buscador, Selector de Rol, Auth y Carrito
// ★ REAL AUTH: Conectado con authStore (JWT real)
// ============================================================
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Search, ShoppingCart, ChevronDown, User, Store, Eye, Menu, X, LogOut, UserCircle2, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCarritoStore } from "@/store/carritoStore";
import { useRolStore } from "@/store/rolStore";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/Badge";
import type { RolUsuario } from "@/types";

// ── Opciones de rol ──────────────────────────────────────────
const ROLES: { valor: RolUsuario; etiqueta: string; descripcion: string; icono: React.ReactNode }[] = [
  {
    valor:       "visitante",
    etiqueta:    "Visitante",
    descripcion: "Precios de catálogo público",
    icono:       <Eye size={14} />,
  },
  {
    valor:       "consumidor",
    etiqueta:    "Consumidor Final",
    descripcion: "Precios al público con MOQ",
    icono:       <User size={14} />,
  },
  {
    valor:       "minorista",
    etiqueta:    "Minorista Verificado",
    descripcion: "Precios mayoristas exclusivos",
    icono:       <Store size={14} />,
  },
];

// ── Props ────────────────────────────────────────────────────
interface NavbarProps {
  onBusqueda?: (termino: string) => void;
  busqueda?: string;
}

export function Navbar({ onBusqueda, busqueda = "" }: NavbarProps) {
  const { totalItems, toggleCarrito } = useCarritoStore();
  const { rol, setRol } = useRolStore();
  // ★ REAL AUTH: estado global de autenticación
  const { estaAutenticado, usuario, logout } = useAuthStore();
  const [rolOpen, setRolOpen]   = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [localBusqueda, setLocalBusqueda] = useState(busqueda);

  const count = totalItems();
  const rolActual = ROLES.find((r) => r.valor === rol)!;

  const handleLogout = () => {
    logout();
    setRolOpen(false);
    setMenuOpen(false);
    // Redirigir al login tras cerrar sesión
    window.location.href = "/auth/login";
  };

  // Efecto de sombra al hacer scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    if (!rolOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest("[data-rol-selector]")) setRolOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [rolOpen]);

  const handleBusquedaChange = (value: string) => {
    setLocalBusqueda(value);
    onBusqueda?.(value);
  };

  const handleRolSelect = (nuevoRol: RolUsuario) => {
    setRol(nuevoRol);
    setRolOpen(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E5E5E5] transition-shadow duration-200",
        scrolled && "shadow-md"
      )}
    >
      {/* ── Barra superior de marca ───────────────────────── */}
      <div className="gradient-brand py-1 px-4 text-center text-xs text-white font-medium tracking-wide">
        🐆 Plataforma mayorista B2B · Compra mínima por lotes · Precios según tu perfil
      </div>

      {/* ── Navbar principal ─────────────────────────────── */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 focus-ring rounded-lg">
            <Image
              src="/logo.png"
              alt="ISBEN Solution — Bazar B2B"
              width={110}
              height={44}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Buscador (desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] pointer-events-none"
              />
              <input
                id="navbar-search"
                type="search"
                placeholder="Buscar productos, SKUs o proveedores..."
                value={localBusqueda}
                onChange={(e) => handleBusquedaChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl
                           focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                           placeholder:text-[#9CA3AF] transition-all"
              />
            </div>
          </div>

          {/* Spacer en mobile */}
          <div className="flex-1 md:hidden" />

          {/* Selector de Rol */}
          <div className="relative hidden sm:block" data-rol-selector>
            <button
              id="rol-selector-btn"
              onClick={() => setRolOpen(!rolOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5E5E5]
                         hover:border-[#FB4318] hover:bg-[#FFF7ED] transition-all text-sm group focus-ring"
            >
              <span className="text-[#FB4318]">{rolActual.icono}</span>
              <span className="font-medium text-[#111] max-w-[120px] truncate">
                {rolActual.etiqueta}
              </span>
              <ChevronDown
                size={13}
                className={cn(
                  "text-[#6B6B6B] transition-transform duration-200",
                  rolOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown de roles */}
            {rolOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-[#E5E5E5]
                              shadow-xl py-1.5 animate-fade-in z-50 overflow-hidden">
                <p className="px-4 py-2 text-xs text-[#6B6B6B] font-semibold uppercase tracking-wider border-b border-[#F1F1F1] mb-1">
                  Simular Vista de Rol
                </p>
                {ROLES.map((r) => (
                  <button
                    key={r.valor}
                    onClick={() => handleRolSelect(r.valor)}
                    className={cn(
                      "w-full text-left flex items-start gap-3 px-4 py-2.5 hover:bg-[#FFF7ED] transition-colors",
                      rol === r.valor && "bg-[#FFF7ED]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex-shrink-0 p-1.5 rounded-lg",
                        rol === r.valor ? "bg-[#FB4318] text-white" : "bg-[#F1F1F1] text-[#6B6B6B]"
                      )}
                    >
                      {r.icono}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-[#111]">{r.etiqueta}</div>
                      <div className="text-xs text-[#6B6B6B]">{r.descripcion}</div>
                    </div>
                    {rol === r.valor && (
                      <span className="ml-auto mt-0.5 w-2 h-2 rounded-full bg-[#FB4318] flex-shrink-0" />
                    )}
                  </button>
                ))}

                {/* Acciones de autenticación — condicional según estado real */}
                <div className="border-t border-[#F1F1F1] mt-1 pt-1 px-3 pb-2">
                  {estaAutenticado && usuario ? (
                    // ★ LOGUEADO: mostrar info del usuario, link al dashboard y botón de logout
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 px-1 py-1">
                        <UserCircle2 size={14} className="text-[#FB4318] flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#111] truncate">
                            {usuario.username}
                          </p>
                          {usuario.email && (
                            <p className="text-[10px] text-[#9CA3AF] truncate">{usuario.email}</p>
                          )}
                        </div>
                      </div>
                      {/* Link al Dashboard */}
                      <Link
                        href="/dashboard/pedidos"
                        onClick={() => setRolOpen(false)}
                        className="flex items-center gap-1.5 text-xs py-1.5 px-2 rounded-lg
                                   gradient-brand text-white font-semibold hover:opacity-90 transition-opacity"
                      >
                        <LayoutDashboard size={11} />
                        Mi Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-1.5 text-xs py-1.5 px-2
                                   rounded-lg border border-red-200 text-red-600 hover:bg-red-50
                                   transition-colors font-medium"
                      >
                        <LogOut size={12} />
                        Cerrar sesión
                      </button>
                    </div>
                  ) : (
                    // ★ NO LOGUEADO: botones de login/registro
                    <div className="flex gap-2">
                      <Link
                        href="/auth/login"
                        className="flex-1 text-center text-xs py-1.5 px-2 rounded-lg border border-[#E5E5E5]
                                   text-[#111] hover:bg-[#F1F1F1] transition-colors font-medium"
                        onClick={() => setRolOpen(false)}
                      >
                        Iniciar sesión
                      </Link>
                      <Link
                        href="/auth/registro"
                        className="flex-1 text-center text-xs py-1.5 px-2 rounded-lg gradient-brand
                                   text-white font-semibold hover:opacity-90 transition-opacity"
                        onClick={() => setRolOpen(false)}
                      >
                        Registrarse
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Carrito */}
          <button
            id="carrito-btn"
            onClick={toggleCarrito}
            className="relative p-2.5 rounded-xl hover:bg-[#FFF7ED] transition-colors focus-ring group"
            aria-label={`Carrito de compras (${count} artículos)`}
          >
            <ShoppingCart
              size={22}
              className="text-[#111] group-hover:text-[#FB4318] transition-colors"
            />
            {count > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center
                           gradient-brand text-white text-xs font-bold rounded-full px-1 animate-pulse-brand"
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>

          {/* Hamburger (mobile) */}
          <button
            className="sm:hidden p-2 rounded-xl hover:bg-[#F1F1F1] transition-colors focus-ring"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Buscador mobile */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] pointer-events-none"
            />
            <input
              type="search"
              placeholder="Buscar productos..."
              value={localBusqueda}
              onChange={(e) => handleBusquedaChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl
                         focus:outline-none focus:border-[#FB4318] focus:ring-2 focus:ring-[#FB4318]/20
                         placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>

        {/* Menú mobile expandido */}
        {menuOpen && (
          <div className="sm:hidden border-t border-[#E5E5E5] py-3 animate-fade-in">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-[#6B6B6B] font-semibold uppercase tracking-wider px-1 mb-1">
                Simular Rol
              </p>
              {ROLES.map((r) => (
                <button
                  key={r.valor}
                  onClick={() => { handleRolSelect(r.valor); setMenuOpen(false); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                    rol === r.valor
                      ? "bg-[#FFF7ED] text-[#FB4318] font-semibold"
                      : "text-[#111] hover:bg-[#F8F8F8]"
                  )}
                >
                  {r.icono}
                  {r.etiqueta}
                </button>
              ))}
              <div className="border-t border-[#E5E5E5] mt-2 pt-2">
                {estaAutenticado && usuario ? (
                  // ★ MOBILE LOGUEADO
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-1 py-1">
                      <UserCircle2 size={14} className="text-[#FB4318]" />
                      <span className="text-sm font-semibold text-[#111]">{usuario.username}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm
                                 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                    >
                      <LogOut size={14} />
                      Cerrar sesión
                    </button>
                  </div>
                ) : (
                  // ★ MOBILE NO LOGUEADO
                  <div className="flex gap-2">
                    <Link href="/auth/login" className="flex-1 text-center py-2 text-sm border border-[#E5E5E5] rounded-lg font-medium">
                      Iniciar sesión
                    </Link>
                    <Link href="/auth/registro" className="flex-1 text-center py-2 text-sm gradient-brand text-white rounded-lg font-semibold">
                      Registrarse
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
