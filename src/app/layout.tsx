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
    default: 'Home - Jdevoto',
    template: '%s - Jdevoto',
  },
  description: 'Plataforma de ventas corporativas B2B',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${roboto.variable} font-sans antialiased min-h-screen`}>
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

