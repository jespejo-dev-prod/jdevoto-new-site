"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface SlideItem {
  id: string | number;
  image: string;
  badge?: string;
  badgeIcon?: any;
  badgeColor?: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  gradient?: string;
  imageClass?: string;
  imagePositionX?: number;
  imageScale?: number;
}

const iconMap: Record<string, any> = {
  Zap,
  Truck,
  ShieldCheck
};

const DEFAULT_SLIDES: SlideItem[] = [
  {
    id: 1,
    image: "/home/outlet.jpg",
    badge: "⚡ Precios Especiales B2B",
    badgeIcon: Zap,
    badgeColor: "text-sky-700 bg-sky-50 border-sky-100",
    title: "Productos en Outlet",
    description:
      "Aprovecha precios rebajados en una gran variedad de productos destacados.",
    cta: "Ver Ofertas",
    href: "/categorias/outlet",
    gradient: "from-sky-100/30 via-zinc-100/50 to-transparent",
    imageClass:
      "object-center scale-110 md:scale-120 translate-x-[3%] md:translate-x-[8%] origin-center",
  },
  {
    id: 2,
    image: "/home/despacho-gratis.png",
    badge: "🚚 Logística a costo cero",
    badgeIcon: Truck,
    badgeColor: "text-amber-700 bg-amber-50 border-amber-100",
    title: "Despacho Gratis",
    description:
      "Recibe tu compra sin costo en zonas seleccionadas según monto mínimo de compra.",
    cta: "Ver Cobertura",
    href: "/support",
    gradient: "from-amber-100/30 via-zinc-100/50 to-transparent",
    imageClass:
      "object-right scale-100 md:scale-108 md:translate-x-[30%] origin-right",
  },
  {
    id: 3,
    image: "/home/linea-credito.jpg",
    badge: "💼 Pago diferido a 30 días",
    badgeIcon: ShieldCheck,
    badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-100",
    title: "Línea de Crédito para Ventas al Comercio",
    description:
      "Contáctanos para evaluar tu crédito y acceder a compras con pago diferido.",
    cta: "Evaluar Crédito",
    href: "/support",
    gradient: "from-emerald-100/30 via-zinc-100/50 to-transparent",
    imageClass:
      "object-left scale-120 md:scale-[1.45] translate-x-[8%] md:translate-x-[22%] origin-left",
  },
];

