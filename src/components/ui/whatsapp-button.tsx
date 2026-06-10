'use client';

import React from 'react';

export function WhatsAppButton() {
  const phoneNumber = '56964247084';
  const message = 'Hola, necesito ayuda con la plataforma B2B';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center h-14 w-14 bg-[#25d366] hover:bg-[#20ba5a] text-white rounded-full shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all duration-300 group border border-emerald-400/20"
      aria-label="Contactar por WhatsApp"
    >
      {/* Icono de WhatsApp SVG Oficial */}
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7 fill-current transition-transform group-hover:rotate-12 duration-300"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.855.002-2.632-1.022-5.105-2.883-6.97C16.59 1.83 14.12 1.81 11.968 1.81c-5.44 0-9.866 4.418-9.87 9.858-.002 1.802.49 3.57 1.42 5.12L2.52 21.46l5.127-1.306zM16.634 13.9c-.252-.126-1.492-.736-1.724-.82-.232-.085-.4-.127-.567.127-.168.252-.65 0-.796.82-.146.82-.41 0-.66.084-.252-.126-1.066-.393-2.03-1.253-.75-.67-1.257-1.5-1.404-1.752-.147-.252-.016-.388.11-.513.113-.112.252-.294.378-.44.126-.148.168-.253.252-.42.084-.168.042-.315-.02-.442-.064-.126-.567-1.365-.778-1.87-.205-.494-.41-.427-.568-.435-.147-.008-.316-.008-.483-.008-.168 0-.442.063-.673.315-.23.252-.882.86-.882 2.1s.9 2.436 1.026 2.6c.126.168 1.77 2.7 4.29 3.79.6.26 1.067.415 1.43.53.603.19 1.152.16 1.586.096.483-.07 1.492-.61 1.702-1.2.21-.59.21-1.094.147-1.2-.063-.105-.23-.168-.48-.294z" />
      </svg>
    </a>
  );
}
