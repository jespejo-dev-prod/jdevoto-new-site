import React from 'react';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/auth-context';
import { QueryProvider } from '@/providers/query-provider';
import { Metadata } from 'next';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { CookieBanner } from '@/components/layout/cookie-banner';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Mayorista B2B de Tecnología en Chile | Antigravity',
    template: '%s | Antigravity',
  },
  description: 'Compra al por mayor productos de tecnología, computación y electrónica. Plataforma B2B con crédito 30/60/90 días para empresas en Chile.',
  keywords: ['mayorista tecnología chile', 'b2b tecnología', 'compra al por mayor computación', 'mayorista electronica chile', 'distribuidor tecnologia b2b'],
  authors: [{ name: 'Antigravity Technology Chile Ltd.' }],
  creator: 'Antigravity',
  publisher: 'Antigravity',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: 'Antigravity',
    title: 'Mayorista B2B de Tecnología en Chile | Antigravity',
    description: 'Compra al por mayor productos de tecnología, computación y electrónica. Plataforma B2B con crédito 30/60/90 días para empresas en Chile.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mayorista B2B de Tecnología en Chile | Antigravity',
    description: 'Compra al por mayor productos de tecnología, computación y electrónica.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Antigravity Technology Chile Ltd.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.jdevoto.cl',
    logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.jdevoto.cl'}/logo-svg.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      areaServed: 'CL',
      availableLanguage: 'Spanish',
    },
  };

  return (
    <html lang="es" suppressHydrationWarning>
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

