'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { TAX_RATE } from '@/types/domain';

interface BundleActionProps {
  currentProduct: any;
  suggestedProduct: any;
}

export function BundleAction({ currentProduct, suggestedProduct }: BundleActionProps) {
  const { addItem } = useCart();
  
  // Precios B2B locales para mostrar total neto exacto e informar al cart
  const [priceA, setPriceA] = useState(Math.round(currentProduct.basePrice));
  const [priceB, setPriceB] = useState(Math.round(suggestedProduct.price?.discountedNetPrice || suggestedProduct.price?.unitNetPrice || suggestedProduct.basePrice));
  const [readyA, setReadyA] = useState(false);
  const [readyB, setReadyB] = useState(false);
  const [b2bPriceA, setB2bPriceA] = useState<any>(null);
  const [b2bPriceB, setB2bPriceB] = useState<any>(null);

  // Fetch B2B Price para el producto actual
  useEffect(() => {
    let cancelled = false;
    async function fetchPrice() {
      try {
        const res = await fetch(`/api/catalog/price/${currentProduct.slug}`);
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (json.success && !cancelled) {
          const p = json.data.price;
          setB2bPriceA(p);
          setPriceA(Math.round(p.discountedNetPrice || p.unitNetPrice));
          setReadyA(true);
        }
      } catch (err) {}
    }
    fetchPrice();
    return () => { cancelled = true; };
  }, [currentProduct.slug]);

  // Fetch B2B Price para el producto sugerido
  useEffect(() => {
    let cancelled = false;
    async function fetchPrice() {
      try {
        const res = await fetch(`/api/catalog/price/${suggestedProduct.slug}`);
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (json.success && !cancelled) {
          const p = json.data.price;
          setB2bPriceB(p);
          setPriceB(Math.round(p.discountedNetPrice || p.unitNetPrice));
          setReadyB(true);
        }
      } catch (err) {}
    }
    fetchPrice();
    return () => { cancelled = true; };
  }, [suggestedProduct.slug]);

  const handleBundleAddToCart = () => {
    const qtyA = Number(currentProduct.inner || currentProduct.minOrderQty || 1);
    const qtyB = Number(suggestedProduct.inner || suggestedProduct.minOrderQty || 1);

    // Aseguramos que ambos productos lleven su precio neto correcto para el Cart
    const productAWithPrice = {
      ...currentProduct,
      price: b2bPriceA || { 
        discountedNetPrice: priceA, 
        unitNetPrice: priceA, 
        discountPercent: 0,
        priceSource: readyA ? 'B2B' : 'BASE_PRICE' 
      }
    };
    
    const productBWithPrice = {
      ...suggestedProduct,
      price: b2bPriceB || { 
        discountedNetPrice: priceB, 
        unitNetPrice: priceB, 
        discountPercent: 0,
        priceSource: readyB ? 'B2B' : 'BASE_PRICE' 
      }
    };

    // Add both items (separate calls to context)
    addItem(productAWithPrice, qtyA);
    addItem(productBWithPrice, qtyB);

    toast.success('Sugerencia añadida al carrito', {
      description: `Se agregaron ${qtyA} un. de ${currentProduct.name} y ${qtyB} un. de ${suggestedProduct.name}.`,
      icon: <ShoppingCart className="h-4 w-4" />,
    });
  };

  const totalMOQ = (priceA * (currentProduct.inner || currentProduct.minOrderQty || 1)) + (priceB * (suggestedProduct.inner || suggestedProduct.minOrderQty || 1));

  return (
    <div className="flex flex-col gap-6 md:min-w-[350px] border-l border-zinc-100 pl-0 lg:pl-12 text-center lg:text-left">
      <div className="space-y-1">
        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Inversión Total (Inner Pack)</div>
        <div className="text-4xl font-black text-zinc-950 tracking-tighter">
          $ {Math.round(totalMOQ).toLocaleString('es-CL')}{' '}
          <span className="text-sm font-bold text-zinc-400 uppercase">Neto</span>
        </div>
        <div className="text-[10px] text-zinc-400 font-bold uppercase">
          Incluye {currentProduct.inner || currentProduct.minOrderQty || 1} un. + {suggestedProduct.inner || suggestedProduct.minOrderQty || 1} un.
        </div>
      </div>
      
      <Button 
        onClick={handleBundleAddToCart}
        className="bg-zinc-950 text-white h-12 px-10 text-[11px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-zinc-900/20 hover:bg-zinc-800 transition-all hover:translate-y-[-2px] flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" />
        comprar juntos
      </Button>
    </div>
  );
}
