'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user already consented
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Delay slightly for a smoother entry feel
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handlePreferences = () => {
    // Simular o abrir manejo de preferencias
    localStorage.setItem('cookie-consent', 'preferences');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-zinc-200 z-[9999] shadow-[0_-12px_40px_rgba(0,0,0,0.06)] py-4 px-6 md:py-3.5"
        >
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
            
            {/* Left Column: Text */}
            <div className="flex flex-col gap-0.5 max-w-4xl text-left">
              <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-wider">
                J. Devoto y las Cookies
              </h4>
              <p className="text-[10px] md:text-[11px] text-zinc-500 leading-relaxed font-semibold">
                Nuestra web usa cookies, incluidas las cookies opcionales para ofrecerle la mejor experiencia en nuestro sitio y para mostrarle anuncios relevantes según su uso de nuestro sitio web. Usted puede manejar sus preferencias o aceptar todas las cookies. Para obtener más información, consulte nuestra{' '}
                <a href="#" className="underline text-zinc-650 hover:text-zinc-950 font-bold transition-colors">
                  Política de privacidad
                </a>{' '}
                y{' '}
                <a href="#" className="underline text-zinc-650 hover:text-zinc-950 font-bold transition-colors">
                  Política de cookies
                </a>.
              </p>
            </div>

            {/* Right Column: Actions */}
            <div className="flex items-center gap-6 shrink-0 mt-2 md:mt-0">
              <button
                onClick={handlePreferences}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 hover:underline transition-colors cursor-pointer"
              >
                Quiero Manejar
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-2 md:py-2.5 rounded-full bg-[#1428a0] hover:bg-[#0f1d70] text-white text-[10px] font-black uppercase tracking-wider shadow-sm transition-all hover:scale-[1.03] active:scale-95 duration-200 cursor-pointer"
              >
                Ok, Vamos!
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
