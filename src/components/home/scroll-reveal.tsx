'use client';

import React from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
}

export function ScrollReveal({ children }: ScrollRevealProps) {
  // Deshabilitado por impacto negativo en Speed Index de Lighthouse
  return <div className="will-change-transform">{children}</div>;
}
