'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoriesSliderProps {
  categories: Category[];
}

// Map manual de imágenes sugeridas según el nombre de la categoría B2B para el mockup
const getCategoryImage = (name: string, index: number) => {
  const defaultImages = [
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1541888087425-ce81dfc46928?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1581092335397-9583eb92d232?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=800&auto=format&fit=crop',
  ];
  return defaultImages[index % defaultImages.length];
};

export function CategoriesSlider({ categories }: CategoriesSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!categories || categories.length === 0) return null;

  return (
    <section className="mt-12 bg-white rounded-[32px] p-6 md:p-8 border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
       <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-zinc-950 tracking-tight uppercase">Descubre Nuestras Categorías</h2>
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
       
       <div 
         ref={scrollRef}
         className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-12 pt-2"
         style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
       >
          {categories.map((category, index) => (
            <Link 
              key={category.id} 
              href={`/products?category=${category.slug}`}
              className="w-[80vw] sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/5)] shrink-0 snap-start group relative h-[320px] rounded-[32px] overflow-hidden flex flex-col justify-end p-6 border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${getCategoryImage(category.name, index)})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              <div className="relative z-10 flex flex-col gap-2">
                <h3 className="text-xl font-black text-white leading-tight uppercase group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <span className="text-xs font-bold text-white/80 tracking-widest uppercase flex items-center gap-2">
                  Explorar <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
       </div>
    </section>
  );
}
