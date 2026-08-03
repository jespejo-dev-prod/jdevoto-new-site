'use client';

import React from 'react';
import { Trash2, CheckCircle2 } from 'lucide-react';
import { QuantitySelector } from '@/components/ui/quantity-selector';
import { CartItem as CartItemType, useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem, selectedClientForOrder } = useCart();
  const { user } = useAuth();

  const effectiveCompany = user?.role === 'SALES_REP' ? selectedClientForOrder : user?.company;
  const companyDiscountPercent = effectiveCompany?.defaultDiscount ? Number(effectiveCompany.defaultDiscount) : 0;
  const isExcluded = item.priceSource === 'PROMOTION' || item.priceSource === 'OUTLET';
  const companyDiscount = isExcluded ? 0 : companyDiscountPercent;

  const discountedPrice = item.price * (1 - companyDiscount / 100);
  const lineTotal = Math.round(discountedPrice * item.quantity);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-zinc-200 shadow-sm hover:shadow-md transition-shadow flex gap-4 sm:gap-6 items-start sm:items-center">
      <Link 
        href={`/products/${item.slug}`}
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-zinc-50 p-2 sm:p-4 border border-zinc-100 flex items-center justify-center shrink-0 hover:border-primary transition-colors group"
      >
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300" 
        />
      </Link>
      
      <div className="flex-grow space-y-2 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1 min-w-0">
            <Link href={`/products/${item.slug}`} className="hover:text-primary transition-colors block">
              <h3 className="text-sm sm:text-base font-black text-zinc-950 leading-tight uppercase truncate sm:whitespace-normal max-w-xs sm:max-w-md">
                {item.name}
              </h3>
            </Link>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="text-xs sm:text-[13px] text-indigo-600 font-bold tracking-wider uppercase font-mono">
                SKU: {item.sku || '-'}
              </span>
              {item.brandName && (
                <>
                  <span className="text-zinc-300 text-xs font-normal">•</span>
                  <span className="text-xs sm:text-[13px] text-zinc-500 font-bold tracking-wider uppercase">
                    {item.brandName}
                  </span>
                </>
              )}
            </div>
            {item.discountPercent > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-tight">
                {item.discountPercent}% OFF • {item.priceSource.replace('_', ' ')}
              </div>
            )}
          </div>
          <button 
            onClick={() => removeItem(item.id)} 
            className="text-zinc-400 hover:text-red-500 transition-colors p-1"
          >
            <Trash2 className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
        
        {item.stockQuantity > 0 ? (
          <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-green-600 uppercase tracking-widest">
            <CheckCircle2 className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0" /> {item.stockQuantity} en stock
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-red-600 uppercase tracking-widest">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" /> Agotado
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 sm:gap-4 pt-2">
          <QuantitySelector 
            value={item.quantity}
            min={item.inner || 1}
            max={item.stockQuantity}
            step={item.inner || 1}
            onChange={(val) => updateQuantity(item.id, val)}
            className="h-9 sm:h-10 w-fit"
          />
          
          <div className="text-left sm:text-right">
            <div className="text-lg sm:text-xl font-black text-zinc-950">
              $ {lineTotal.toLocaleString('es-CL')}{' '}
              <span className="text-xs sm:text-sm font-bold text-zinc-400 uppercase">Neto</span>
            </div>
            <div className="flex flex-col items-start sm:items-end">
              {item.discountPercent > 0 && (
                <span className="text-xs sm:text-[13px] font-bold text-zinc-400 line-through uppercase tracking-wide">
                  $ {Math.round(item.originalPrice).toLocaleString('es-CL')}
                </span>
              )}
              {companyDiscount > 0 ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-tight mt-1">
                  $ {Math.round(item.price).toLocaleString('es-CL')} c/u Neto (-{companyDiscount}% Dcto. Empresa)
                </span>
              ) : (
                <span className="text-xs sm:text-[13px] font-bold text-zinc-400 uppercase tracking-wide">
                  $ {Math.round(item.price).toLocaleString('es-CL')} c/u Neto
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
