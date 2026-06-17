'use client';

import Link from 'next/link';
import Image from 'next/image';
import { memo, useState } from 'react';
import { Pencil, Trash2, Package, ShoppingCart, Heart, Zap, Star } from 'lucide-react';
import { StockBadge } from './StockBadge';
import { AddToCartAction } from '../AddToCartAction/AddToCartAction';
import { useAuth } from '@/context/auth-context';
import { useWishlist } from '@/context/WishlistContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductCardProps {
  product: any;
  variant?: 'dashboard' | 'catalog';
  onDelete?: (id: string, name: string) => void;
  isDeleting?: boolean;
  /** Primeras 4 cards son above-the-fold: cargarlas con priority */
  priority?: boolean;
}

export const ProductCard = memo(function ProductCard({
  product,
  variant = 'dashboard',
  onDelete,
  isDeleting,
  priority = false,
}: ProductCardProps) {
  const { accessToken, user } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isAuthenticated = !!accessToken;
  const isAdmin = user?.role === 'ADMIN';
  const isDashboard = variant === 'dashboard';
  const isSaved = isInWishlist(product.id);
  const primaryImage = product.images?.[0] ?? null;
  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=500&auto=format&fit=crop&q=60';
  
  const [imgSrc, setImgSrc] = useState(primaryImage?.url || '');

  // Catalog specific calculations — show NET price (without IVA)
  const price = Math.round(product.price?.discountedNetPrice || product.price?.unitNetPrice || product.basePrice || 0);
  const discountPercent = product.price?.discountPercent || 0;
  const priceSource = product.price?.priceSource || 'BASE_PRICE';
  // Only show strikethrough original if there's a promotion or list-based discount
  const originalNetPrice = discountPercent > 0 
    ? Math.round(product.price?.unitNetPrice || product.basePrice || 0)
    : null;

  const cardClasses = cn(
    "group relative rounded-2xl border transition-all duration-300 ease-out flex flex-col overflow-hidden",
    isDashboard 
      ? "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:shadow-primary/5 hover:-translate-y-0.5" 
      : "border-zinc-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-zinc-200 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1"
  );

  const linkHref = isDashboard 
    ? `/dashboard/products/${product.id}/edit` 
    : `/products/${product.slug}`;

  return (
    <div className={cardClasses}>
      {/* Overlay Link - Hace que toda la card sea clickeable */}
      <Link 
        href={linkHref} 
        className="absolute inset-0 z-[5]"
        aria-label={isDashboard ? `Editar ${product.name}` : `Ver ${product.name}`}
      />

      {/* Image Container */}
      <div className={cn(
        "aspect-[4/3] relative overflow-hidden flex-shrink-0 z-0",
        isDashboard ? "bg-zinc-950" : "bg-zinc-50/60"
      )}>
        <Image
          src={primaryImage?.url || '/placeholder-product.png'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={cn(
            "object-contain p-4 group-hover:scale-[1.04] transition-transform duration-700 ease-out",
            isDashboard ? "opacity-80 group-hover:opacity-100 mix-blend-lighten" : "mix-blend-multiply"
          )}
        />

        {/* Badges */}
        <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10">
          {!isDashboard && priceSource === 'PROMOTION' && discountPercent > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-primary text-zinc-950 text-[11px] font-black uppercase tracking-wider shadow-md">
              {discountPercent}% OFF
            </span>
          )}
          <span className={cn(
            "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest w-fit border",
            isDashboard 
              ? "bg-zinc-950/80 backdrop-blur-md border-white/10 text-white" 
              : "bg-white/90 backdrop-blur-sm border-zinc-200/50 text-zinc-500 shadow-sm"
          )}>
            {product.category?.name ?? '—'}
          </span>
          {isDashboard && product.isDeleted && (
            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/20 border border-red-500/40 text-red-400 w-fit backdrop-blur-sm">
              Papelera
            </span>
          )}
          {isDashboard && !product.isDeleted && !product.isActive && (
            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 border border-amber-500/40 text-amber-400 w-fit backdrop-blur-sm">
              Borrador
            </span>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {product.stockQuantity === 0 && (
          <div className="absolute inset-0 bg-zinc-950/65 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest">
              Sin Stock
            </span>
          </div>
        )}
      </div>

      {/* Actions overlay */}
      <div className="absolute top-3.5 right-3.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0 z-10 pointer-events-auto">
        {isDashboard ? (
          <>
            <Link href={`/dashboard/products/${product.id}/edit`}>
              <button
                type="button"
                className="p-2.5 rounded-2xl bg-zinc-900/90 backdrop-blur border border-zinc-700 text-zinc-300 hover:text-primary hover:border-primary/50 transition-all shadow-xl"
                title="Editar producto"
                onClick={(e) => e.stopPropagation()}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete?.(product.id, product.name);
              }}
              disabled={isDeleting}
              className="p-2.5 rounded-2xl bg-zinc-900/90 backdrop-blur border border-zinc-700 text-zinc-300 hover:text-red-400 hover:border-red-500/50 transition-all shadow-xl disabled:opacity-50"
              title="Eliminar producto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            {isAdmin && (
              <Link href={`/dashboard/products/${product.id}/edit`} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="p-2.5 rounded-2xl bg-white/95 text-zinc-800 hover:bg-primary hover:text-zinc-950 shadow-md transition-all border border-zinc-200/50 flex items-center justify-center"
                  title="Editar producto (Admin)"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </Link>
            )}
            {isAuthenticated && (
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
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
                  "p-2.5 rounded-2xl shadow-md transition-all border flex items-center justify-center",
                  isSaved 
                    ? "bg-red-50 text-red-500 border-red-200 hover:bg-red-100/70"
                    : "bg-white/95 text-zinc-800 hover:bg-red-500 hover:text-white border-zinc-200/50"
                )}
                title={isSaved ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                <Heart className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4 flex flex-col flex-1 relative">
        <div className="flex justify-between items-start gap-2 pointer-events-none">
          <div className="min-w-0">
            <p className={cn(
              "text-[15px] font-bold uppercase tracking-widest mb-1 font-mono",
              isDashboard ? "text-zinc-500" : "text-zinc-400"
            )}>
              {product.brand?.name || 'SIN MARCA'}
            </p>
            <h3 className={cn(
              "transition-colors",
              isDashboard 
                ? "text-sm font-bold leading-tight truncate text-white group-hover:text-primary" 
                : "text-lg sm:text-[19px] font-bold leading-snug line-clamp-2 h-[50px] sm:h-[54px] overflow-hidden text-zinc-900 group-hover:text-primary"
            )}>
              {product.name}
            </h3>
          </div>
        </div>

        {/* Rating removed to keep clean Retail aesthetic */}

        <div className={cn(
          "pt-2 border-t mt-auto pointer-events-none",
          isDashboard ? "border-zinc-800/50" : "border-zinc-100"
        )}>
          {isDashboard ? (
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-[10px] font-medium text-zinc-500 mb-0.5 uppercase">Precio Neto</p>
                <p className="text-lg font-bold text-white tracking-tight">
                  ${Number(product.basePrice).toLocaleString('es-CL')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium text-zinc-500 mb-1 uppercase text-right">Stock</p>
                <StockBadge stock={product.stockQuantity} stockAlert={product.stockAlert} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {/* Row 1: Pricing details */}
              <div className="w-full">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-0.5">
                    {originalNetPrice && originalNetPrice !== price ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-zinc-950 tracking-tight">
                            $ {price.toLocaleString('es-CL')}
                          </span>
                          <span className="text-[14px] font-black text-blue-600 whitespace-nowrap">
                            Ahorra $ {(originalNetPrice - price).toLocaleString('es-CL')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[15px] text-zinc-400 uppercase tracking-tight">
                          <span className="line-through">
                            $ {originalNetPrice.toLocaleString('es-CL')}
                          </span>
                          <span>•</span>
                          <span>Neto</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-black text-zinc-950 tracking-tight">
                          $ {price.toLocaleString('es-CL')}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-tight">Neto</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-[13.5px] font-bold text-blue-600 uppercase tracking-wider">
                      🔒 Inicia sesión
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-zinc-400 font-bold uppercase mt-0.5">Para ver precios</span>
                  </div>
                )}
              </div>
              
              {/* Row 2: Stock (Catalog only, below price to avoid superposition) */}
              <div className="flex justify-end w-full pt-0.5">
                {isAuthenticated ? (
                  <span className={cn(
                    "text-[11px] font-black px-2 py-1 rounded uppercase tracking-widest whitespace-nowrap",
                    product.stockQuantity > 0 ? "text-green-600 bg-green-50 border border-green-200/50" : "text-red-600 bg-red-50 border border-red-200/50"
                  )}>
                    {product.stockQuantity > 0 ? `${product.stockQuantity} En Stock` : "Sin Stock"}
                  </span>
                ) : (
                  <span className="text-xs sm:text-[12.5px] font-bold text-zinc-450 uppercase tracking-wider">
                    Stock Privado
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* BOTÓN AGREGAR AL CARRO (Solo si está autenticado) */}
        {!isDashboard && isAuthenticated && (
          <div className="pt-2 relative z-10">
            <AddToCartAction product={product} variant="compact" />
          </div>
        )}
        {!isDashboard && !isAuthenticated && (
          <div className="pt-2 relative z-10 text-center border-t border-zinc-150/60 mt-1">
            <Link 
              href="/login" 
              className="text-[11px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest block py-1.5"
            >
              Inicia sesión para precio B2B
            </Link>
          </div>
        )}
      </div>
    </div>
  );
});
