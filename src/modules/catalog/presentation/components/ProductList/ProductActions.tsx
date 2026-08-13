'use client';

import { useAuth } from '@/context/auth-context';
import { useWishlist } from '@/context/WishlistContext';
import { Heart, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductActionsProps {
  product: any;
  variant?: 'dashboard' | 'catalog';
  onDelete?: (id: string, name: string) => void;
  isDeleting?: boolean;
}

export function ProductActions({
  product,
  variant = 'catalog',
  onDelete,
  isDeleting
}: ProductActionsProps) {
  const { accessToken, user } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  const isAuthenticated = !!accessToken;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isDashboard = variant === 'dashboard';
  const isSaved = isInWishlist(product.id);

  return (
    <div className="absolute top-3.5 right-3.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-transform transition-opacity transition-colors duration-300 transform translate-x-1 group-hover:translate-x-0 z-10 pointer-events-auto">
      {isDashboard ? (
        <>
          <Link href={`/dashboard/products/${product.id}/edit`}>
            <button
              type="button"
              className="p-2.5 rounded-2xl bg-zinc-900/90 backdrop-blur border border-zinc-700 text-zinc-300 hover:text-primary hover:border-primary/50 transition-transform transition-opacity transition-colors shadow-xl"
              title="Editar producto"
              onClick={(e) => e.stopPropagation()}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </Link>
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(product.id, product.name);
              }}
              disabled={isDeleting}
              className="p-2.5 rounded-2xl bg-zinc-900/90 backdrop-blur border border-zinc-700 text-zinc-300 hover:text-red-400 hover:border-red-500/50 transition-transform transition-opacity transition-colors shadow-xl disabled:opacity-50"
              title="Eliminar producto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </>
      ) : (
        <>
          {isAdmin && (
            <Link href={`/dashboard/products/${product.id}/edit`} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="p-2.5 rounded-2xl bg-white/95 text-zinc-800 hover:bg-primary hover:text-zinc-950 shadow-md transition-transform transition-opacity transition-colors border border-zinc-200/50 flex items-center justify-center"
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
                "p-2.5 rounded-2xl shadow-md transition-transform transition-opacity transition-colors border flex items-center justify-center",
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
  );
}
