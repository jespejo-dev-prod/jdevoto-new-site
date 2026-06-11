import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],

  // ── Optimización de imágenes ─────────────────────────────────────────────
  images: {
    // Dominios externos usados en el proyecto
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "www.jdevoto.cl" },
      { protocol: "http", hostname: "localhost" },
    ],
    // Formatos modernos: WebP primero, luego AVIF para los que lo soportan
    formats: ["image/webp", "image/avif"],
    // Tamaños de dispositivo para el srcset automático
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Tiempo de caché en la CDN/browser (1 semana)
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },

  // ── Compresión de respuestas HTTP ────────────────────────────────────────
  compress: true,

  // ── Cabeceras de caché globales ──────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: "default-src 'self'; connect-src 'self' https://nominatim.openstreetmap.org; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com https://plus.unsplash.com https://www.jdevoto.cl; font-src 'self' data:;" }
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },

  // ── Optimizaciones del compilador ────────────────────────────────────────
  experimental: {
    // Optimizar imports de paquetes grandes para reducir bundle size
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@tanstack/react-query",
    ],
  },
};

export default nextConfig;
