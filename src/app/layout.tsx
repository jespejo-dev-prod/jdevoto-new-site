import React from 'react';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/auth-context';
import { QueryProvider } from '@/providers/query-provider';
import { Metadata } from 'next';
import { CartProvider } from '@/context/CartContext';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Antigravity B2B',
  description: 'Plataforma de ventas corporativas B2B',
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
      <body className="antialiased min-h-screen">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <CartProvider>
                {children}
                <Toaster position="bottom-right" richColors closeButton />
                <WhatsAppButton />
              </CartProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
