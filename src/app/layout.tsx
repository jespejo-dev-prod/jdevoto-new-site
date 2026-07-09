import React from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/auth-context";
import { QueryProvider } from "@/providers/query-provider";
import { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "Comercial J. Devoto | Distribución Mayorista a Todo Chile",
    template: "%s | Comercial J. Devoto",
  },
  description:
    "Comercial J. Devoto - Distribución Mayorista a Todo Chile. Encuentra el más amplio catálogo de papelería, oficina, arte, manualidades, regalos y ferretería para tu negocio desde nuestro centro de distribución.",
  keywords: [
    "mayorista escolar chile",
    "b2b libreria",
    "compra al por mayor papeleria",
    "mayorista manualidades chile",
    "distribuidor j devoto",
    "articulos de oficina al por mayor",
  ],
  authors: [{ name: "Comercial J. Devoto" }],
  creator: "J. Devoto",
  publisher: "J. Devoto",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: "J. Devoto",
    title: "Comercial J. Devoto | Importadora y Distribuidora Mayorista",
    description:
      "Devoto | Importadora y Distribuidora Mayorista en Chile con más de 50 años abasteciendo a librerías y empresas con las mejores marcas del mercado en artículos escolares, oficina, manualidades y regalos. ¡Descubre nuestro catálogo exclusivo aquí!",
  },
  twitter: {
    card: "summary_large_image",
    title: "Comercial J. Devoto | Distribución Mayorista a Todo Chile",
    description:
      "Encuentra el más amplio catálogo de papelería, oficina, arte, manualidades, regalos y ferretería para tu negocio.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${process.env.NEXT_PUBLIC_APP_URL || "https://www.jdevoto.cl"}#organization`,
        name: "Comercial J. Devoto",
        url: process.env.NEXT_PUBLIC_APP_URL || "https://www.jdevoto.cl",
        logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.jdevoto.cl"}/logo-svg.png`,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          email: "jespejo@jdevoto.cl",
          areaServed: "CL",
          availableLanguage: "Spanish",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${process.env.NEXT_PUBLIC_APP_URL || "https://www.jdevoto.cl"}#website`,
        url: process.env.NEXT_PUBLIC_APP_URL || "https://www.jdevoto.cl",
        name: "Comercial J. Devoto",
        potentialAction: {
          "@type": "SearchAction",
          target: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.jdevoto.cl"}/products?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
      </head>
      <body className={`${roboto.variable} font-sans antialiased min-h-screen`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  {children}
                  <Toaster position="bottom-right" richColors closeButton />
                  <WhatsAppButton />
                  <CookieBanner />
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
