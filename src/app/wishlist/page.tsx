'use client';

import { useState } from 'react';
import { 
  Heart, Trash2, Package, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const getMockImg = (id: string) => `https://images.unsplash.com/${id}?q=80&w=300&auto=format&fit=crop`;

export default function WishlistPage() {
  const [items, setItems] = useState([
    { id: 1, name: "RTX 5070 Ti Gaming OC", price: 1099.99, img: 'photo-1591488320449-011701bb6704' },
    { id: 2, name: "Monitor 4K 144Hz OLED", price: 899.99, img: 'photo-1527443224154-c4a3942d3acf' }
  ]);

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-zinc-950 text-white p-4 px-8 flex items-center justify-between">
         <Link href="/" className="text-2xl font-black italic tracking-tighter">antigravity<span className="text-primary">.</span></Link>
         <Link href="/products" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">Seguir comprando</Link>
      </nav>

      <main className="max-w-[1000px] mx-auto p-6 lg:p-12">
        <h1 className="text-4xl font-black text-zinc-900 mb-10 flex items-center gap-4">
           Lista de Deseos <Heart className="h-8 w-8 text-red-500 fill-current" />
        </h1>

        <div className="space-y-6">
           {items.map((item) => (
             <div key={item.id} className="bg-white p-8 rounded-[40px] border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center gap-8 group">
                <div className="w-32 h-32 rounded-3xl bg-zinc-50 p-4 border border-zinc-100 flex items-center justify-center">
                   <img src={getMockImg(item.img)} alt={item.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1 space-y-2 text-center md:text-left">
                   <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">{item.name}</h3>
                   <div className="text-2xl font-black text-primary">${item.price.toLocaleString()}</div>
                   <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                      <Package className="h-4 w-4" /> Disponible para despacho
                   </div>
                </div>
                <div className="flex flex-col gap-3 w-full md:w-auto">
                   <Button className="bg-zinc-950 text-white rounded-2xl h-12 px-8 text-xs font-black uppercase hover:bg-primary hover:text-zinc-950 transition-all">
                      Añadir al Carrito
                   </Button>
                   <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1 rounded-xl h-10 text-[10px] font-bold uppercase hover:bg-zinc-100"><Share2 className="h-4 w-4 mr-2" /> Compartir</Button>
                      <Button variant="ghost" onClick={() => setItems(items.filter(i => i.id !== item.id))} className="rounded-xl h-10 text-zinc-300 hover:text-red-500"><Trash2 className="h-5 w-5" /></Button>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </main>
    </div>
  );
}
