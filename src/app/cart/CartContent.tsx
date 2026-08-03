'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, History, RotateCcw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/auth-context';
import { useCustomers } from '@/modules/customers/presentation/hooks/useCustomers';
import { CartItem } from '@/modules/cart/presentation/components/CartItem/CartItem';
import { OrderSummary } from '@/modules/cart/presentation/components/OrderSummary/OrderSummary';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { toast } from 'sonner';
import { PromoCountdownBanner } from '@/components/cart/PromoCountdownBanner';
import { Building2, Search, Plus, Trash2 } from 'lucide-react';

interface CartContentProps {
  recentOrders?: any[];
}

export function CartContent({ recentOrders = [] }: CartContentProps) {
  const { items, itemCount, clearCart, addItem, syncPrices, selectedClientForOrder, setClientForOrder } = useCart();
  const { user } = useAuth();
  const { fetcher } = useApi();
  const [isRepeating, setIsRepeating] = useState<string | null>(null);

  // Buscador de clientes para vendedores
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('');
  
  const { customers = [], isLoading: loadingCustomers } = useCustomers({ search: debouncedCustomerSearch, limit: 5 });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCustomerSearch(customerSearch);
    }, 500);
    return () => clearTimeout(handler);
  }, [customerSearch]);

  // Sync prices when visiting the cart page
  useEffect(() => {
    syncPrices();
  }, [syncPrices]);

  // Dynamically fetch orders for the selected client if SALES_REP
  useEffect(() => {
    let active = true;
    if (user?.role === 'SALES_REP') {
      if (selectedClientForOrder) {
        fetcher(`/api/orders?page=1&limit=3&companyId=${selectedClientForOrder.id}`)
          .then((res) => {
            if (!active) return;
            const fetchedData = res && res.data ? res.data : (Array.isArray(res) ? res : []);
            setOrders(fetchedData.map((o: any) => ({
              id: o.id,
              orderNumber: o.orderNumber,
              totalGross: Number(o.totalGross),
              createdAt: o.createdAt,
              status: o.status,
              itemCount: o.itemCount || o._count?.items || 0
            })));
            setHasMore(fetchedData.length >= 3);
          })
          .catch(err => console.error(err));
      } else {
        if (active) {
          setOrders([]);
          setHasMore(false);
        }
      }
    }
    return () => { active = false; };
  }, [user?.role, selectedClientForOrder?.id, fetcher]);

  // State for dynamic orders listing in CartContent
  const [orders, setOrders] = useState<any[]>(recentOrders);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(recentOrders.length > 0);

  const handleRepeatOrder = async (orderId: string, orderNumber: string) => {
    if (isRepeating) return;
    
    if (items.length > 0) {
      if (!confirm(`¿Estás seguro de que deseas repetir el pedido ${orderNumber}? Esto vaciará los productos que tienes en tu carrito actualmente.`)) {
        return;
      }
    }

    setIsRepeating(orderId);
    try {
      // Llamamos a la API para recuperar e inyectar el pedido anterior
      const itemsToLoad = await fetcher(`/api/orders/${orderId}/repeat`, { method: 'POST' });
      
      if (itemsToLoad && Array.isArray(itemsToLoad)) {
        clearCart(); // Vaciar carrito actual
        
        // Agregar cada elemento al carrito actual con stock y precios B2B al día
        itemsToLoad.forEach((item: any) => {
          addItem(item.product, item.quantity);
        });

        toast.success(`¡Pedido ${orderNumber} repetido con éxito! Se cargaron ${itemsToLoad.length} productos al carrito con sus precios B2B vigentes.`);
      }
    } catch (err: any) {
      console.error("Error repeating B2B order:", err);
      toast.error(err.message || "Error al intentar repetir el pedido. Inténtalo de nuevo.");
    } finally {
      setIsRepeating(null);
    }
  };

  const handleLoadMoreOrders = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const companyQuery = (user?.role === 'SALES_REP' && selectedClientForOrder) 
        ? `&companyId=${selectedClientForOrder.id}` 
        : '';
        
      const res = await fetcher(`/api/orders?page=1&limit=50${companyQuery}`);
      
      const fetchedData = res && res.data ? res.data : (Array.isArray(res) ? res : []);
      
      if (fetchedData.length > 0) {
        // Mapeamos al formato esperado
        const fetched = fetchedData.map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          totalGross: Number(o.totalGross),
          createdAt: o.createdAt,
          status: o.status,
          itemCount: o.itemCount || o._count?.items || 0
        }));

        // Filtrar duplicados
        const existingIds = new Set(orders.map(o => o.id));
        const newOrders = fetched.filter((o: any) => !existingIds.has(o.id));

        if (newOrders.length > 0) {
          setOrders(prev => [...prev, ...newOrders]);
          toast.success(`Se cargaron ${newOrders.length} órdenes anteriores.`);
        } else {
          toast.info('No hay más órdenes anteriores para cargar.');
        }
      } else {
        toast.info('No hay más órdenes anteriores para cargar.');
      }
      setHasMore(false); // Ya cargamos el listado completo (límite 50)
    } catch (err: any) {
      console.error("Error loading past orders:", err);
      toast.error("No se pudieron cargar las órdenes anteriores.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <main className="flex-grow max-w-[1400px] mx-auto w-full p-6 lg:p-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-sm sm:text-base font-black text-zinc-500 uppercase tracking-wider">
          <Link href="/products" className="hover:text-zinc-900 transition-colors flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Volver a la tienda
          </Link>
        </div>
        
        {items.length > 0 && (
          <button 
            onClick={clearCart}
            className="text-xs sm:text-sm font-bold text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            Vaciar Carrito
          </button>
        )}
      </div>

      <div className="mb-8">
        <PromoCountdownBanner />
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 mb-6 flex items-baseline gap-4">
        Carrito de Compras <span className="text-xs sm:text-sm font-semibold text-zinc-400 uppercase tracking-wider">({itemCount} artículos)</span>
      </h1>



      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* LISTA DE PRODUCTOS EN EL CARRITO */}
        <div className="lg:col-span-8 space-y-6">
          {user?.role === 'SALES_REP' && (
            <div className="mb-4 w-full p-5 rounded-[24px] bg-indigo-50 border-2 border-indigo-200 shadow-sm relative overflow-visible">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Building2 className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <label className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <Building2 className="h-5 w-5" /> Cliente Objetivo para este pedido
                </label>
                <p className="text-xs text-indigo-700 font-semibold mb-4 opacity-80">
                  * El carrito ajustará automáticamente los descuentos según el cliente seleccionado.
                </p>
                <div className="relative">
                  {!selectedClientForOrder ? (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
                        <input 
                          type="text"
                          placeholder="Buscar cliente por RUT o Razón Social..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full h-12 rounded-xl border border-indigo-200 pl-10 pr-4 text-base font-semibold text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white shadow-inner"
                        />
                      </div>
                      {customerSearch.length > 1 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl overflow-hidden z-50 shadow-2xl max-h-60 overflow-y-auto">
                          {loadingCustomers ? (
                            <div className="p-4 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-indigo-400" /></div>
                          ) : customers.length > 0 ? (
                            customers.map((c: any) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => { setClientForOrder(c); setCustomerSearch(''); }}
                                className="w-full px-5 py-4 flex items-center gap-3 hover:bg-indigo-50 text-left border-b border-zinc-100 last:border-none transition-colors group"
                              >
                                <div className="min-w-0 flex-1 py-0.5">
                                  <p className="text-base font-bold text-zinc-900 truncate">{c.razonSocial}</p>
                                  {c.rut && <p className="text-sm font-semibold text-zinc-500 mt-0.5">{c.rut}</p>}
                                </div>
                                <Plus className="h-5 w-5 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))
                           ) : customerSearch.length > 2 && (
                            <div className="p-4 text-center text-sm text-zinc-500 uppercase font-bold tracking-widest">No se encontraron clientes</div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-between bg-white border border-indigo-200 rounded-xl p-4 shadow-sm">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-zinc-900 truncate">{selectedClientForOrder.razonSocial}</p>
                        {selectedClientForOrder.rut && <p className="text-sm font-semibold text-indigo-500 mt-0.5">{selectedClientForOrder.rut}</p>}
                      </div>
                      <button 
                        type="button"
                        onClick={() => setClientForOrder(null)}
                        className="p-2.5 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-lg transition-colors ml-2 flex items-center gap-2"
                      >
                        <span className="text-xs font-bold uppercase tracking-widest">Cambiar</span>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {items.length > 0 ? (
            items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))
          ) : (
            <div className="text-center py-20 space-y-6">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="h-10 w-10 text-zinc-300" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Tu carrito está vacío</h2>
              <Link href="/products">
                <Button className="rounded-xl px-10">Explorar catálogo</Button>
              </Link>
            </div>
          )}

          {/* SECCIÓN: VOLVER A COMPRAR - LISTA DE PEDIDOS PASADOS */}
          <div className="mt-20 space-y-8">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <h2 className="text-lg sm:text-xl font-bold text-zinc-950 uppercase tracking-tight flex items-center gap-3">
                <History className="h-4.5 w-4.5 text-zinc-950" /> Volver a comprar
              </h2>
              <Link href="/dashboard/orders" className="text-xs sm:text-sm font-black text-zinc-400 hover:text-primary uppercase tracking-widest transition-colors">Historial completo</Link>
            </div>
            
            {orders && orders.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {orders.map((order: any) => (
                    <div key={order.id} className="p-6 bg-zinc-50 border border-zinc-100 rounded-3xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all group">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-zinc-950 font-mono">{order.orderNumber}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 font-semibold">
                          {new Date(order.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <div className="h-px bg-zinc-200/60 my-2" />
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-wide">
                          <span>Artículos</span>
                          <span className="text-zinc-950">{order.itemCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm font-black text-zinc-950 uppercase tracking-wide">
                          <span>Total Bruto</span>
                          <span>${order.totalGross.toLocaleString('es-CL')}</span>
                        </div>
                      </div>

                      <Button 
                        onClick={() => handleRepeatOrder(order.id, order.orderNumber)}
                        disabled={isRepeating !== null}
                        className="w-full mt-4 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl h-11 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-95 transition-all shadow-sm animate-in fade-in duration-200"
                      >
                        {isRepeating === order.id ? (
                          <Loader2 className="h-3 w-3 animate-spin text-white" />
                        ) : (
                          <RotateCcw className="h-3 w-3 text-white animate-pulse" />
                        )}
                        Repetir Pedido
                      </Button>
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <Button 
                      onClick={handleLoadMoreOrders}
                      disabled={isLoadingMore}
                      className="rounded-xl px-8 h-11 text-xs font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white hover:text-black transition-all flex items-center gap-2 shadow-md cursor-pointer border-none"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          Cargando...
                        </>
                      ) : (
                        'Cargar órdenes'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-zinc-400 text-xs font-bold uppercase tracking-widest py-8 text-center bg-zinc-50 rounded-[32px] border border-dashed border-zinc-200">
                No tienes pedidos recientes para repetir.
              </div>
            )}
          </div>
        </div>

        {/* RESUMEN DE COMPRA */}
        <div className="lg:col-span-4">
          <OrderSummary />
        </div>
      </div>
    </main>
  );
}
