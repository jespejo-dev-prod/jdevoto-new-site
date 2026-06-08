'use client';

import { useState, useMemo } from 'react';
import { useCustomers } from '@/modules/customers/presentation/hooks/useCustomers';
import { useProducts } from '@/modules/catalog/presentation/hooks/useProducts';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { useRouter } from 'next/navigation';
import { OrderStatus } from '@prisma/client';
import { format } from 'date-fns';
import { 
  Search, 
  User, 
  Package, 
  Trash2, 
  Plus, 
  Minus, 
  Loader2, 
  ChevronLeft,
  Building2,
  Truck,
  ShoppingCart,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';

export function OrderCreateForm({ initialData }: { initialData?: any }) {
  const { user } = useAuth();
  const isClient = user?.role === 'COMPANY_ADMIN' || user?.role === 'BUYER';
  const router = useRouter();
  const { fetcher } = useApi();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de la Orden
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(initialData?.status || OrderStatus.PENDING);
  const [creationDate, setCreationDate] = useState(
    initialData?.createdAt ? format(new Date(initialData.createdAt), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [creationTime, setCreationTime] = useState(
    initialData?.createdAt ? format(new Date(initialData.createdAt), 'HH:mm') : format(new Date(), 'HH:mm')
  );
  const [selectedCustomer, setSelectedCustomer] = useState<any>(initialData?.company || null);

  useEffect(() => {
    if (isClient && user?.company && !selectedCustomer) {
      setSelectedCustomer(user.company);
    }
  }, [isClient, user?.company, selectedCustomer]);

  // Estados de Edición de Direcciones
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [billingAddress, setBillingAddress] = useState({ 
    street: initialData?.billingAddress?.street || '', 
    number: initialData?.billingAddress?.number || '', 
    commune: initialData?.billingAddress?.commune || '', 
    city: initialData?.billingAddress?.city || '', 
    email: initialData?.billingAddress?.email || '' 
  });
  const [shippingAddress, setShippingAddress] = useState({ 
    street: initialData?.shippingAddress?.street || '', 
    number: initialData?.shippingAddress?.number || '', 
    commune: initialData?.shippingAddress?.commune || '', 
    region: initialData?.shippingAddress?.region || '' 
  });

  // Sincronizar con cliente seleccionado
  useEffect(() => {
    if (selectedCustomer) {
      setBillingAddress({
        street: selectedCustomer.billingStreet || selectedCustomer.direccion || '',
        number: selectedCustomer.billingNumber || '',
        commune: selectedCustomer.billingCommune || selectedCustomer.comuna || '',
        city: selectedCustomer.billingCity || selectedCustomer.ciudad || '',
        email: selectedCustomer.billingEmail || selectedCustomer.email || ''
      });
      setShippingAddress({
        street: selectedCustomer.shippingStreet || selectedCustomer.direccion || '',
        number: selectedCustomer.shippingNumber || '',
        commune: selectedCustomer.shippingCommune || selectedCustomer.comuna || '',
        region: selectedCustomer.shippingRegion || selectedCustomer.region || ''
      });
    }
  }, [selectedCustomer]);
  
  // Búsqueda
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  
  // "Carrito" local
  const [items, setItems] = useState<Array<{
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    minOrderQty: number;
    price: number;
    basePrice: number;
    discount: number;
    image?: string;
  }>>(initialData?.items?.map((i: any) => ({
    productId: i.productId,
    sku: i.productSku || i.product?.sku || '',
    name: i.productName || i.product?.name || '',
    quantity: i.quantity,
    minOrderQty: i.product?.minOrderQty || 1,
    basePrice: Number(i.unitNetPrice),
    price: Number(i.unitNetPrice) * (1 - Number(i.discount) / 100),
    discount: Number(i.discount),
    image: i.product?.images?.[0]?.url
  })) || []);

  // Hooks de datos
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers(customerSearch);
  const { data: productsData, isLoading: loadingProducts } = useProducts({ search: productSearch, limit: 10 });
  const products = productsData?.products || []; // FIX: use .products instead of .data

  // Cálculos
  const totals = useMemo(() => {
    const net = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = Math.round(net * 0.19);
    const total = net + tax;
    return { net, tax, total };
  }, [items]);

  const addItem = (product: any) => {
    const existing = items.find(i => i.productId === product.id);
    const initialQty = product.minOrderQty || 1;
    
    // Aplicar descuento del cliente
    const discountPercent = Number(selectedCustomer?.defaultDiscount || 0);
    const discountedPrice = product.basePrice * (1 - discountPercent / 100);

    if (existing) {
      setItems(items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + initialQty } : i));
    } else {
      setItems([...items, {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: initialQty,
        minOrderQty: initialQty,
        basePrice: product.basePrice,
        price: discountedPrice,
        discount: discountPercent,
        image: product.images?.[0]?.url
      }]);
    }
    toast.success(`${product.name} agregado`);
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const updateQty = (productId: string, delta: number) => {
    setItems(items.map(i => {
      if (i.productId === productId) {
        const newQty = Math.max(i.minOrderQty, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const updateExactQty = (productId: string, val: string) => {
    if (val === '') {
      setItems(items.map(i => {
        if (i.productId === productId) return { ...i, quantity: 0 };
        return i;
      }));
      return;
    }

    const num = parseInt(val);
    if (isNaN(num)) return;
    
    setItems(items.map(i => {
      if (i.productId === productId) {
        return { ...i, quantity: num };
      }
      return i;
    }));
  };

  const handleSubmit = async (overrideStatus?: OrderStatus) => {
    if (!selectedCustomer) return toast.error("Selecciona un cliente");
    if (items.length === 0) return toast.error("Agrega al menos un producto");

    if (isClient) {
      const selected = new Date(creationDate);
      const today = new Date();
      today.setHours(0,0,0,0);
      selected.setHours(0,0,0,0);
      if (selected < today) {
        return toast.error("La fecha del pedido no puede ser en el pasado.");
      }
    }

    const finalStatus = overrideStatus || orderStatus;

    setIsSubmitting(true);
    try {
      const payload = {
        companyId: selectedCustomer.id,
        status: finalStatus,
        createdAt: new Date(`${creationDate}T${creationTime}:00`),
        items: items.map(i => ({ 
          productId: i.productId, 
          quantity: i.quantity,
          discount: i.discount,
          unitNetPrice: i.basePrice
        })),
        shippingAddress: {
          street: shippingAddress.street,
          number: shippingAddress.number,
          comuna: shippingAddress.commune,
          region: shippingAddress.region,
        },
        billingAddress: {
          street: billingAddress.street,
          number: billingAddress.number,
          comuna: billingAddress.commune,
          city: billingAddress.city,
          email: billingAddress.email,
        }
      };

      if (initialData) {
        await fetcher(`/api/orders/${initialData.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        queryClient.invalidateQueries({ queryKey: ["order", initialData.id] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        toast.success("Pedido actualizado correctamente");
      } else {
        await fetcher('/api/orders', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        toast.success("Pedido creado correctamente");
      }
      router.push('/dashboard/orders');
    } catch (err: any) {
      toast.error(err.message || "Error al crear pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

  const statusLabels: Record<OrderStatus, string> = {
    [OrderStatus.DRAFT]: 'Borrador',
    [OrderStatus.PENDING]: 'Pendiente de Pago',
    [OrderStatus.CONFIRMED]: 'Confirmado',
    [OrderStatus.PROCESSING]: 'En Preparación',
    [OrderStatus.SHIPPED]: 'Despachado',
    [OrderStatus.DELIVERED]: 'Entregado',
    [OrderStatus.CANCELLED]: 'Cancelado',
    [OrderStatus.REJECTED]: 'Rechazado'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700 pb-20">
      
      {/* Columna Principal */}
      <div className="lg:col-span-9 space-y-8">
        
        {/* Cabecera de Datos: General, Facturación, Envío */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-x divide-zinc-800/50">
            
            {/* General */}
            <div className="space-y-6">
               <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                 <Building2 className="h-3.5 w-3.5 text-primary" />
                 General
               </h4>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mb-1.5">Fecha de creación:</label>
                   <div className="flex items-center gap-2">
                     <input 
                       type="date" 
                       value={creationDate}
                       min={isClient ? format(new Date(), 'yyyy-MM-dd') : undefined}
                       onChange={(e) => {
                         const val = e.target.value;
                         if (isClient) {
                           const selected = new Date(val);
                           const today = new Date();
                           today.setHours(0,0,0,0);
                           selected.setHours(0,0,0,0);
                           if (selected < today) {
                             toast.error("La fecha no puede ser en el pasado.");
                             return;
                           }
                         }
                         setCreationDate(val);
                       }}
                       className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-primary/50 outline-none w-full disabled:opacity-50 disabled:cursor-not-allowed"
                     />
                     <span className="text-zinc-600">@</span>
                     <div className="flex items-center gap-1">
                        <input 
                          type="text" 
                          value={creationTime.split(':')[0]} disabled={isClient}
                          onChange={(e) => setCreationTime(`${e.target.value}:${creationTime.split(':')[1]}`)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-xs text-white focus:border-primary/50 outline-none w-10 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="text-zinc-600">:</span>
                        <input 
                          type="text" 
                          value={creationTime.split(':')[1]} disabled={isClient}
                          onChange={(e) => setCreationTime(`${creationTime.split(':')[0]}:${e.target.value}`)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-xs text-white focus:border-primary/50 outline-none w-10 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                     </div>
                   </div>
                 </div>

                 {!isClient && (
                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mb-1.5">Estado:</label>
                     <select 
                       value={orderStatus}
                       onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                       className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary/50 outline-none appearance-none cursor-pointer"
                     >
                       {Object.values(OrderStatus).map((status) => (
                         <option key={status} value={status}>{statusLabels[status]}</option>
                       ))}
                     </select>
                   </div>
                 )}

                 <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mb-1.5">Cliente:</label>
                    {!selectedCustomer ? (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                        <input 
                          type="text"
                          placeholder="Buscar por RUT o Nombre..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-10 pl-9 pr-3 text-xs text-white focus:border-primary/50 outline-none transition-all"
                        />
                        {customerSearch.length > 1 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden z-50 shadow-2xl max-h-60 overflow-y-auto ring-1 ring-zinc-800">
                            {loadingCustomers ? (
                              <div className="p-4 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-600" /></div>
                            ) : customers.length > 0 ? (
                              customers.map((c: any) => (
                                <button
                                  key={c.id}
                                  onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-900 text-left border-b border-zinc-900 last:border-none transition-colors"
                                >
                                  <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="h-4 w-4 text-zinc-500" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{c.razonSocial}</p>
                                    <p className="text-[10px] text-zinc-500 font-mono">{c.rut}</p>
                                  </div>
                                  <Plus className="h-3 w-3 text-primary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ))
                            ) : customerSearch.length > 2 && (
                              <div className="p-4 text-center text-[10px] text-zinc-500 uppercase font-bold tracking-widest italic">No se encontraron clientes</div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button 
                        onClick={() => { if (!isClient) setSelectedCustomer(null); }}
                        disabled={isClient}
                        className={cn(
                          "w-full px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl text-left flex items-center justify-between group",
                          isClient && "cursor-not-allowed opacity-90"
                        )}
                      >
                        <span className="text-xs font-bold text-white truncate max-w-[180px]">{selectedCustomer.razonSocial}</span>
                        {!isClient && <Trash2 className="h-3 w-3 text-zinc-500 group-hover:text-red-500 transition-colors" />}
                      </button>
                    )}
                 </div>
               </div>
            </div>

            {/* Facturación */}
            <div className="pl-12 space-y-6">
               <div className="flex items-center justify-between">
                 <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                   <FileText className="h-3.5 w-3.5 text-primary" />
                   Facturación
                 </h4>
                 <button 
                   onClick={() => setIsEditingBilling(!isEditingBilling)}
                   className="p-1.5 bg-zinc-800 rounded-lg text-zinc-500 hover:text-primary transition-all"
                 >
                   <Pencil className="h-3 w-3" />
                 </button>
               </div>
               
               <div className="space-y-4">
                  {isEditingBilling ? (
                    <div className="space-y-2">
                      <input 
                        placeholder="Calle" 
                        value={billingAddress.street}
                        onChange={(e) => setBillingAddress({...billingAddress, street: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-primary/40"
                      />
                      <div className="flex gap-2">
                        <input 
                          placeholder="N°" 
                          value={billingAddress.number}
                          onChange={(e) => setBillingAddress({...billingAddress, number: e.target.value})}
                          className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-primary/40"
                        />
                        <input 
                          placeholder="Comuna" 
                          value={billingAddress.commune}
                          onChange={(e) => setBillingAddress({...billingAddress, commune: e.target.value})}
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-primary/40"
                        />
                      </div>
                      <input 
                        placeholder="Ciudad" 
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-primary/40"
                      />
                      <input 
                        placeholder="Email" 
                        value={billingAddress.email}
                        onChange={(e) => setBillingAddress({...billingAddress, email: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-primary/40"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="text-xs space-y-2">
                        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-tighter">Dirección:</p>
                        {selectedCustomer ? (
                          <div className="text-zinc-300 space-y-0.5">
                            <p>{billingAddress.street} {billingAddress.number}</p>
                            <p>{billingAddress.commune}, {billingAddress.city}</p>
                          </div>
                        ) : (
                          <p className="text-zinc-600 italic">No se ha establecido una dirección de facturación.</p>
                        )}
                      </div>
                      <div className="text-xs space-y-2">
                        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-tighter">Correo electrónico:</p>
                        <p className={selectedCustomer ? "text-primary font-medium" : "text-zinc-600 italic"}>
                          {billingAddress.email || '—'}
                        </p>
                      </div>
                    </>
                  )}
               </div>
            </div>

            {/* Envío */}
            <div className="pl-12 space-y-6">
               <div className="flex items-center justify-between">
                 <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                   <Truck className="h-3.5 w-3.5 text-primary" />
                   Envío
                 </h4>
                 <button 
                   onClick={() => setIsEditingShipping(!isEditingShipping)}
                   className="p-1.5 bg-zinc-800 rounded-lg text-zinc-500 hover:text-primary transition-all"
                 >
                   <Pencil className="h-3 w-3" />
                 </button>
               </div>

               <div className="space-y-4">
                  {isEditingShipping ? (
                    <div className="space-y-2">
                      <input 
                        placeholder="Calle" 
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-primary/40"
                      />
                      <div className="flex gap-2">
                        <input 
                          placeholder="N°" 
                          value={shippingAddress.number}
                          onChange={(e) => setShippingAddress({...shippingAddress, number: e.target.value})}
                          className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-primary/40"
                        />
                        <input 
                          placeholder="Comuna" 
                          value={shippingAddress.commune}
                          onChange={(e) => setShippingAddress({...shippingAddress, commune: e.target.value})}
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-primary/40"
                        />
                      </div>
                      <input 
                        placeholder="Región" 
                        value={shippingAddress.region}
                        onChange={(e) => setShippingAddress({...shippingAddress, region: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-primary/40"
                      />
                    </div>
                  ) : (
                    <div className="text-xs space-y-2">
                      <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-tighter">Dirección:</p>
                      {selectedCustomer ? (
                        <div className="text-zinc-300 space-y-0.5">
                          <p>{shippingAddress.street} {shippingAddress.number}</p>
                          <p>{shippingAddress.commune}, {shippingAddress.region}</p>
                        </div>
                      ) : (
                        <p className="text-zinc-600 italic">Sin dirección de envío configurada.</p>
                      )}
                    </div>
                  )}
               </div>
            </div>

          </div>
        </div>

        {/* Sección Artículos */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl shadow-2xl">
          <div className="p-6 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Artículos del Pedido
            </h4>
            <div className="relative w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
               <input 
                 type="text"
                 placeholder="Agregar producto..."
                 value={productSearch}
                 onChange={(e) => setProductSearch(e.target.value)}
                 className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-9 pl-9 pr-3 text-[10px] text-white focus:border-primary/50 outline-none"
               />
               {productSearch.length > 1 && products.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden z-50 shadow-2xl max-h-40 overflow-y-auto">
                  {products.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => { addItem(p); setProductSearch(''); }}
                      className="w-full px-4 py-2 flex items-center gap-3 hover:bg-zinc-900 text-[10px] text-left border-b border-zinc-900 last:border-none"
                    >
                      <div className="h-8 w-8 rounded bg-zinc-900 relative overflow-hidden flex-shrink-0">
                        {p.images?.[0]?.url && <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />}
                      </div>
                      <div className="flex-1 truncate">
                        <p className="font-bold text-white truncate">{p.name}</p>
                        <p className="text-primary">{formatCurrency(p.basePrice)}</p>
                      </div>
                      <Plus className="h-3 w-3 text-primary" />
                    </button>
                  ))}
                </div>
               )}
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left">
            <thead className="bg-zinc-950/20 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Artículo</th>
                <th className="px-6 py-4 text-right">Precio</th>
                <th className="px-6 py-4 text-center">Cantidad</th>
                <th className="px-8 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-zinc-600 text-[10px] uppercase font-bold tracking-widest italic">
                    Agrega productos al pedido para comenzar
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.productId} className="text-[11px] group hover:bg-zinc-800/10 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 relative overflow-hidden flex-shrink-0 shadow-md">
                          {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate max-w-[250px]">{item.name}</p>
                          <p className="text-[9px] text-zinc-600 font-mono mt-0.5">SKU: {item.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        {item.discount > 0 && (
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] text-zinc-600 line-through">{formatCurrency(item.basePrice)}</span>
                            <span className="text-[8px] bg-primary/10 text-primary px-1 rounded font-bold">-{item.discount}%</span>
                          </div>
                        )}
                        <span className="text-zinc-300 font-medium">{formatCurrency(item.price)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => updateQty(item.productId, -1)} 
                          className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-white transition-all"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        
                        <input 
                          type="number"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => updateExactQty(item.productId, e.target.value)}
                          onBlur={() => {
                            if (item.quantity < item.minOrderQty) {
                              updateExactQty(item.productId, item.minOrderQty.toString());
                              toast.error(`Mínimo ${item.minOrderQty} unidades`);
                            }
                          }}
                          className="w-12 bg-zinc-950 border border-zinc-800 rounded-md py-1 text-center font-bold text-white text-[11px] outline-none focus:border-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />

                        <button 
                          onClick={() => updateQty(item.productId, 1)} 
                          className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-white transition-all"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                        
                        <button 
                          onClick={() => removeItem(item.productId)} 
                          className="ml-2 text-zinc-700 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right font-bold text-white">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>

          {/* Resumen Interno */}
          <div className="bg-zinc-950/40 p-8 flex justify-end">
            <div className="w-64 space-y-3">
              <div className="flex justify-between items-center text-[10px] text-zinc-500">
                <span>Subtotal de artículos:</span>
                <span className="font-bold text-zinc-300">{formatCurrency(totals.net)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-white border-t border-zinc-800 pt-3 mt-3">
                <span className="uppercase tracking-widest text-[11px]">Total del pedido:</span>
                <span className="text-primary">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-zinc-800 bg-zinc-950/20 flex gap-3">
             <button className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Agregar artículo(s)</button>
             <button className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Agregar cargo</button>
             <button className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Agregar envío</button>
             <button className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Agregar impuesto</button>
             <div className="flex-1" />
             <button onClick={() => router.back()} className="px-6 py-2 bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Cancelar</button>
              {isClient ? (
                <>
                  <button 
                    onClick={() => handleSubmit(OrderStatus.DRAFT)} 
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    Guardar Borrador
                  </button>
                  <button 
                    onClick={() => handleSubmit(OrderStatus.PENDING)} 
                    disabled={isSubmitting}
                    className="px-8 py-2 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                    Enviar Pedido
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => handleSubmit()} 
                  disabled={isSubmitting}
                  className="px-8 py-2 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  Guardar
                </button>
              )}
          </div>
        </div>

      </div>

      {/* Barra Lateral */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Acciones del Pedido */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl">
           <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-4 flex items-center justify-between">
              Acciones del Pedido
              <ChevronDown className="h-3 w-3" />
           </h4>
           <div className="space-y-4">
              {isClient ? (
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleSubmit(OrderStatus.DRAFT)} 
                    disabled={isSubmitting}
                    className="w-full h-11 bg-zinc-800 text-zinc-300 border border-zinc-700 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    Guardar Borrador
                  </button>
                  <button 
                    onClick={() => handleSubmit(OrderStatus.PENDING)} 
                    disabled={isSubmitting}
                    className="w-full h-11 bg-primary text-black rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                    Enviar Pedido
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                     <select className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-[10px] text-zinc-400 outline-none">
                        <option>Elige una acción...</option>
                        <option>Enviar por correo</option>
                        <option>Volver a enviar aviso</option>
                     </select>
                     <button className="p-2.5 bg-zinc-800 border border-zinc-700 text-primary rounded-xl hover:bg-zinc-700 transition-all">
                        <ChevronRight className="h-4 w-4" />
                     </button>
                  </div>
                  <button 
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting}
                    className="w-full h-11 bg-primary text-black rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                     {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                     Crear
                  </button>
                </>
              )}
           </div>
        </div>

        {/* Atribución */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
           <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-4 flex items-center justify-between">
              Atribución de Pedido
              <ChevronDown className="h-3 w-3" />
           </h4>
           <div className="space-y-1">
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Origen</p>
              <p className="text-xs text-zinc-400">Desconocido</p>
           </div>
        </div>

        {/* Notas del Pedido */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl">
           <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-4 flex items-center justify-between">
              Notas del Pedido
              <ChevronDown className="h-3 w-3" />
           </h4>
           <div className="space-y-4">
              <div className="space-y-2">
                 <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter flex items-center gap-1.5">
                   Agregar nota 
                   <span className="h-3 w-3 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] text-zinc-500">?</span>
                 </p>
                 <textarea className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[11px] text-zinc-400 outline-none min-h-[80px] resize-none focus:border-primary/40 transition-all" />
              </div>
              <div className="flex gap-2">
                 <select className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] text-zinc-400 outline-none">
                    <option>Nota privada</option>
                    <option>Nota al cliente</option>
                 </select>
                 <button className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold transition-all">
                    Agregar
                 </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
