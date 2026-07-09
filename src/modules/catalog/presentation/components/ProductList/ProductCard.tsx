import Link from 'next/link';
import Image from 'next/image';
import { memo } from 'react';
import { Package, Zap } from 'lucide-react';
import { StockBadge } from './StockBadge';
import { AddToCartAction } from '../AddToCartAction/AddToCartAction';
import { ProductActions } from './ProductActions';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: any;
  variant?: 'dashboard' | 'catalog';
  onDelete?: (id: string, name: string) => void;
  isDeleting?: boolean;
  /** Primeras 4 cards son above-the-fold: cargarlas con priority */
  priority?: boolean;
  compact?: boolean;
  isAuthenticated?: boolean;
}

export const ProductCard = memo(function ProductCard({
  product,
  variant = 'dashboard',
  onDelete,
  isDeleting,
  priority = false,
  compact = false,
  isAuthenticated = false,
}: ProductCardProps) {
  const isDashboard = variant === 'dashboard';
  const primaryImage = product.images?.[0] ?? null;
  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=500&auto=format&fit=crop&q=60';

  // Catalog specific calculations — show NET price (without IVA)
  const price = Math.round(product.price?.discountedNetPrice || product.price?.unitNetPrice || product.basePrice || 0);
  const discountPercent = product.price?.discountPercent || 0;
  const priceSource = product.price?.priceSource || 'BASE_PRICE';
  // Only show strikethrough original if there's a promotion or list-based discount
  const originalNetPrice = discountPercent > 0 
    ? Math.round(product.price?.unitNetPrice || product.basePrice || 0)
    : null;

  const cardClasses = cn(
    "group relative rounded-2xl border transition-transform transition-opacity transition-colors duration-300 ease-out flex flex-col overflow-hidden",
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
          alt={`${product.name}${product.brand?.name ? ` — ${product.brand.name}` : ''}`}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 17vw"
          className={cn(
            "object-contain p-4 group-hover:scale-[1.04] transition-transform duration-700 ease-out"
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

      <ProductActions 
        product={product} 
        variant={variant} 
        onDelete={onDelete} 
        isDeleting={isDeleting} 
      />

      {/* Body */}
      <div className={cn("p-5 space-y-4 flex flex-col flex-1 relative shrink-0", compact && "p-3.5 space-y-2.5 pt-2.5")}>
        <div className="flex justify-between items-start gap-2 pointer-events-none w-full">
          <div className="min-w-0 w-full">
            <div className="flex items-center justify-between gap-2 mb-1.5 w-full">
              <p className={cn(
                "font-black uppercase tracking-widest font-mono",
                compact ? "text-[10px]" : "text-[16px]",
                isDashboard ? "text-zinc-400" : "text-zinc-400"
              )}>
                {product.brand?.name || 'SIN MARCA'}
              </p>
              {isDashboard && product.sku && (
                <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded border bg-primary/10 border-primary/20 text-primary shrink-0">
                  SKU: {product.sku}
                </span>
              )}
              {!isDashboard && product.sku && (
                <span className={cn(
                  "font-mono font-black text-blue-600 shrink-0",
                  compact ? "text-xs" : "text-sm"
                )}>
                  SKU: {product.sku}
                </span>
              )}
            </div>
            <h3 className={cn(
              "transition-colors",
              isDashboard 
                ? "text-base font-bold leading-snug line-clamp-2 h-[48px] overflow-hidden text-white group-hover:text-primary" 
                : (compact
                    ? "text-sm font-extrabold leading-snug line-clamp-2 h-[40px] overflow-hidden text-zinc-900 group-hover:text-primary"
                    : "text-lg sm:text-[19px] font-bold leading-snug line-clamp-2 h-[50px] sm:h-[54px] overflow-hidden text-zinc-900 group-hover:text-primary")
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
                <p className="text-xs font-bold text-zinc-400 mb-1 uppercase">Precio Neto</p>
                <p className="text-xl font-black text-white tracking-tight">
                  ${Number(product.basePrice).toLocaleString('es-CL')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-zinc-400 mb-1 uppercase text-right">Stock</p>
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
                          <span className={cn(
                            "font-black text-zinc-950 tracking-tight whitespace-nowrap",
                            compact ? "text-2xl" : "text-3xl"
                          )}>
                            $ {price.toLocaleString('es-CL')}
                          </span>
                          <span className={cn(
                            "font-black text-blue-600 whitespace-nowrap",
                            compact ? "text-xs" : "text-[14px]"
                          )}>
                            Ahorra $ {(originalNetPrice - price).toLocaleString('es-CL')}
                          </span>
                        </div>
                        <div className={cn(
                          "flex items-center gap-1 text-zinc-400 uppercase tracking-tight",
                          compact ? "text-[12px]" : "text-[15px]"
                        )}>
                          <span className="line-through whitespace-nowrap">
                            $ {originalNetPrice.toLocaleString('es-CL')}
                          </span>
                          <span>•</span>
                          <span>Neto</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className={cn(
                          "font-black text-zinc-950 tracking-tight whitespace-nowrap",
                          compact ? "text-2xl" : "text-3xl"
                        )}>
                          $ {price.toLocaleString('es-CL')}
                        </span>
                        <span className={cn(
                          "font-bold uppercase tracking-tight",
                          compact ? "text-[10px]" : "text-[11px]"
                        )}>Neto</span>
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
              <div className={cn("flex justify-end w-full pt-0.5", compact && "pt-0")}>
                {isAuthenticated ? (
                  <span className={cn(
                    "font-black px-2 py-1 rounded uppercase tracking-widest whitespace-nowrap",
                    compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px]",
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
