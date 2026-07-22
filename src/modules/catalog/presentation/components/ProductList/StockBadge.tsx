/**
 * src/modules/catalog/presentation/components/ProductList/StockBadge.tsx
 *
 * Componente atómico reutilizable para mostrar el estado del stock.
 */

import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface StockBadgeProps {
  stock: number;
  stockAlert?: number;
  showLabel?: boolean;
}

export function StockBadge({ stock, stockAlert = 5, showLabel = true }: StockBadgeProps) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-red-500/15 text-red-400 border border-red-500/20">
        <AlertCircle className="h-3.5 w-3.5" />
        {showLabel && 'Sin Stock'}
      </span>
    );
  }

  if (stock <= stockAlert) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-orange-500/10 text-orange-400">
        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
        {stock} {stock === 1 ? 'unidad' : 'unidades'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-green-500/10 text-green-500">
      {stock} {stock === 1 ? 'unidad' : 'unidades'}
    </span>
  );
}
