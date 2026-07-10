'use client';

import React from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
}

export function ScrollReveal({ children }: ScrollRevealProps) {
  // Deshabilitado por impacto negativo en Speed Index de Lighthouse
  // Eliminamos will-change-transform para evitar forzar capas de composición innecesarias
  return <div className="">{children}</div>;
}
