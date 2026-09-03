'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, ChevronRight, Lock, 
  CreditCard, Building2, CheckCircle2,
  ArrowLeft, Calendar, FileText, Ticket,
  Truck, Wallet, Edit2, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { CHILE_REGIONS } from '@/lib/chile-data';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';
import { PromoCountdownBanner } from '@/components/cart/PromoCountdownBanner';

import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, syncPrices, selectedClientForOrder } = useCart();
  const { user, accessToken, refresh } = useAuth();

  // Sync cart prices when visiting checkout to discard any expired promotions
  useEffect(() => {
    syncPrices();
  }, [syncPrices]);

  const effectiveCompany = user?.role === 'SALES_REP' ? selectedClientForOrder : user?.company;

  const companyDiscountPercent = effectiveCompany?.defaultDiscount ? Number(effectiveCompany.defaultDiscount) : 0;
  const paymentTermsDays = effectiveCompany?.paymentTerms ?? 30;

  const excludedSubtotal = items
    .filter(item => item.priceSource === 'PROMOTION' || item.priceSource === 'OUTLET' || item.sku === 'TEST-001')
    .reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);

  const nonExcludedSubtotal = items
    .filter(item => item.priceSource !== 'PROMOTION' && item.priceSource !== 'OUTLET' && item.sku !== 'TEST-001')
    .reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);

  // 1. Subtotales Netos
  const excludedBaseNet = Math.round(excludedSubtotal);
  const nonExcludedBaseNet = Math.round(nonExcludedSubtotal);
  const baseNet = excludedBaseNet + nonExcludedBaseNet;

  // 2. Company discount amount — ONLY on non-excluded items
  const companyDiscountAmount = Math.round(nonExcludedBaseNet * (companyDiscountPercent / 100));

  // 3. Net after company discount
  const netAfterCompanyDiscount = nonExcludedBaseNet - companyDiscountAmount;
  const subtotalAfterCompany = excludedBaseNet + netAfterCompanyDiscount;
  
  // States
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successParam, setSuccessParam] = useState(false);

  // Read query parameters safely without requiring Suspense boundary
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'true') {
        setSuccessParam(true);
        setIsSuccess(true);
        clearCart();
      }
    }
  }, [clearCart]);

  // Redirect if cart is empty or subtotal after company discount is below minimum
  useEffect(() => {
    if (!isSuccess && !successParam) {
      if (items.length === 0) {
        router.push('/cart');
        return;
      }
      const isTestBypass = items.some(item => item.sku === 'TEST-001' || item.sku === 'test-001');
      
      if (subtotalAfterCompany < 100000 && !isTestBypass) {
        toast.error('Compra mínima no alcanzada. Se requiere al menos $100.000 neto.');
        router.push('/cart');
        return;
      }
    }
  }, [items.length, subtotalAfterCompany, isSuccess, successParam, router]);
  
  // Form States
  const [region, setRegion] = useState('');
  const [comuna, setComuna] = useState('');

  const [shippingStreet, setShippingStreet] = useState('');
  
  const [billingType, setBillingType] = useState<'boleta' | 'factura'>('factura');
  const [billingEmail, setBillingEmail] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [rutEmpresa, setRutEmpresa] = useState('');
  
  const [selectedCourier, setSelectedCourier] = useState('');
  const [customCourier, setCustomCourier] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState<'credit_b2b' | 'webpay' | 'transfer' | 'mercadopago'>('webpay');
  const [coupon, setCoupon] = useState('');
  
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [bankConfig, setBankConfig] = useState<any>(null);
  const [mpConfig, setMpConfig] = useState<any>(null);

  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);
  const [addressWarning, setAddressWarning] = useState<string | null>(null);

  const validateAddress = async (streetVal: string, comunaVal: string, regionVal: string) => {
    if (!streetVal.trim() || !comunaVal || !regionVal) {
      setAddressWarning(null);
      return;
    }
    
    setIsVerifyingAddress(true);
    setAddressWarning(null);
    
    try {
      // Clean up common Chilean address suffixes (e.g. Of 502, Depto 101, Piso 3, Local 4) that fail geocoding
      const cleanStreetVal = streetVal
        .replace(/[,;]\s*(oficina|ofi|of\.?|departamento|depto\.?|dep\.?|piso|block|bl\.?|casa|sitio|local)\b.*/i, '')
        .replace(/\s+(oficina|ofi|of\.?|departamento|depto\.?|dep\.?|piso|block|bl\.?|casa|sitio|local)\b.*/i, '')
        .trim();

      // If street becomes empty after cleaning (e.g., user wrote only "Oficina 502"), skip geocoding
      if (!cleanStreetVal) {
        setAddressWarning(null);
        setIsVerifyingAddress(false);
        return;
      }

      // Build query. Omit region for insular areas to prevent geocoder bias to Valparaiso city
      let query = `${cleanStreetVal}, ${comunaVal}, ${regionVal}, Chile`;
      const isInsular = comunaVal.toUpperCase() === 'ISLA DE PASCUA' || 
                        comunaVal.toUpperCase() === 'JUAN FERNÁNDEZ' || 
                        comunaVal.toUpperCase() === 'JUAN FERNANDEZ';
      if (isInsular) {
        query = `${cleanStreetVal}, ${comunaVal}, Chile`;
      }

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&email=jespejo@jdevoto.cl`;
      
      const res = await fetch(url);
      
      if (!res.ok) throw new Error('Error al conectar con el servicio de mapas');
      
      const data = await res.json();
      if (data.length === 0) {
        setAddressWarning("No pudimos verificar esta dirección. Puedes continuar de todas formas.");
      } else {
        setAddressWarning(null);
      }
    } catch (err) {
      console.error("Address validation error:", err);
      // Do not block the purchase if the OpenStreetMap API fails or times out
      setAddressWarning(null);
    } finally {
      setIsVerifyingAddress(false);
    }
  };
  
  const handleCopyBillingAddress = () => {
    if (effectiveCompany) {
      setShippingStreet(effectiveCompany.direccion || '');
      
      const regionMatch = CHILE_REGIONS.find(r => 
        r.name.toLowerCase() === effectiveCompany.region?.toLowerCase() ||
        r.name.toLowerCase().includes(effectiveCompany.region?.toLowerCase() || '')
      );
      
      if (regionMatch) {
        setRegion(regionMatch.name);
        const comunaMatch = regionMatch.comunas.find(c => 
          c.name.toLowerCase() === effectiveCompany.comuna?.toLowerCase() ||
          c.name.toLowerCase().includes(effectiveCompany.comuna?.toLowerCase() || '')
        );
        if (comunaMatch) {
          setTimeout(() => setComuna(comunaMatch.name), 10);
        } else {
          setTimeout(() => setComuna(effectiveCompany.comuna || ''), 10);
        }
      } else {
        setRegion(effectiveCompany.region || '');
        setTimeout(() => setComuna(effectiveCompany.comuna || ''), 10);
      }
    }
  };


  useEffect(() => {
    if (shippingStreet && comuna && region) {
      const delayDebounceFn = setTimeout(() => {
        validateAddress(shippingStreet, comuna, region);
      }, 800);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setAddressWarning(null);
    }
  }, [shippingStreet, comuna, region]);

  useEffect(() => {
    if (!accessToken) return;

    fetch('/api/settings?key=bank_transfer_config', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.value) setBankConfig(data.value);
      })
      .catch(() => {});
      
    fetch('/api/settings?key=mercadopago_config', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.value && data.value.enabled) {
          setMpConfig(data.value);
          setPaymentMethod(prev => prev === 'webpay' ? 'mercadopago' : prev);
        }
      })
      .catch(() => {});

    const saved = localStorage.getItem('jdevoto_payment_method');
    if (saved && ['credit_b2b', 'webpay', 'transfer', 'mercadopago'].includes(saved)) {
      setPaymentMethod(saved as any);
    }
  }, [accessToken]);

  // Auto-fill user data if available
  useEffect(() => {
    if (user) {
      setBillingEmail(user.email || '');
      setRazonSocial(user.company?.razonSocial || `${user.firstName} ${user.lastName}`);
      setRutEmpresa(user.company?.rut || '');
      
      // Auto-rellenar opciones de despacho (Mock)
      setRegion('METROPOLITANA DE SANTIAGO');
      setComuna('PROVIDENCIA'); // Tiene que ser una comuna válida para la región
      setShippingStreet('Av. Providencia 1234, Of 502');
    }
  }, [user]);

  // Derived Data
  const comunas = useMemo(() => {
    return CHILE_REGIONS.find(r => r.name === region)?.comunas || [];
  }, [region]);

  const freeShippingMin = useMemo(() => {
    if (!region || !comuna) return 100000;
    const r = region.toUpperCase();
    const c = comuna.toUpperCase();

    // Zonas Extremas $1.000.000 (Sur)
    if (
      r.includes("AYSEN") || 
      r.includes("MAGALLANES") ||
      c.includes("PUNTA ARENAS") || 
      c.includes("NATALES") || 
      c.includes("AYSEN") ||
      c.includes("CISNES") ||
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

    // Antofagasta hasta Puerto Montt $250.000
    return 250000;
  }, [region, comuna]);

  const selectedComunaInfo = useMemo(() => {
    if (!region || !comuna) return null;
    const regionObj = CHILE_REGIONS.find(r => r.name === region);
    return regionObj?.comunas.find(c => c.name === comuna) || null;
  }, [region, comuna]);

  const isInsularValparaiso = useMemo(() => {
    if (!region || !comuna) return false;
    const c = comuna.toUpperCase();
    return c.includes("JUAN FERNANDEZ") || c.includes("ISLA DE PASCUA");
  }, [region, comuna]);

  const [shippingMethod, setShippingMethod] = useState<'client_pays' | 'free'>('client_pays');





  const activePaymentDiscountPercent = useMemo(() => {
    if (paymentMethod === 'credit_b2b') {
      if (user?.company?.paymentTermDiscount !== undefined && user?.company?.paymentTermDiscount !== null) {
        return Number(user.company.paymentTermDiscount);
      }
      if (paymentTermsDays === 90) return 0;
      if (paymentTermsDays === 60) return 4;
      if (paymentTermsDays === 30) return 7;
      if (paymentTermsDays === 0) return 10;
      return 0;
    }
    if (paymentMethod === 'webpay' || paymentMethod === 'transfer' || paymentMethod === 'mercadopago') {
      return 10;
    }
    return 0;
  }, [paymentMethod, paymentTermsDays, user?.company]);

  const creditB2bDiscountPercent = useMemo(() => {
    if (user?.company?.paymentTermDiscount !== undefined && user?.company?.paymentTermDiscount !== null) {
      return Number(user.company.paymentTermDiscount);
    }
    if (paymentTermsDays === 90) return 0;
    if (paymentTermsDays === 61) return 0;
    if (paymentTermsDays === 60) return 4;
    if (paymentTermsDays === 32) return 0;
    if (paymentTermsDays === 31) return 10;
    if (paymentTermsDays === 30) return 7;
    if (paymentTermsDays === 0) return 10;
    return 0;
  }, [paymentTermsDays, user?.company]);

  const cardTransferDiscountPercent = 10;



  // Validate shipping method compatibility and automatically select the correct flete option
  useEffect(() => {
    if (region && comuna && subtotalAfterCompany >= freeShippingMin && !isInsularValparaiso) {
      setShippingMethod('free');
    } else {
      setShippingMethod('client_pays');
    }
  }, [region, comuna, subtotalAfterCompany, freeShippingMin, isInsularValparaiso]);

  const shippingCost = 0; // Both shipping options are $0 in invoice (freight to be paid by client or free shipping)
  
  // 4. Payment discount amount — applied to the total subtotal after company discount
  const paymentDiscountAmount = Math.round(subtotalAfterCompany * (activePaymentDiscountPercent / 100));
  
  // 5. Final Net
  const finalNet = subtotalAfterCompany - paymentDiscountAmount;
  
  // 6. Final IVA (19%)
  const finalIva = Math.round(finalNet * 0.19);
  
  // 7. Grand Total
  const grandTotal = Math.round(finalNet + finalIva + shippingCost);

  const creditLimit = effectiveCompany?.creditLimit ? Number(effectiveCompany.creditLimit) : 0;
  const creditUsed = effectiveCompany?.creditUsed ? Number(effectiveCompany.creditUsed) : 0;
  const availableCredit = creditLimit - creditUsed;
  const hasEnoughCredit = paymentMethod !== 'credit_b2b' || grandTotal <= availableCredit;

  // Credit Validation
  const isCourierValid = shippingMethod === 'free' || (
    selectedCourier && (selectedCourier !== 'otro' || customCourier.trim() !== '')
  );
  
  const isClientSelected = true;

  const isFormValid = termsAccepted && region && comuna && shippingStreet.trim() !== '' &&
    !isVerifyingAddress &&
    (billingType === 'factura' ? (razonSocial && rutEmpresa) : true) && 
    hasEnoughCredit && isCourierValid && isClientSelected;

  const handleProcessOrder = async () => {
    const activeCompanyId = effectiveCompany?.id || user?.companyId;
    if (!activeCompanyId) {
      toast.error('Error: No tienes una empresa/cliente asignado para hacer pedidos.');
      return;
    }
    
    setIsProcessing(true);
    try {
      const orderPayload = {
        companyId: activeCompanyId,
        status: paymentMethod === 'credit_b2b' ? 'CONFIRMED' : 'PENDING',
        paymentMethod,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitNetPrice: item.price ? Math.round(item.price) : 0,
        })),
        shippingAddress: {
          region,
          comuna,
          street: shippingStreet,
          shippingMethod,
          courier: shippingMethod === 'free' 
            ? (selectedComunaInfo?.transport || 'FLETE INCLUIDO')
            : (selectedCourier === 'otro' ? customCourier : selectedCourier) || 'POR PAGAR',
          estimatedDelivery: selectedComunaInfo?.deliveryTime || null,
        },
        billingAddress: {
          email: billingEmail,
        }
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errData = await res.json();
        const errorMessage = errData.error?.message || errData.error || 'Error al crear el pedido';
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }

      const createdOrder = await res.json();

      try {
        await refresh();
      } catch (err) {
        console.error("Error refreshing auth context:", err);
      }

      if (paymentMethod === 'webpay') {
        // Redirect to Mercado Pago simulation
        router.push(`/checkout/mercadopago-simulation?orderId=${createdOrder.data.id}`);
        return;
      }

      if (paymentMethod === 'mercadopago') {
        try {
          const prefRes = await fetch(`/api/orders/${createdOrder.data.id}/checkout-preference?context=checkout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          });
          if (!prefRes.ok) throw new Error('Error al generar la preferencia de pago.');
          const prefData = await prefRes.json();
          if (prefData.success && prefData.data?.initPoint) {
            clearCart();
            window.location.href = prefData.data.initPoint;
            return;
          } else {
            throw new Error('No se recibió la URL de pago.');
          }
        } catch (prefErr: any) {
          console.error(prefErr);
          toast.error(prefErr.message || 'Error al iniciar la pasarela de pagos.');
          // Si falla la redirección, al menos mostramos la pantalla de éxito local
          setIsSuccess(true);
          clearCart();
          return;
        }
      }

      setIsSuccess(true);
      clearCart();
    } catch (error: any) {
      toast.error(error.message || 'Ocurrió un error al procesar tu pedido. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
         <div className="max-w-2xl w-full bg-white p-12 rounded-[50px] shadow-2xl text-center space-y-8 border-2 border-primary/20">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
               <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-3">
               <h1 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">¡Pedido Recibido!</h1>
               <p className="text-sm font-medium text-zinc-500">Tu orden ha sido procesada exitosamente. Recibirás los detalles en tu correo corporativo.</p>
            </div>
            
            {paymentMethod === 'transfer' && (
              <div className="text-left bg-zinc-50 p-6 rounded-3xl border border-zinc-200 mt-6 space-y-4 shadow-sm animate-in zoom-in">
                <div className="flex items-center gap-3 border-b border-zinc-200 pb-4">
                  <Building2 className="w-6 h-6 text-primary" />
                  <h3 className="font-bold text-zinc-900 text-lg">{bankConfig?.title || 'Datos para transferencia'}</h3>
                </div>
                {(bankConfig?.instructions || bankConfig?.description) && (
                  <p className="text-sm text-zinc-600 whitespace-pre-wrap">{bankConfig.instructions || bankConfig.description}</p>
                )}
                
                {(() => {
                  const validAccounts = bankConfig?.accounts?.filter((acc: any) => 
                    (acc.bankName && acc.bankName.trim() !== '') || 
                    (acc.accountDetails && acc.accountDetails.trim() !== '') || 
                    (acc.accountName && acc.accountName.trim() !== '')
                  ) || [];

                  return validAccounts.length > 0 ? (
                    <div className="space-y-3 pt-2">
                      {validAccounts.map((acc: any, i: number) => (
                        <div key={i} className="text-sm bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-1">
                          {acc.bankName && <p className="flex justify-between"><span className="text-zinc-500">Banco</span> <span className="font-bold text-zinc-900">{acc.bankName}</span></p>}
                          {acc.accountType && <p className="flex justify-between"><span className="text-zinc-500">Tipo de cuenta</span> <span className="font-bold text-zinc-900">{acc.accountType}</span></p>}
                          {acc.accountDetails && <p className="flex justify-between"><span className="text-zinc-500">Cuenta</span> <span className="font-bold text-zinc-900">{acc.accountDetails}</span></p>}
                          {acc.accountName && <p className="flex justify-between"><span className="text-zinc-500">Titular</span> <span className="font-bold text-zinc-900">{acc.accountName}</span></p>}
                          {acc.rut && <p className="flex justify-between"><span className="text-zinc-500">RUT</span> <span className="font-bold text-zinc-900">{acc.rut}</span></p>}
                          {acc.email && <p className="flex justify-between"><span className="text-zinc-500">Correo</span> <span className="font-bold text-zinc-900">{acc.email}</span></p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                      <p className="text-zinc-500 text-center italic">No hay cuentas bancarias configuradas.</p>
                    </div>
                  );
                })()}
              </div>
            )}
            
            <div className="pt-4">
               <Link href="/products">
                  <Button className="w-full h-14 bg-zinc-950 text-white font-black uppercase text-xs rounded-2xl shadow-xl hover:bg-zinc-800 transition-all">
                     Volver a la tienda
                  </Button>
               </Link>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      
      {/* MINIMAL HEADER FOR CHECKOUT */}
      <nav className="bg-zinc-950 text-white p-6 px-12 flex items-center justify-between border-b border-zinc-800 sticky top-0 z-50">
         <Link href="/cart" className="flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider">
            <ArrowLeft className="h-4 w-4" /> Volver al carrito
         </Link>
         <img 
            src="/home/devoto.png" 
            alt="JDevoto Logo" 
            className="h-10 sm:h-12 w-auto"
         />
         <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-green-500 uppercase tracking-wider hidden md:flex">
            <Lock className="h-4 w-4" /> Pago Seguro SSL
         </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-6 lg:p-12">
        <div className="mb-8">
          <PromoCountdownBanner />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
           
            <div className="lg:col-span-8 space-y-10">
            
              {/* SECCIÓN 1: FACTURACIÓN */}
              <section className="bg-white p-8 lg:p-10 rounded-[40px] border border-zinc-200 shadow-sm space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
                 <div className="flex items-center gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 uppercase tracking-tight">Documento de Compra</h2>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="flex gap-4">
                       <label className={`flex-1 p-4 rounded-2xl border-2 cursor-pointer transition-all ${billingType === 'boleta' ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:bg-zinc-50'}`}>
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <input type="radio" name="billing" checked={billingType === 'boleta'} onChange={() => setBillingType('boleta')} className="hidden" />
                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${billingType === 'boleta' ? 'border-primary' : 'border-zinc-300'}`}>
                                   {billingType === 'boleta' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                                </div>
                                <span className="font-bold text-sm sm:text-base uppercase text-zinc-900">Boleta</span>
                             </div>
                             <FileText className={`h-5 w-5 ${billingType === 'boleta' ? 'text-primary' : 'text-zinc-400'}`} />
                          </div>
                       </label>
                       <label className={`flex-1 p-4 rounded-2xl border-2 cursor-pointer transition-all ${billingType === 'factura' ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:bg-zinc-50'}`}>
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <input type="radio" name="billing" checked={billingType === 'factura'} onChange={() => setBillingType('factura')} className="hidden" />
                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${billingType === 'factura' ? 'border-primary' : 'border-zinc-300'}`}>
                                   {billingType === 'factura' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                                </div>
                                <span className="font-bold text-sm sm:text-base uppercase text-zinc-900">Factura</span>
                             </div>
                             <Building2 className={`h-5 w-5 ${billingType === 'factura' ? 'text-primary' : 'text-zinc-400'}`} />
                          </div>
                       </label>
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">Email de recepción</Label>
                       <Input 
                         value={billingEmail} 
                         onChange={(e) => setBillingEmail(e.target.value)}
                         readOnly
                         className="rounded-xl h-12 bg-zinc-100 border-zinc-200 font-medium text-zinc-500 cursor-not-allowed focus:ring-0 text-sm" 
                       />
                       <p className="text-sm text-zinc-500 font-medium mt-2">
                          La {billingType} se enviará al siguiente correo: <span className="font-bold text-zinc-900">{billingEmail || '...'}</span>.
                       </p>
                    </div>

                    {billingType === 'factura' && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
                          <div className="space-y-2">
                             <Label className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">Razón Social</Label>
                             <Input 
                               value={razonSocial}
                               onChange={(e) => setRazonSocial(e.target.value)}
                               readOnly
                               className="rounded-xl h-12 bg-zinc-100 border-zinc-200 text-zinc-500 font-medium cursor-not-allowed focus:ring-0 text-sm" 
                             />
                          </div>
                          <div className="space-y-2">
                             <Label className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">RUT Empresa</Label>
                             <Input 
                               value={rutEmpresa}
                               onChange={(e) => setRutEmpresa(e.target.value)}
                               placeholder="Ej: 76.123.456-7"
                               readOnly
                               className="rounded-xl h-12 bg-zinc-100 border-zinc-200 text-zinc-500 font-medium cursor-not-allowed focus:ring-0 text-sm" 
                             />
                          </div>
                       </div>
                    )}
                 </div>
              </section>

              {/* SECCIÓN 2: DESPACHO */}
              <section className="bg-white p-8 lg:p-10 rounded-[40px] border border-zinc-200 shadow-sm space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-2 h-full bg-purple-500" />
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 uppercase tracking-tight">Opciones de Despacho</h2>
                    {effectiveCompany?.direccion && (
                      <button
                        type="button"
                        onClick={handleCopyBillingAddress}
                        className="text-[11px] font-bold text-purple-600 hover:text-purple-700 transition-colors uppercase tracking-wider bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl border border-purple-200 self-start sm:self-auto flex items-center gap-2"
                      >
                        <Truck className="h-4 w-4" />
                        Copiar Dir. Tributaria
                      </button>
                    )}
                 </div>
                 
                 <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">Región</Label>
                            <div className="relative">
                               <select 
                                 value={region}
                                 onChange={(e) => {
                                    setRegion(e.target.value);
                                    setComuna('');
                                 }}
                                 className="w-full h-12 rounded-xl border border-zinc-200 px-4 pr-10 text-sm font-semibold text-zinc-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-zinc-50 cursor-pointer appearance-none"
                               >
                                  <option value="" className="text-zinc-500">Selecciona tu región...</option>
                                  {CHILE_REGIONS.map(r => (
                                     <option key={r.id} value={r.name}>{r.name}</option>
                                  ))}
                               </select>
                               <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">Comuna / Ciudad</Label>
                            <div className="relative">
                               <select 
                                 value={comuna}
                                 onChange={(e) => setComuna(e.target.value)}
                                 disabled={!region}
                                 className="w-full h-12 rounded-xl border border-zinc-200 px-4 pr-10 text-sm font-semibold text-zinc-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-zinc-50 disabled:opacity-50 cursor-pointer appearance-none"
                               >
                                  <option value="" className="text-zinc-500">Selecciona tu comuna...</option>
                                  {comunas.map(c => (
                                     <option key={c.id} value={c.name}>{c.name}</option>
                                  ))}
                               </select>
                               <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                            </div>
                         </div>
                        <div className="md:col-span-2 space-y-2">
                           <div className="flex justify-between items-center">
                              <Label className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">Calle y Número</Label>
                              {region && comuna && (
                                 <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                       (() => {
                                          const cleanStreetVal = shippingStreet
                                             .replace(/[,;]\s*(oficina|ofi|of\.?|departamento|depto\.?|dep\.?|piso|block|bl\.?|casa|sitio|local)\b.*/i, '')
                                             .replace(/\s+(oficina|ofi|of\.?|departamento|depto\.?|dep\.?|piso|block|bl\.?|casa|sitio|local)\b.*/i, '')
                                             .trim();
                                          const isInsular = comuna.toUpperCase() === 'ISLA DE PASCUA' || 
                                                            comuna.toUpperCase() === 'JUAN FERNÁNDEZ' || 
                                                            comuna.toUpperCase() === 'JUAN FERNANDEZ';
                                          return (cleanStreetVal ? cleanStreetVal + ', ' : '') + comuna + (isInsular ? '' : ', ' + region) + ', Chile';
                                       })()
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider flex items-center gap-1"
                                 >
                                    📍 Verificar en Google Maps
                                 </a>
                              )}
                           </div>
                           <Input 
                             value={shippingStreet}
                             onChange={(e) => setShippingStreet(e.target.value)}
                             placeholder="Ej: Av. Vitacura 1234, Of 502" 
                             className="rounded-xl h-12 bg-zinc-50 text-zinc-900 font-medium text-sm" 
                           />
                           {isVerifyingAddress && (
                               <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider animate-pulse pt-1 px-1">
                                  🔍 Verificando existencia de la dirección...
                               </p>
                            )}
                            {addressWarning && (
                               <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider pt-1 px-1">
                                  ⚠️ {addressWarning}
                               </p>
                            )}
                        </div>
                     </div>

                     <div className="pt-6 border-t border-zinc-100 grid grid-cols-1 gap-6">
                        {/* Selector de tipo de flete */}
                        {region && comuna && (() => {
                           const showClientPaysOption = subtotalAfterCompany < freeShippingMin || isInsularValparaiso;
                           return (
                             <div className="space-y-3">
                                <Label className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">Modalidad de Flete</Label>
                                <div className={`grid gap-4 ${showClientPaysOption ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                   {showClientPaysOption && (
                                     <label className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${shippingMethod === 'client_pays' ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:bg-zinc-50'}`}>
                                        <div className="flex items-center gap-3">
                                           <input type="radio" name="shippingMethod" checked={shippingMethod === 'client_pays'} onChange={() => setShippingMethod('client_pays')} className="hidden" />
                                           <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${shippingMethod === 'client_pays' ? 'border-primary' : 'border-zinc-300'}`}>
                                              {shippingMethod === 'client_pays' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                                           </div>
                                           <div className="flex flex-col text-left">
                                              <span className="font-bold text-sm sm:text-base uppercase text-zinc-900">Flete por Pagar</span>
                                              <span className="text-[11px] text-zinc-500 font-medium uppercase">A cargo del cliente en destino</span>
                                           </div>
                                        </div>
                                     </label>
                                   )}

                                   {(() => {
                                      if (isInsularValparaiso) {
                                        return (
                                          <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 opacity-60 cursor-not-allowed flex flex-col gap-2 text-left justify-center">
                                             <div className="flex items-center gap-3">
                                                <div className="h-5 w-5 rounded-full border-2 border-zinc-300 flex items-center justify-center">
                                                </div>
                                                <div className="flex flex-col text-left">
                                                   <span className="font-bold text-sm sm:text-base uppercase text-zinc-400">Flete Incluido</span>
                                                   <span className="text-[11px] text-zinc-450 font-semibold uppercase">Despacho Gratis</span>
                                                </div>
                                             </div>
                                             <span className="text-[11px] font-bold text-red-500 uppercase tracking-tight text-left">
                                               No disponible para territorio insular (Envío por pagar obligatorio)
                                             </span>
                                          </div>
                                        );
                                      }

                                      const canFreeShipping = subtotalAfterCompany >= freeShippingMin;
                                      const missingForFree = freeShippingMin - subtotalAfterCompany;

                                      return (
                                       <label className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2 ${
                                         shippingMethod === 'free' 
                                           ? 'border-primary bg-primary/5' 
                                           : canFreeShipping 
                                             ? 'border-zinc-200 hover:bg-zinc-50' 
                                             : 'border-zinc-150 bg-zinc-50 opacity-60 cursor-not-allowed'
                                       }`}>
                                          <div className="flex items-center justify-between w-full">
                                             <div className="flex items-center gap-3">
                                                <input 
                                                  type="radio" 
                                                  name="shippingMethod" 
                                                  disabled={!canFreeShipping}
                                                  checked={shippingMethod === 'free'} 
                                                  onChange={() => canFreeShipping && setShippingMethod('free')} 
                                                  className="hidden" 
                                                />
                                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                                  shippingMethod === 'free' ? 'border-primary' : 'border-zinc-300'
                                                }`}>
                                                   {shippingMethod === 'free' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                                                </div>
                                                <div className="flex flex-col text-left">
                                                   <span className="font-bold text-sm sm:text-base uppercase text-zinc-900">Flete Incluido</span>
                                                   <span className="text-[11px] text-emerald-600 font-semibold uppercase">Despacho Gratis</span>
                                                </div>
                                             </div>
                                          </div>
                                          {!canFreeShipping && (
                                            <span className="text-[11px] font-bold text-red-500 uppercase tracking-tight text-left">
                                              Falta ${missingForFree.toLocaleString('es-CL')} neto (Mínimo: ${freeShippingMin.toLocaleString('es-CL')} neto)
                                            </span>
                                          )}
                                       </label>
                                      );
                                   })()}
                                </div>
                             </div>
                           );
                         })()}

                         {shippingMethod === 'client_pays' && (
                            <div className="space-y-3 pt-3 border-t border-zinc-100/80 animate-in fade-in duration-350 text-left">
                               <Label className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                  Selecciona tu Transporte de Preferencia (Por Pagar)
                               </Label>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="relative">
                                     <select
                                        value={selectedCourier}
                                        onChange={(e) => {
                                           setSelectedCourier(e.target.value);
                                           if (e.target.value !== 'otro') {
                                              setCustomCourier('');
                                           }
                                        }}
                                        className="w-full h-12 rounded-xl border border-zinc-200 px-4 pr-10 text-sm font-semibold text-zinc-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-zinc-50 cursor-pointer appearance-none"
                                     >
                                        <option value="" className="text-zinc-500">Selecciona un transporte...</option>
                                        <option value="Starken">Starken</option>
                                        <option value="Chilexpress">Chilexpress</option>
                                        <option value="Blue Express">Blue Express</option>
                                        <option value="Pullman Cargo">Pullman Cargo</option>
                                        <option value="Varmontt">Varmontt</option>
                                        <option value="Fedex">Fedex</option>

                                        <option value="otro">Otro (Especificar...)</option>
                                     </select>
                                     <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                                  </div>

                                  {selectedCourier === 'otro' && (
                                     <Input
                                        value={customCourier}
                                        onChange={(e) => setCustomCourier(e.target.value)}
                                        placeholder="Escribe el nombre del transporte"
                                        className="rounded-xl h-12 bg-zinc-50 text-zinc-900 font-medium text-sm focus:ring-primary focus:border-primary border-zinc-200"
                                     />
                                  )}
                               </div>
                            </div>
                         )}
                        
                        {/* Courier y plazos asignados */}
                        {shippingMethod === 'free' && region && comuna && selectedComunaInfo && (
                          <div className="flex flex-col gap-5 bg-purple-50/70 p-6 sm:p-7 rounded-[28px] border border-purple-100/80 animate-in fade-in zoom-in duration-300">
                             <div className="flex items-center gap-4 border-b border-purple-100 pb-4">
                                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-purple-200/50">
                                   <Truck className="h-6 w-6 text-purple-600" />
                                </div>
                                <div className="text-left">
                                   <p className="text-[10px] sm:text-xs font-bold text-purple-600 uppercase tracking-wider leading-none mb-1">Detalles del Courier</p>
                                   <h3 className="text-lg sm:text-xl font-bold text-zinc-900 uppercase tracking-tight">Información de Despacho</h3>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                                <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex flex-col justify-between">
                                   <span className="text-[10px] sm:text-xs font-bold text-purple-600 uppercase tracking-wider block mb-1">Transporte Asignado</span>
                                   <span className="text-lg sm:text-xl font-bold text-zinc-900 uppercase tracking-tight block">
                                      {selectedComunaInfo.transport || 'POR DEFINIR'}
                                   </span>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex flex-col justify-between">
                                   <span className="text-[10px] sm:text-xs font-bold text-purple-600 uppercase tracking-wider block mb-1">Plazo de entrega / Salidas</span>
                                   <span className="text-lg sm:text-xl font-bold text-zinc-900 uppercase tracking-tight block">
                                      {selectedComunaInfo.deliveryTime || 'POR DEFINIR'}
                                   </span>
                                </div>
                             </div>

                             <div className="pt-4 border-t border-purple-100/60 space-y-2 text-left">
                                <p className="text-xs sm:text-[13px] text-zinc-500 font-medium tracking-normal">
                                   *¹ Tiempos de entregas declarados por respectivos transportes, solo referencial.
                                </p>
                                <p className="text-xs sm:text-[13px] text-zinc-500 font-medium tracking-normal">
                                   *² Tiempos a regiones se inician desde la entrega en Santiago por T. Espinoza, cuando corresponda.
                                </p>
                                <p className="text-xs sm:text-[13px] text-zinc-500 font-medium tracking-normal pl-4">
                                   excepto Fedex y GyG.
                                </p>
                             </div>
                          </div>
                        )}
                      </div>
                  </div>
               </section>

              {/* SECCIÓN 3: PAGO */}
              <section className="bg-white p-8 lg:p-10 rounded-[40px] border border-zinc-200 shadow-sm space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
                 <div className="flex items-center gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 uppercase tracking-tight">Método de Pago</h2>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-4">
                    
                    <label className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'credit_b2b' ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:bg-zinc-50'}`}>
                       <div className="flex items-center gap-4">
                          <input type="radio" name="payment" checked={paymentMethod === 'credit_b2b'} onChange={() => { setPaymentMethod('credit_b2b'); localStorage.setItem('jdevoto_payment_method', 'credit_b2b'); }} className="hidden" />
                          <Wallet className={`h-6 w-6 ${paymentMethod === 'credit_b2b' ? 'text-primary' : 'text-zinc-400'}`} />
                          <div className="flex flex-col">
                             <span className="text-sm sm:text-base font-bold text-zinc-900">Crédito Directo {(user?.company?.paymentTerms === 31 ? 30 : user?.company?.paymentTerms === 61 ? 60 : user?.company?.paymentTerms) ?? 30} días {creditB2bDiscountPercent > 0 && <span className="text-[10px] ml-2 text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">-{creditB2bDiscountPercent}% OFF</span>}</span>
                             <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Condición: Pago a {(user?.company?.paymentTerms === 31 ? 30 : user?.company?.paymentTerms === 61 ? 60 : user?.company?.paymentTerms) ?? 30} días</span>
                          </div>
                       </div>
                       {paymentMethod === 'credit_b2b' && <CheckCircle2 className="h-6 w-6 text-primary" />}
                    </label>

                    {mpConfig ? (
                       <label className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'mercadopago' ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:bg-zinc-50'}`}>
                          <div className="flex items-center gap-4">
                             <input type="radio" name="payment" checked={paymentMethod === 'mercadopago'} onChange={() => { setPaymentMethod('mercadopago'); localStorage.setItem('jdevoto_payment_method', 'mercadopago'); }} className="hidden" />
                             <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">MP</div>
                             <div className="flex flex-col">
                                <span className="text-sm sm:text-base font-bold text-zinc-900">Mercado Pago {cardTransferDiscountPercent > 0 && <span className="text-[10px] ml-2 text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full">-{cardTransferDiscountPercent}% OFF</span>}</span>
                                <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Paga seguro con tu cuenta o tarjeta</span>
                             </div>
                          </div>
                          {paymentMethod === 'mercadopago' && <CheckCircle2 className="h-6 w-6 text-primary" />}
                       </label>
                     ) : (
                       <label className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'webpay' ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:bg-zinc-50'}`}>
                          <div className="flex items-center gap-4">
                             <input type="radio" name="payment" checked={paymentMethod === 'webpay'} onChange={() => { setPaymentMethod('webpay'); localStorage.setItem('jdevoto_payment_method', 'webpay'); }} className="hidden" />
                             <div className="relative h-7 w-7 shrink-0 flex items-center justify-center rounded-lg bg-sky-50 border border-sky-200 shadow-sm">
                                <span className="text-[9px] font-bold text-sky-600 italic tracking-tighter">MP</span>
                             </div>
                             <div className="flex flex-col">
                                <span className="text-sm sm:text-base font-bold text-zinc-900">Mercado Pago (Simulado) {cardTransferDiscountPercent > 0 && <span className="text-[10px] ml-2 text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full">-{cardTransferDiscountPercent}% OFF</span>}</span>
                                <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Paga seguro con tu cuenta o tarjeta (Prueba)</span>
                             </div>
                          </div>
                          {paymentMethod === 'webpay' && <CheckCircle2 className="h-6 w-6 text-primary" />}
                       </label>
                     )}

                    <label className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'transfer' ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:bg-zinc-50'}`}>
                       <div className="flex items-center gap-4">
                          <input type="radio" name="payment" checked={paymentMethod === 'transfer'} onChange={() => { setPaymentMethod('transfer'); localStorage.setItem('jdevoto_payment_method', 'transfer'); }} className="hidden" />
                          <Building2 className={`h-6 w-6 ${paymentMethod === 'transfer' ? 'text-primary' : 'text-zinc-400'}`} />
                          <div className="flex flex-col">
                             <span className="text-sm sm:text-base font-bold text-zinc-900">{bankConfig?.title || 'Transferencia Electrónica'} {cardTransferDiscountPercent > 0 && <span className="text-[10px] ml-2 text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full">-{cardTransferDiscountPercent}% OFF</span>}</span>
                             <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Venta bajo orden de compra</span>
                          </div>
                       </div>
                       {paymentMethod === 'transfer' && <CheckCircle2 className="h-6 w-6 text-primary" />}
                    </label>
                 </div>
              </section>
           </div>
           
           {/* RESUMEN LATERAL */}
           <div className="lg:col-span-4">
              <div className="bg-zinc-950 text-white p-6 sm:p-8 lg:p-10 rounded-[32px] sm:rounded-[50px] shadow-2xl space-y-8 static lg:sticky lg:top-24 border border-zinc-800">
                 <div className="flex items-center justify-between">
                   <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-white">Tu Orden</h2>
                   <Link href="/cart">
                      <Button className="h-8 px-4 bg-white text-zinc-950 hover:bg-zinc-200 text-[10px] font-bold uppercase tracking-wider gap-1.5 rounded-full shadow-md transition-all">
                        <Edit2 className="h-3 w-3" /> Editar Carrito
                      </Button>
                    </Link>
                 </div>
                 
                 <div className="space-y-4 pb-6 border-b border-zinc-800 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {items.length === 0 ? (
                      <p className="text-sm text-zinc-500 italic text-center py-4">Tu carrito está vacío</p>
                    ) : (
                      items.map(item => {
                         const isExcluded = item.priceSource === 'PROMOTION' || item.priceSource === 'OUTLET' || item.sku === 'TEST-001';
                         const companyDiscount = isExcluded ? 0 : companyDiscountPercent;
                         const discountedPrice = item.price * (1 - companyDiscount / 100);
                         const lineTotal = Math.round(discountedPrice * item.quantity);

                         return (
                           <div key={item.id} className="flex gap-4">
                              <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1 relative">
                                 {item.image && <Image src={item.image} alt={item.name} fill className="object-contain p-1" />}
                              </div>
                              <div className="flex-1 flex flex-col justify-center">
                                 <span className="text-sm font-semibold text-zinc-200 line-clamp-1">{item.name}</span>
                                 <span className="text-xs text-zinc-400 font-semibold mt-0.5">
                                   Cant: {item.quantity} x ${Math.round(discountedPrice).toLocaleString('es-CL')}
                                   {companyDiscount > 0 && <span className="text-[11px] text-emerald-400 ml-1.5">(-{companyDiscount}%)</span>}
                                 </span>
                              </div>
                              <div className="flex items-center text-sm font-bold text-zinc-100">
                                 ${lineTotal.toLocaleString('es-CL')}
                              </div>
                           </div>
                         );
                      })
                    )}
                 </div>

                 {/* CUPONES */}
                 <div className="space-y-3 pb-6 border-b border-zinc-800">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                       <Ticket className="h-3.5 w-3.5" /> Cupones
                    </Label>
                    <div className="flex gap-2">
                       <Input 
                         placeholder="Agrega cupón de descuento" 
                         value={coupon}
                         onChange={(e) => setCoupon(e.target.value)}
                         className="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 rounded-xl text-xs sm:text-sm"
                       />
                       <Button className="h-12 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl px-6 text-xs sm:text-sm">
                          Aplicar
                       </Button>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-medium italic">El descuento se aplicará luego de seleccionar tu medio de pago.</p>
                    
                    {/* TOTALES */}
                    <div className="space-y-4 text-xs sm:text-sm">
                       <div className="flex justify-between items-center font-semibold text-zinc-400 uppercase tracking-wider gap-2">
                          <span>Subtotal Neto</span>
                          <span className="whitespace-nowrap text-zinc-100 font-bold">$ {subtotalAfterCompany.toLocaleString('es-CL')}</span>
                       </div>

                       {paymentDiscountAmount > 0 && (
                         <div className="flex justify-between items-center font-semibold text-emerald-400 uppercase tracking-wider gap-2">
                            <span className="truncate">Dcto. Pago ({activePaymentDiscountPercent}%)</span>
                            <span className="whitespace-nowrap font-bold text-emerald-400">- $ {paymentDiscountAmount.toLocaleString('es-CL')}</span>
                         </div>
                       )}

                       <div className="flex justify-between items-center font-semibold text-zinc-400 uppercase tracking-wider gap-2">
                          <span>IVA (19%)</span>
                          <span className="whitespace-nowrap text-zinc-100 font-bold">$ {finalIva.toLocaleString('es-CL')}</span>
                       </div>

                       <div className="flex justify-between items-center font-semibold text-purple-400 uppercase tracking-wider gap-2">
                          <span>Tipo de Despacho</span>
                          <span className="whitespace-nowrap font-bold text-purple-400">
                            {shippingMethod === 'free' ? 'Flete Incluido (Gratis)' : 'Flete por Pagar'}
                          </span>
                       </div>

                       {shippingCost > 0 && (
                         <div className="flex justify-between items-center font-semibold text-purple-400 uppercase tracking-wider gap-2">
                            <span>Despacho Estimado</span>
                            <span className="whitespace-nowrap font-bold text-purple-400">$ {shippingCost.toLocaleString('es-CL')}</span>
                         </div>
                       )}

                       <div className="pt-4 border-t border-zinc-800 flex justify-between items-end gap-2">
                          <span className="text-sm sm:text-base font-bold uppercase text-zinc-300">Total Final</span>
                          <span className="text-2xl sm:text-3xl font-black text-primary whitespace-nowrap">$ {grandTotal.toLocaleString('es-CL')}</span>
                       </div>
                    </div>
                 </div>

                 {/* TERMS AND CONDITIONS */}
                 <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <label className="flex items-start gap-3 cursor-pointer group">
                       <div className="mt-0.5 relative flex items-center justify-center">
                          <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="peer appearance-none h-5 w-5 border-2 border-zinc-600 rounded-md checked:bg-primary checked:border-primary transition-all cursor-pointer" />
                          <CheckCircle2 className="h-3.5 w-3.5 text-zinc-950 absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                       </div>
                       <span className="text-[13px] text-zinc-400 font-medium group-hover:text-zinc-300 transition-colors leading-snug">
                          Acepto los <Link href="#" className="underline hover:text-white">términos y condiciones</Link>.
                       </span>
                    </label>
                 </div>

                 <button 
                   onClick={handleProcessOrder}
                   disabled={isProcessing || !isFormValid || items.length === 0}
                   className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-sm sm:text-base rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isProcessing ? (
                     "Procesando..."
                   ) : (
                     <>Finalizar Pedido <ChevronRight className="h-5 w-5" /></>
                   )}
                 </button>
                 
                 {!isFormValid && items.length > 0 && (
                   <p className="text-[10px] sm:text-xs text-red-400 text-center uppercase tracking-wider font-semibold">
                     {!hasEnoughCredit 
                        ? `Límite de crédito insuficiente (Disponible: $${availableCredit.toLocaleString('es-CL')}). Por favor, elige otro medio de pago.` 
                        : (isVerifyingAddress
                           ? "Verificando dirección de despacho..."
                           : (addressWarning
                              ? addressWarning
                              : (!isCourierValid
                                 ? "Por favor, selecciona o escribe el courier para el flete por pagar."
                                 : "Completa tu dirección, datos de facturación y acepta los términos para continuar.")))}
                   </p>
                 )}
              </div>
           </div>

        </div>
      </main>
    </div>
  );
}
