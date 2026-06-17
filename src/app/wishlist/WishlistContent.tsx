'use client';

import React, { useState } from 'react';
import { ArrowLeft, Heart, Trash2, Mail, Printer, Loader2, Package, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { AddToCartAction } from '@/modules/catalog/presentation/components/AddToCartAction/AddToCartAction';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WishlistContentProps {
  defaultEmail?: string;
}

export function WishlistContent({ defaultEmail = '' }: WishlistContentProps) {
  const { items, itemCount, removeFromWishlist, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const { post } = useApi();
  const { user } = useAuth();
  const [emails, setEmails] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const subtotalNeto = Math.round(items.reduce((acc, item) => {
    const qty = quantities[item.id] ?? item.minOrderQty ?? 1;
    return acc + (item.price * qty);
  }, 0));
  const iva = Math.round(subtotalNeto * 0.19);
  const total = Math.round(subtotalNeto + iva);

  const handleQuantityChange = (id: string, val: number) => {
    setQuantities(prev => ({ ...prev, [id]: val }));
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('No hay productos en la lista para enviar.');
      return;
    }

    if (!emails.trim()) {
      toast.error('Por favor ingresa al menos un correo electrónico.');
      return;
    }

    setIsSending(true);
    try {
      const enrichedItems = items.map(item => ({
        ...item,
        quantity: quantities[item.id] ?? item.minOrderQty ?? 1
      }));
      await post('/api/wishlist/send-email', { items: enrichedItems, emails });

      toast.success('¡Lista de deseos enviada con éxito!', {
        description: `Enviado a: ${emails}`,
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al intentar enviar el correo. Inténtalo de nuevo.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddAllToCart = () => {
    if (items.length === 0) return;
    
    items.forEach(item => {
      const qty = quantities[item.id] ?? item.minOrderQty ?? 1;
      addItem(item, qty);
    });

    toast.success('¡Todos los artículos añadidos al carrito!', {
      icon: <ShoppingCart className="h-4 w-4" />,
    });
  };

  return (
    <main className="flex-grow max-w-[1400px] mx-auto w-full p-6 lg:p-12">
      {/* Estilos para Impresión */}
      <style>{`
        @media print {
          header, footer, .no-print, button, input, .toast {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .print-header {
            display: block !important;
            margin-bottom: 30px;
          }
          .print-border-none {
            border: none !important;
            box-shadow: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            flex: 1 1 100% !important;
          }
          .print-table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #d1d5db !important;
            padding: 8px !important;
          }
          .print-image {
            max-height: 50px !important;
            object-fit: contain !important;
          }
        }
        .print-header {
          display: none;
        }
      `}</style>

      {/* Header en impresión (oculto en pantalla) */}
      <div className="print-header font-sans">
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <img src="/logo-svg.png" alt="JDevoto Logo" className="h-12 w-auto" />
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-950">Lista de Deseos / Cotización</h2>
            <p className="text-[9px] text-zinc-500 font-medium max-w-lg ml-auto leading-normal">
              COMERCIAL J. DEVOTO LIMITADA, Rut N° 84.915.400-1, domiciliada en Oriente - Décima Avenida 1740, 2373506 Placilla, Valparaíso. Teléfono: (32) 331 5100
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 no-print">
        <div className="flex items-center gap-2 text-sm sm:text-base font-black text-zinc-500 uppercase tracking-wider">
          <Link href="/products" className="hover:text-zinc-900 transition-colors flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Volver a la tienda
          </Link>
        </div>
        
        {items.length > 0 && (
          <button 
            onClick={clearWishlist}
            className="text-xs sm:text-sm font-bold text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
          >
            Vaciar Lista
          </button>
        )}
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 mb-10 flex items-baseline gap-4 print-full-width print:mb-6">
        Lista de Deseos <span className="text-xs sm:text-sm font-semibold text-zinc-400 uppercase tracking-wider no-print">({itemCount} artículos)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start print-full-width">
        
        {/* LISTADO DE PRODUCTOS FAVORITOS */}
        <div className="lg:col-span-8 space-y-6 print-full-width">
          {items.length > 0 ? (
            <div className="rounded-2xl border border-zinc-100 bg-white shadow-xl overflow-x-auto print-border-none">
              <table className="w-full text-left border-collapse print-table">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-wider text-zinc-400 bg-zinc-50 border-b border-zinc-100">
                    <th className="px-4 py-3 whitespace-nowrap text-center">Imagen</th>
                    <th className="px-4 py-3 whitespace-nowrap">Producto</th>
                    <th className="px-4 py-3 whitespace-nowrap hidden md:table-cell">SKU</th>
                    <th className="px-4 py-3 whitespace-nowrap">Precio Neto</th>
                    <th className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">Disponibilidad</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap no-print">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((item) => {
                    const qty = quantities[item.id] ?? item.minOrderQty ?? 1;
                    const lineTotal = Math.round(item.price * qty);

                    return (
                      <tr key={item.id} className="hover:bg-zinc-50 transition-colors text-sm border-b last:border-0">
                        {/* Imagen */}
                        <td className="px-4 py-4 text-center">
                          <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative border bg-zinc-50 border-zinc-100 mx-auto print-border-none">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="object-contain p-1 print-image max-h-12"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-zinc-400" />
                            )}
                          </div>
                        </td>

                        {/* Producto */}
                        <td className="px-4 py-4">
                          <Link href={`/products/${item.slug}`} className="hover:text-primary transition-colors font-extrabold text-sm sm:text-base text-zinc-900 uppercase tracking-tight">
                            <span className="block text-zinc-400 font-mono text-[10px] tracking-widest font-black uppercase mb-0.5">{item.brandName || 'SIN MARCA'}</span>
                            <span className="block font-sans whitespace-normal leading-tight">{item.name}</span>
                          </Link>
                          {/* Badges de Descuento */}
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {item.discountPercent > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[9px] font-bold text-emerald-600 uppercase tracking-tight">
                                {item.discountPercent}% OFF • {item.priceSource.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          {/* SKU Móvil */}
                          <div className="mt-1.5 text-[10px] text-zinc-400 font-bold uppercase md:hidden flex items-center gap-1.5">
                            <span>SKU: {item.sku}</span>
                            <span>•</span>
                            <span className={item.stockQuantity > 0 ? "text-green-600" : "text-red-600"}>
                              {item.stockQuantity > 0 ? "En Stock" : "Sin Stock"}
                            </span>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="px-4 py-4 font-mono text-zinc-500 hidden md:table-cell">
                          {item.sku}
                        </td>

                        {/* Precio */}
                        <td className="px-4 py-4 font-bold text-zinc-950 whitespace-nowrap">
                          <div className="text-sm sm:text-base font-black text-zinc-950">
                            $ {lineTotal.toLocaleString('es-CL')}{' '}
                            <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase">Neto</span>
                          </div>
                          {(qty > 1 || item.discountPercent > 0) && (
                            <div className="flex flex-col text-[10px] sm:text-xs font-medium text-zinc-400 mt-0.5">
                              {item.discountPercent > 0 && (
                                <span className="line-through">
                                  $ {Math.round(item.originalPrice).toLocaleString('es-CL')}
                                </span>
                              )}
                              <span>
                                $ {Math.round(item.price).toLocaleString('es-CL')} c/u Neto
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                          <span className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest border",
                            item.stockQuantity > 0 ? "text-green-600 bg-green-50 border-green-200/50" : "text-red-600 bg-red-50 border-red-200/50"
                          )}>
                            {item.stockQuantity > 0 ? `${item.stockQuantity} En Stock` : "Sin Stock"}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-4 text-right no-print">
                          <div className="flex justify-end items-center gap-3">
                            <div className="w-32 sm:w-40 shrink-0">
                              <AddToCartAction 
                                product={item} 
                                variant="compact" 
                                quantity={qty}
                                onQuantityChange={(val) => handleQuantityChange(item.id, val)}
                              />
                            </div>
                            <button
                              onClick={() => {
                                removeFromWishlist(item.id);
                                toast.success('Producto eliminado de favoritos.');
                              }}
                              className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-500 hover:bg-red-50/20 transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer"
                              title="Eliminar de favoritos"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Subtotal, IVA y Total */}
                  <tr className="bg-zinc-50/50 font-bold border-t border-zinc-200">
                    <td colSpan={2} className="px-4 py-3.5 text-right text-zinc-500 text-xs sm:text-sm uppercase tracking-wider">Subtotal Neto:</td>
                    <td className="hidden md:table-cell"></td>
                    <td className="px-4 py-3.5 text-zinc-950 font-extrabold text-sm sm:text-base whitespace-nowrap">
                      $ {subtotalNeto.toLocaleString('es-CL')}
                    </td>
                    <td className="hidden sm:table-cell"></td>
                    <td className="no-print"></td>
                  </tr>
                  <tr className="bg-zinc-50/50 font-bold">
                    <td colSpan={2} className="px-4 py-3.5 text-right text-zinc-500 text-xs sm:text-sm uppercase tracking-wider">IVA (19%):</td>
                    <td className="hidden md:table-cell"></td>
                    <td className="px-4 py-3.5 text-zinc-950 font-extrabold text-sm sm:text-base whitespace-nowrap">
                      $ {iva.toLocaleString('es-CL')}
                    </td>
                    <td className="hidden sm:table-cell"></td>
                    <td className="no-print"></td>
                  </tr>
                  <tr className="bg-zinc-100/60 font-black border-t-2 border-zinc-200">
                    <td colSpan={2} className="px-4 py-4 text-right text-zinc-900 text-sm sm:text-base uppercase tracking-wider">Total Final:</td>
                    <td className="hidden md:table-cell"></td>
                    <td className="px-4 py-4 text-blue-900 text-base sm:text-lg font-black whitespace-nowrap">
                      $ {total.toLocaleString('es-CL')}
                    </td>
                    <td className="hidden sm:table-cell"></td>
                    <td className="no-print"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 space-y-6">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
                <Heart className="h-10 w-10 text-zinc-300" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Tu lista de deseos está vacía</h2>
              <Link href="/products">
                <Button className="rounded-xl px-10">Explorar catálogo</Button>
              </Link>
            </div>
          )}
        </div>

        {/* COMPARTIR Y ACCIONES ADICIONALES */}
        {items.length > 0 && (
          <div className="lg:col-span-4 space-y-6 no-print">
            {/* Tarjeta Enviar por Correo */}
            <div className="p-6 sm:p-8 rounded-[32px] border border-zinc-100 bg-white shadow-xl space-y-6">
              <h3 className="text-lg font-black text-zinc-950 uppercase tracking-tight flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" /> Compartir por Correo
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Ingresa una o más direcciones de correo electrónico separadas por comas (ej. <code>compras@empresa.com, socio@empresa.com</code>) para enviarles la lista completa en formato orden de compra.
              </p>
              
              <form onSubmit={handleSendEmail} className="space-y-4">
                <input
                  type="text"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="ejemplo1@empresa.cl, ejemplo2@empresa.cl"
                  className="w-full h-11 rounded-xl bg-zinc-50 border border-zinc-200 px-4 text-zinc-800 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-zinc-400 font-medium"
                  disabled={isSending}
                />
                
                <Button 
                  type="submit" 
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 cursor-pointer"
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 text-white" />
                      <span>Enviar Lista</span>
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Tarjeta de Impresión y Acciones Masivas */}
            <div className="p-6 sm:p-8 rounded-[32px] border border-zinc-100 bg-white shadow-xl space-y-4">
              <h3 className="text-md font-bold text-zinc-900 uppercase tracking-tight">Otras Acciones</h3>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleAddAllToCart}
                  className="w-full h-11 rounded-xl bg-primary text-zinc-950 hover:bg-primary/95 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="h-4 w-4 text-zinc-950" />
                  <span>Añadir todo al carro</span>
                </Button>

                <Button
                  onClick={handlePrint}
                  className="w-full h-11 rounded-xl bg-transparent hover:bg-zinc-50 text-zinc-700 border border-zinc-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="h-4 w-4 text-zinc-500" />
                  <span>Imprimir / Guardar PDF</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
