import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Centro de Ayuda y Soporte',
  description: 'Resuelve tus dudas sobre la plataforma mayorista B2B J. Devoto. Preguntas frecuentes, guías de compra, facturación y contacto con soporte.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.jdevoto.cl'}/support`,
  },
  robots: { index: true, follow: true },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
