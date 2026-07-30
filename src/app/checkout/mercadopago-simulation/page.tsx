'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { 
  Lock, CreditCard, ArrowLeft, Smartphone, CheckCircle2, 
  Loader2, ShieldCheck, HelpCircle, Eye, EyeOff, Check
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

export default function MercadoPagoSimulationPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  
  const [orderId, setOrderId] = useState<string | null>(null);
  const [payInvoice, setPayInvoice] = useState<boolean>(false);

  // Page states
  const [order, setOrder] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [viewState, setViewState] = useState<'methods' | 'card' | 'account' | 'processing' | 'success'>('methods');

  // Read orderId safely from window location search
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('orderId');
      if (!id) {
        toast.error('ID de orden inválido.');
        router.push('/cart');
        return;
      }
      setOrderId(id);
      setPayInvoice(params.get('payInvoice') === 'true');
    }
  }, [router]);
  
  // Card input states
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardMonth, setCardMonth] = useState('');
  const [cardYear, setCardYear] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  
  // Account input states
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Simulated gateway messages
  const [processMessage, setProcessMessage] = useState('Iniciando pago seguro...');

  // Load order details
  useEffect(() => {
    if (!orderId) return;

    if (accessToken) {
      fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar la orden.');
        return res.json();
      })
      .then(data => {
        setOrder(data.success ? data.data : data);
        setIsLoadingOrder(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingOrder(false);
        toast.error('No se pudo recuperar los detalles del pedido.');
      });
    }
  }, [orderId, accessToken]);

  // Card brand detection
  const cardBrand = useMemo(() => {
    const cleanNumber = cardNumber.replace(/\s+/g, '');
    if (!cleanNumber) return null;
    
    if (/^4/.test(cleanNumber)) return 'VISA';
    if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) return 'MASTERCARD';
    if (/^3[47]/.test(cleanNumber)) return 'AMEX';
    if (/^6(?:011|5)/.test(cleanNumber)) return 'DISCOVER';
    if (/^(?:2131|1800|35)/.test(cleanNumber)) return 'JCB';
    if (/^3(?:0[0-5]|[68])/.test(cleanNumber)) return 'DINERS';
    
    return null;
  }, [cardNumber]);

  // Luhn algorithm validator
  const validateLuhn = (num: string) => {
    const clean = num.replace(/\D/g, '');
    let sum = 0;
    let shouldDouble = false;
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  // Input formatter for card number
  const handleCardNumberChange = (val: string) => {
    // Only digits and spaces
    const clean = val.replace(/[^\d]/g, '');
    // Format: add spaces every 4 digits
    const parts = [];
    for (let i = 0; i < clean.length; i += 4) {
      parts.push(clean.substring(i, i + 4));
    }
    setCardNumber(parts.join(' ').substring(0, 23)); // Limit to standard sizes
  };

  // Populate test card
  const handleUseTestCard = () => {
    setCardNumber('4111 1111 1111 1111'); // Valid Visa via Luhn
    setCardName('COMPRADOR PRUEBA');
    setCardMonth('12');
    setCardYear('2029');
    setCardCvv('123');
    setErrors({});
  };

  // Submit payment handler
  const handlePay = async (type: 'card' | 'account') => {
    const newErrors: Record<string, string> = {};

    if (type === 'card') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      if (!cleanNum) {
        newErrors.cardNumber = 'Ingresa el número de tarjeta.';
      } else if (cleanNum.length < 13 || cleanNum.length > 19) {
        newErrors.cardNumber = 'El número de tarjeta no es válido.';
      } else if (!validateLuhn(cleanNum)) {
        newErrors.cardNumber = 'El número de tarjeta falló la comprobación de seguridad (Luhn).';
      }

      if (!cardName.trim()) {
        newErrors.cardName = 'Ingresa el nombre del titular.';
      }

      if (!cardMonth || !cardYear) {
        newErrors.cardExpiry = 'Seleccionar la fecha de vencimiento.';
      } else {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const expiryYear = parseInt(cardYear, 10);
        const expiryMonth = parseInt(cardMonth, 10);
        
        if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
          newErrors.cardExpiry = 'La tarjeta está vencida.';
        }
      }

      if (!cardCvv) {
        newErrors.cardCvv = 'Ingresa el CVV.';
      } else if (cardCvv.length < 3 || cardCvv.length > 4) {
        newErrors.cardCvv = 'Código de seguridad inválido.';
      }
    } else {
      if (!accountEmail.trim() || !/\S+@\S+\.\S+/.test(accountEmail)) {
        newErrors.accountEmail = 'Ingresa un email válido de Mercado Pago.';
      }
      if (!accountPassword || accountPassword.length < 4) {
        newErrors.accountPassword = 'Ingresa tu contraseña.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Start payment processing simulation
    setViewState('processing');
    
    // Step 1
    setProcessMessage('Conectando de forma segura con Mercado Pago...');
    await new Promise(r => setTimeout(r, 800));
    
    // Step 2
    setProcessMessage('Autorizando transacción con el banco emisor...');
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 3
    setProcessMessage('Verificando fondos y código de seguridad...');
    await new Promise(r => setTimeout(r, 800));

    try {
      // API call to confirm payment on backend
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!res.ok) {
        throw new Error('Error al procesar el estado de pago.');
      }

      // Success
      setViewState('success');
      await new Promise(r => setTimeout(r, 1500));
      
      if (payInvoice) {
        toast.success('Pago procesado con éxito.');
        router.push(`/dashboard/orders/${orderId}`);
      } else {
        // Redirect back to checkout success
        router.push(`/checkout?success=true&orderId=${orderId}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Ocurrió un error al registrar tu pago.');
      setViewState('methods');
    }
  };

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 text-[#009ee3] animate-spin" />
          <p className="text-sm font-semibold text-zinc-650">Conectando a Mercado Pago...</p>
        </div>
      </div>
    );
  }

  const formattedTotal = Number(order?.totalGross || 0).toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP'
  });

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-zinc-800 font-sans pb-20">
      {/* HEADER SIMULADO MERCADO PAGO */}
      <nav className="bg-white border-b border-zinc-200 p-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#009ee3] text-white p-2 rounded-xl flex items-center justify-center font-black italic tracking-tighter text-sm">
            MP
          </div>
          <span className="text-sm font-black tracking-tight text-zinc-900 uppercase">Mercado Pago <span className="text-zinc-400 text-xs font-bold capitalize lowercase">sandbox</span></span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full">
          <ShieldCheck className="h-3.5 w-3.5 text-[#00a650]" />
          Entorno de Pruebas Seguro
        </div>
      </nav>

      <main className="max-w-[1050px] mx-auto p-4 md:p-8 mt-4">
        {viewState === 'processing' && (
          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-md text-center max-w-lg mx-auto py-16 flex flex-col items-center gap-6 border border-zinc-200">
            <Loader2 className="h-16 w-16 text-[#009ee3] animate-spin" />
            <h2 className="text-xl font-bold text-zinc-900 mt-2">Procesando pago</h2>
            <p className="text-sm text-zinc-500 font-medium">{processMessage}</p>
          </div>
        )}

        {viewState === 'success' && (
          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-md text-center max-w-lg mx-auto py-16 flex flex-col items-center gap-6 border border-zinc-200 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-[#00a650]/15 rounded-full flex items-center justify-center">
              <Check className="h-10 w-10 text-[#00a650] stroke-[3.5]" />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 mt-2">¡Pago Aprobado!</h2>
            <p className="text-sm text-zinc-500 font-semibold">Redireccionando de vuelta a la tienda...</p>
          </div>
        )}

        {(viewState === 'methods' || viewState === 'card' || viewState === 'account') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMNA IZQUIERDA: MÉTODOS DE PAGO */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Back button */}
              {viewState !== 'methods' && (
                <button 
                  onClick={() => {
                    setViewState('methods');
                    setErrors({});
                  }} 
                  className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-850 transition-colors uppercase tracking-wider"
                >
                  <ArrowLeft className="h-4 w-4" /> Volver a métodos de pago
                </button>
              )}

              {/* CONTENEDOR PRINCIPAL */}
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden text-left">
                
                {/* OPCIÓN 1: VISTA DE SELECCIÓN GENERAL */}
                {viewState === 'methods' && (
                  <div className="p-6 md:p-8 space-y-8">
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight leading-none">¿Cómo quieres pagar?</h1>
                    
                    {/* Sección Con cuenta de Mercado Pago */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Con tu cuenta de Mercado Pago</h3>
                      
                      <button 
                        onClick={() => setViewState('account')} 
                        className="w-full p-4 rounded-xl border border-zinc-200 hover:border-zinc-350 hover:bg-zinc-50 transition-all flex items-center justify-between text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-[#009ee3]/10 text-[#009ee3] rounded-xl flex items-center justify-center shrink-0">
                            <Smartphone className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-zinc-800 group-hover:text-[#009ee3] transition-colors">Ingresar con mi cuenta</span>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Paga usando tus tarjetas o saldo disponible</span>
                          </div>
                        </div>
                        <span className="text-zinc-400 text-lg font-light">&gt;</span>
                      </button>

                      <button 
                        onClick={() => setViewState('account')} 
                        className="w-full p-4 rounded-xl border border-zinc-200 hover:border-zinc-350 hover:bg-zinc-50 transition-all flex items-center justify-between text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-[#009ee3]/10 text-[#009ee3] rounded-xl flex items-center justify-center shrink-0">
                            <Smartphone className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-zinc-800 group-hover:text-[#009ee3] transition-colors">Usar la app de Mercado Pago</span>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Escanea un código QR para pagar al instante</span>
                          </div>
                        </div>
                        <span className="text-zinc-400 text-lg font-light">&gt;</span>
                      </button>
                    </div>

                    {/* Sección Sin cuenta de Mercado Pago */}
                    <div className="space-y-3 pt-4 border-t border-zinc-150">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Sin cuenta de Mercado Pago</h3>
                      
                      <button 
                        onClick={() => setViewState('card')} 
                        className="w-full p-4 rounded-xl border border-zinc-200 hover:border-zinc-350 hover:bg-zinc-50 transition-all flex items-center justify-between text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-[#00a650]/10 text-[#00a650] rounded-xl flex items-center justify-center shrink-0">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-zinc-800 group-hover:text-[#00a650] transition-colors">Tarjeta</span>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Crédito, débito o prepaga</span>
                          </div>
                        </div>
                        <span className="text-zinc-400 text-lg font-light">&gt;</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* OPCIÓN 2: FORMULARIO DE TARJETA (INLINE ESTILO TEMU) */}
                {viewState === 'card' && (
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-150 pb-4">
                      <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Ingresa los datos de tu tarjeta</h2>
                      <div className="flex gap-1.5">
                        {['VISA', 'MASTERCARD', 'AMEX'].map((brand) => (
                          <div key={brand} className="text-[9px] font-black tracking-tighter px-1.5 py-0.5 border border-zinc-200 rounded bg-zinc-50 text-zinc-500">
                            {brand}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Candado verde */}
                    <div className="bg-[#00a650]/5 border border-[#00a650]/15 p-3.5 rounded-xl flex items-center gap-2.5">
                      <Lock className="h-4 w-4 text-[#00a650]" />
                      <span className="text-xs text-[#00a650] font-semibold leading-none">Todas las transacciones son seguras y cifradas</span>
                    </div>

                    <div className="space-y-4">
                      {/* Número de tarjeta */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Número de tarjeta *</Label>
                          <button 
                            onClick={handleUseTestCard} 
                            className="text-[10px] text-[#009ee3] hover:underline font-bold uppercase tracking-wider"
                          >
                            Usar Tarjeta de Prueba
                          </button>
                        </div>
                        <div className="relative">
                          <Input 
                            value={cardNumber}
                            onChange={(e) => handleCardNumberChange(e.target.value)}
                            placeholder="0000 0000 0000 0000"
                            className={`h-12 rounded-xl pr-12 font-medium tracking-wider text-zinc-900 border ${errors.cardNumber ? 'border-red-500 focus:ring-red-500' : 'border-zinc-200'}`}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center shrink-0">
                            {cardBrand ? (
                              <span className="text-[9px] font-black text-[#009ee3] bg-[#009ee3]/10 border border-[#009ee3]/20 px-1.5 py-0.5 rounded uppercase">
                                {cardBrand}
                              </span>
                            ) : (
                              <CreditCard className="h-5 w-5 text-zinc-400" />
                            )}
                          </div>
                        </div>
                        {errors.cardNumber && (
                          <p className="text-xs text-red-500 font-semibold">{errors.cardNumber}</p>
                        )}
                      </div>

                      {/* Nombre del titular */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nombre del titular *</Label>
                        <Input 
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Ej: Juan Pérez"
                          className={`h-12 rounded-xl font-medium text-zinc-900 border ${errors.cardName ? 'border-red-500 focus:ring-red-500' : 'border-zinc-200'}`}
                        />
                        {errors.cardName && (
                          <p className="text-xs text-red-500 font-semibold">{errors.cardName}</p>
                        )}
                      </div>

                      {/* Expiración y CVV */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fecha de vencimiento *</Label>
                          <div className="flex gap-2">
                            <select 
                              value={cardMonth} 
                              onChange={(e) => setCardMonth(e.target.value)}
                              className={`flex-1 h-12 rounded-xl border px-3 text-sm font-medium text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-primary ${errors.cardExpiry ? 'border-red-500' : 'border-zinc-200'}`}
                            >
                              <option value="">Mes</option>
                              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>

                            <select 
                              value={cardYear} 
                              onChange={(e) => setCardYear(e.target.value)}
                              className={`flex-1 h-12 rounded-xl border px-3 text-sm font-medium text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-primary ${errors.cardExpiry ? 'border-red-500' : 'border-zinc-200'}`}
                            >
                              <option value="">Año</option>
                              {Array.from({ length: 11 }, (_, i) => String(new Date().getFullYear() + i)).map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                          {errors.cardExpiry && (
                            <p className="text-xs text-red-500 font-semibold">{errors.cardExpiry}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                            CVV * 
                            <span title="Código de 3 o 4 dígitos al reverso de la tarjeta" className="cursor-help flex items-center justify-center shrink-0">
                              <HelpCircle className="h-3 w-3 text-zinc-400" />
                            </span>
                          </Label>
                          <div className="relative">
                            <Input 
                              type="password"
                              maxLength={4}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/[^\d]/g, ''))}
                              placeholder="Código de 3 a 4 dígitos"
                              className={`h-12 rounded-xl font-medium text-zinc-900 pr-10 border ${errors.cardCvv ? 'border-red-500 focus:ring-red-500' : 'border-zinc-200'}`}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <Lock className="h-4 w-4 text-zinc-400" />
                            </div>
                          </div>
                          {errors.cardCvv && (
                            <p className="text-xs text-red-500 font-semibold">{errors.cardCvv}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handlePay('card')} 
                      className="w-full h-12 bg-[#009ee3] hover:bg-[#0081ba] text-white font-bold rounded-xl text-sm transition-colors mt-6 shadow-sm"
                    >
                      Pagar {formattedTotal}
                    </Button>
                  </div>
                )}

                {/* OPCIÓN 3: SIMULACIÓN DE INGRESO DE CUENTA */}
                {viewState === 'account' && (
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="border-b border-zinc-150 pb-4">
                      <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Ingresa con tu cuenta de Mercado Pago</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">E-mail *</Label>
                        <Input 
                          type="email"
                          value={accountEmail}
                          onChange={(e) => setAccountEmail(e.target.value)}
                          placeholder="nombre@ejemplo.com"
                          className={`h-12 rounded-xl font-medium text-zinc-900 border ${errors.accountEmail ? 'border-red-500' : 'border-zinc-200'}`}
                        />
                        {errors.accountEmail && (
                          <p className="text-xs text-red-500 font-semibold">{errors.accountEmail}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Contraseña *</Label>
                        <div className="relative">
                          <Input 
                            type={showPassword ? 'text' : 'password'}
                            value={accountPassword}
                            onChange={(e) => setAccountPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`h-12 rounded-xl font-medium text-zinc-900 pr-10 border ${errors.accountPassword ? 'border-red-500' : 'border-zinc-200'}`}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.accountPassword && (
                          <p className="text-xs text-red-500 font-semibold">{errors.accountPassword}</p>
                        )}
                      </div>
                    </div>

                    <Button 
                      onClick={() => handlePay('account')} 
                      className="w-full h-12 bg-[#009ee3] hover:bg-[#0081ba] text-white font-bold rounded-xl text-sm transition-colors mt-6 shadow-sm"
                    >
                      Ingresar y Pagar {formattedTotal}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA: RESUMEN DE COMPRA */}
            <div className="lg:col-span-4 space-y-4 text-left">
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-zinc-150">
                  <div className="h-10 w-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center font-black italic tracking-tighter text-xs shrink-0">
                    ag
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="font-black text-sm text-zinc-900">jdevoto.</span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Comercial J. Devoto</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Detalles del pago</h4>
                  
                  <div className="flex justify-between items-start text-sm bg-zinc-50 p-3 rounded-xl border border-zinc-150">
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-900">jdevoto.cl</span>
                      <span className="text-[10px] text-zinc-500 font-bold">ORDEN #{order?.orderNumber?.replace('ORD-', '') || orderId?.substring(0,8).toUpperCase()}</span>
                    </div>
                    <span className="font-black text-zinc-900">{formattedTotal}</span>
                  </div>
                </div>
              </div>

              {/* Botón para abortar pago */}
              <Link href="/cart">
                <button className="w-full text-center text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors py-2 uppercase tracking-widest">
                  Volver al Carrito / Cancelar Pago
                </button>
              </Link>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
