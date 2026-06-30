'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/modules/catalog/presentation/components/ProductList/ProductCard';

interface ProductSliderProps {
  title: string;
  products: any[];
  linkHref?: string;
  linkLabel?: string;
}

export function ProductSlider({ title, products, linkHref, linkLabel = "Ver todas las ofertas" }: ProductSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lógica de arrastre con mouse para usuarios de escritorio
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDown.current = true;
    e.preventDefault();
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
  };

  const handleMouseUp = () => {
    isDown.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Multiplicador de velocidad de scroll
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft: currentScrollLeft, clientWidth, scrollWidth } = scrollRef.current;
      const scrollAmount = clientWidth;
      
      let scrollTo = direction === 'left' ? currentScrollLeft - scrollAmount : currentScrollLeft + scrollAmount;
      
      // Chequear límites para hacer scroll infinito
      const tolerance = 10;
      if (direction === 'right' && currentScrollLeft + clientWidth >= scrollWidth - tolerance) {
        scrollTo = 0; // Volver al inicio
      } else if (direction === 'left' && currentScrollLeft <= tolerance) {
        scrollTo = scrollWidth - clientWidth; // Ir al final
      }

      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="mt-12 bg-white rounded-[32px] p-6 md:p-8 border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
       {/* Header del Contenedor */}
       <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100">
          <div className="flex items-end gap-4">
            <h2 className="text-xl md:text-2xl font-black text-zinc-950 tracking-tight">{title}</h2>
            
            {linkHref && (
              <Link href={linkHref} className="hidden sm:block text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest mb-1">
                {linkLabel}
              </Link>
            )}
          </div>
          <div className="flex gap-2">
             <button 
               onClick={() => scroll('left')}
               className="h-10 w-10 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-all shadow-sm active:scale-90 bg-white"
             >
               <ChevronLeft className="h-5 w-5 text-zinc-400" />
             </button>
             <button 
               onClick={() => scroll('right')}
               className="h-10 w-10 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-all shadow-sm active:scale-90 bg-white"
             >
               <ChevronRight className="h-5 w-5 text-zinc-400" />
             </button>
          </div>
       </div>
       
       {/* Link visible en mobile */}
       {linkHref && (
          <Link href={linkHref} className="sm:hidden block text-xs font-bold text-primary mb-6 uppercase tracking-widest">
            {linkLabel}
          </Link>
       )}

       {/* Slider */}
       <div 
         ref={scrollRef}
         onMouseDown={handleMouseDown}
         onMouseLeave={handleMouseLeave}
         onMouseUp={handleMouseUp}
         onMouseMove={handleMouseMove}
         className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 cursor-grab active:cursor-grabbing select-none"
         style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
       >
          {products.map((p, index) => (
            <div 
              key={`${p.id}-${index}`} 
              // En móvil: 80% ancho. En md: 3 por fila (gap-4 = 1rem). En lg: exactamente 5 por fila (gap-4 = 1rem * 4 = 4rem total gap)
              className="w-[80vw] sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/5)] shrink-0 snap-start"
            >
              <ProductCard product={p} variant="catalog" />
            </div>
          ))}
       </div>
    </section>
  );
}
