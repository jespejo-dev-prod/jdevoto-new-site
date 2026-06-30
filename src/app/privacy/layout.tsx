import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Conoce cómo Antigravity recopila, usa y protege tus datos personales. Política de privacidad y protección de datos para usuarios de la plataforma B2B.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.jdevoto.cl'}/privacy`,
  },
  robots: { index: true, follow: true },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
