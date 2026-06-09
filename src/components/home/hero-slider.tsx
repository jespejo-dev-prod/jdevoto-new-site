'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShieldCheck, Zap, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const slides = [
  {
    id: 1,
    image: '/home/outlet.jpg',
    badge: '⚡ Precios Especiales B2B',
    badgeIcon: Zap,
    badgeColor: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    title: 'Productos en Outlet',
    description: 'Aprovecha precios rebajados en una gran variedad de productos destacados.',
    cta: 'Ver Ofertas',
    href: '/products?category=outlet',
    gradient: 'from-sky-500/10 via-zinc-950 to-zinc-950',
    imageClass: 'object-center scale-110 md:scale-120 translate-x-[3%] md:translate-x-[8%] origin-center',
  },
  {
    id: 2,
    image: '/home/despacho-gratis.png',
    badge: '🚚 Logística a costo cero',
    badgeIcon: Truck,
    badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    title: 'Despacho Gratis',
    description: 'Recibe tu compra sin costo en zonas seleccionadas según monto mínimo de compra.',
    cta: 'Ver Cobertura',
    href: '/support',
    gradient: 'from-amber-500/10 via-zinc-950 to-zinc-950',
    imageClass: 'object-right scale-105 md:scale-115 origin-right',
  },
  {
    id: 3,
    image: '/home/linea-credito.jpg',
    badge: '💼 Pago diferido a 30 días',
    badgeIcon: ShieldCheck,
    badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    title: 'Línea de Crédito para Empresas',
    description: 'Contáctanos para evaluar tu crédito y acceder a compras con pago diferido.',
    cta: 'Evaluar Crédito',
    href: '/support',
    gradient: 'from-emerald-500/10 via-zinc-950 to-zinc-950',
    imageClass: 'object-left scale-120 md:scale-[1.45] translate-x-[8%] md:translate-x-[22%] origin-left',
  },
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  const activeSlide = slides[current];

  return (
    <div className="relative h-[420px] md:h-[500px] lg:h-[580px] w-full overflow-hidden rounded-[36px] md:rounded-[40px] bg-zinc-950 border border-zinc-800/80 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7)] group">
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-10" />
      
      {/* Light glow effects */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="absolute inset-0 flex flex-col md:flex-row items-center justify-between"
        >
          {/* Background image & gradient overlay (Spans full width) */}
          <div className="absolute inset-0 z-0">
            <Image
              src={activeSlide.image}
              alt={activeSlide.title}
              fill
              className={`object-cover opacity-35 md:opacity-45 filter grayscale contrast-125 transition-all duration-700 ${activeSlide.imageClass}`}
              priority
            />
            {/* Dark gradient fade for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent hidden md:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/35 to-transparent md:hidden" />
            
            {/* Subtle color highlight gradient glow */}
            <div className={`absolute inset-0 bg-gradient-to-r ${activeSlide.gradient} opacity-40 pointer-events-none`} />
          </div>

          {/* Slide Text Content (Left / Top) */}
          <motion.div 
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
            }}
            className="relative z-10 flex flex-col justify-center px-8 md:px-16 lg:px-24 h-full md:w-[50%] lg:w-[45%] text-left pt-12 md:pt-0"
          >
            {/* Badge */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: -10 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="mb-4"
            >
              <span className={`inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${activeSlide.badgeColor}`}>
                <activeSlide.badgeIcon className="h-3.5 w-3.5" />
                {activeSlide.badge}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
                visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white max-w-xl leading-[1.1] tracking-tight uppercase"
            >
              {activeSlide.title}
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="text-sm md:text-base lg:text-lg text-zinc-400 mt-4 max-w-md font-medium leading-relaxed"
            >
              {activeSlide.description}
            </motion.p>

            {/* CTA Button */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="mt-8"
            >
              <Link
                href={activeSlide.href}
                className="inline-flex items-center justify-center px-8 py-3.5 bg-primary text-zinc-950 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white transition-all shadow-xl shadow-primary/10 hover:scale-[1.03] active:scale-95 duration-300"
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
        className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-zinc-900/40 backdrop-blur-md border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-zinc-800/80 z-20"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-zinc-900/40 backdrop-blur-md border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-zinc-800/80 z-20"
        aria-label="Siguiente"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              idx === current ? 'w-8 bg-primary' : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
