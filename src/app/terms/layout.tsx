import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso de la plataforma mayorista B2B Antigravity. Condiciones de compra, crédito y entrega para empresas en Chile.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.jdevoto.cl'}/terms`,
  },
  robots: { index: true, follow: true },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
