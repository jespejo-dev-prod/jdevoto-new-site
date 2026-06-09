'use client';

import { 
  MapPin, Mail, Phone, 
  ChevronRight, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';

export default function SupportPage() {
  const faqs = [
    { q: "¿Cómo solicito una cotización mayorista?", a: "Puedes hacerlo directamente desde el carrito de compras seleccionando la opción 'Solicitar Cotización'." },
    { q: "¿Tienen despacho a regiones?", a: "Sí, realizamos envíos a todo Chile a través de BlueExpress y Starken con tarifas B2B preferenciales." },
    { q: "¿Cómo descargo mi factura electrónica?", a: "Todas las facturas se emiten automáticamente y quedan disponibles en tu perfil de usuario bajo la sección 'Mis Pedidos'." }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <PublicHeader />
      
      {/* HERO SUPPORT */}
      <section className="bg-zinc-950 text-white py-20 px-8 border-b border-zinc-800">
         <div className="max-w-[1000px] mx-auto text-center space-y-4">
            <h1 className="text-5xl font-black italic tracking-tighter">Centro de Ayuda<span className="text-primary">.</span></h1>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">Estamos aquí para potenciar tu infraestructura. Contacta con nuestro equipo especializado o revisa las preguntas frecuentes.</p>
         </div>
      </section>

      <main className="max-w-[1200px] mx-auto p-6 lg:p-20 space-y-24">
         
         {/* CONTACT CARDS */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 rounded-[40px] border border-zinc-100 bg-white space-y-6 hover:shadow-xl transition-all flex flex-col justify-between">
               <div className="space-y-6">
                  <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><MapPin className="h-7 w-7" /></div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900">Oficina Central</h3>
                  <p className="text-sm text-zinc-500 font-semibold leading-relaxed">
                     Décima Avenida 1740, Placilla, Valparaíso
                  </p>
               </div>
               <a 
                  href="https://maps.google.com/?q=Décima+Avenida+1740,+Placilla,+Valparaíso" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold h-12 uppercase text-[10px] flex items-center justify-center transition-all mt-4"
               >
                  Ver en Google Maps
               </a>
            </div>
            <div className="p-10 rounded-[40px] border border-zinc-100 bg-white space-y-6 hover:shadow-xl transition-all flex flex-col justify-between">
               <div className="space-y-6">
                  <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Mail className="h-7 w-7" /></div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900">Email Corporativo</h3>
                  <p className="text-sm text-zinc-500">Para consultas comerciales, RMA y facturación masiva.</p>
                  <div className="text-lg font-black text-primary break-all">contactoweb@jdevoto.cl</div>
               </div>
               <a 
                  href="mailto:contactoweb@jdevoto.cl" 
                  className="w-full rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold h-12 uppercase text-[10px] flex items-center justify-center transition-all mt-4"
               >
                  Enviar Correo
               </a>
            </div>
            <div className="p-10 rounded-[40px] border border-zinc-100 bg-white space-y-6 hover:shadow-xl transition-all flex flex-col justify-between">
               <div className="space-y-6">
                  <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Phone className="h-7 w-7" /></div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900">Línea Directa</h3>
                  <p className="text-sm text-zinc-500">Lunes a Viernes, 09:00 a 18:00 hrs. Exclusivo empresas.</p>
                  <div className="text-xl font-black text-primary">(32) 331 5100</div>
               </div>
               <a 
                  href="tel:+56323315100" 
                  className="w-full rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold h-12 uppercase text-[10px] flex items-center justify-center transition-all mt-4"
               >
                  Llamar Ahora
               </a>
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

      <PublicFooter />
    </div>
  );
}
