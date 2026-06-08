'use client';

import Link from 'next/link';
import Image from 'next/image';
import { memo, useState } from 'react';
import { Pencil, Trash2, Package, ShoppingCart, Heart, Zap, Star } from 'lucide-react';
import { StockBadge } from './StockBadge';
import { AddToCartAction } from '../AddToCartAction/AddToCartAction';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

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
  const isAuthenticated = !!accessToken;
  const isAdmin = user?.role === 'ADMIN';
  const isDashboard = variant === 'dashboard';
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
    "group relative rounded-2xl border transition-all duration-300 shadow-lg flex flex-col overflow-hidden",
    isDashboard 
      ? "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600 hover:shadow-primary/5" 
      : "border-zinc-100 bg-white hover:border-primary/20 hover:shadow-2xl hover:shadow-zinc-200/50"
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
        isDashboard ? "bg-zinc-950" : "bg-zinc-50"
      )}>
        <Image
          src={primaryImage?.url || '/placeholder-product.png'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={cn(
            "object-contain p-4 group-hover:scale-105 transition-transform duration-500",
            isDashboard ? "opacity-80 group-hover:opacity-100 mix-blend-lighten" : "mix-blend-multiply"
          )}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {!isDashboard && priceSource === 'PROMOTION' && discountPercent > 0 && (
            <span className="px-2.5 py-1.5 rounded-br-xl rounded-tl-xl bg-primary text-zinc-950 text-[10px] font-black uppercase shadow-md">
              {discountPercent}% OFF
            </span>
          )}
          <span className={cn(
            "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider w-fit",
            isDashboard ? "bg-zinc-950/80 backdrop-blur-md border border-white/10 text-white" : "bg-white/80 backdrop-blur-sm border border-zinc-100 text-zinc-500"
          )}>
            {product.category?.name ?? '—'}
          </span>
          {isDashboard && product.isDeleted && (
            <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-500/20 border border-red-500/40 text-red-400 w-fit backdrop-blur-sm">
              Papelera
            </span>
          )}
          {isDashboard && !product.isDeleted && !product.isActive && (
            <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/20 border border-amber-500/40 text-amber-400 w-fit backdrop-blur-sm">
              Borrador
            </span>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {product.stockQuantity === 0 && (
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-[11px] font-black uppercase tracking-widest">
              Sin Stock
            </span>
          </div>
        )}
      </div>

      {/* Actions overlay */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-auto">
        {isDashboard ? (
          <>
            <Link href={`/dashboard/products/${product.id}/edit`}>
              <button
                type="button"
                className="p-2 rounded-xl bg-zinc-900/90 backdrop-blur border border-zinc-700 text-zinc-300 hover:text-primary hover:border-primary/50 transition-all shadow-xl"
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
              className="p-2 rounded-xl bg-zinc-900/90 backdrop-blur border border-zinc-700 text-zinc-300 hover:text-red-400 hover:border-red-500/50 transition-all shadow-xl disabled:opacity-50"
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
                  className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-xl transition-all border border-blue-500/20 flex items-center justify-center"
                  title="Editar producto (Admin)"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </Link>
            )}
            {/* Solo dejamos el corazón aquí, el carro está abajo con cantidad */}
            <button className="p-2.5 rounded-full bg-white text-zinc-900 hover:bg-red-500 hover:text-white shadow-xl transition-all border border-zinc-100 flex items-center justify-center">
              <Heart className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4 flex flex-col flex-1 relative">
        <div className="flex justify-between items-start gap-2 pointer-events-none">
          <div className="min-w-0">
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-widest mb-1 font-mono",
              isDashboard ? "text-zinc-500" : "text-zinc-400"
            )}>
              {product.brand?.name || 'SIN MARCA'}
            </p>
            <h3 className={cn(
              "text-sm font-bold leading-tight transition-colors truncate uppercase tracking-tight",
              isDashboard ? "text-white group-hover:text-primary" : "text-zinc-900 group-hover:text-primary"
            )}>
              {product.name}
            </h3>
          </div>
        </div>

        {!isDashboard && (
          <div className="flex items-center gap-1.5 pointer-events-none">
             <div className="flex items-center text-orange-400">
               {[...Array(5)].map((_, j) => <Star key={j} className={cn("h-3 w-3 fill-current", j >= 4 && "text-zinc-200 fill-none")} />)}
             </div>
             <span className="text-[10px] text-zinc-400 font-bold">({(product.id.charCodeAt(0) % 80) + 12})</span>
          </div>
        )}

        <div className={cn(
          "flex items-center justify-between pt-2 border-t mt-auto pointer-events-none",
          isDashboard ? "border-zinc-800/50" : "border-zinc-100"
        )}>
          <div>
            {isDashboard ? (
              <>
                <p className="text-[10px] font-medium text-zinc-500 mb-0.5 uppercase">Precio Neto</p>
                <p className="text-lg font-bold text-white tracking-tight">
                  ${Number(product.basePrice).toLocaleString('es-CL')}
                </p>
              </>
            ) : isAuthenticated ? (
              <div className="flex flex-col">
                {originalNetPrice && originalNetPrice !== price && (
                  <span className="text-[10px] text-zinc-400 line-through font-bold tracking-tighter">
                    $ {originalNetPrice.toLocaleString('es-CL')}
                  </span>
                )}
                <p className="text-lg font-black text-zinc-950 tracking-tight">
                  $ {price.toLocaleString('es-CL')}
                </p>
                <span className="text-[9px] text-zinc-400 font-bold uppercase">Neto</span>
              </div>
            ) : (
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-tight">
                🔒 Inicia sesión
              </span>
            )}
          </div>
          <div className="text-right">
            {isDashboard ? (
              <>
                <p className="text-[10px] font-medium text-zinc-500 mb-1 uppercase text-right">Stock</p>
                <StockBadge stock={product.stockQuantity} stockAlert={product.stockAlert} />
              </>
            ) : isAuthenticated ? (
              <div className="flex flex-col items-end gap-1">
                <span className={cn(
                  "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest",
                  product.stockQuantity > 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                )}>
                  {product.stockQuantity > 0 ? `${product.stockQuantity} En Stock` : "Sin Stock"}
                </span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Entrega mañana</span>
              </div>
            ) : (
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                Stock Privado
              </span>
            )}
          </div>
        </div>

        {/* BOTÓN AGREGAR AL CARRO (Solo si está autenticado) */}
        {!isDashboard && isAuthenticated && (
          <div className="pt-2 relative z-10">
            <AddToCartAction product={product} variant="compact" />
          </div>
        )}
      </div>
    </div>
  );
});
