'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop',
    title: 'Equipamiento Profesional',
    description: 'Encuentra las mejores herramientas para tus proyectos industriales.',
    cta: 'Ver Ofertas',
    href: '/products?category=herramientas',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070&auto=format&fit=crop',
    title: 'Materiales de Construcción',
    description: 'Calidad garantizada para compras mayoristas B2B.',
    cta: 'Explorar Catálogo',
    href: '/products?category=materiales',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?q=80&w=2000&auto=format&fit=crop',
    title: 'Seguridad Industrial',
    description: 'Protege a tu equipo con nuestra nueva línea de EPP.',
    cta: 'Comprar Ahora',
    href: '/products?category=seguridad',
  },
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full overflow-hidden rounded-3xl group">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <Image
            src={slides[current].image}
            alt={slides[current].title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-7xl font-black text-white max-w-2xl leading-tight"
            >
              {slides[current].title}
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-zinc-300 mt-4 max-w-xl font-medium"
            >
              {slides[current].description}
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <Link 
                href={slides[current].href}
                className="inline-flex items-center justify-center px-8 py-4 bg-primary text-zinc-950 font-black uppercase tracking-widest text-sm rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
              >
                {slides[current].cta}
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === current ? 'w-8 bg-primary' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
