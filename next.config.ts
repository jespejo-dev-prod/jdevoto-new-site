import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],

  // ── Optimización de imágenes ─────────────────────────────────────────────
  images: {
    // Dominios externos usados en el proyecto
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "www.jdevoto.cl" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http", hostname: "localhost" },
    ],
    // AVIF primero: ~50% más ligero que WebP; soporte en todos los browsers modernos.
    // WebP como fallback para browsers sin soporte AVIF.
    formats: ["image/avif", "image/webp"],
    // Tamaños de dispositivo para el srcset automático
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 256, 384],
    // Tiempo de caché en la CDN/browser (30 días)
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // APAGAR OPTIMIZACIÓN DE VERCEL PARA NO GASTAR LÍMITE (Usa directamente las URLs originales)
    unoptimized: true,
  },

  // ── Compresión de respuestas HTTP ────────────────────────────────────────
  compress: true,

  // ── Cabeceras de caché globales ──────────────────────────────────────────
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];

    if (isProd) {
      securityHeaders.push({
        key: "Content-Security-Policy",
        value: "default-src 'self'; connect-src 'self' https://nominatim.openstreetmap.org https://www.google-analytics.com https://region1.google-analytics.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com https://plus.unsplash.com https://www.jdevoto.cl https://res.cloudinary.com https://www.googletagmanager.com https://quickchart.io; font-src 'self' data:;"
      });
    }

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
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

  // Redirecciones 301 para preservar el SEO del sitio antiguo (WooCommerce/WordPress)
  async redirects() {
    return [
      {
        source: '/tienda',
        destination: '/products',
        permanent: true,
      },
      {
        source: '/contacto',
        destination: '/support',
        permanent: true,
      },
      {
        source: '/product-category/:category*',
        destination: '/categorias/:category*',
        permanent: true,
      },
      {
        source: '/products',
        has: [
          {
            type: 'query',
            key: 'category',
            value: '(?<slug>.*)'
          }
        ],
        destination: '/categorias/:slug',
        permanent: true,
      },
      {
        source: '/outlet',
        destination: '/products', // Puedes ajustarlo si existe un filtro especial
        permanent: true,
      }
    ];
  },

  // ── Optimizaciones del compilador ────────────────────────────────────────
  experimental: {
    cpus: 2,
    // Inline CSS: convierte <link> CSS en <style> inlineados en el HTML inicial.
    // Elimina el render-blocking de los chunks CSS (17.7 KiB + 2.8 KiB).
    // Ideal para Tailwind (CSS atómico, ~20 KiB) y primeros visitantes.
    // Trade-off: devuelve retornantes no usan cache de CSS, pero para Lighthouse
    // (siempre primer visitante) es el cambio más impactante.
    inlineCss: true,
    // Optimizar imports de paquetes grandes para tree-shaking más agresivo
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@tanstack/react-query",
      "recharts",
      "date-fns",
    ],
  },
};

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig);
