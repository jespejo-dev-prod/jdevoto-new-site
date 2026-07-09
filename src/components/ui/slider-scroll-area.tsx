'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SliderScrollAreaProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerContent?: React.ReactNode;
  containerClassName?: string;
}

export function SliderScrollArea({ 
  children, 
  title, 
  subtitle, 
  headerContent,
  containerClassName
}: SliderScrollAreaProps) {
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
      
      const tolerance = 10;
      if (direction === 'right' && currentScrollLeft + clientWidth >= scrollWidth - tolerance) {
        scrollTo = 0;
      } else if (direction === 'left' && currentScrollLeft <= tolerance) {
        scrollTo = scrollWidth - clientWidth;
      }

      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className={containerClassName}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-200/60">
        <div className="flex flex-col md:flex-row items-center gap-4 lg:gap-6 w-full md:w-auto justify-center md:justify-start">
           {title && (
             <div>
               <h2 className="text-xl md:text-2xl font-black text-zinc-950 tracking-tight uppercase">
                 {title}
               </h2>
               {subtitle && (
                 <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-widest text-center md:text-left">
                   {subtitle}
                 </p>
               )}
             </div>
           )}
           {headerContent}
        </div>
        <div className="flex gap-2 justify-center md:justify-end">
           <button 
             onClick={() => scroll('left')}
             className="h-10 w-10 rounded-full border border-zinc-200/80 flex items-center justify-center hover:bg-zinc-50 transition-colors shadow-sm active:scale-90 bg-white"
             aria-label="Deslizar izquierda"
           >
             <ChevronLeft className="h-5 w-5 text-zinc-400" />
           </button>
           <button 
             onClick={() => scroll('right')}
             className="h-10 w-10 rounded-full border border-zinc-200/80 flex items-center justify-center hover:bg-zinc-50 transition-colors shadow-sm active:scale-90 bg-white"
             aria-label="Deslizar derecha"
           >
             <ChevronRight className="h-5 w-5 text-zinc-400" />
           </button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 pt-1 cursor-grab active:cursor-grabbing select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </section>
  );
}
