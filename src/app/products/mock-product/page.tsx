'use client';

import { useState, useEffect } from 'react';
import { 
  Star, Truck, ShieldCheck, ShoppingCart, 
  ChevronRight, Heart, ChevronLeft, Plus, 
  Search, ChevronDown, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Helper for high-quality mock images
const getMockImg = (id: string) => `https://images.unsplash.com/${id}?q=80&w=600&auto=format&fit=crop`;

const IMG_GPU = getMockImg('photo-1591488320449-011701bb6704');
const IMG_PSU = getMockImg('photo-1587202372775-e239fccff699');
const IMG_RAM = getMockImg('photo-1555617766-c94804975da3');
const IMG_CPU = getMockImg('photo-1518770660439-4636190af475');
const IMG_SSD = getMockImg('photo-1597872200370-499df51bbd30');
const IMG_CASE = getMockImg('photo-1542744094-24638eff58bb');
const IMG_PC_BUILD = getMockImg('photo-1587202372775-e239fccff699');

export default function ProductSinglePage() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const product = {
    name: "GIGABYTE GeForce RTX 5070 Ti Gaming OC 16GB GDDR7 Tarjeta de Video, Sistema WINDFORCE, RGB Fusion",
    brand: "GIGABYTE",
    price: 1099.99,
    originalPrice: 1299.99,
    images: [IMG_GPU, IMG_PSU, IMG_RAM]
  };

  const relatedProducts = [
    { name: "MSI Gaming RTX 5070 Ti 16G Ventus 3X PZ OC", price: 999.99, img: IMG_GPU, fast: true, rating: 4.5, reviews: 68 },
    { name: "GIGABYTE Tarjeta gráfica GeForce RTX 5080 Gaming OC 16G", price: 1489.32, img: IMG_GPU, fast: true, rating: 4.8, reviews: 101 },
    { name: "MSI Tarjeta gráfica NVIDIA GeForce RTX 5070 Ti 16G Gaming Trio", price: 1289.99, img: IMG_GPU, fast: false, rating: 4.7, reviews: 499 },
    { name: "PNY NVIDIA GeForce RTX™ 5070 Ti Epic-X™ ARGB OC Triple Fan", price: 1049.99, img: IMG_GPU, fast: true, rating: 4.4, reviews: 327 },
    { name: "ASUS TUF Gaming GeForce RTX ™ 5070 12GB GDDR7 OC Edition", price: 754.99, img: IMG_GPU, fast: true, rating: 4.9, reviews: 453 },
    { name: "Tarjeta gráfica GIGABYTE GeForce RTX 5070 AERO OC 12G", price: 689.99, img: IMG_GPU, fast: true, rating: 4.6, reviews: 335 }
  ];

  const ProductSlider = ({ title, items }: { title: string, items: any[] }) => (
    <section className="mt-16 border-t border-zinc-200 pt-12">
       <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">{title}</h2>
          <div className="flex gap-2">
             <button className="h-10 w-10 rounded-full border border-zinc-300 flex items-center justify-center hover:bg-zinc-100 transition-colors shadow-sm"><ChevronLeft className="h-5 w-5" /></button>
             <button className="h-10 w-10 rounded-full border border-zinc-300 flex items-center justify-center hover:bg-zinc-100 transition-colors shadow-sm"><ChevronRight className="h-5 w-5" /></button>
          </div>
       </div>
       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {items.map((p, i) => (
            <div key={i} className="group cursor-pointer space-y-4">
               <div className="aspect-square rounded-xl bg-white flex items-center justify-center relative overflow-hidden transition-all group-hover:shadow-md border border-zinc-50">
                  <img src={p.img} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" alt="prod" />
                  {p.fast && <div className="absolute top-2 left-2 bg-zinc-900 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">Entrega rápida</div>}
               </div>
               <div className="space-y-1.5">
                  <h4 className="text-sm font-medium text-primary leading-tight line-clamp-3 group-hover:underline">{p.name}</h4>
                  <div className="flex items-center gap-1">
                    <div className="flex items-center text-orange-400">
                      {[...Array(5)].map((_, j) => <Star key={j} className={cn("h-3 w-3 fill-current", j >= 4 && "text-zinc-200 fill-none")} />)}
                    </div>
                    <span className="text-[11px] text-zinc-500 font-medium">{p.reviews || 0}</span>
                  </div>
                  <div className="text-lg font-bold text-zinc-900 tracking-tighter">US${p.price.toLocaleString()}</div>
               </div>
            </div>
          ))}
       </div>
    </section>
  );

  return (
    <div className="flex flex-col min-h-screen bg-white text-zinc-900 font-sans selection:bg-primary/20">
      
      {/* HEADER */}
      <nav className="bg-zinc-950 text-white p-4 px-8 flex items-center justify-between sticky top-0 z-50 border-b border-zinc-800 shadow-md">
         <div className="flex items-center gap-8">
            <span className="text-2xl font-black italic tracking-tighter">antigravity<span className="text-primary">.</span></span>
         </div>
         <div className="flex-1 max-w-2xl mx-8 relative group">
            <input placeholder="Buscar en el catálogo mayorista..." className="w-full h-11 rounded-xl bg-zinc-900 border border-zinc-800 px-5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-zinc-600" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary p-2 rounded-lg cursor-pointer">
               <Search className="h-4 w-4 text-zinc-950" />
            </div>
         </div>
         <div className="flex items-center gap-8">
            <div className="hidden md:flex flex-col text-right">
               <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Empresa</span>
               <span className="text-xs font-bold text-white tracking-tighter uppercase">Tech Chile Ltd.</span>
            </div>
            <div className="relative group cursor-pointer">
               <ShoppingCart className="h-6 w-6 text-zinc-400 group-hover:text-primary transition-colors" />
               <span className="absolute -top-2 -right-2 bg-primary text-zinc-950 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center">0</span>
            </div>
         </div>
      </nav>

      <main className="flex-grow max-w-[1400px] mx-auto p-6 lg:px-12 pt-8 pb-20">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 mb-6 uppercase tracking-wider">
           <Link href="#" className="hover:text-primary transition-colors">Catálogo</Link> <ChevronRight className="h-3 w-3" />
           <Link href="#" className="hover:text-primary transition-colors">Hardware</Link> <ChevronRight className="h-3 w-3" />
           <span className="text-zinc-900 truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* GALLERY */}
          <div className="lg:col-span-5 flex gap-6">
            <div className="flex flex-col gap-3">
               {product.images.map((img, i) => (
                 <div key={i} onMouseEnter={() => setSelectedImage(i)} className={cn("w-14 h-14 rounded-xl border-2 cursor-pointer overflow-hidden transition-all shadow-md", selectedImage === i ? "border-primary" : "border-transparent hover:border-zinc-200")}>
                   <img src={img} className="w-full h-full object-cover" alt="thumb" />
                 </div>
               ))}
            </div>
            <div className="flex-1 rounded-[40px] overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center min-h-[450px] relative shadow-inner">
               <img src={product.images[selectedImage]} className="w-full h-full object-contain p-10 mix-blend-multiply transition-all duration-700" alt="Main" />
               <button className="absolute top-8 right-8 h-12 w-12 rounded-full bg-white shadow-xl flex items-center justify-center text-zinc-300 hover:text-red-500 transition-all"><Heart className="h-6 w-6" /></button>
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-3">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-lg text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                  GIGABYTE — <span className="text-primary">AORUS ELITE</span>
               </div>
               <h1 className="text-xl lg:text-3xl font-black text-zinc-900 leading-[1.15] uppercase tracking-tighter">
                 {product.name}
               </h1>
               <div className="flex items-center gap-2">
                  <div className="flex items-center text-orange-400">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                  <span className="text-xs font-bold text-primary hover:underline cursor-pointer">1,248 opiniones</span>
               </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-zinc-100">
               <div className="flex items-baseline gap-3">
                 <span className="text-red-600 text-4xl font-black tracking-tighter">-15%</span>
                 <div className="flex flex-col">
                   <span className="text-4xl font-black text-zinc-900">$ {product.price.toLocaleString()}</span>
                   <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Precio sugerido: ${product.originalPrice}</span>
                 </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-zinc-950/20">
                    <Truck className="h-4 w-4 text-primary" /> Entrega Priority Chile
                  </div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase underline decoration-primary decoration-2 cursor-pointer">Logística</span>
               </div>
            </div>

            <div className="pt-6 grid grid-cols-2 gap-y-3 text-[11px] font-bold uppercase tracking-tight border-t border-zinc-100">
               <div className="text-zinc-400">Coprocesador</div><div className="text-zinc-900">RTX 5070 Ti</div>
               <div className="text-zinc-400">RAM Gráfica</div><div className="text-zinc-900">16 GB GDDR7</div>
               <div className="text-zinc-400">Marca</div><div className="text-zinc-900">GIGABYTE</div>
               <div className="text-zinc-400">Reloj GPU</div><div className="text-zinc-900">2600 MHz</div>
            </div>
          </div>

          {/* BUY BOX */}
          <div className="lg:col-span-3">
             <div className="p-6 lg:p-7 rounded-[40px] border-2 border-zinc-100 bg-white shadow-2xl space-y-6 sticky top-24">
                <div className="space-y-1">
                   <div className="text-2xl font-black text-zinc-900">$1,099.99</div>
                   <div className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Listos para despacho
                   </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-zinc-100">
                   <div className="flex gap-3 text-[10px] font-black uppercase tracking-tighter text-zinc-500">
                      <Truck className="h-4 w-4 text-primary" /> Entrega este <span className="text-zinc-900">Viernes</span>
                   </div>
                   <div className="flex gap-3 text-[10px] font-black uppercase tracking-tighter text-zinc-500">
                      <ShieldCheck className="h-4 w-4 text-zinc-400" /> Garantía <span className="text-zinc-900">3 años</span>
                   </div>
                </div>

                <div className="space-y-3">
                   <select className="w-full h-11 rounded-xl bg-zinc-50 border border-zinc-200 px-4 text-[10px] font-black outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                      <option>Cantidad: 1 unidad</option>
                      <option>Cantidad: 5 unidades</option>
                      <option>Cantidad: 10+ (Precio Mayorista)</option>
                   </select>
                   <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-zinc-950 font-black text-[10px] uppercase rounded-2xl shadow-xl shadow-primary/30 transition-all active:scale-95">
                      Añadir al carrito
                   </Button>
                   <Button className="w-full h-12 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-[10px] uppercase rounded-2xl transition-all active:scale-95">
                      Comprar ahora
                   </Button>
                </div>
             </div>
          </div>
        </div>

        {/* --- FULL WIDTH DESCRIPTION & SPECS --- */}
        <div className="mt-20 border-t border-zinc-200 pt-16 space-y-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-zinc-900">Descripción del producto</h2>
            <div className="text-base text-zinc-700 leading-relaxed max-w-6xl">
               Antes de su tiempo, por delante del juego están las tarjetas gráficas GIGABYTE GeForce RTX 5070 Ti GAMING OC 16G. Impulsado por la nueva arquitectura RTX de NVIDIA, la GIGABYTE GeForce RTX 5070 Ti ofrece imágenes impresionantes y aceleración de IA avanzada.
            </div>
          </section>

          <section className="space-y-8">
            <div className="bg-primary text-zinc-950 px-4 py-1.5 text-lg font-bold w-fit rounded-sm">Información del producto</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
               <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <h3 className="text-xl font-bold text-zinc-900">Características y especificaciones</h3>
                    <ChevronDown className="h-5 w-5 text-zinc-400" />
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-zinc-100">
                      <tr className="bg-zinc-50/50"><td className="py-3 px-4 font-bold text-zinc-700 w-1/2">Coprocesador Gráfico</td><td className="py-3 px-4 text-zinc-600">NVIDIA GeForce RTX 5070 Ti</td></tr>
                      <tr><td className="py-3 px-4 font-bold text-zinc-700">Memoria RAM Gráfica</td><td className="py-3 px-4 text-zinc-600">16 GB</td></tr>
                      <tr className="bg-zinc-50/50"><td className="py-3 px-4 font-bold text-zinc-700">Velocidad Reloj GPU</td><td className="py-3 px-4 text-zinc-600">2600 MHz</td></tr>
                      <tr><td className="py-3 px-4 font-bold text-zinc-700">Interfaz Salida Vídeo</td><td className="py-3 px-4 text-zinc-600">DisplayPort, HDMI</td></tr>
                    </tbody>
                  </table>
               </div>
               <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <h3 className="text-xl font-bold text-zinc-900">Detalles del producto</h3>
                    <ChevronDown className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 text-sm text-zinc-600 space-y-4">
                     <p>Dimensiones: 30 x 13 x 5 cm; 1.5 kilogramos</p>
                     <p>Fabricante: GIGABYTE</p>
                     <p>ASIN: B0DTRC7782</p>
                  </div>
               </div>
            </div>
          </section>
        </div>

        {/* SECTION: BUNDLE */}
        <section className="mt-28 p-10 lg:p-12 rounded-[40px] border border-zinc-200 bg-zinc-50/50">
           <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 max-w-6xl mx-auto">
              <div className="flex flex-col gap-8 flex-1">
                 <h2 className="text-xl font-bold text-zinc-900">Comprados juntos habitualmente</h2>
                 <div className="flex items-center gap-6">
                    <div className="w-32 h-32 rounded-2xl bg-white border border-zinc-200 p-4 shadow-sm flex items-center justify-center"><img src={IMG_GPU} className="w-full h-full object-contain" alt="b1" /></div>
                    <Plus className="h-5 w-5 text-zinc-300" />
                    <div className="w-32 h-32 rounded-2xl bg-white border border-zinc-200 p-4 shadow-sm flex items-center justify-center"><img src={IMG_PSU} className="w-full h-full object-contain" alt="b2" /></div>
                    <Plus className="h-5 w-5 text-zinc-300" />
                    <div className="w-32 h-32 rounded-2xl bg-white border border-zinc-200 p-4 shadow-sm flex items-center justify-center"><img src={IMG_RAM} className="w-full h-full object-contain" alt="b3" /></div>
                 </div>
              </div>
              <div className="flex flex-col gap-6 md:min-w-[300px] border-l border-zinc-200 pl-0 lg:pl-12">
                 <div className="space-y-1">
                    <div className="text-sm font-medium text-zinc-500 uppercase">Precio por el bundle</div>
                    <div className="text-4xl font-black text-zinc-900 tracking-tighter">$1,878.98</div>
                 </div>
                 <Button className="bg-zinc-950 text-white h-14 px-10 text-xs font-bold uppercase rounded-2xl shadow-xl hover:bg-zinc-800 transition-all">Añadir los 3 al carrito</Button>
              </div>
           </div>
        </section>

        {/* ALL SLIDERS RESTORED */}
        <ProductSlider title="Artículos similares que pueden enviarse rápidamente" items={relatedProducts} />
        <ProductSlider title="Los clientes que compraron este producto también compraron" items={relatedProducts.slice().reverse()} />
        <ProductSlider title="Marcas oficiales en nuestro catálogo" items={relatedProducts.map(p => ({ ...p, img: IMG_GPU }))} />
        <ProductSlider title="Los más vendidos en Computación" items={relatedProducts} />
        <ProductSlider title="Relacionado con tus búsquedas recientes" items={relatedProducts} />

        {/* --- REFINED REVIEWS (Amazon Style with Visibility Fix) --- */}
        <section className="mt-32 border-t border-zinc-200 pt-16">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              
              <div className="lg:col-span-3 space-y-8">
                 <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-zinc-900">Opiniones de clientes</h2>
                    <div className="flex items-center gap-2">
                       <div className="flex items-center text-orange-400">
                          {[...Array(5)].map((_, i) => <Star key={i} className={cn("h-5 w-5 fill-current", i === 4 && "text-orange-400 fill-none")} />)}
                       </div>
                       <span className="text-lg font-bold">4.5 de 5</span>
                    </div>
                    <p className="text-sm text-zinc-500">215 calificaciones globales</p>
                 </div>

                 <div className="space-y-3">
                    {[
                      { s: 5, p: 79 }, { s: 4, p: 9 }, { s: 3, p: 3 }, { s: 2, p: 1 }, { s: 1, p: 8 }
                    ].map((r) => (
                      <div key={r.s} className="flex items-center gap-4 group cursor-pointer">
                         <span className="text-xs font-medium text-primary hover:underline whitespace-nowrap w-14">{r.s} estrellas</span>
                         <div className="flex-1 h-5 bg-zinc-100 rounded-sm overflow-hidden border border-zinc-200">
                            <div className="h-full bg-orange-400 transition-all" style={{ width: `${r.p}%` }} />
                         </div>
                         <span className="text-xs font-medium text-primary hover:underline w-10 text-right">{r.p}%</span>
                      </div>
                    ))}
                 </div>

                 <div className="pt-6 border-t border-zinc-100 space-y-4">
                    <h3 className="text-lg font-bold text-zinc-900">Escribir opinión de este producto</h3>
                    <Button className="w-full h-11 bg-zinc-950 text-white font-bold text-xs rounded-full hover:bg-zinc-800 transition-all">
                       Escribir mi opinión
                    </Button>
                 </div>
              </div>

              <div className="lg:col-span-9 space-y-12">
                 <div className="space-y-6">
                    <h3 className="text-xl font-bold text-zinc-900">Fotos y videos de clientes</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                       {[IMG_PC_BUILD, IMG_CASE, IMG_GPU, IMG_PC_BUILD, IMG_RAM].map((img, i) => (
                         <div key={i} className="h-40 w-40 rounded-lg overflow-hidden border border-zinc-200 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                            <img src={img} className="h-full w-full object-cover" alt="customer" />
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-8">
                    <h3 className="text-xl font-bold text-zinc-900">Opiniones destacadas</h3>
                    <div className="space-y-10">
                       <div className="space-y-4 border-b border-zinc-100 pb-10">
                          <div className="flex items-center gap-3">
                             <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                                <User className="h-5 w-5 text-zinc-400" />
                             </div>
                             <span className="text-sm font-bold">Osmanys Perez</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="flex items-center text-orange-400">
                                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                             </div>
                             <span className="text-sm font-bold">100% worth it if you're in a budget</span>
                          </div>
                          <div className="text-xs text-zinc-500">Calificado en Chile el 18 de marzo de 2026</div>
                          <div className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase">
                             <span>Estilo: Gaming</span> <span>|</span> <span>Tamaño: RTX 5070 Ti</span> <span>|</span> <span className="text-orange-600">Compra Verificada</span>
                          </div>
                          <p className="text-sm text-zinc-700 leading-relaxed max-w-4xl">
                             Una bestia de tarjeta gráfica. Las temperaturas rara vez superan los 65° funcionando a plena potencia. El sistema WINDFORCE es sorprendentemente silencioso.
                          </p>
                          <div className="flex items-center gap-4 pt-2">
                             <Button className="h-9 px-8 bg-zinc-950 text-white font-bold text-[10px] uppercase rounded shadow-md border-zinc-300">
                               Útil
                             </Button>
                             <span className="text-xs text-zinc-500">¿Te resultó útil esta opinión?</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

           </div>
        </section>

      </main>

      <footer className="bg-zinc-950 text-white py-24 px-12 border-t border-zinc-800 mt-auto">
         <div className="max-w-[1400px] mx-auto text-center space-y-10">
            <span className="text-4xl font-black italic tracking-tighter">antigravity<span className="text-primary">.</span></span>
            <div className="flex flex-wrap justify-center gap-12 text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">
               <span className="hover:text-primary cursor-pointer transition-colors">Centro de Soporte</span>
               <span className="hover:text-primary cursor-pointer transition-colors">Términos de Servicio</span>
               <span className="hover:text-primary cursor-pointer transition-colors">Privacidad B2B</span>
               <span className="hover:text-primary cursor-pointer transition-colors">Portal de Facturación</span>
            </div>
            <p className="text-[11px] text-zinc-700 font-bold uppercase tracking-[0.2em]">© 2026 Comercial J. Devoto Ingeniería para Empresas.</p>
         </div>
      </footer>
    </div>
  );
}
