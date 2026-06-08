'use client';

import { 
  MessageSquare, Mail, Phone, 
  ChevronRight, Search, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SupportPage() {
  const faqs = [
    { q: "¿Cómo solicito una cotización mayorista?", a: "Puedes hacerlo directamente desde el carrito de compras seleccionando la opción 'Solicitar Cotización'." },
    { q: "¿Tienen despacho a regiones?", a: "Sí, realizamos envíos a todo Chile a través de BlueExpress y Starken con tarifas B2B preferenciales." },
    { q: "¿Cómo descargo mi factura electrónica?", a: "Todas las facturas se emiten automáticamente y quedan disponibles en tu perfil de usuario bajo la sección 'Mis Pedidos'." }
  ];

  return (
    <div className="min-h-screen bg-white">
      
      {/* HERO SUPPORT */}
      <section className="bg-zinc-950 text-white py-24 px-8 border-b border-zinc-800">
         <div className="max-w-[1000px] mx-auto text-center space-y-8">
            <h1 className="text-5xl font-black italic tracking-tighter">Centro de Ayuda<span className="text-primary">.</span></h1>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">Estamos aquí para potenciar tu infraestructura. Busca soluciones técnicas o contacta con nuestro equipo especializado.</p>
            <div className="max-w-2xl mx-auto relative">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-zinc-600" />
               <input placeholder="¿Cómo podemos ayudarte hoy?" className="w-full h-16 rounded-2xl bg-zinc-900 border border-zinc-800 px-16 text-lg outline-none focus:ring-4 focus:ring-primary/20 transition-all" />
            </div>
         </div>
      </section>

      <main className="max-w-[1200px] mx-auto p-6 lg:p-20 space-y-24">
         
         {/* CONTACT CARDS */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 rounded-[40px] border border-zinc-100 bg-zinc-50/50 space-y-6 hover:shadow-xl transition-all">
               <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><MessageSquare className="h-7 w-7" /></div>
               <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900">Chat en Vivo</h3>
               <p className="text-sm text-zinc-500">Soporte técnico inmediato para clientes con contrato Priority.</p>
               <Button className="w-full rounded-xl bg-zinc-950 text-white font-bold h-12 uppercase text-[10px]">Iniciar Chat</Button>
            </div>
            <div className="p-10 rounded-[40px] border border-zinc-100 bg-zinc-50/50 space-y-6 hover:shadow-xl transition-all">
               <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Mail className="h-7 w-7" /></div>
               <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900">Email Corporativo</h3>
               <p className="text-sm text-zinc-500">Para consultas comerciales, RMA y facturación masiva.</p>
               <Button className="w-full rounded-xl bg-zinc-950 text-white font-bold h-12 uppercase text-[10px]">Enviar Correo</Button>
            </div>
            <div className="p-10 rounded-[40px] border border-zinc-100 bg-zinc-50/50 space-y-6 hover:shadow-xl transition-all">
               <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Phone className="h-7 w-7" /></div>
               <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900">Línea Directa</h3>
               <p className="text-sm text-zinc-500">Lunes a Viernes, 09:00 a 18:00 hrs. Exclusivo empresas.</p>
               <div className="text-xl font-black text-primary">+56 2 2938 4800</div>
            </div>
         </div>

         {/* FAQ SECTION */}
         <div className="space-y-12">
            <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter text-center">Preguntas Frecuentes</h2>
            <div className="max-w-4xl mx-auto divide-y divide-zinc-100">
               {faqs.map((faq, i) => (
                 <div key={i} className="py-8 space-y-4 group cursor-pointer">
                    <div className="flex items-center justify-between">
                       <h4 className="text-lg font-black text-zinc-900 group-hover:text-primary transition-colors">{faq.q}</h4>
                       <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-primary" />
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed font-medium">{faq.a}</p>
                 </div>
               ))}
            </div>
         </div>

         {/* LINKS RAPIDOS */}
         <div className="pt-12 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {['Garantías', 'Envíos', 'Devoluciones', 'Privacidad'].map((item, i) => (
              <Link key={i} href="#" className="flex items-center justify-between p-6 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-primary/30 transition-all group">
                 <span className="text-xs font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-900">{item}</span>
                 <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-primary" />
              </Link>
            ))}
         </div>

      </main>

      <footer className="bg-zinc-950 text-white py-12 px-12 border-t border-zinc-800">
         <div className="max-w-[1200px] mx-auto text-center">
            <span className="text-2xl font-black italic tracking-tighter">antigravity<span className="text-primary">.</span></span>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.4em] pt-4">© 2026 Antigravity Support Hub.</p>
         </div>
      </footer>
    </div>
  );
}
