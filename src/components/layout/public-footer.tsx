import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="bg-zinc-950 text-white py-24 px-12 border-t border-zinc-800 mt-auto">
      <div className="max-w-[1400px] mx-auto text-center space-y-10">
        <div className="flex justify-center">
          <img 
            src="/home/devoto.png" 
            alt="JDevoto Logo" 
            className="h-14 w-auto"
          />
        </div>
        <div className="flex flex-wrap justify-center gap-12 text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">
          <Link href="/support" className="hover:text-primary transition-colors">
            Centro de Soporte
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors">
            Términos de Servicio
          </Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Privacidad B2B
          </Link>
          <Link href="/portal-facturacion" className="hover:text-primary transition-colors">
            Portal de Facturación
          </Link>
        </div>
        <p className="text-[11px] text-zinc-700 font-bold uppercase tracking-[0.2em]">© 2026 J. Devoto. Ingeniería para Empresas.</p>
      </div>
    </footer>
  );
}
