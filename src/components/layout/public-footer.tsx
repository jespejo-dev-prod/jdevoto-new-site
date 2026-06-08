'use client';

export function PublicFooter() {
  return (
    <footer className="bg-zinc-950 text-white py-24 px-12 border-t border-zinc-800 mt-auto">
      <div className="max-w-[1400px] mx-auto text-center space-y-10">
        <span className="text-4xl font-black italic tracking-tighter">antigravity<span className="text-primary">.</span></span>
        <div className="flex flex-wrap justify-center gap-12 text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">
          <span className="hover:text-primary cursor-pointer transition-colors">Centro de Soporte</span>
          <span className="hover:text-primary cursor-pointer transition-colors">Términos de Servicio</span>
          <span className="hover:text-primary cursor-pointer transition-colors">Privacidad B2B</span>
          <span className="hover:text-primary cursor-pointer transition-colors">Portal de Facturación</span>
        </div>
        <p className="text-[11px] text-zinc-700 font-bold uppercase tracking-[0.2em]">© 2026 Antigravity Technology Chile Ltd. Ingeniería para Empresas.</p>
      </div>
    </footer>
  );
}
