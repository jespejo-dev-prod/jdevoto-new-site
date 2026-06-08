'use client';

import { useState, useEffect } from 'react';
import { Minus, Plus, Truck, ShieldCheck, CheckCircle2, RotateCcw, Lock, ShoppingCart as ShoppingCartIcon, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddToCartAction } from '../AddToCartAction/AddToCartAction';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { toast } from 'sonner';
import { TAX_RATE } from '@/types/domain';

interface BuyBoxProps {
  product: any;
  /** Slug del producto para el fetch de precio B2B */
  slug: string;
}

/**
 * BuyBox — Patrón "Opción A" (Instant UI + Deferred B2B Price)
 *
 * 1. Al montar, muestra el precio base (basePrice + IVA 19%) INMEDIATAMENTE.
 *    El usuario ve un precio real válido sin esperar nada.
 *
 * 2. En background, llama a /api/products/[slug]/price para obtener el
 *    precio B2B personalizado de la empresa del usuario.
 *
 * 3. Cuando la respuesta llega (~100-200ms), actualiza el precio sin recargar
 *    la página ni mostrar ningún loading al usuario.
 *
 * Esto es el mismo patrón que usa Amazon y MercadoLibre.
 */
export function BuyBox({ product, slug }: BuyBoxProps) {
  const { accessToken, user } = useAuth();
  const isAuthenticated = !!accessToken;
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'SALES_REP';
  const { addItem } = useCart();
  const minQty = product.inner || 1;
  const [quantity, setQuantity] = useState(minQty);

  // Precio neto base como valor inicial instantáneo (sin IVA)
  const baseNetPrice = Math.round(Number(product.basePrice));

  const [displayNetPrice, setDisplayNetPrice] = useState(baseNetPrice);
  const [displayGrossPrice, setDisplayGrossPrice] = useState(Math.round(baseNetPrice * (1 + TAX_RATE)));
  const [discountPercent, setDiscountPercent] = useState(0);
  const [priceSource, setPriceSource] = useState<string>('BASE_PRICE');
  const [priceReady, setPriceReady] = useState(false);
  const [b2bPrice, setB2bPrice] = useState<any>(null);

  // Fetch silencioso del precio B2B en background
  useEffect(() => {
    let cancelled = false;

    async function fetchB2BPrice() {
      try {
        const res = await fetch(`/api/catalog/price/${slug}`);
        if (!res.ok || cancelled) return;

        const json = await res.json();
        if (!json.success || cancelled) return;

         const { price } = json.data;
        setB2bPrice(price);
        setDisplayNetPrice(Math.round(price.discountedNetPrice));
        setDisplayGrossPrice(Math.round(price.unitGrossPrice));
        setDiscountPercent(Math.round(price.discountPercent || 0));
        setPriceSource(price.priceSource || 'BASE_PRICE');
      } catch {
        // Si falla el fetch, el precio base sigue visible — no hay error visible
      } finally {
        if (!cancelled) setPriceReady(true);
      }
    }

    if (isAuthenticated) {
      fetchB2BPrice();
    }
    return () => { cancelled = true; };
  }, [slug, isAuthenticated]);

  const handleAddToCart = () => {
    const priceObj = b2bPrice || {
      discountedNetPrice: baseNetPrice,
      unitNetPrice: baseNetPrice,
      discountPercent: 0,
      priceSource: 'BASE_PRICE'
    };
    addItem({ ...product, price: priceObj }, quantity);
    toast.success(`${quantity} unidades añadidas al carrito`, {
      description: product.name,
      icon: <ShoppingCartIcon className="h-4 w-4" />,
      duration: 1000,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8 rounded-[48px] border border-zinc-100 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] space-y-6 text-center">
        <div className="h-16 w-16 rounded-full bg-blue-50/80 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 shadow-inner">
          <Lock className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-zinc-950 tracking-tight">Precios y stock corporativo</h3>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto">
            Inicia sesión o solicita tu cuenta corporativa para acceder a nuestro catálogo de precios mayoristas, consultar stock disponible y realizar pedidos.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/login" className="block">
            <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-600/20">
              Iniciar sesión B2B
            </Button>
          </Link>
        </div>
        <div className="pt-4 border-t border-zinc-100 flex items-center justify-center gap-2 text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4 text-blue-500" />
          <span>Acceso verificado para empresas</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-[48px] border border-zinc-100 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] space-y-8">
      <div className="space-y-2">
        {/* Precio Neto — visible INMEDIATAMENTE, se actualiza silenciosamente */}
        <div className="text-[32px] font-black text-zinc-950 transition-all duration-300">
          $ {displayNetPrice.toLocaleString('es-CL')}
        </div>
        <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Precio Neto (sin IVA)</span>

        {/* Descuento — aparece solo si hay precio B2B con descuento */}
        {priceReady && discountPercent > 0 && (
          <div className="text-sm font-bold text-green-600 animate-fade-in">
            {priceSource === 'PROMOTION' ? `${discountPercent}% Promoción aplicada` : `${discountPercent}% descuento B2B aplicado`}
          </div>
        )}

        <div className="flex items-center gap-2 text-[#00a650] text-[11px] font-black uppercase tracking-widest">
          <div className="h-2 w-2 rounded-full bg-[#00a650] animate-pulse" /> Listos para despacho
        </div>
      </div>



      <div className="space-y-4 pt-4 border-t border-zinc-100">
        <div className="flex gap-4 text-[11px] font-bold uppercase tracking-tight text-zinc-400">
          <Truck className="h-4 w-4 text-[#3483fa]" />
          <span>Entrega este <span className="text-zinc-950">VIERNES</span></span>
        </div>
        <div className="flex gap-4 text-[11px] font-bold uppercase tracking-tight text-zinc-400">
          <ShieldCheck className="h-4 w-4 text-zinc-400" />
          <span>Garantía <span className="text-zinc-950">3 Años</span></span>
        </div>
      </div>

      <div className="space-y-4">
        {product.stockQuantity > 0 ? (
          <div className="flex items-center gap-2 px-4 py-3 bg-[#f3f9f2] rounded-xl w-full border border-[#e3f0e0]">
            <CheckCircle2 className="h-5 w-5 text-[#70b363]" />
            <span className="text-[#70b363] font-black text-[14px]">
              {product.stockQuantity} disponibles
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 rounded-xl w-full border border-red-100">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-red-600 font-black text-[14px]">Agotado</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <AddToCartAction
            product={{ 
              ...product, 
              price: b2bPrice || {
                discountedNetPrice: baseNetPrice,
                unitNetPrice: baseNetPrice,
                discountPercent: 0,
                priceSource: 'BASE_PRICE'
              } 
            }}
            quantity={quantity}
            onQuantityChange={setQuantity}
          />

          <div className="space-y-4 pt-2">
            <div className="flex gap-3">
              <div className="shrink-0 pt-0.5">
                <RotateCcw className="h-4 w-4 text-zinc-400" />
              </div>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                <span className="text-[#3483fa] cursor-pointer hover:underline">Devolución gratis.</span> Tienes 30 días desde que lo recibes.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="shrink-0 pt-0.5">
                <ShieldCheck className="h-4 w-4 text-zinc-400" />
              </div>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                <span className="text-[#3483fa] cursor-pointer hover:underline">Compra Protegida:</span> Recibe el producto que esperabas o te devolvemos tu dinero.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
