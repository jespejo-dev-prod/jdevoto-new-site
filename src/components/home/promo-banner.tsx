import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function PromoBanner() {
  return (
    <section className="relative my-16 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-50/50 via-white to-blue-50/20 text-zinc-900 border border-zinc-200/80 p-8 md:p-12 shadow-[0_4px_30px_rgba(0,0,0,0.01)]">
      {/* Decorative Blur Orbs - subtle and soft for light mode */}
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-200/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-200/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/80 text-[9px] font-black uppercase tracking-widest text-zinc-600">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Campaña Especial B2B
          </div>
          <h3 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-tight text-zinc-950">
            Abastece tu Negocio y Empresa con Flete Incluido
          </h3>
          <p className="text-zinc-500 text-xs md:text-sm font-semibold leading-relaxed">
            Catálogo completo de papelería, manualidades, productos de oficina y
            ferretería. Activa tu cuenta corriente corporativa para recibir
            flete 100% bonificado en Santiago y regiones.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
          <Link
            href="/login"
            className="px-6 py-3 rounded-full bg-zinc-950 text-white font-bold text-xs uppercase tracking-wider hover:bg-zinc-900 transition-all shadow-md active:scale-95 text-center"
          >
            Inicia Sesión
          </Link>
          <Link
            href="/support"
            className="px-6 py-3 rounded-full bg-white border border-zinc-300 text-zinc-800 font-bold text-xs uppercase tracking-wider hover:bg-zinc-50 hover:border-zinc-400 transition-all active:scale-95 text-center flex items-center justify-center gap-1.5"
          >
            Solicitar Convenio
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
