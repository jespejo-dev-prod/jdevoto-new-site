'use client';

import Link from 'next/link';
import Image from 'next/image';
import { memo, useState } from 'react';
import { Pencil, Trash2, Package, ShoppingCart, Heart, Zap, X, Check, Loader2 } from 'lucide-react';
import { StockBadge } from './StockBadge';
import { AddToCartAction } from '../AddToCartAction/AddToCartAction';
import { useAuth } from '@/context/auth-context';
import { useWishlist } from '@/context/WishlistContext';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { useCategories } from '@/modules/catalog/application/hooks/useCatalogData';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const api = useApi();
  const queryClient = useQueryClient();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { data: categories = [] } = useCategories();
  const isAuthenticated = !!accessToken;
  const isDashboard = variant === 'dashboard';
  const isSaved = isInWishlist(product.id);
  const primaryImage = product.images?.[0] ?? null;
  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=500&auto=format&fit=crop&q=60';
  
  const [imgSrc, setImgSrc] = useState(primaryImage?.url || '');

  // Quick Edit State
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    categoryId: product.category?.id || '',
    basePrice: product.basePrice || 0,
    stockQuantity: product.stockQuantity || 0
  });

  const linkHref = isDashboard 
    ? `/dashboard/products/${product.id}/edit` 
    : `/products/${product.slug}`;

  const price = Math.round(product.price?.discountedNetPrice || product.price?.unitNetPrice || product.basePrice || 0);

  const handleQuickSave = async () => {
    setIsSaving(true);
    try {
      await api.patch(`/api/products/${product.id}`, {
        categoryId: editForm.categoryId === '' ? null : editForm.categoryId,
        basePrice: Number(editForm.basePrice),
        stockQuantity: Number(editForm.stockQuantity)
      });
      toast.success('Producto actualizado');
      setIsQuickEditing(false);
      
      // Revalidate products list in React Query
      queryClient.invalidateQueries({ queryKey: ['dashboard-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar el producto');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <tr className={cn(
        "group transition-colors text-sm border-b last:border-0",
        isDashboard ? "hover:bg-zinc-800/20 border-zinc-800/50" : "hover:bg-zinc-50 border-zinc-100",
        isQuickEditing ? (isDashboard ? "bg-zinc-800/20" : "bg-zinc-50") : ""
      )}>
        <td className="px-1.5 lg:px-2.5 py-3">
          <Link 
            href={linkHref}
            className="flex items-center gap-3 group/link cursor-pointer min-w-0"
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
              "transition-colors flex flex-col gap-0.5 min-w-0",
              isDashboard 
                ? "font-bold text-sm text-white group-hover/link:text-primary max-w-[300px] uppercase tracking-normal" 
                : "font-extrabold text-sm sm:text-base text-zinc-900 group-hover/link:text-primary max-w-[120px] sm:max-w-[200px] md:max-w-[280px] lg:max-w-[140px] xl:max-w-[220px] 2xl:max-w-[300px] uppercase tracking-tight"
            )}>
              <span className="block w-full whitespace-normal leading-normal">
                {product.name}
              </span>
              {!isDashboard && (
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[9px] sm:text-[10px] text-zinc-400 font-bold uppercase md:hidden">
                  <span>SKU: {product.sku}</span>
                  <span>•</span>
                  <span className={product.stockQuantity > 0 ? "text-green-600" : "text-red-600"}>
                    {product.stockQuantity > 0 ? `${product.stockQuantity} Stock` : "Sin Stock"}
                  </span>
                </div>
              )}
              {isDashboard && product.isDeleted && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-red-500/20 border border-red-500/30 text-red-400 shrink-0 w-fit">
                  Papelera
                </span>
              )}
              {isDashboard && !product.isDeleted && !product.isActive && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0 w-fit">
                  Borrador
                </span>
              )}
            </span>
          </Link>
        </td>

        <td className={cn("px-1.5 lg:px-2.5 py-3 font-mono whitespace-nowrap hidden md:table-cell", isDashboard ? "text-zinc-400" : "text-zinc-500")}>
          {product.sku}
        </td>

        <td className="px-1.5 lg:px-2.5 py-3 whitespace-nowrap hidden xl:table-cell">
          <span className={cn(
            "px-2.5 py-1 rounded-lg font-semibold text-xs uppercase tracking-wider",
            isDashboard ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"
          )}>
            {product.category?.name || '—'}
          </span>
        </td>

        <td className={cn("px-1 lg:px-1.5 py-3 font-bold whitespace-nowrap w-[80px]", isDashboard ? "text-white" : "text-zinc-900")}>
          {isDashboard ? (
            `$${price.toLocaleString('es-CL')}`
          ) : isAuthenticated ? (
            `$${price.toLocaleString('es-CL')}`
          ) : (
            <span className="text-blue-600 font-bold text-xs sm:text-[13px] uppercase whitespace-nowrap">🔒 Inicia sesión</span>
          )}
        </td>

        <td className="px-1.5 lg:px-2.5 py-3 whitespace-nowrap hidden sm:table-cell">
          {isDashboard ? (
            <StockBadge stock={product.stockQuantity} stockAlert={product.stockAlert} />
          ) : isAuthenticated ? (
            <span className={cn(
              "text-[11px] font-black px-2.5 py-1 rounded uppercase tracking-widest whitespace-nowrap",
              product.stockQuantity > 0 ? "text-green-600 bg-green-50 border border-green-200/50" : "text-red-600 bg-red-50 border border-red-200/50"
            )}>
              {product.stockQuantity > 0 ? `${product.stockQuantity}` : "Sin Stock"}
            </span>
          ) : (
            <span className="text-[10px] sm:text-[11px] font-black text-zinc-600 uppercase tracking-widest whitespace-nowrap bg-zinc-200/80 px-2 py-1 rounded">Stock Privado</span>
          )}
        </td>

        <td className="px-1.5 lg:px-2.5 py-3 text-right">
          <div className="flex justify-end items-center gap-2">
            {isDashboard ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsQuickEditing(!isQuickEditing)}
                  className={cn(
                    "p-2 rounded-lg border transition-all shadow-sm",
                    isQuickEditing 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "bg-zinc-900 border-zinc-800 text-emerald-400 hover:text-emerald-300 hover:border-emerald-400/40"
                  )}
                  title="Edición rápida"
                >
                  <Zap className="h-4 w-4" />
                </button>
                <Link href={`/dashboard/products/${product.id}/edit`}>
                  <button
                    type="button"
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-primary hover:border-primary/40 transition-all shadow-sm"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </Link>
                <button
                  type="button"
                  onClick={() => onDelete?.(product.id, product.name)}
                  disabled={isDeleting}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition-all disabled:opacity-50 shadow-sm"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                {isAuthenticated && (
                  <div className="w-32 sm:w-40 shrink-0 mr-1.5">
                    <AddToCartAction product={product} variant="compact" />
                  </div>
                )}
                {isAuthenticated && (
                  <button 
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
                      "p-2 rounded-xl border transition-all shadow-md flex items-center justify-center shrink-0 hidden md:flex",
                      isSaved
                        ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100/70"
                        : "bg-white border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-500 hover:bg-red-50/20"
                    )}
                    title={isSaved ? "Quitar de favoritos" : "Añadir a favoritos"}
                  >
                    <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
                  </button>
                )}
              </div>
            )}
          </div>
        </td>
      </tr>
      
      {/* QUICK EDIT EXPANDED ROW */}
      {isDashboard && isQuickEditing && (
        <tr className="border-b border-zinc-800/50 bg-zinc-900/60 shadow-inner">
          <td colSpan={6} className="px-4 py-4">
            <div className="flex flex-col md:flex-row md:items-end gap-4 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/80">
              
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Categoría</label>
                <select
                  value={editForm.categoryId}
                  onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:border-primary/50 outline-none transition-colors"
                >
                  <option value="">Sin Categoría</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Precio Neto ($)</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.basePrice}
                  onChange={(e) => setEditForm({ ...editForm, basePrice: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:border-primary/50 outline-none transition-colors"
                />
              </div>

              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.stockQuantity}
                  onChange={(e) => setEditForm({ ...editForm, stockQuantity: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:border-primary/50 outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 md:pt-0">
                <button
                  onClick={() => setIsQuickEditing(false)}
                  disabled={isSaving}
                  className="flex items-center justify-center p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                  title="Cancelar"
                >
                  <X className="h-5 w-5" />
                </button>
                <button
                  onClick={handleQuickSave}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                  title="Guardar Cambios"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Guardar
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
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
            "text-xs font-bold uppercase tracking-wider",
            isDashboard ? "text-zinc-400 bg-zinc-950/60" : "text-zinc-400 bg-zinc-50"
          )}>
            <th className="px-1.5 lg:px-2.5 py-3 whitespace-nowrap">Producto</th>
            <th className="px-1.5 lg:px-2.5 py-3 whitespace-nowrap hidden md:table-cell">SKU</th>
            <th className="px-1.5 lg:px-2.5 py-3 whitespace-nowrap hidden xl:table-cell">Categoría</th>
            <th className="px-1 lg:px-1.5 py-3 whitespace-nowrap w-[80px]">{isDashboard ? 'Precio Neto' : 'Precio'}</th>
            <th className="px-1.5 lg:px-2.5 py-3 whitespace-nowrap hidden sm:table-cell">Stock</th>
            <th className="px-1.5 lg:px-2.5 py-3 text-right whitespace-nowrap">Acciones</th>
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
