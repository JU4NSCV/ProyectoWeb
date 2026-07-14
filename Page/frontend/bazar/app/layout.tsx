import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/ui/ToastContainer";


// ── Tipografía Inter (más cercana a Verdana/Futura del branding) ──
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// ── SEO Metadata ───────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "Bazar B2B — Plataforma Mayorista Digital | ISBEN Solution",
    template: "%s | Bazar B2B",
  },
  description:
    "Plataforma B2B y D2C de venta al por mayor. Conectamos fabricantes y distribuidores con minoristas y compradores por volumen en Ecuador. Precios por rol, MOQ garantizado, pedidos 24/7.",
  keywords: ["mayorista", "B2B", "Ecuador", "distribuidor", "minorista", "ISBEN", "Bazar B2B"],
  authors: [{ name: "ISBEN Solution" }],
  creator: "ISBEN Solution",
  openGraph: {
    type: "website",
    locale: "es_EC",
    title: "Bazar B2B — Plataforma Mayorista Digital",
    description: "Compra al por mayor con precios por rol, MOQ y lotes garantizados.",
    siteName: "Bazar B2B por ISBEN Solution",
  },
};

// ── Layout Raíz ────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <head>
        {/* Preconectar a la API para mejorar performance */}
        <link rel="preconnect" href="http://127.0.0.1:8000" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F8F8F8] antialiased">
        {children}
        {/* Sistema de notificaciones global — esquina inferior derecha */}
        <ToastContainer />
      </body>
    </html>
  );
}
