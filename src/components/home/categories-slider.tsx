'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoriesSliderProps {
  categories: Category[];
}

// Map categories to the moved local images in public/home
const getCategoryImage = (name: string, slug: string) => {
  const cleanName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanSlug = slug.toLowerCase();
  
  if (cleanName.includes('escolar') || cleanSlug.includes('escolar')) return '/home/escolar.jpg';
  if (cleanName.includes('ferreteria') || cleanSlug.includes('ferreteria')) return '/home/ferreteria.jpg';
  if (cleanName.includes('manualidades') || cleanSlug.includes('manualidades')) return '/home/manualidades.jpg';
  if (cleanName.includes('oficina') || cleanSlug.includes('oficina')) return '/home/oficina.jpg';
  if (cleanName.includes('outlet') || cleanSlug.includes('outlet')) return '/home/outlet.jpg';
  if (cleanName.includes('papeleria') || cleanSlug.includes('papeleria')) return '/home/papeleria.jpg';
  if (cleanName.includes('regalo') || cleanSlug.includes('regalo')) return '/home/regalos.jpg';
  
  // Safe fallback to one of the category keys
  const keys = ['escolar', 'ferreteria', 'manualidades', 'oficina', 'outlet', 'papeleria', 'regalos'];
  const fallbackKey = keys[name.length % keys.length];
  return `/home/${fallbackKey}.jpg`;
};

export function CategoriesSlider({ categories }: CategoriesSliderProps) {
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
      const scrollAmount = clientWidth * 0.85;
      
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

  if (!categories || categories.length === 0) return null;

  return (
    <section className="mt-12 bg-white rounded-[32px] p-6 md:p-8 border border-zinc-100 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
       {/* Section Header */}
       <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-zinc-950 tracking-tight uppercase">Categorías Destacadas</h2>
            <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">Explora nuestro catálogo industrial B2B</p>
          </div>
          <div className="flex gap-2">
             <button 
               onClick={() => scroll('left')}
               className="h-10 w-10 rounded-full border border-zinc-200/80 flex items-center justify-center hover:bg-zinc-50 transition-all shadow-sm active:scale-90 bg-white"
               aria-label="Deslizar izquierda"
             >
               <ChevronLeft className="h-5 w-5 text-zinc-400" />
             </button>
             <button 
               onClick={() => scroll('right')}
               className="h-10 w-10 rounded-full border border-zinc-200/80 flex items-center justify-center hover:bg-zinc-50 transition-all shadow-sm active:scale-90 bg-white"
               aria-label="Deslizar derecha"
             >
               <ChevronRight className="h-5 w-5 text-zinc-400" />
             </button>
          </div>
       </div>
       
       {/* Cards Grid / Carousel */}
       <div 
         ref={scrollRef}
         onMouseDown={handleMouseDown}
         onMouseLeave={handleMouseLeave}
         onMouseUp={handleMouseUp}
         onMouseMove={handleMouseMove}
         className="flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 pt-1 cursor-grab active:cursor-grabbing select-none"
         style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
       >
          {categories.map((category, index) => (
            <Link 
              key={category.id} 
              href={`/products?category=${category.slug}`}
              className="w-[80vw] sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-5rem)/5)] shrink-0 snap-start group relative h-[360px] rounded-[28px] overflow-hidden flex flex-col justify-end p-6 border border-zinc-200/40 shadow-[0_8px_25px_rgba(0,0,0,0.02)] hover:shadow-2xl transition-all duration-500"
            >
              {/* Zoom background image */}
              <Image 
                src={getCategoryImage(category.name, category.slug)}
                alt={category.name}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 80vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-105"
              />
              
              {/* Elegant dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
              
              {/* Text info */}
              <div className="relative z-10 flex flex-col gap-2.5">
                <h3 className="text-lg font-black text-white leading-tight uppercase tracking-tight group-hover:text-primary transition-colors duration-300">
                  {category.name}
                </h3>
                <span className="text-[9px] font-black text-white/70 group-hover:text-white tracking-widest uppercase flex items-center gap-1.5 transition-colors">
                  Ver Productos <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
       </div>
    </section>
  );
}
