"use client";

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/modules/catalog/presentation/components/ProductList/ProductCard';

interface ProductSliderProps {
  title: string;
  products: any[];
  linkHref?: string;
  linkLabel?: string;
  isPromoSlider?: boolean;
  validTo?: string | null;
  campaignColor?: string | null;
  prioritizeLcp?: boolean;
}

export function ProductSlider({
  title,
  products,
  linkHref,
  linkLabel = "Ver todas las ofertas",
  isPromoSlider = false,
  validTo = null,
  campaignColor = null,
  prioritizeLcp = false,
}: ProductSliderProps) {
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

  const [timeLeft, setTimeLeft] = useState<{ days: number; hrs: number; mins: number; secs: number } | null>(null);

  useEffect(() => {
    if (!validTo) return;
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = new Date(validTo).getTime() - now;
      if (difference <= 0) {
        return null;
      }
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hrs: Math.floor((difference / (1000 * 60 * 60)) % 24),
        mins: Math.floor((difference / 1000 / 60) % 60),
        secs: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      if (!left) {
        clearInterval(timer);
        setTimeLeft(null);
      } else {
        setTimeLeft(left);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [validTo]);

  if (!products || products.length === 0) return null;

  const isStockMode = validTo ? new Date(validTo).getFullYear() === 9999 : false;
  const isExpired = isPromoSlider && validTo && !isStockMode && (new Date(validTo).getTime() <= new Date().getTime());

  if (isExpired) return null;

  const hasTimeLeft = timeLeft !== null;
  
  // Calculate total days remaining for sub-label
  let daysLeft = 0;
  if (validTo) {
    const toDate = new Date(validTo);
    const diff = toDate.getTime() - new Date().getTime();
    daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  if (isPromoSlider) {
    return (
      <section className="mt-12 bg-[#f0f4f8] rounded-[32px] p-5 md:p-6 pb-6 border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden relative">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000002_1px,transparent_1px),linear-gradient(to_bottom,#00000002_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        {/* Campaign Banner Header */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-5 pb-4 border-b border-zinc-200/60">
          <div className="flex flex-col md:flex-row items-center gap-4 lg:gap-6 w-full md:w-auto justify-center md:justify-start">
            <div className="flex flex-col md:flex-row items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse shrink-0">
                <Flame className="h-5 w-5 text-red-500 fill-current" />
              </span>
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <h2 
                  className="text-lg md:text-xl lg:text-2xl font-black tracking-tight uppercase"
                  style={{ color: campaignColor || '#dc2626' }}
                >
                  {title}
                </h2>
                {linkHref && (
                  <Link 
                    href={linkHref}
                    className="text-[11px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-full border-2 hover:bg-black/5 transition-all mt-3 mb-2 md:mt-2 md:mb-0 flex items-center justify-center gap-1.5 w-fit"
                    style={{ 
                      color: campaignColor || '#dc2626', 
                      borderColor: campaignColor || '#dc2626' 
                    }}
                  >
                    Ver todas las ofertas &rarr;
                  </Link>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <span 
                className="text-[10px] font-black uppercase tracking-widest leading-none mb-1"
                style={{ color: campaignColor || '#dc2626' }}
              >
                Apúrate
              </span>
              <span 
                className="text-xs sm:text-sm font-black uppercase tracking-tight"
                style={{ color: campaignColor || '#dc2626' }}
              >
                {validTo && !isStockMode
                  ? (daysLeft > 1 ? `¡Quedan sólo ${daysLeft} días!` : "¡Solo por pocas horas!")
                  : "¡Hasta agotar stock!"}
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto justify-center md:justify-start">
            {/* Expiration Display */}
            {validTo && hasTimeLeft && !isStockMode ? (
              <div className="bg-white rounded-[28px] md:rounded-3xl border border-zinc-200/80 px-7 py-3 md:px-6 md:py-2.5 flex items-center gap-4 md:gap-4 shadow-sm select-none mx-auto md:mx-0">
                {timeLeft.days > 0 && (
                  <>
                    <div className="flex flex-col items-center">
                      <span 
                        className="text-3xl font-extrabold leading-none tracking-tight font-sans"
                        style={{ color: campaignColor || '#0066ff' }}
                      >
                        {timeLeft.days}
                      </span>
                      <span 
                        className="text-[11px] md:text-xs font-semibold mt-1.5"
                        style={{ color: campaignColor || '#0066ff' }}
                      >
                        Días
                      </span>
                    </div>
                    <span 
                      className="text-2xl font-bold pb-5"
                      style={{ color: campaignColor || '#0066ff' }}
                    >
                      :
                    </span>
                  </>
                )}
                <div className="flex flex-col items-center">
                  <span 
                    className="text-3xl font-extrabold leading-none tracking-tight font-sans"
                    style={{ color: campaignColor || '#0066ff' }}
                  >
                    {String(timeLeft.hrs).padStart(2, '0')}
                  </span>
                  <span 
                    className="text-[11px] md:text-xs font-semibold mt-1.5"
                    style={{ color: campaignColor || '#0066ff' }}
                  >
                    Hrs
                  </span>
                </div>
                <span 
                  className="text-2xl font-bold pb-5"
                  style={{ color: campaignColor || '#0066ff' }}
                >
                  :
                </span>
                <div className="flex flex-col items-center">
                  <span 
                    className="text-3xl font-extrabold leading-none tracking-tight font-sans"
                    style={{ color: campaignColor || '#0066ff' }}
                  >
                    {String(timeLeft.mins).padStart(2, '0')}
                  </span>
                  <span 
                    className="text-[11px] md:text-xs font-semibold mt-1.5"
                    style={{ color: campaignColor || '#0066ff' }}
                  >
                    Mins
                  </span>
                </div>
                <span 
                  className="text-2xl font-bold pb-5"
                  style={{ color: campaignColor || '#0066ff' }}
                >
                  :
                </span>
                <div className="flex flex-col items-center">
                  <span 
                    className="text-3xl font-extrabold leading-none tracking-tight font-sans"
                    style={{ color: campaignColor || '#0066ff' }}
                  >
                    {String(timeLeft.secs).padStart(2, '0')}
                  </span>
                  <span 
                    className="text-[11px] md:text-xs font-semibold mt-1.5"
                    style={{ color: campaignColor || '#0066ff' }}
                  >
                    Segs
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[20px] border border-zinc-200/80 px-5 py-3 shadow-sm select-none mx-auto md:mx-0">
                <span className="text-xs sm:text-sm font-black text-emerald-600 uppercase tracking-widest">
                  Hasta agotar stock
                </span>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-1.5 justify-center mt-3.5 md:mt-0">
              <button 
                onClick={() => scroll('left')}
                className="h-11 w-11 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-all shadow-sm active:scale-90 bg-white"
                aria-label="Desplazar a la izquierda"
              >
                <ChevronLeft className="h-5 w-5 text-zinc-400" />
              </button>
              <button 
                onClick={() => scroll('right')}
                className="h-11 w-11 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-all shadow-sm active:scale-90 bg-white"
                aria-label="Desplazar a la derecha"
              >
                <ChevronRight className="h-5 w-5 text-zinc-400" />
              </button>
            </div>
          </div>
        </div>

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
              className="w-[72vw] sm:w-[calc((100%-2rem)/3)] md:w-[calc((100%-3rem)/4)] lg:w-[calc((100%-5rem)/6)] shrink-0 snap-start"
            >
              <ProductCard product={p} variant="catalog" compact={isPromoSlider} priority={prioritizeLcp && index < 4} />
            </div>
          ))}
        </div>
      </section>
    );
  }

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
               aria-label="Desplazar a la izquierda"
             >
               <ChevronLeft className="h-5 w-5 text-zinc-400" />
             </button>
             <button 
               onClick={() => scroll('right')}
               className="h-10 w-10 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-all shadow-sm active:scale-90 bg-white"
               aria-label="Desplazar a la derecha"
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
              <ProductCard product={p} variant="catalog" priority={prioritizeLcp && index < 4} />
            </div>
          ))}
       </div>
    </section>
  );
}
