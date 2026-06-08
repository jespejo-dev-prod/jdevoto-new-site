'use client';

export function PublicFooter() {
  return (
    <footer className="bg-zinc-950 text-white py-24 px-12 border-t border-zinc-800 mt-auto">
      <div className="max-w-[1400px] mx-auto text-center space-y-10">
        <div className="flex justify-center">
          <img 
            src="https://www.jdevoto.cl/wp-content/uploads/2024/06/logo-svg.png" 
            alt="JDevoto Logo" 
            className="h-14 w-auto"
            style={{ filter: 'invert(1) grayscale(1) brightness(2)' }}
          />
        </div>
        <div className="flex flex-wrap justify-center gap-12 text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">
          <span className="hover:text-primary cursor-pointer transition-colors">Centro de Soporte</span>
          <span className="hover:text-primary cursor-pointer transition-colors">Términos de Servicio</span>
          <span className="hover:text-primary cursor-pointer transition-colors">Privacidad B2B</span>
          <span className="hover:text-primary cursor-pointer transition-colors">Portal de Facturación</span>
        </div>
        <p className="text-[11px] text-zinc-700 font-bold uppercase tracking-[0.2em]">© 2026 J. Devoto. Ingeniería para Empresas.</p>
      </div>
    </footer>
  );
}
