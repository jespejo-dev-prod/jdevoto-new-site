'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useCustomers, useCustomer } from '@/modules/customers/presentation/hooks/useCustomers';
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
  Building2,
  Truck,
  ShoppingCart,
  CheckCircle2,
  ChevronDown,
  FileText,
  Pencil,
  Calendar,
  Clock,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { CHILE_REGIONS } from '@/lib/chile-data';

export function OrderCreateForm({ initialData }: { initialData?: any }) {
  const { user } = useAuth();
  const isClient = user?.role === 'COMPANY_ADMIN' || user?.role === 'BUYER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SALES_REP';
  
  const router = useRouter();
  const { fetcher } = useApi();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos completos del cliente si es cliente
  const companyId = user?.company?.id || user?.companyId;
  const { data: customerDetails, isLoading: loadingCustomerDetails } = useCustomer(
    isClient && companyId ? companyId : ''
  );

  // Estados del Pedido
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(
    isClient ? OrderStatus.PENDING : (initialData?.status || OrderStatus.CONFIRMED)
  );
  
  const [creationDate, setCreationDate] = useState(
    initialData?.createdAt ? format(new Date(initialData.createdAt), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(initialData?.company || null);

  const [paymentMethod, setPaymentMethod] = useState<string>(
    initialData?.paymentMethod || 'transfer'
  );

  const [shippingMethod, setShippingMethod] = useState<'free' | 'client_pays'>(
    initialData?.shippingAddress?.shippingMethod || 'client_pays'
  );

  const [selectedCourier, setSelectedCourier] = useState<string>(
    initialData?.shippingAddress?.courier && ['Starken', 'Chilexpress', 'Blue Express', 'Pullman Cargo', 'Varmontt', 'Cruz del Sur'].includes(initialData.shippingAddress.courier)
      ? initialData.shippingAddress.courier
      : initialData?.shippingAddress?.courier === 'FLETE INCLUIDO' || initialData?.shippingAddress?.shippingMethod === 'free'
        ? ''
        : initialData?.shippingAddress?.courier
          ? 'otro'
          : ''
  );

  const [customCourier, setCustomCourier] = useState<string>(
    initialData?.shippingAddress?.courier && !['Starken', 'Chilexpress', 'Blue Express', 'Pullman Cargo', 'Varmontt', 'Cruz del Sur', 'FLETE INCLUIDO', 'POR PAGAR'].includes(initialData.shippingAddress.courier)
      ? initialData.shippingAddress.courier
      : ''
  );

  // Auto-cargar cliente si es cliente de la plataforma
  useEffect(() => {
    if (isClient && customerDetails) {
      setSelectedCustomer(customerDetails);
    }
  }, [isClient, customerDetails]);

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

  // Sincronizar direcciones con cliente seleccionado
  useEffect(() => {
    if (selectedCustomer) {
      setBillingAddress({
        street: selectedCustomer.billingStreet || selectedCustomer.direccion || '',
        number: selectedCustomer.billingNumber || '',
        commune: selectedCustomer.billingCommune || selectedCustomer.comuna || '',
        city: selectedCustomer.billingCity || selectedCustomer.ciudad || '',
        email: selectedCustomer.billingEmail || selectedCustomer.email || ''
      });

      // Normalizar región y comuna con CHILE_REGIONS para consistencia
      const customerReg = (selectedCustomer.shippingRegion || selectedCustomer.region || '').trim().toUpperCase();
      const customerCom = (selectedCustomer.shippingCommune || selectedCustomer.comuna || '').trim().toUpperCase();
      
      const matchedRegion = CHILE_REGIONS.find(r => r.name.trim().toUpperCase() === customerReg);
      const matchedCommune = matchedRegion?.comunas.find(c => c.name.trim().toUpperCase() === customerCom);

      setShippingAddress({
        street: selectedCustomer.shippingStreet || selectedCustomer.direccion || '',
        number: selectedCustomer.shippingNumber || '',
        commune: matchedCommune ? matchedCommune.name : (selectedCustomer.shippingCommune || selectedCustomer.comuna || ''),
        region: matchedRegion ? matchedRegion.name : (selectedCustomer.shippingRegion || selectedCustomer.region || '')
      });
    }
  }, [selectedCustomer]);
  
  // Búsqueda
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [activeProductIndex, setActiveProductIndex] = useState<number>(-1);
  const [activeCustomerIndex, setActiveCustomerIndex] = useState<number>(-1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomerSearch(customerSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const customerSearchInputRef = useRef<HTMLInputElement>(null);
  const creationDateInputRef = useRef<HTMLInputElement>(null);
  const productSearchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus de inputs al seleccionar o remover clientes
  useEffect(() => {
    if (selectedCustomer) {
      if (creationDateInputRef.current) {
        creationDateInputRef.current.focus();
        if (typeof creationDateInputRef.current.showPicker === 'function') {
          try {
            creationDateInputRef.current.showPicker();
          } catch (e) {
            // ignore
          }
        }
      }
    } else {
      if (customerSearchInputRef.current) {
        customerSearchInputRef.current.focus();
      }
    }
  }, [selectedCustomer]);
  
  // Carrito local
  const [items, setItems] = useState<Array<{
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    minOrderQty: number;
    inner: number;
    stockQuantity: number;
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
    inner: i.product?.inner || 1,
    stockQuantity: i.product?.stockQuantity !== undefined ? Number(i.product.stockQuantity) : 999999,
    basePrice: Number(i.unitNetPrice),
    price: Number(i.unitNetPrice) * (1 - Number(i.discount) / 100),
    discount: Number(i.discount),
    image: i.product?.images?.[0]?.url
  })) || []);

  // Hooks de datos
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers({ search: debouncedCustomerSearch, limit: 5 });
  const { data: productsData, isLoading: loadingProducts } = useProducts({ search: productSearch, limit: 10 });
  const products = productsData?.products || [];

  // Sincronizar índice activo del buscador de clientes
  useEffect(() => {
    if (customers.length > 0) {
      setActiveCustomerIndex(0);
    } else {
      setActiveCustomerIndex(-1);
    }
  }, [customers]);

  // Scroll del buscador de clientes hacia la selección activa
  useEffect(() => {
    if (activeCustomerIndex >= 0) {
      const activeEl = document.getElementById(`search-customer-item-${activeCustomerIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeCustomerIndex]);

  // Sincronizar índice activo del buscador de productos
  useEffect(() => {
    if (products.length > 0) {
      setActiveProductIndex(0);
    } else {
      setActiveProductIndex(-1);
    }
  }, [products]);

  // Scroll del buscador de productos hacia la selección activa
  useEffect(() => {
    if (activeProductIndex >= 0) {
      const activeEl = document.getElementById(`search-product-item-${activeProductIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeProductIndex]);

  const paymentTermsDays = selectedCustomer?.paymentTerms ?? 30;

  const creditDiscountPercent = useMemo(() => {
    if (selectedCustomer && selectedCustomer.paymentTermDiscount !== undefined && selectedCustomer.paymentTermDiscount !== null) {
      return Number(selectedCustomer.paymentTermDiscount);
    }
    if (paymentTermsDays === 90) return 0;
    if (paymentTermsDays === 60) return 4;
    if (paymentTermsDays === 30) return 7;
    if (paymentTermsDays === 0) return 0;
    return 0;
  }, [selectedCustomer, paymentTermsDays]);

  const activePaymentDiscountPercent = useMemo(() => {
    if (paymentMethod === 'credit_b2b') {
      return creditDiscountPercent;
    }
    if (paymentMethod === 'webpay' || paymentMethod === 'transfer' || paymentMethod === 'mercadopago') {
      return 10;
    }
    return 0;
  }, [paymentMethod, creditDiscountPercent]);

  // Cálculos de Totales
  const totals = useMemo(() => {
    const baseNet = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const paymentDiscountAmount = Math.round(baseNet * (activePaymentDiscountPercent / 100));
    const net = baseNet - paymentDiscountAmount;
    const tax = Math.round(net * 0.19);
    const total = net + tax;
    return { baseNet, paymentDiscountAmount, net, tax, total };
  }, [items, activePaymentDiscountPercent]);

  const subtotalBeforeCompanyDiscount = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.basePrice * item.quantity), 0);
  }, [items]);

  const isInsularValparaiso = useMemo(() => {
    if (!shippingAddress.region || !shippingAddress.commune) return false;
    const c = shippingAddress.commune.toUpperCase();
    return c.includes("JUAN FERNANDEZ") || c.includes("ISLA DE PASCUA");
  }, [shippingAddress.region, shippingAddress.commune]);

  const freeShippingMin = useMemo(() => {
    if (!shippingAddress.region || !shippingAddress.commune) return 100000;
    const r = shippingAddress.region.toUpperCase();
    const c = shippingAddress.commune.toUpperCase();

    // Zonas Extremas $1.000.000 (Sur)
    if (
      r.includes("AYSEN") || 
      r.includes("MAGALLANES") ||
      c.includes("PUNTA ARENAS") || 
      c.includes("PUERTO NATALES") || 
      c.includes("AYSEN") ||
      c.includes("PUERTO CISNE") ||
      c.includes("PUERTO AYSEN") ||
      c.includes("COIHAIQUE") ||
      c.includes("COCHRANE") ||
      c.includes("PORVENIR")
    ) {
      return 1000000;
    }

    // Zonas Extremas $500.000 (Norte + Calama)
    if (
      r.includes("TARAPACA") ||
      r.includes("ARICA") ||
      c.includes("ARICA") || 
      c.includes("IQUIQUE") || 
      c.includes("CALAMA")
    ) {
      return 500000;
    }

    // Región Metropolitana y Valparaíso $100.000
    if (r.includes("METROPOLITANA") || r.includes("VALPARAISO")) {
      return 100000;
    }

    return 250000;
  }, [shippingAddress.region, shippingAddress.commune]);

  const selectedComunaInfo = useMemo(() => {
    if (!shippingAddress.region || !shippingAddress.commune) return null;
    const regionObj = CHILE_REGIONS.find(r => r.name === shippingAddress.region);
    return regionObj?.comunas.find(c => c.name === shippingAddress.commune) || null;
  }, [shippingAddress.region, shippingAddress.commune]);

  // Auto-selection of shipping method based on eligibility
  useEffect(() => {
    if (shippingAddress.region && shippingAddress.commune && totals.baseNet >= freeShippingMin && !isInsularValparaiso) {
      setShippingMethod('free');
    } else {
      setShippingMethod('client_pays');
    }
  }, [shippingAddress.region, shippingAddress.commune, totals.baseNet, freeShippingMin, isInsularValparaiso]);

  const addItem = (product: any) => {
    const existing = items.find(i => i.productId === product.id);
    const innerVal = Number(product.inner || 1);
    const minQty = Number(product.minOrderQty || 1);
    const initialQty = Math.max(minQty, innerVal);
    const stockQty = Number(product.stockQuantity ?? 0);

    if (stockQty <= 0) {
      toast.error(`Producto ${product.sku} sin stock disponible.`);
      return;
    }
    
    // Descuento corporativo base
    const discountPercent = Number(selectedCustomer?.defaultDiscount || 0);
    const discountedPrice = product.basePrice * (1 - discountPercent / 100);

    if (existing) {
      let newQty = existing.quantity + initialQty;
      if (newQty > stockQty) {
        newQty = stockQty;
        // Ajustar a múltiplos de inner pack dentro del stock
        if (newQty % innerVal !== 0) {
          newQty = Math.floor(newQty / innerVal) * innerVal;
        }
        if (newQty === existing.quantity) {
          toast.error(`No se puede agregar más. Stock máximo alcanzado (${stockQty} unidades).`);
          return;
        }
        toast.warning(`Cantidad ajustada al stock máximo disponible: ${newQty} unidades.`);
      }
      setItems(items.map(i => i.productId === product.id ? { ...i, quantity: newQty } : i));
    } else {
      let finalQty = initialQty;
      if (finalQty > stockQty) {
        finalQty = stockQty;
        // Ajustar a múltiplos de inner pack dentro del stock
        if (finalQty % innerVal !== 0) {
          finalQty = Math.floor(finalQty / innerVal) * innerVal;
        }
        if (finalQty <= 0) {
          toast.error(`Stock insuficiente para cumplir la cantidad de empaque (${innerVal} u).`);
          return;
        }
        toast.warning(`Cantidad inicial ajustada al stock disponible: ${finalQty} unidades.`);
      }
      setItems([...items, {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: finalQty,
        minOrderQty: minQty,
        inner: innerVal,
        stockQuantity: stockQty,
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
        const step = i.inner || 1;
        const change = delta * step;
        let newQty = i.quantity + change;
        const minQty = Math.max(i.minOrderQty || 1, step);
        
        if (newQty < minQty) {
          newQty = minQty;
          toast.error(`La cantidad mínima es ${minQty} unidades`);
        }
        if (newQty > i.stockQuantity) {
          newQty = i.stockQuantity;
          if (newQty % step !== 0) {
            newQty = Math.floor(newQty / step) * step;
          }
          if (newQty < minQty) newQty = minQty;
          toast.error(`Stock insuficiente. Máximo disponible: ${i.stockQuantity}`);
        }
        
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

    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    
    setItems(items.map(i => {
      if (i.productId === productId) {
        let cleanQty = num;
        const minQty = Math.max(i.minOrderQty || 1, i.inner || 1);
        const step = i.inner || 1;
        
        if (cleanQty > i.stockQuantity) {
          cleanQty = i.stockQuantity;
          toast.error(`Stock insuficiente. Solo quedan ${i.stockQuantity} unidades.`);
        }
        
        return { ...i, quantity: cleanQty };
      }
      return i;
    }));
  };

  const handleSubmit = async (overrideStatus?: OrderStatus) => {
    if (!selectedCustomer) return toast.error("Selecciona un cliente");
    if (items.length === 0) return toast.error("Agrega al menos un producto al carrito");

    // Validar que la fecha no esté en el pasado
    const selected = new Date(creationDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    selected.setHours(0,0,0,0);
    if (selected < today) {
      return toast.error("La fecha de creación no puede ser en el pasado.");
    }

    // El cliente (COMPANY_ADMIN) solo puede crear con estado PENDING
    const finalStatus = isClient ? OrderStatus.PENDING : (overrideStatus || orderStatus);

    setIsSubmitting(true);
    try {
      let finalCreatedAt: Date;
      if (initialData?.createdAt) {
        const originalTime = format(new Date(initialData.createdAt), 'HH:mm:ss');
        finalCreatedAt = new Date(`${creationDate}T${originalTime}`);
      } else {
        const now = new Date();
        const timeStr = format(now, 'HH:mm:ss');
        finalCreatedAt = new Date(`${creationDate}T${timeStr}`);
      }

      const payload = {
        companyId: selectedCustomer.id,
        status: finalStatus,
        createdAt: finalCreatedAt,
        paymentMethod,
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
          shippingMethod,
          courier: shippingMethod === 'free' 
            ? (selectedComunaInfo?.transport || 'FLETE INCLUIDO')
            : (selectedCourier === 'otro' ? customCourier : selectedCourier) || 'POR PAGAR',
          estimatedDelivery: selectedComunaInfo?.deliveryTime || null,
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
      toast.error(err.message || "Error al procesar el pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

  const todayString = format(new Date(), 'yyyy-MM-dd');

  // Si está cargando los datos completos del cliente administrador
  if (isClient && loadingCustomerDetails) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Cargando datos de empresa...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700 pb-24">
      
      {/* Columna Principal: Carrito y Configuración */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* Paso 1: Selección de Cliente y Configuración del Pedido */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-800/60 pb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-extrabold text-white uppercase tracking-wider">
              1. Cliente & Configuración General
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Buscador de Cliente (Sólo Internos, deshabilitado para clientes) */}
            <div className="space-y-2">
              <label className="text-sm font-extrabold text-zinc-400 uppercase tracking-wider px-1">Cliente / Cuenta Empresa</label>
              {!selectedCustomer ? (
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-500" />
                  <input 
                    ref={customerSearchInputRef}
                    type="text"
                    placeholder="Buscar por RUT o Nombre..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (customers.length > 0) {
                          setActiveCustomerIndex((prev) => (prev < customers.length - 1 ? prev + 1 : 0));
                        }
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (customers.length > 0) {
                          setActiveCustomerIndex((prev) => (prev > 0 ? prev - 1 : customers.length - 1));
                        }
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const targetIdx = activeCustomerIndex >= 0 && activeCustomerIndex < customers.length ? activeCustomerIndex : 0;
                        if (customers.length > 0 && customers[targetIdx]) {
                          setSelectedCustomer(customers[targetIdx]);
                          setCustomerSearch('');
                        }
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setCustomerSearch('');
                      }
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 pl-11 pr-4 text-base text-white focus:border-primary/50 outline-none transition-all font-semibold"
                  />
                  {customerSearch.length > 1 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden z-50 shadow-2xl max-h-60 overflow-y-auto ring-1 ring-zinc-800">
                      {loadingCustomers ? (
                        <div className="p-4 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-600" /></div>
                      ) : customers.length > 0 ? (
                        customers.map((c: any, idx: number) => (
                          <button
                            key={c.id}
                            id={`search-customer-item-${idx}`}
                            type="button"
                            onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                            className={cn(
                              "w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-900 text-left border-b border-zinc-900 last:border-none transition-colors group",
                              idx === activeCustomerIndex && "bg-zinc-800/80 text-white"
                            )}
                          >
                            <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                              <Building2 className="h-4 w-4 text-zinc-500" />
                            </div>
                            <div className="min-w-0 flex-1 py-1">
                              <p className="text-base font-extrabold text-white truncate">{c.razonSocial}</p>
                              {c.rut && (
                                <div className="inline-flex mt-1.5 px-2.5 py-0.5 rounded-lg bg-primary/15 border border-primary/30 text-xs font-bold text-primary w-fit shadow-sm tracking-wide">
                                  {c.rut}
                                </div>
                              )}
                            </div>
                            <Plus className="h-4.5 w-4.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))
                       ) : customerSearch.length > 2 && (
                        <div className="p-4 text-center text-xs text-zinc-500 uppercase font-bold tracking-widest italic">No se encontraron clientes</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-primary flex-shrink-0 shadow-inner">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[17px] font-bold text-white truncate max-w-[300px]">{selectedCustomer.razonSocial}</p>
                      {selectedCustomer.rut && (
                        <div className="inline-flex mt-1.5 px-3 py-0.5 rounded-lg bg-primary/15 border border-primary/30 text-sm font-bold text-primary w-fit shadow-sm tracking-wide">
                          {selectedCustomer.rut}
                        </div>
                      )}
                    </div>
                  </div>
                  {!isClient && (
                    <button 
                      id="clear-customer-button"
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="p-1.5 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Fecha de Creación */}
            <div className="space-y-2">
              <label className="text-sm font-extrabold text-zinc-400 uppercase tracking-wider px-1">Fecha de Creación (Igual o superior a hoy)</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-500 pointer-events-none" />
                <input 
                  ref={creationDateInputRef}
                  type="date" 
                  value={creationDate}
                  min={todayString}
                  onFocus={(e) => {
                    if (typeof e.target.showPicker === 'function') {
                      try {
                        e.target.showPicker();
                      } catch (err) {
                        // ignore
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      if (e.shiftKey) {
                        if (selectedCustomer) {
                          const clearBtn = document.getElementById('clear-customer-button');
                          if (clearBtn) {
                            (clearBtn as HTMLElement).focus();
                          }
                        } else {
                          if (customerSearchInputRef.current) {
                            customerSearchInputRef.current.focus();
                          }
                        }
                      } else {
                        if (productSearchInputRef.current) {
                          productSearchInputRef.current.focus();
                        }
                      }
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    const selected = new Date(val);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    selected.setHours(0,0,0,0);
                    if (selected < today) {
                      toast.error("La fecha no puede ser en el pasado.");
                      return;
                    }
                    setCreationDate(val);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 pl-10 pr-4 text-base text-white focus:border-primary/50 outline-none font-semibold"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Paso 2: El Carrito de Artículos */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden">
          
          <div className="p-8 border-b border-zinc-800 bg-zinc-950/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-extrabold text-white uppercase tracking-wider">
                2. Artículos en Carrito
              </h3>
            </div>
 
            {/* Buscador de Productos */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-500" />
              <input 
                ref={productSearchInputRef}
                type="text"
                placeholder="Buscar y agregar producto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (products.length > 0) {
                      setActiveProductIndex((prev) => (prev < products.length - 1 ? prev + 1 : 0));
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (products.length > 0) {
                      setActiveProductIndex((prev) => (prev > 0 ? prev - 1 : products.length - 1));
                    }
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const targetIdx = activeProductIndex >= 0 && activeProductIndex < products.length ? activeProductIndex : 0;
                    if (products.length > 0 && products[targetIdx]) {
                      addItem(products[targetIdx]);
                      setProductSearch('');
                    } else if (productSearch.trim() !== '') {
                      toast.error("No se encontró ningún producto con esa búsqueda");
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setProductSearch('');
                  }
                }}
                disabled={!selectedCustomer}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-11 pl-11 pr-4 text-base text-white focus:border-primary/50 outline-none font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {productSearch.length > 1 && products.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden z-50 shadow-2xl max-h-60 overflow-y-auto ring-1 ring-zinc-800">
                  {products.map((p: any, idx: number) => (
                    <button
                      key={p.id}
                      id={`search-product-item-${idx}`}
                      type="button"
                      onClick={() => { addItem(p); setProductSearch(''); }}
                      className={cn(
                        "w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-900 text-left border-b border-zinc-900 last:border-none transition-colors",
                        idx === activeProductIndex && "bg-zinc-800/80 text-white"
                      )}
                    >
                      <div className="h-10 w-10 rounded-lg bg-zinc-900 relative overflow-hidden flex-shrink-0 border border-zinc-850">
                        {p.images?.[0]?.url && <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />}
                      </div>
                      <div className="flex-1 truncate">
                        <p className="text-sm font-bold text-white truncate">{p.name}</p>
                        <p className="text-sm font-extrabold text-amber-500 font-mono mt-1">SKU: {p.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{formatCurrency(p.basePrice)}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">Mín: {p.minOrderQty || 1} u</p>
                      </div>
                      <Plus className="h-4 w-4 text-primary ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
 
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left">
              <thead className="bg-zinc-950/40 text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800/80">
                <tr>
                  <th className="px-8 py-5">Artículo</th>
                  <th className="px-6 py-5 text-right">Precio Neto</th>
                  <th className="px-6 py-5 text-center">Cantidad</th>
                  <th className="px-8 py-5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-zinc-500 text-sm uppercase font-bold tracking-widest italic">
                      No hay productos agregados al pedido. Utiliza el buscador superior para agregar ítems.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.productId} className="text-sm hover:bg-zinc-800/10 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 relative overflow-hidden flex-shrink-0 shadow-md">
                            {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-100 truncate max-w-[320px] text-sm md:text-base uppercase tracking-tight">{item.name}</p>
                            <p className="text-[15px] font-extrabold text-amber-500 font-mono mt-1.5">SKU: {item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col items-end">
                          {item.discount > 0 && (
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-base font-bold text-zinc-500 line-through">{formatCurrency(item.basePrice)}</span>
                              <span className="text-sm bg-primary/15 text-primary px-2.5 py-0.5 rounded-md font-bold">-{item.discount}%</span>
                            </div>
                          )}
                          <span className="text-white font-black text-lg md:text-xl">{formatCurrency(item.price)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            type="button"
                            tabIndex={-1}
                            onClick={() => updateQty(item.productId, -1)} 
                            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all border border-zinc-850"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          
                          <input 
                            type="number"
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={(e) => updateExactQty(item.productId, e.target.value)}
                            onBlur={() => {
                              const step = item.inner || 1;
                              const minQty = Math.max(item.minOrderQty || 1, step);
                              let cleanQty = item.quantity;

                              if (cleanQty < minQty) {
                                cleanQty = minQty;
                                toast.error(`La cantidad mínima de pedido es ${minQty} unidades`);
                              } else if (cleanQty % step !== 0) {
                                cleanQty = Math.round(cleanQty / step) * step;
                                if (cleanQty > item.stockQuantity) {
                                  cleanQty = Math.floor(item.stockQuantity / step) * step;
                                }
                                toast.info(`Cantidad ajustada a múltiplo de empaque (${step}): ${cleanQty}`);
                              }

                              if (cleanQty > item.stockQuantity) {
                                cleanQty = item.stockQuantity;
                                if (cleanQty % step !== 0) {
                                  cleanQty = Math.floor(cleanQty / step) * step;
                                }
                                if (cleanQty < minQty) cleanQty = minQty;
                                toast.error(`Stock insuficiente. Máximo disponible: ${item.stockQuantity}`);
                              }

                              setItems(items.map(i => i.productId === item.productId ? { ...i, quantity: cleanQty } : i));
                            }}
                            className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg py-2 text-center font-bold text-white text-base outline-none focus:border-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />

                          <button 
                            type="button"
                            tabIndex={-1}
                            onClick={() => updateQty(item.productId, 1)} 
                            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all border border-zinc-850"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          
                          <button 
                            type="button"
                            tabIndex={-1}
                            onClick={() => removeItem(item.productId)} 
                            className="ml-3 p-2 hover:bg-red-500/10 text-zinc-655 hover:text-red-500 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-white text-base md:text-lg">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Paso 3: Datos de Envío & Facturación (Checkout) */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl space-y-8">
          
          <div className="flex items-center gap-3 border-b border-zinc-800/60 pb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-extrabold text-white uppercase tracking-wider">
              3. Datos de Envío & Facturación
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 divide-y md:divide-y-0 md:divide-x divide-zinc-800/60">
            
            {/* Sección: Dirección de Envío */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <Truck className="h-4.5 w-4.5 text-primary" />
                  Dirección de Envío
                </h4>
                <button 
                  type="button"
                  onClick={() => setIsEditingShipping(!isEditingShipping)}
                  className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"
                  disabled={!selectedCustomer}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              {isEditingShipping ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[13px] font-bold text-zinc-500 uppercase px-1">Calle</label>
                    <input 
                      placeholder="Calle" 
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 px-4 text-base text-white outline-none focus:border-primary/40 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 col-span-1">
                      <label className="text-[13px] font-bold text-zinc-500 uppercase px-1">N°</label>
                      <input 
                        placeholder="N°" 
                        value={shippingAddress.number}
                        onChange={(e) => setShippingAddress({...shippingAddress, number: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 px-4 text-base text-white outline-none focus:border-primary/40 font-medium"
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="text-[13px] font-bold text-zinc-500 uppercase px-1">Región</label>
                      <div className="relative">
                        <select
                          value={shippingAddress.region}
                          onChange={(e) => {
                            const nextReg = e.target.value;
                            const nextComunas = CHILE_REGIONS.find(r => r.name === nextReg)?.comunas || [];
                            const firstComuna = nextComunas[0]?.name || '';
                            setShippingAddress({
                              ...shippingAddress,
                              region: nextReg,
                              commune: firstComuna
                            });
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 px-4 pr-8 text-base text-white outline-none focus:border-primary/40 font-medium appearance-none cursor-pointer"
                        >
                          <option value="">Selecciona Región...</option>
                          {CHILE_REGIONS.map(r => (
                            <option key={r.name} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[13px] font-bold text-zinc-500 uppercase px-1">Comuna</label>
                    <div className="relative">
                      <select
                        value={shippingAddress.commune}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, commune: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 px-4 pr-8 text-base text-white outline-none focus:border-primary/40 font-medium appearance-none cursor-pointer"
                      >
                        <option value="">Selecciona Comuna...</option>
                        {(CHILE_REGIONS.find(r => r.name === shippingAddress.region)?.comunas || []).map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-6 space-y-4">
                  {selectedCustomer ? (
                    <div className="text-sm space-y-3">
                      <div className="flex items-start gap-3">
                        <Truck className="h-5 w-5 text-zinc-500 mt-1" />
                        <div>
                          <p className="font-extrabold text-zinc-100 text-base md:text-lg">{shippingAddress.street} {shippingAddress.number}</p>
                          <p className="text-zinc-350 font-extrabold uppercase text-sm md:text-base mt-2 tracking-wider">
                            {shippingAddress.commune}, {shippingAddress.region}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-650 italic">Por favor, selecciona un cliente para cargar su dirección.</p>
                  )}
                </div>
              )}
            </div>

            {/* Sección: Datos de Facturación */}
            <div className="pt-6 md:pt-0 md:pl-12 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-primary" />
                  Facturación
                </h4>
                <button 
                  type="button"
                  onClick={() => setIsEditingBilling(!isEditingBilling)}
                  className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"
                  disabled={!selectedCustomer}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              {isEditingBilling ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[13px] font-bold text-zinc-500 uppercase px-1">Calle</label>
                    <input 
                      placeholder="Calle" 
                      value={billingAddress.street}
                      onChange={(e) => setBillingAddress({...billingAddress, street: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 px-4 text-base text-white outline-none focus:border-primary/40 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 col-span-1">
                      <label className="text-[13px] font-bold text-zinc-500 uppercase px-1">N°</label>
                      <input 
                        placeholder="N°" 
                        value={billingAddress.number}
                        onChange={(e) => setBillingAddress({...billingAddress, number: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 px-4 text-base text-white outline-none focus:border-primary/40 font-medium"
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="text-[13px] font-bold text-zinc-500 uppercase px-1">Comuna</label>
                      <input 
                        placeholder="Comuna" 
                        value={billingAddress.commune}
                        onChange={(e) => setBillingAddress({...billingAddress, commune: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 px-4 text-base text-white outline-none focus:border-primary/40 font-medium"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[13px] font-bold text-zinc-500 uppercase px-1">Ciudad</label>
                      <input 
                        placeholder="Ciudad" 
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 px-4 text-base text-white outline-none focus:border-primary/40 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[13px] font-bold text-zinc-500 uppercase px-1">DTE Email</label>
                      <input 
                        placeholder="facturacion@empresa.cl" 
                        value={billingAddress.email}
                        onChange={(e) => setBillingAddress({...billingAddress, email: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 px-4 text-base text-white outline-none focus:border-primary/40 font-medium"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-6 space-y-4">
                  {selectedCustomer ? (
                    <div className="text-sm space-y-3">
                      <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 text-zinc-500 mt-1" />
                        <div>
                          <p className="font-extrabold text-zinc-100 text-base md:text-lg">{billingAddress.street} {billingAddress.number}</p>
                          <p className="text-zinc-350 font-extrabold uppercase text-sm md:text-base mt-2 tracking-wider">
                            {billingAddress.commune}, {billingAddress.city}
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-zinc-850/50 pt-3 flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email XML DTE</span>
                        <span className="text-zinc-100 font-black font-mono text-base md:text-lg mt-1">{billingAddress.email || '—'}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-650 italic">Por favor, selecciona un cliente para cargar su dirección.</p>
                  )}
                </div>
              )}
            </div>

          </div>

          {selectedCustomer && (
            <div className="border-t border-zinc-800/60 pt-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Truck className="h-4.5 w-4.5" />
                </div>
                <h4 className="text-base font-extrabold text-zinc-200 uppercase tracking-wider">
                  Modalidad & Transporte de Despacho
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Modalidad de Flete */}
                <div className="space-y-3">
                  <label className="text-sm font-extrabold text-zinc-300 uppercase tracking-wider px-1">
                    Modalidad de Flete
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Flete por Pagar */}
                    <button
                      type="button"
                      onClick={() => setShippingMethod('client_pays')}
                      className={cn(
                        "p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-1",
                        shippingMethod === 'client_pays'
                          ? "border-primary bg-primary/5 text-white"
                          : "border-zinc-800 hover:bg-zinc-900/40 text-zinc-455"
                      )}
                    >
                      <span className="font-extrabold text-base uppercase">Flete por Pagar</span>
                      <span className="text-xs text-zinc-400 uppercase font-extrabold mt-1">A cargo del cliente en destino</span>
                    </button>

                    {/* Flete Incluido */}
                    {isInsularValparaiso ? (
                      <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/10 opacity-50 cursor-not-allowed flex flex-col gap-1 text-left">
                        <span className="font-extrabold text-base uppercase text-zinc-500">Flete Incluido</span>
                        <span className="text-xs font-bold text-red-500 uppercase mt-1">No disponible en isla</span>
                      </div>
                    ) : (
                      (() => {
                        const canFreeShipping = totals.baseNet >= freeShippingMin;
                        const missingForFree = freeShippingMin - totals.baseNet;
                        return (
                          <button
                            type="button"
                            disabled={!canFreeShipping}
                            onClick={() => setShippingMethod('free')}
                            className={cn(
                              "p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-1",
                              shippingMethod === 'free'
                                ? "border-emerald-500 bg-emerald-500/10 text-white"
                                : canFreeShipping
                                  ? "border-zinc-700 hover:border-emerald-500/30 hover:bg-zinc-900/60"
                                  : "border-zinc-800/80 bg-zinc-900/40 cursor-not-allowed"
                            )}
                          >
                            <span className={cn(
                              "font-extrabold text-base uppercase",
                              shippingMethod === 'free' ? "text-emerald-400" : (canFreeShipping ? "text-emerald-500" : "text-emerald-500/60")
                            )}>Flete Incluido</span>
                            {canFreeShipping ? (
                              <span className="text-xs text-emerald-400 uppercase font-extrabold mt-1">Despacho Gratis</span>
                            ) : (
                              <span className="text-xs font-bold text-red-400 uppercase mt-1">
                                Falta {formatCurrency(missingForFree)} (Mín: {formatCurrency(freeShippingMin)})
                              </span>
                            )}
                          </button>
                        );
                      })()
                    )}
                  </div>
                </div>

                {/* Transporte de Preferencia */}
                {shippingMethod === 'client_pays' ? (
                  <div className="space-y-3">
                    <label className="text-sm font-extrabold text-zinc-350 uppercase tracking-wider px-1">
                      Transporte de Preferencia (Por Pagar)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <select
                          value={selectedCourier}
                          onChange={(e) => {
                            setSelectedCourier(e.target.value);
                            if (e.target.value !== 'otro') {
                              setCustomCourier('');
                            }
                          }}
                          className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl px-4 pr-10 text-sm font-semibold text-white outline-none focus:border-primary/50 cursor-pointer appearance-none"
                        >
                          <option value="" className="text-zinc-500">Selecciona un transporte...</option>
                          <option value="Starken">Starken</option>
                          <option value="Chilexpress">Chilexpress</option>
                          <option value="Blue Express">Blue Express</option>
                          <option value="Pullman Cargo">Pullman Cargo</option>
                          <option value="Varmontt">Varmontt</option>
                          <option value="Cruz del Sur">Cruz del Sur</option>
                          <option value="otro">Otro (Especificar...)</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                      </div>

                      {selectedCourier === 'otro' && (
                        <input
                          value={customCourier}
                          onChange={(e) => setCustomCourier(e.target.value)}
                          placeholder="Nombre del transporte"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 px-4 text-sm text-white font-medium outline-none focus:border-primary/50"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                      <Truck className="h-6 w-6 text-primary" />
                      <div>
                        <p className="text-xs md:text-sm font-extrabold text-primary uppercase tracking-wider">Courier Asignado automáticamente</p>
                        <p className="text-base md:text-lg font-black text-white uppercase mt-1 tracking-wide">
                          {selectedComunaInfo?.transport || 'FLETE INCLUIDO'}
                        </p>
                        {selectedComunaInfo?.deliveryTime && (
                          <p className="text-xs md:text-sm text-zinc-350 font-extrabold mt-1">
                            Plazo estimado: {selectedComunaInfo.deliveryTime}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Columna Lateral: Resumen del Pedido (Checkout) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Card: Resumen de Compra */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 space-y-6 shadow-xl sticky top-24">
          <h4 className="text-base font-extrabold text-white uppercase tracking-wider border-b border-zinc-800/80 pb-4">
            Resumen del Pedido (Checkout)
          </h4>

          <div className="space-y-4">
            
            {/* Estado de Pedido (Fijo a PENDING si es cliente, selector si es ADMIN) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">Estado de Orden</label>
              {isClient ? (
                <div className="h-12 bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-base font-bold text-white">Pendiente de Autorización</span>
                </div>
              ) : (
                <div className="relative">
                  <select 
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 px-4 text-base text-white focus:border-primary/50 outline-none appearance-none cursor-pointer font-bold"
                  >
                    <option value={OrderStatus.PENDING}>Pendiente</option>
                    <option value={OrderStatus.CONFIRMED}>Confirmado</option>
                    <option value={OrderStatus.SHIPPED}>Enviado</option>
                    <option value={OrderStatus.DELIVERED}>Entregado</option>
                    <option disabled>────────────────────</option>
                    <option value={OrderStatus.DRAFT}>Borrador</option>
                    <option value={OrderStatus.REJECTED}>Rechazado</option>
                    <option value={OrderStatus.CANCELLED}>Cancelado</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Medio de Pago */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">Medio de Pago</label>
              <div className="relative">
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={!selectedCustomer}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 px-4 text-base text-white focus:border-primary/50 outline-none appearance-none cursor-pointer font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="transfer">Transferencia Bancaria Directa (10% OFF)</option>
                  <option value="webpay">Mercado Pago (10% OFF)</option>
                  <option value="credit_b2b">Crédito Directo B2B ({creditDiscountPercent}% OFF)</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* Desglose de Precios */}
            <div className="space-y-4 pt-4 border-t border-zinc-800/60">
              <div className="flex justify-between items-center text-base text-zinc-300">
                <span className="font-semibold">Subtotal Neto</span>
                <span className="font-extrabold text-white text-lg">{formatCurrency(totals.baseNet)}</span>
              </div>

              {totals.paymentDiscountAmount > 0 && (
                <div className="flex justify-between items-center text-base text-emerald-400">
                  <span className="font-semibold">Dcto. Pago ({activePaymentDiscountPercent}%)</span>
                  <span className="font-extrabold text-lg">-{formatCurrency(totals.paymentDiscountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-base text-zinc-300">
                <span className="font-semibold">IVA (19%)</span>
                <span className="font-extrabold text-white text-lg">{formatCurrency(totals.tax)}</span>
              </div>
              
              <div className="h-px bg-zinc-800/80 my-3" />
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Bruto</span>
                <span className="text-3xl font-black text-primary tracking-tight">{formatCurrency(totals.total)}</span>
              </div>
            </div>

            {/* Botones de Envío / Creación */}
            <div className="space-y-3 pt-6">
              {isClient ? (
                <button
                  type="button"
                  onClick={() => handleSubmit(OrderStatus.PENDING)}
                  disabled={isSubmitting || items.length === 0}
                  className="w-full bg-zinc-950 hover:bg-blue-950/40 border border-blue-800/80 hover:border-blue-500 text-blue-400 hover:text-blue-300 h-12 rounded-2xl font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {isSubmitting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <CheckCircle2 className="h-4.5 w-4.5" />}
                  Enviar Pedido Pendiente
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting || items.length === 0}
                  className="w-full bg-zinc-950 hover:bg-blue-950/40 border border-blue-800/80 hover:border-blue-500 text-blue-400 hover:text-blue-300 h-12 rounded-2xl font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {isSubmitting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <CheckCircle2 className="h-4.5 w-4.5" />}
                  Crear Pedido
                </button>
              )}

              <button
                type="button"
                onClick={() => router.back()}
                className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-450 hover:text-white h-12 rounded-2xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-xs"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
