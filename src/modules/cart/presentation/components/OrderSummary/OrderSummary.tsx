'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, CreditCard, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/auth-context';

export function OrderSummary() {
  const { items, subtotal = 0 } = useCart();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<string>('webpay');

  useEffect(() => {
    const saved = localStorage.getItem('antigravity_payment_method');
    if (saved) {
      setPaymentMethod(saved);
    } else {
      localStorage.setItem('antigravity_payment_method', 'webpay');
    }
  }, []);

  const paymentTermsDays = user?.company?.paymentTerms ?? 30;

  const creditDiscountPercent = React.useMemo(() => {
    if (paymentTermsDays === 90) return 0;
    if (paymentTermsDays === 60) return 4;
    if (paymentTermsDays === 30) return 7;
    if (paymentTermsDays === 0) return 10;
    return 0;
  }, [paymentTermsDays]);

  const activePaymentDiscountPercent = React.useMemo(() => {
    if (paymentMethod === 'credit_b2b') {
      return creditDiscountPercent;
    }
    if (paymentMethod === 'webpay' || paymentMethod === 'transfer' || paymentMethod === 'mercadopago') {
      return 10;
    }
    return 0;
  }, [paymentMethod, creditDiscountPercent]);

  // ─── Segregar ítems excluidos vs afectos a descuento corporativo ──────────
  const excludedSubtotal = items
    .filter(item => item.priceSource === 'PROMOTION' || item.priceSource === 'OUTLET')
    .reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);

  const nonExcludedSubtotal = items
    .filter(item => item.priceSource !== 'PROMOTION' && item.priceSource !== 'OUTLET')
    .reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);

  const excludedBaseNet = Math.round(excludedSubtotal);
  const nonExcludedBaseNet = Math.round(nonExcludedSubtotal);
  const totalBaseNet = excludedBaseNet + nonExcludedBaseNet;

  const companyDiscountPercent = user?.company?.defaultDiscount ? Number(user.company.defaultDiscount) : 0;
  const companyDiscountAmount = Math.round(nonExcludedBaseNet * (companyDiscountPercent / 100));
  const netAfterCompanyDiscount = nonExcludedBaseNet - companyDiscountAmount;
  const finalNet = excludedBaseNet + netAfterCompanyDiscount;

  const paymentDiscountAmount = Math.round(finalNet * (activePaymentDiscountPercent / 100));
  const netAfterPayment = finalNet - paymentDiscountAmount;
  const finalIva = Math.round(netAfterPayment * 0.19);

  const isEmpty = items.length === 0;
  const grandTotal = netAfterPayment + finalIva;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-[24px] sm:rounded-[40px] border-2 border-zinc-100 shadow-xl space-y-8 sticky top-28">
      <h2 className="text-lg font-black text-zinc-900 uppercase tracking-widest">Resumen de Orden</h2>
      
      <div className="space-y-4 text-sm">
        {/* Selector de Medio de Pago */}
        <div className="space-y-2 pb-4 border-b border-zinc-100 flex flex-col">
           <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Medio de Pago (Simulador)</label>
           <div className="relative mt-1">
              <select 
                value={paymentMethod}
                onChange={(e) => {
                  const val = e.target.value;
                  setPaymentMethod(val);
                  localStorage.setItem('antigravity_payment_method', val);
                }}
                className="w-full h-11 rounded-xl border-2 border-zinc-200 px-3 pr-8 text-xs font-bold text-zinc-900 outline-none focus:border-zinc-900 transition-all bg-zinc-50 cursor-pointer appearance-none"
              >
                <option value="transfer">Transferencia Bancaria Directa (10% OFF)</option>
                <option value="webpay">Mercado Pago (10% OFF)</option>
                <option value="credit_b2b">Crédito Directo B2B ({creditDiscountPercent}% OFF)</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 font-bold text-[10px]">▼</div>
           </div>
        </div>

        <div className="flex justify-between font-bold text-zinc-500 uppercase tracking-tighter">
          <span>Subtotal Neto</span>
          <span className="text-zinc-900">$ {finalNet.toLocaleString('es-CL')}</span>
        </div>

        {paymentDiscountAmount > 0 && (
          <div className="flex justify-between font-bold text-emerald-600 uppercase tracking-tighter">
            <span>Dcto. Pago ({activePaymentDiscountPercent}%)</span>
            <span>- $ {paymentDiscountAmount.toLocaleString('es-CL')}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-zinc-500 uppercase tracking-tighter">
          <span>IVA (19%)</span>
          <span className="text-zinc-900">$ {finalIva.toLocaleString('es-CL')}</span>
        </div>
        
        <div className="flex justify-between font-bold text-zinc-500 uppercase tracking-tighter">
          <span>Envío estimado</span>
          <span className="text-zinc-500 font-black tracking-widest">---</span>
        </div>
        
        <div className="pt-4 border-t border-zinc-100 flex justify-between">
          <span className="text-lg font-black text-zinc-900 uppercase">Total Final</span>
          <span className="text-2xl font-black text-primary">$ {grandTotal.toLocaleString('es-CL')}</span>
        </div>
      </div>

      <div className="space-y-4">
        {!isEmpty && totalBaseNet < 100000 && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-[11px] font-bold uppercase tracking-wider space-y-1.5 animate-in fade-in zoom-in">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚠️</span> Mínimo de compra no alcanzado
            </div>
            <p className="font-semibold text-rose-700 tracking-normal leading-relaxed normal-case">
              Tu subtotal neto actual es de <strong>${totalBaseNet.toLocaleString('es-CL')}</strong>. Se requiere un mínimo de <strong>$100.000</strong> netos para proceder al checkout. Te faltan <strong>${(100000 - totalBaseNet).toLocaleString('es-CL')}</strong> netos.
            </p>
          </div>
        )}

        {isEmpty || totalBaseNet < 100000 ? (
          <Button disabled className="w-full h-14 bg-zinc-950 text-white font-black uppercase text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 opacity-50 cursor-not-allowed">
            Proceder al Checkout <ChevronRight className="h-4 w-4 text-zinc-500" />
          </Button>
        ) : (
          <Link href="/checkout">
            <Button className="w-full h-14 bg-zinc-950 text-white font-black uppercase text-xs rounded-2xl shadow-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-3">
              Proceder al Checkout <ChevronRight className="h-4 w-4 text-primary" />
            </Button>
          </Link>
        )}
        <div className="flex items-center justify-center gap-4 pt-4 grayscale opacity-40">
          <CreditCard className="h-6 w-6" />
          <ShieldCheck className="h-6 w-6" />
          <Truck className="h-6 w-6" />
        </div>
      </div>

      <div className="pt-6 text-center">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
          * Los descuentos corporativos se aplican solo sobre productos sin promoción activa.
        </p>
      </div>
    </div>
  );
}
