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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20">
        <AlertCircle className="h-3 w-3" />
        {showLabel && 'Sin Stock'}
      </span>
    );
  }

  if (stock <= stockAlert) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
        {stock} {stock === 1 ? 'unidad' : 'unidades'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500">
      {stock} {stock === 1 ? 'unidad' : 'unidades'}
    </span>
  );
}
