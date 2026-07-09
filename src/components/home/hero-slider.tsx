"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    href: "/products?category=outlet",
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

export function HeroSlider() {
  const [activeSlides, setActiveSlides] = useState<SlideItem[]>(DEFAULT_SLIDES);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // Cargar sliders dinámicos desde API pública de configuraciones
    fetch("/api/settings?key=home_slides")
      .then(res => res.json())
      .then(data => {
        if (data && data.value && Array.isArray(data.value) && data.value.length > 0) {
          const mapped = data.value.map((s: any) => {
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
          setActiveSlides(mapped);
        } else {
          setActiveSlides(DEFAULT_SLIDES);
        }
      })
      .catch((err) => {
        console.error("Error loading dynamic slides:", err);
        setActiveSlides(DEFAULT_SLIDES);
      });
  }, []);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % activeSlides.length);
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, [activeSlides]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % activeSlides.length);
  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      nextSlide();
    } else if (info.offset.x > threshold) {
      prevSlide();
    }
  };

  const activeSlide = activeSlides[current] || DEFAULT_SLIDES[0];

  return (
    <div className="relative h-[420px] md:h-[500px] lg:h-[580px] w-full overflow-hidden rounded-[36px] md:rounded-[40px] bg-zinc-100 border border-zinc-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06),0_-10px_40px_rgba(0,0,0,0.04)] group">
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000004_1px,transparent_1px),linear-gradient(to_bottom,#00000004_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-10" />

      {/* Light glow effects */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial="hidden"
          animate="visible"
          exit="hidden"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 flex flex-col md:flex-row items-center justify-between cursor-grab active:cursor-grabbing select-none"
        >
          {/* Background image & gradient overlay (Spans full width) */}
          <div className="absolute inset-0 z-0">
            {/* When using inline style transforms, strip any conflicting Tailwind scale/translate classes */}
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
                    className={`object-cover opacity-85 md:opacity-95 transition-all duration-700 ${safeImageClass}`}
                    priority
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

          {/* Slide Text Content (Left / Top) */}
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
            }}
            className="relative z-10 flex flex-col justify-center px-8 md:px-16 lg:px-24 h-full md:w-[50%] lg:w-[45%] text-left pt-12 md:pt-0"
          >
            {/* Badge */}
            {activeSlide.badge && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: -10 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
                className="mb-4"
              >
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${activeSlide.badgeColor || ""}`}
                >
                  {activeSlide.badgeIcon && (
                    <activeSlide.badgeIcon className="h-3.5 w-3.5" />
                  )}
                  {activeSlide.badge}
                </span>
              </motion.div>
            )}

            {/* Title */}
            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-950 max-w-xl leading-[1.1] tracking-tight uppercase"
            >
              {activeSlide.title}
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              className="text-sm md:text-base lg:text-lg text-zinc-600 mt-4 max-w-md font-semibold leading-relaxed"
            >
              {activeSlide.description}
            </motion.p>

            {/* CTA Button */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              className="mt-8"
            >
              <Link
                href={activeSlide.href}
                className="inline-flex items-center justify-center px-8 py-3.5 bg-zinc-950 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 hover:scale-[1.03] active:scale-95 duration-300"
              >
                {activeSlide.cta}
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons (Sleek Circle Controls) */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/60 backdrop-blur-md border border-zinc-200/50 flex items-center justify-center text-zinc-500 hover:text-zinc-950 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/90 shadow-sm z-20"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/60 backdrop-blur-md border border-zinc-200/50 flex items-center justify-center text-zinc-500 hover:text-zinc-950 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/90 shadow-sm z-20"
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
              className={`h-1.5 rounded-full transition-all duration-500 ${
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
