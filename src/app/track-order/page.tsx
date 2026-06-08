'use client';

import { useState } from 'react';
import { 
  Package, Truck, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [tracking, setTracking] = useState<any>(null);

  const handleTrack = () => {
    if (!orderId) return;
    setTracking({
      id: orderId,
      status: 'En camino',
      location: 'Centro de Distribución Santiago',
      history: [
        { status: 'Pedido recibido', time: '10:30 AM', done: true },
        { status: 'En preparación', time: '11:45 AM', done: true },
        { status: 'Despachado', time: '02:20 PM', done: true },
        { status: 'En reparto', time: '--:--', done: false }
      ]
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="bg-zinc-950 text-white p-6 px-12 flex items-center justify-between">
         <Link href="/" className="text-2xl font-black italic tracking-tighter">antigravity<span className="text-primary">.</span></Link>
      </nav>

      <main className="flex-grow max-w-[800px] mx-auto w-full p-6 lg:p-20">
        <div className="bg-white p-12 rounded-[50px] border border-zinc-200 shadow-2xl space-y-10">
           <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                 <Truck className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">Rastrea tu Pedido B2B</h1>
              <p className="text-sm text-zinc-500 font-medium">Ingresa tu número de orden para conocer el estado en tiempo real.</p>
           </div>

           <div className="flex gap-4">
              <Input 
                placeholder="Ej: AG-29384" 
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="h-14 rounded-2xl border-zinc-200 px-6 text-lg font-black uppercase" 
              />
              <Button onClick={handleTrack} className="h-14 bg-zinc-950 text-white rounded-2xl px-10 font-black uppercase text-xs hover:bg-zinc-800 transition-all">
                 Rastrear
              </Button>
           </div>

           {tracking && (
             <div className="pt-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                         <Package className="h-6 w-6 text-zinc-950" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Estado Actual</span>
                         <span className="text-lg font-black text-zinc-900 uppercase">{tracking.status}</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ubicación</span>
                      <div className="text-sm font-bold text-zinc-900">{tracking.location}</div>
                   </div>
                </div>

                <div className="space-y-8 pl-6 relative">
                   <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-zinc-100" />
                   {tracking.history.map((h: any, i: number) => (
                     <div key={i} className="flex items-center gap-6 relative">
                        <div className={cn("h-4 w-4 rounded-full border-4 border-white shadow-md z-10 -ml-[9px]", h.done ? "bg-primary" : "bg-zinc-200")} />
                        <div className="flex-1 flex justify-between items-center">
                           <span className={cn("text-sm font-black uppercase tracking-tight", h.done ? "text-zinc-900" : "text-zinc-300")}>{h.status}</span>
                           <span className="text-xs font-bold text-zinc-400">{h.time}</span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}

           <div className="pt-8 border-t border-zinc-100 text-center">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center justify-center gap-2">
                 <ShieldCheck className="h-4 w-4" /> Logística Protegida por Antigravity
              </p>
           </div>
        </div>
      </main>
    </div>
  );
}
