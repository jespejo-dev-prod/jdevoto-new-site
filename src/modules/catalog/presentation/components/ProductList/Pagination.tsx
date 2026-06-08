'use client';

/**
 * src/modules/catalog/presentation/components/ProductList/Pagination.tsx
 *
 * Paginación con ventana deslizante de 10 páginas.
 * Muestra: Anterior | 1 | … | [bloque de 10] | … | última | Siguiente
 */

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  /** Número de páginas visibles en la ventana (default: 10) */
  windowSize?: number;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  windowSize = 10,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // ── Calcular el bloque actual ──────────────────────────────────────────────
  // El bloque empieza en el múltiplo de windowSize anterior a la página actual
  // Ejemplo: página 23 con window=10 → bloque [21..30]
  const blockIndex = Math.floor((page - 1) / windowSize);
  const blockStart = blockIndex * windowSize + 1;
  const blockEnd = Math.min(blockStart + windowSize - 1, totalPages);

  const pagesInWindow: number[] = [];
  for (let p = blockStart; p <= blockEnd; p++) {
    pagesInWindow.push(p);
  }

  const showLeadingEllipsis = blockStart > 1;
  const showTrailingEllipsis = blockEnd < totalPages;

  // ── Clases base ───────────────────────────────────────────────────────────
  const btnBase =
    'h-8 min-w-[2rem] px-2 rounded-lg flex items-center justify-center text-xs font-bold transition-all select-none';
  const btnIdle = 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600';
  const btnActive = 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 border border-transparent';
  const btnNav =
    'h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div className="flex items-center justify-center gap-1.5 pt-4 flex-wrap">

      {/* ← Anterior */}
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1 || disabled}
        className={btnNav}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Anterior
      </button>

      {/* Primera página si no está en el bloque */}
      {showLeadingEllipsis && (
        <>
          <button
            onClick={() => onPageChange(1)}
            disabled={disabled}
            className={cn(btnBase, page === 1 ? btnActive : btnIdle)}
          >
            1
          </button>
          <span className="flex items-center px-1 text-zinc-600">
            <MoreHorizontal className="h-4 w-4" />
          </span>
        </>
      )}

      {/* Ventana de 10 páginas */}
      {pagesInWindow.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          disabled={disabled}
          className={cn(btnBase, p === page ? btnActive : btnIdle)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      {/* Última página si no está en el bloque */}
      {showTrailingEllipsis && (
        <>
          <span className="flex items-center px-1 text-zinc-600">
            <MoreHorizontal className="h-4 w-4" />
          </span>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={disabled}
            className={cn(btnBase, page === totalPages ? btnActive : btnIdle)}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Siguiente → */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages || disabled}
        className={btnNav}
        aria-label="Página siguiente"
      >
        Siguiente
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
