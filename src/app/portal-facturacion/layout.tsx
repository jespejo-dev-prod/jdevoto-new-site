import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal de Facturación',
  robots: { index: false, follow: false },
};

export default function PortalFacturacionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
