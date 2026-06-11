'use client';

import { useState } from 'react';
import { ShoppingCart as ShoppingCartIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuantitySelector } from '@/components/ui/quantity-selector';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AddToCartActionProps {
  product: any;
  variant?: 'compact' | 'full';
  className?: string;
  quantity?: number;
  onQuantityChange?: (val: number) => void;
}

export function AddToCartAction({ 
  product, 
  variant = 'full', 
  className,
  quantity: externalQuantity,
  onQuantityChange
}: AddToCartActionProps) {
  const { addItem } = useCart();
  const minQty = product.inner || 1;
  const [internalQuantity, setInternalQuantity] = useState(minQty);

  const quantity = externalQuantity ?? internalQuantity;
  const setQuantity = onQuantityChange ?? setInternalQuantity;

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    addItem(product, quantity);
    toast.success(`${quantity} unidades añadidas al carrito`, {
      description: product.name,
      icon: <ShoppingCartIcon className="h-4 w-4" />,
      duration: 1000,
    });
  };

  const isCompact = variant === 'compact';

  return (
    <div 
      className={cn("flex items-center gap-2 w-full", className)}
      onClick={(e) => e.stopPropagation()} // Evitar navegar al producto al interactuar
    >
      <QuantitySelector 
        value={quantity}
        min={minQty}
        max={product.stockQuantity}
        step={minQty}
        onChange={setQuantity}
        size={isCompact ? 'sm' : 'default'}
        className={cn(isCompact ? "text-xs" : "")}
      />
      
      <Button 
        onClick={handleAddToCart}
        className={cn(
          "flex-1 font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2",
          isCompact ? "h-9 text-[11px] rounded-full border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-white" : "h-11 text-sm bg-primary text-zinc-950 hover:bg-primary/90"
        )}
      >
        <Plus className={cn(isCompact ? "h-3 w-3" : "h-4 w-4")} />
        <span className="hidden sm:inline truncate">{isCompact ? "Añadir" : "Agregar"}</span>
      </Button>
    </div>
  );
}
