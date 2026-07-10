'use client';

import React, { useState, useEffect, useRef } from 'react';

interface InViewRenderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
}

export function InViewRender({ 
  children, 
  fallback = <div className="h-48 w-full animate-pulse bg-zinc-100 rounded-xl"></div>,
  rootMargin = '200px'
}: InViewRenderProps) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isInView) return; // Ya se cargó, no necesitamos seguir observando

    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [isInView, rootMargin]);

  if (isInView) {
    return <>{children}</>;
  }

  return <div ref={ref}>{fallback}</div>;
}
