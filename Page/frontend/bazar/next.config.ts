import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dominio del backend Django para imágenes de productos
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**",
      },
    ],
  },
  // Headers CORS adicionales para el fetch hacia Django
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "http://127.0.0.1:8000" },
        ],
      },
    ];
  },
};

export default nextConfig;
