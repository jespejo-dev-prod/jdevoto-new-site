'use client';

import { useState, useEffect } from 'react';
import { Minus, Plus, Truck, ShieldCheck, CheckCircle2, RotateCcw, Lock, ShoppingCart as ShoppingCartIcon, Pencil, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddToCartAction } from '../AddToCartAction/AddToCartAction';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { toast } from 'sonner';
import { TAX_RATE } from '@/types/domain';
import { cn } from '@/lib/utils';

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
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isAuthenticated = !!accessToken;
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'SALES_REP';
  const { addItem } = useCart();
  const isSaved = isInWishlist(product.id);
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
        <div className="pt-4 border-t border-zinc-100 flex items-center justify-center gap-2 text-zinc-500 text-[11px] font-bold uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4 text-blue-500" />
          <span>Acceso verificado para empresas</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-[48px] border border-zinc-100 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] space-y-8">
      <div className="space-y-2.5">
        {discountPercent > 0 ? (
          <>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-[36px] font-black text-zinc-950 transition-all duration-300 leading-none whitespace-nowrap">
                $ {displayNetPrice.toLocaleString('es-CL')}
              </span>
              <span className="text-base font-black text-blue-600 whitespace-nowrap bg-blue-50 px-2 py-0.5 rounded-md">
                Ahorra $ {(Math.round(b2bPrice?.unitNetPrice || baseNetPrice) - displayNetPrice).toLocaleString('es-CL')}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 text-[17px] text-zinc-400 uppercase tracking-tight">
              <span className="line-through whitespace-nowrap">
                $ {Math.round(b2bPrice?.unitNetPrice || baseNetPrice).toLocaleString('es-CL')}
              </span>
              <span>•</span>
              <span>Neto</span>
              {priceReady && (
                <>
                  <span>•</span>
                  <span className="text-green-600 font-semibold lowercase first-letter:uppercase">
                    {priceSource === 'PROMOTION' ? `${discountPercent}% promo` : `${discountPercent}% dcto`}
                  </span>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-[36px] font-black text-zinc-950 transition-all duration-300 leading-none whitespace-nowrap">
              $ {displayNetPrice.toLocaleString('es-CL')}
            </div>
            <span className="text-sm sm:text-base text-zinc-500 font-bold uppercase tracking-widest block">Precio Neto (sin IVA)</span>
          </>
        )}

        <div className="flex items-center gap-2 text-[#00a650] text-[13px] sm:text-[14px] font-black uppercase tracking-widest pt-1">
          <div className="h-2.5 w-2.5 rounded-full bg-[#00a650] animate-pulse" /> Listos para despacho
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-zinc-100">
        <div className="flex gap-4 items-start text-xs sm:text-[13px] font-normal uppercase tracking-tight text-zinc-400">
          <ShieldCheck className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
          <div className="flex flex-col leading-tight">
            <span>Garantía Legal</span>
            <span className="text-zinc-950 font-normal">6 meses por falla de fábrica</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {product.stockQuantity <= 0 ? (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 rounded-xl w-full border border-red-100">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-red-600 font-black text-[15px] sm:text-[16px]">Agotado</span>
          </div>
        ) : product.stockQuantity < minQty ? (
          <div className="flex flex-col gap-1 px-4 py-3 bg-amber-50 rounded-xl w-full border border-amber-200">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-amber-700 font-black text-[14px] sm:text-[15px] uppercase tracking-wide">
                Stock Insuficiente
              </span>
            </div>
            <p className="text-xs text-amber-600 font-medium leading-tight">
              Hay {product.stockQuantity} unidades en stock, pero el empaque mínimo (Inner) para este producto es de {minQty} unidades.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 bg-[#f3f9f2] rounded-xl w-full border border-[#e3f0e0]">
            <CheckCircle2 className="h-5 w-5 text-[#70b363]" />
            <span className="text-[#70b363] font-black text-[15px] sm:text-[16px]">
              {product.stockQuantity} disponibles
            </span>
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

          <button
            onClick={() => {
              toggleWishlist(product);
              toast.success(
                isSaved 
                  ? 'Eliminado de tu lista de deseos' 
                  : 'Añadido a tu lista de deseos',
                {
                  description: product.name,
                  icon: <Heart className="h-4 w-4 fill-red-500 text-red-500" />,
                  duration: 1500,
                }
              );
            }}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-bold text-sm transition-all select-none active:scale-[0.98] cursor-pointer mt-1",
              isSaved
                ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100/50"
                : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300"
            )}
          >
            <Heart className={cn("h-4.5 w-4.5 transition-colors", isSaved ? "fill-red-600 text-red-600" : "text-zinc-500")} />
            <span>{isSaved ? 'Quitar de favoritos' : 'Añadir a favoritos'}</span>
          </button>

          <div className="space-y-4 pt-2">
            <div className="flex gap-3">
              <div className="shrink-0 pt-0.5">
                <RotateCcw className="h-5 w-5 text-zinc-400" />
              </div>
              <p className="text-sm sm:text-[15px] text-zinc-500 leading-relaxed">
                <span className="text-[#3483fa] font-semibold">Políticas B2B:</span> No aplica derecho a retracto unilateral para compras mayoristas institucionales.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="shrink-0 pt-0.5">
                <ShieldCheck className="h-5 w-5 text-zinc-400" />
              </div>
              <p className="text-sm sm:text-[15px] text-zinc-500 leading-relaxed">
                <span className="text-[#3483fa] font-semibold">Garantía comercial:</span> 6 meses de garantía exclusivamente por fallas o defectos de fabricación.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