export function HeroSlider({ initialSlides }: { initialSlides?: any[] | null }) {
  const [activeSlides, setActiveSlides] = useState<SlideItem[]>(() => {
    if (initialSlides && Array.isArray(initialSlides) && initialSlides.length > 0) {
      return initialSlides.map((s: any) => {
        let BadgeIcon = null;
        if (s.badgeIcon) {
          if (typeof s.badgeIcon === "string") {
            BadgeIcon = iconMap[s.badgeIcon] || null;
          } else {
            BadgeIcon = s.badgeIcon;
          }
        }
        return {
          id: s.id,
          image: s.image,
          badge: s.badge,
          badgeIcon: BadgeIcon,
          badgeColor: s.badgeColor || "text-sky-700 bg-sky-50 border-sky-100",
          title: s.title,
          description: s.description,
          cta: s.cta || "Ver Más",
          href: s.href || "/products",
          gradient: s.gradient || "from-sky-100/10 via-zinc-100/30 to-transparent",
          imageClass: s.imageClass || "object-center scale-100",
          imagePositionX: s.imagePositionX,
          imageScale: s.imageScale
        };
      });
    }
    return DEFAULT_SLIDES;
  });
  const [current, setCurrent] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Swipe logic
  const [pointerDownX, setPointerDownX] = useState<number | null>(null);
  const [pointerUpX, setPointerUpX] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const handlePointerDown = (e: React.PointerEvent) => {
    setPointerUpX(null);
    setPointerDownX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Solo registramos el movimiento si hemos presionado
    if (pointerDownX !== null) {
      setPointerUpX(e.clientX);
    }
  };

  const handlePointerUp = () => {
    if (pointerDownX === null || pointerUpX === null) {
      setPointerDownX(null);
      setPointerUpX(null);
      return;
    }
    const distance = pointerDownX - pointerUpX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
    setPointerDownX(null);
    setPointerUpX(null);
  };

  // Fetch dinámico eliminado: ahora los slides se inyectan mediante SSR (initialSlides)
  // para evitar retrasos en el LCP generados por el renderizado asíncrono en cliente.

  useEffect(() => {
    if (activeSlides.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % activeSlides.length);
    }, 7000);

    return () => {
      clearInterval(timer);
    };
  }, [activeSlides, current, isHovered]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % activeSlides.length);
  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);

  const activeSlide = activeSlides[current] || DEFAULT_SLIDES[0];

  return (
    <div 
      className="relative h-[420px] md:h-[500px] lg:h-[580px] w-full overflow-hidden rounded-[36px] md:rounded-[40px] bg-zinc-100 border border-zinc-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06),0_-10px_40px_rgba(0,0,0,0.04)] group touch-pan-y"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        handlePointerUp(); // Si sale del slider mientras arrastra
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000004_1px,transparent_1px),linear-gradient(to_bottom,#00000004_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-10" />

      {/* Light glow effects */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Background image — visible Inmediatamente (LCP detectable por Lighthouse) */}
      <div className="absolute inset-0 z-0">
        {(() => {
          const hasInlineTransform = activeSlide.imagePositionX !== undefined || activeSlide.imageScale !== undefined;
          const safeImageClass = hasInlineTransform
            ? (activeSlide.imageClass || '').replace(/\bscale-\S+\b|\btranslate-x-\S+\b/g, '').trim()
            : (activeSlide.imageClass || '');
          return (
            <Image
              src={activeSlide.image}
              alt={activeSlide.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1440px"
              className={`object-cover opacity-85 md:opacity-95 transition-opacity transition-transform duration-700 ${safeImageClass}`}
              priority
              quality={60}
              fetchPriority="high"
              style={
                hasInlineTransform
                  ? {
                      transform: `scale(${(activeSlide.imageScale || 100) / 100}) translateX(${activeSlide.imagePositionX || 0}%)`
                    }
                  : undefined
              }
            />
          );
        })()}
        {/* Light gradient fade for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-100 via-zinc-100/90 to-transparent hidden md:block" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-100 via-zinc-100/60 to-transparent md:hidden" />
        {/* Subtle color highlight gradient glow */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${activeSlide.gradient} opacity-40 pointer-events-none`}
        />
      </div>

      {/* Text Container: Pure CSS Animations */}
      <div
        key={current}
        className="absolute inset-0 flex flex-col md:flex-row items-center justify-between select-none"
      >
        <div className="relative z-10 flex flex-col justify-center px-8 md:px-16 lg:px-24 h-full md:w-[50%] lg:w-[45%] text-left pt-12 md:pt-0">
          
          {/* Badge */}
          {activeSlide.badge && (
            <div className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both">
              <span className={`inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${activeSlide.badgeColor || ""}`}>
                {activeSlide.badgeIcon && (
                  <activeSlide.badgeIcon className="h-3.5 w-3.5" />
                )}
                {activeSlide.badge}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className={`text-4xl md:text-5xl lg:text-6xl font-black max-w-xl leading-[1.1] tracking-tight uppercase animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both ${
            activeSlide.title.toLowerCase().includes('outlet') ? 'text-red-600' :
            activeSlide.title.toLowerCase().includes('despacho gratis') ? 'text-emerald-600' :
            (activeSlide.title.toLowerCase().includes('ferreteria') || activeSlide.title.toLowerCase().includes('ferretería')) ? 'text-[#6F4E37]' :
            'text-zinc-950'
          }`}>
            {activeSlide.title}
          </h1>

          {/* Description */}
          <p className="text-sm md:text-base lg:text-lg text-zinc-600 mt-4 max-w-md font-semibold leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
            {activeSlide.description}
          </p>

          {/* CTA Button */}
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500 fill-mode-both">
            <Link
              href={activeSlide.href}
              className="inline-flex items-center justify-center px-8 py-3.5 bg-zinc-950 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-800 transition-colors shadow-xl shadow-zinc-900/10 hover:scale-[1.03] active:scale-95 duration-300"
            >
              {activeSlide.cta}
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Buttons (Sleek Circle Controls) */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/60 backdrop-blur-md border border-zinc-200/50 flex items-center justify-center text-zinc-500 hover:text-zinc-950 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/90 shadow-sm z-20"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/60 backdrop-blur-md border border-zinc-200/50 flex items-center justify-center text-zinc-500 hover:text-zinc-950 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/90 shadow-sm z-20"
        aria-label="Siguiente"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
        {activeSlides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className="h-8 w-8 flex items-center justify-center focus:outline-none"
            aria-label={`Slide ${idx + 1}`}
          >
            <span 
              className={`h-1.5 rounded-full transition-colors duration-500 ${
                idx === current
                  ? "w-8 bg-zinc-950"
                  : "w-2 bg-zinc-300 group-hover:bg-zinc-400"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
