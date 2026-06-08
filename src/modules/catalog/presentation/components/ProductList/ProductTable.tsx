'use client';

import Link from 'next/link';
import Image from 'next/image';
import { memo, useState } from 'react';
import { Pencil, Trash2, Package, ShoppingCart, Heart } from 'lucide-react';
import { StockBadge } from './StockBadge';
import { AddToCartAction } from '../AddToCartAction/AddToCartAction';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

interface ProductTableProps {
  products: any[];
  onDelete?: (id: string, name: string) => void;
  isDeleting?: boolean;
  variant?: 'dashboard' | 'catalog';
}

const ProductRow = memo(function ProductRow({
  product,
  onDelete,
  isDeleting,
  variant,
}: {
  product: any;
  onDelete?: (id: string, name: string) => void;
  isDeleting?: boolean;
  variant: 'dashboard' | 'catalog';
}) {
  const { accessToken } = useAuth();
  const isAuthenticated = !!accessToken;
  const isDashboard = variant === 'dashboard';
  const primaryImage = product.images?.[0] ?? null;
  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=500&auto=format&fit=crop&q=60';
  
  const [imgSrc, setImgSrc] = useState(primaryImage?.url || '');

  const linkHref = isDashboard 
    ? `/dashboard/products/${product.id}/edit` 
    : `/products/${product.slug}`;

  const price = Math.round(product.price?.discountedNetPrice || product.price?.unitNetPrice || product.basePrice || 0);

  return (
    <tr className={cn(
      "group transition-colors text-xs border-b last:border-0",
      isDashboard ? "hover:bg-zinc-800/20 border-zinc-800/50" : "hover:bg-zinc-50 border-zinc-100"
    )}>
      <td className="px-6 py-4">
        <Link 
          href={linkHref}
          className="flex items-center gap-3 group/link cursor-pointer"
        >
          <div className={cn(
            "h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative border",
            isDashboard ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-100"
          )}>
            {imgSrc ? (
              <Image
                src={imgSrc}
                alt={product.name}
                fill
                sizes="40px"
                className={cn(
                  "object-contain p-1 transition-opacity",
                  isDashboard ? "opacity-80 group-hover/link:opacity-100 mix-blend-lighten" : "mix-blend-multiply"
                )}
                loading="lazy"
                onError={() => setImgSrc(FALLBACK_IMAGE)}
              />
            ) : (
              <Package className="h-4 w-4 text-zinc-700" />
            )}
          </div>
          <span className={cn(
            "font-bold transition-colors max-w-[300px] truncate uppercase tracking-tight flex items-center gap-2",
            isDashboard ? "text-white group-hover/link:text-primary" : "text-zinc-900 group-hover/link:text-primary"
          )}>
            {product.name}
            {isDashboard && product.isDeleted && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-red-500/20 border border-red-500/30 text-red-400">
                Papelera
              </span>
            )}
            {isDashboard && !product.isDeleted && !product.isActive && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/20 border border-amber-500/30 text-amber-400">
                Borrador
              </span>
            )}
          </span>
        </Link>
      </td>

      <td className={cn("px-6 py-4 font-mono", isDashboard ? "text-zinc-400" : "text-zinc-500")}>
        {product.sku}
      </td>

      <td className="px-6 py-4">
        <span className={cn(
          "px-2 py-0.5 rounded-lg font-medium text-[10px] uppercase tracking-wider",
          isDashboard ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"
        )}>
          {product.category?.name ?? '—'}
        </span>
      </td>

      <td className={cn("px-6 py-4 font-bold", isDashboard ? "text-white" : "text-zinc-900")}>
        {isDashboard ? (
          `$${price.toLocaleString('es-CL')}`
        ) : isAuthenticated ? (
          `$${price.toLocaleString('es-CL')}`
        ) : (
          <span className="text-blue-600 font-bold text-[11px] uppercase">🔒 Inicia sesión</span>
        )}
      </td>

      <td className="px-6 py-4">
        {isDashboard ? (
          <StockBadge stock={product.stockQuantity} stockAlert={product.stockAlert} />
        ) : isAuthenticated ? (
          <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-widest">En Stock</span>
        ) : (
          <span className="text-[10px] font-bold text-zinc-400 uppercase">Stock Privado</span>
        )}
      </td>

      <td className="px-6 py-4 text-right">
        <div className="flex justify-end items-center gap-2">
          {isDashboard ? (
            <>
              <Link href={`/dashboard/products/${product.id}/edit`}>
                <button
                  type="button"
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-primary hover:border-primary/40 transition-all shadow-sm"
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </Link>
              <button
                type="button"
                onClick={() => onDelete?.(product.id, product.name)}
                disabled={isDeleting}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition-all disabled:opacity-50 shadow-sm"
                title="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <div className="w-48">
                  <AddToCartAction product={product} variant="compact" />
                </div>
              )}
              <button className="p-2 rounded-lg bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-500 transition-all shadow-sm">
                <Heart className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});

export function ProductTable({ products, onDelete, isDeleting, variant = 'dashboard' }: ProductTableProps) {
  const isDashboard = variant === 'dashboard';
  return (
    <div className={cn(
      "rounded-2xl border overflow-x-auto shadow-xl",
      isDashboard ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-100 bg-white"
    )}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className={cn(
            "text-[10px] font-black uppercase tracking-widest",
            isDashboard ? "text-zinc-500 bg-zinc-950/60" : "text-zinc-400 bg-zinc-50"
          )}>
            <th className="px-6 py-4">Producto</th>
            <th className="px-6 py-4">SKU</th>
            <th className="px-6 py-4">Categoría</th>
            <th className="px-6 py-4">{isDashboard ? 'Precio Neto' : 'Precio B2B'}</th>
            <th className="px-6 py-4">Stock</th>
            <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className={cn("divide-y", isDashboard ? "divide-zinc-800/50" : "divide-zinc-100")}>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onDelete={onDelete}
              isDeleting={isDeleting}
              variant={variant}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
