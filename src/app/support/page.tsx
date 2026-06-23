'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Wrench, PenTool, Sparkles, Search, Phone, Mail, 
  ArrowRight, ChevronRight, X, Smartphone, ChevronDown, Check, MapPin, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';

// Types
interface FAQ {
  category: string;
  categoryName: string;
  q: string;
  a: string;
}

export default function SupportPage() {
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Captcha & Honeypot State
  const [mathNums, setMathNums] = useState({ n1: 0, n2: 0 });
  const [mounted, setMounted] = useState(false);
  const [userMathAnswer, setUserMathAnswer] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  useEffect(() => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setMathNums({ n1, n2 });
    setMounted(true);
  }, []);

  // Email Ticket State
  const [emailForm, setEmailForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({ name: '', email: '', subject: '', message: '' });

  // --- DATA ---
  const faqs: FAQ[] = [
    { 
      category: 'registro', 
      categoryName: 'Registro y Cuentas',
      q: '¿Cómo registro mi empresa para acceder a los precios mayoristas?', 
      a: 'Para comprar en nuestra plataforma B2B, es necesario registrarse ingresando el RUT de tu empresa, razón social y giro. Una vez que tu cuenta sea validada por nuestro equipo comercial, podrás iniciar sesión para ver los precios mayoristas y aplicar a condiciones de crédito B2B.' 
    },
    { 
      category: 'registro', 
      categoryName: 'Registro y Cuentas',
      q: '¿Puedo agregar a otros colaboradores de mi empresa para que realicen pedidos?', 
      a: 'Sí. Si eres el Administrador de la cuenta de tu empresa (Company Admin), puedes ingresar a tu panel de administración, invitar a otros colaboradores y crearles cuentas de tipo Comprador. Esto les permitirá generar pedidos bajo el cupo y condiciones de la empresa.' 
    },
    { 
      category: 'descuentos', 
      categoryName: 'Precios y Descuentos',
      q: '¿Qué descuentos se aplican según los días de plazo de pago (0, 30, 60 y 90 días)?', 
      a: 'Ofrecemos incentivos en el subtotal de tu pedido según las condiciones de pago de tu empresa: la condición Contado (0 días) otorga un 10% de descuento adicional, el plazo a 30 días otorga un 7% de descuento, a 60 días otorga un 4% de descuento, y la condición a 90 días no aplica descuento adicional (0%).' 
    },
    { 
      category: 'credito', 
      categoryName: 'Finanzas y Crédito',
      q: '¿Cómo puedo pagar mis pedidos mediante Mercado Pago?', 
      a: 'Si tu cuenta no tiene línea de crédito activa o prefieres pagar al instante, puedes seleccionar "Mercado Pago" en la sección de Checkout. Podrás pagar de forma segura con tarjetas de crédito, débito (Redcompra/Webpay) o saldo en tu cuenta de Mercado Pago. Tu pedido será procesado de inmediato una vez confirmado el pago.' 
    },
    { 
      category: 'credito', 
      categoryName: 'Finanzas y Crédito',
      q: '¿Cómo funciona el pago con Crédito B2B y cómo libero mi cupo?', 
      a: 'El pago con Crédito B2B te permite realizar compras utilizando la línea de crédito aprobada para tu empresa. Al procesar un pedido bajo esta modalidad, se consume el cupo disponible. Puedes  liberará tu cupo de crédito de forma 100% automática en el sistema.' 
    },
    { 
      category: 'descuentos', 
      categoryName: 'Precios y Descuentos',
      q: '¿Cómo se aplican las listas de precios y los descuentos especiales a empresas en mi cuenta?', 
      a: 'Nuestro motor de precios aplica una jerarquía automática para que siempre obtengas las mejores condiciones comerciales. La prioridad de precios es: 1) Descuentos de Outlet, 2) Listas de precios personalizadas o el Descuento de Empresa asignado a tu cuenta por convenio corporativo, 3) Promociones temporales, y 4) Precio base. Los descuentos especiales aplicados a tu empresa se reflejarán de forma automática en el subtotal del carrito una vez inicies sesión. Ten en cuenta que estos descuentos corporativos específicos son independientes del descuento de plazos de pago (0, 30, 60 o 90 días).' 
    },
    { 
      category: 'pedidos', 
      categoryName: 'Gestión de Pedidos',
      q: '¿Puedo enviar mis listas de compras o cotizaciones por correo electrónico?', 
      a: 'Sí, desde el carrito de compras puedes exportar y enviar el detalle de tu lista de insumos por correo electrónico en formato PDF o Excel. Esta funcionalidad es ideal para enviar la cotización a los departamentos de compras o aprobación interna antes de generar el pedido.' 
    },
    { 
      category: 'pedidos', 
      categoryName: 'Gestión de Pedidos',
      q: '¿Cómo puedo repetir o duplicar un pedido anterior?', 
      a: 'Para repetir un pedido, accede a tu panel de usuario en la sección "Mis Pedidos". Busca la compra anterior que deseas duplicar y presiona el botón "Repetir Pedido". Todos los artículos correspondientes se agregarán de inmediato al carrito de compras con sus existencias disponibles actuales.' 
    },
    { 
      category: 'despacho', 
      categoryName: 'Despachos y Fletes',
      q: '¿Cuáles son las políticas de flete y montos mínimos para despacho gratuito?', 
      a: 'El monto mínimo de compra neta para despacho gratuito en la Región Metropolitana es de $100.000 CLP. Para la zona extrema norte el mínimo es de $500.000 CLP y para la zona extrema sur es de $1.000.000 CLP. Los despachos a territorios insulares no son elegibles para despacho gratuito. Cabe destacar que el subtotal neto mínimo para realizar cualquier pedido en la plataforma es de $100.000 CLP netos (monto obligatorio que se calcula sobre los precios de lista y que no incluye ni considera los descuentos específicos adicionales otorgados a empresas o convenios corporativos).' 
    },
    { 
      category: 'despacho', 
      categoryName: 'Despachos y Fletes',
      q: '¿Con qué empresas de transporte trabajan en la modalidad "Flete Pagado" y cuáles son los plazos?', 
      a: 'Si tu compra cumple con el monto mínimo para despacho gratuito (Flete Pagado), el sistema asignará de forma automática el transporte y los tiempos según tu ciudad/comuna de destino: Santiago se despacha vía T. Espinoza (24-48 hrs); la Quinta Región a domicilio (12-48 hrs); Chillán, Concepción, Talcahuano, Valdivia, Temuco y Osorno vía Ecoex (24-48 hrs); ciudades del norte y sur (Arica, Iquique, Copiapó, La Serena, Puerto Montt, Chiloé) vía FedEx (24-96 hrs); Coyhaique y Puerto Aysén vía A.T.E. (6-8 días); y Punta Arenas o Porvenir vía Swisslog (5-7 días).' 
    },
    { 
      category: 'despacho', 
      categoryName: 'Despachos y Fletes',
      q: '¿Cómo funciona la modalidad "Flete por Pagar" y qué transporte debo elegir?', 
      a: 'Si tu pedido no alcanza el monto mínimo para despacho gratis, se enviará bajo la modalidad "Flete por Pagar". Al finalizar tu compra en el Checkout, el usuario deberá indicar obligatoriamente el transporte por el cual desea recibir sus productos, pudiendo seleccionar entre Starken, Chilexpress, Blue Express, Pullman Cargo, Varmontt, Cruz del Sur o especificar otro alternativo. El costo del flete se cancela directamente al transportista elegido al momento de recibir la mercadería.' 
    },
    { 
      category: 'descuentos', 
      categoryName: 'Precios y Descuentos',
      q: '¿Tienen precios especiales para librerías o compras escolares por volumen?', 
      a: 'Sí, en JDevoto.cl nos especializamos en ventas al por mayor para oficinas y librerías. Al agregar productos al carrito, puedes seleccionar la opción "Solicitar Cotización" para recibir un descuento por volumen.' 
    },
    { 
      category: 'credito', 
      categoryName: 'Finanzas y Crédito',
      q: '¿Cómo descargo mi factura electrónica?', 
      a: 'Todas las facturas electrónicas emitidas por JDevoto se envían automáticamente al correo registrado en el Servicio de Impuestos Internos. También puedes visualizarlas y descargarlas en tu panel de usuario en la sección de "Mis Pedidos".' 
    },
    { 
      category: 'pedidos', 
      categoryName: 'Gestión de Pedidos',
      q: '¿Cómo puedo generar una cotización formal desde la web?', 
      a: 'Al tener productos en el carrito de compras, puedes presionar la opción "Solicitar Cotización" en lugar de proceder al pago. El sistema generará automáticamente un documento PDF formal con la validez de stock y precios vigentes, el cual se enviará a tu correo de contacto.' 
    }
  ];

  // --- HANDLERS ---
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) {
      console.log('Bot submission detected via Honeypot');
      return;
    }

    // Custom Validation
    const newErrors = { name: '', email: '', subject: '', message: '' };
    let hasError = false;

    if (!emailForm.name.trim()) {
      newErrors.name = 'El nombre completo es requerido.';
      hasError = true;
    } else if (emailForm.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres.';
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailForm.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido.';
      hasError = true;
    } else if (!emailRegex.test(emailForm.email.trim())) {
      newErrors.email = 'El formato del correo electrónico no es válido.';
      hasError = true;
    }

    if (!emailForm.subject.trim()) {
      newErrors.subject = 'El asunto o número de pedido es requerido.';
      hasError = true;
    } else if (emailForm.subject.trim().length < 4) {
      newErrors.subject = 'El asunto debe tener al menos 4 caracteres.';
      hasError = true;
    }

    if (!emailForm.message.trim()) {
      newErrors.message = 'El detalle de la solicitud es requerido.';
      hasError = true;
    } else if (emailForm.message.trim().length < 10) {
      newErrors.message = 'El mensaje debe tener al menos 10 caracteres.';
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      return;
    }

    if (parseInt(userMathAnswer) !== mathNums.n1 + mathNums.n2) {
      setCaptchaError(true);
      return;
    }
    setCaptchaError(false);
    setSubmitError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error?.message || 'Error al enviar el ticket de soporte');
      }

      setEmailSent(true);
      setEmailForm({ name: '', email: '', subject: '', message: '' });
      setUserMathAnswer('');
      
      // Regenerar Captcha
      const n1 = Math.floor(Math.random() * 9) + 1;
      const n2 = Math.floor(Math.random() * 9) + 1;
      setMathNums({ n1, n2 });

      setTimeout(() => {
        setEmailSent(false);
      }, 5000);
    } catch (err: any) {
      console.error("Support submission error:", err);
      setSubmitError(err.message || 'No se pudo enviar tu mensaje. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };



  // FAQ Filter Logic (Filters questions directly as user types with accent/diacritic-insensitive matching)
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;

    const normalize = (text: string) =>
      text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const normalizedQuery = normalize(searchQuery);

    return faqs.filter(faq =>
      normalize(faq.q).includes(normalizedQuery) ||
      normalize(faq.a).includes(normalizedQuery) ||
      normalize(faq.categoryName).includes(normalizedQuery)
    );
  }, [searchQuery]);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#fafafc] text-zinc-950 flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      <PublicHeader />

      {/* HERO SECTION / SEARCH */}
      <section className="relative bg-[#0c0d12] text-white pt-24 pb-28 px-6 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(30,41,59,0.5),rgba(255,255,255,0))]" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <span className="text-xs uppercase tracking-widest font-bold text-sky-400 bg-sky-500/10 px-3.5 py-1.5 rounded-full inline-block">
            Centro de Ayuda Oficial
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
            ¿Cómo podemos ayudarte hoy?
          </h1>

          {/* Clean Functional Search Bar */}
          <div className="max-w-2xl mx-auto mt-8 relative">
            <div className="relative flex items-center bg-white shadow-2xl rounded-full border border-zinc-800/20 overflow-hidden focus-within:ring-2 focus-within:ring-sky-500 transition-all duration-300">
              <Search className="absolute left-6 h-5 w-5 text-zinc-400 pointer-events-none" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ingresa tu duda (ej. despacho, factura, garantía)..." 
                className="w-full bg-transparent text-zinc-900 placeholder-zinc-400 py-5 pl-16 pr-28 outline-none text-base font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-16 text-zinc-400 hover:text-zinc-950 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              <span className="absolute right-6 text-xs bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded font-semibold pointer-events-none hidden md:inline">
                Buscar
              </span>
            </div>


          </div>
        </div>
      </section>

      {/* DYNAMIC FAQ SECTION */}
      <section className="py-20 px-6 max-w-4xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900">
            Preguntas Frecuentes
          </h2>
          <p className="text-sm text-zinc-500">
            {filteredFaqs.length === 0 
              ? 'No encontramos artículos específicos. Intenta buscar otro término.' 
              : `Mostrando ${filteredFaqs.length} pregunta(s) que coinciden con tu búsqueda.`}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden divide-y divide-zinc-100 transition-all duration-300">
          {filteredFaqs.map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <div key={faq.q} className="overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 md:p-8 text-left cursor-pointer hover:bg-zinc-50/50 transition-colors"
                >
                  <div>
                    <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider block mb-1">{faq.categoryName}</span>
                    <span className="text-sm md:text-base font-bold text-zinc-900 pr-4 leading-tight">{faq.q}</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-zinc-400 shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-sky-500' : ''}`} />
                </button>
                
                {isExpanded && (
                  <div className="bg-zinc-50/40 border-t border-zinc-50 transition-all duration-200">
                    <div className="p-6 md:p-8 pt-4 text-xs md:text-sm text-zinc-600 leading-relaxed font-medium">
                      <p>{faq.a}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="p-12 text-center space-y-4">
              <p className="text-sm text-zinc-500 font-medium">No se encontraron resultados para tu búsqueda.</p>
              <div className="flex justify-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="text-xs rounded-full cursor-pointer"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CHANNELS OF CONTACT */}
      <section className="bg-zinc-100/60 border-t border-b border-zinc-200/80 py-24 px-6 w-full">
        <div className="max-w-[1300px] mx-auto w-full">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900">¿Prefieres Soporte Directo? Contáctanos</h2>
            <p className="text-sm text-zinc-500 max-w-xl mx-auto">Nuestro equipo de atención al cliente está listo para ayudarte con tu compra.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {/* Channel 1: WhatsApp */}
            <div className="p-8 rounded-[36px] bg-white border border-zinc-200/80 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-6">
                <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-950">WhatsApp Directo</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Escríbenos para resolver dudas de stock, coordinar despachos o consultar precios por volumen.</p>
                <div className="text-base font-bold text-emerald-600">+56 9 2610 9897</div>
              </div>
              <a 
                href="https://wa.me/56926109897" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mt-6 w-full rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold h-11 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Abrir WhatsApp</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Channel 2: Email Support */}
            <div className="p-8 rounded-[36px] bg-white border border-zinc-200/80 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-6">
                <div className="h-12 w-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-950">Correo de Soporte</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Envíanos tus órdenes de compra B2B, solicitudes de postventa o dudas comerciales.</p>
                <div className="text-xs text-zinc-400 font-medium">contactoweb@jdevoto.cl</div>
              </div>
              <a 
                href="mailto:contactoweb@jdevoto.cl" 
                className="mt-6 w-full rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold h-11 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Enviar Correo</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Channel 3: Phone Support */}
            <div className="p-8 rounded-[36px] bg-white border border-zinc-200/80 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-6">
                <div className="h-12 w-12 bg-zinc-100 text-zinc-700 rounded-2xl flex items-center justify-center">
                  <Phone className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-950">Línea Directa</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Atención telefónica directa en nuestra oficina central corporativa de Placilla (Valparaíso).</p>
                <div className="text-base font-bold text-zinc-900">(32) 331 5100</div>
              </div>
              <a 
                href="tel:+56323315100" 
                className="mt-6 w-full rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold h-11 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Llamar Ahora</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* BOTTOM FORM: OPEN A SUPPORT TICKET */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 bg-white rounded-[40px] border border-zinc-200/80 p-8 md:p-12 shadow-sm">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs uppercase font-extrabold tracking-widest text-sky-600 bg-sky-50 px-3 py-1.5 rounded-full inline-block">
                Soporte vía Ticket
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-950">Abre una Solicitud de Ayuda</h3>
              <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">
                ¿Tienes algún problema con un pedido recibido, necesitas solicitar un cambio de mercadería o necesitas cotizar insumos para tu oficina de forma mayorista?
              </p>
              <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">
                Completa el formulario a la derecha y nuestro equipo de servicio de Placilla responderá a tu solicitud en menos de 24 horas hábiles.
              </p>
              <div className="pt-4 border-t border-zinc-100 space-y-2 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <span>contactoweb@jdevoto.cl</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                  <span>Décima Avenida 1740, Placilla, Valparaíso</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-zinc-50/50 rounded-3xl p-6 md:p-8 border border-zinc-100">
              {emailSent ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <h4 className="text-xl font-bold text-zinc-900">¡Solicitud Creada Exitosamente!</h4>
                  <p className="text-xs text-zinc-500 max-w-sm">
                    Hemos recibido tu requerimiento. Te enviamos un correo de confirmación y un ejecutivo se contactará contigo para coordinar el caso.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-4 text-xs md:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-zinc-700">Nombre Completo</label>
                      <input 
                        type="text" 
                        required
                        value={emailForm.name}
                        onChange={(e) => {
                          setEmailForm({...emailForm, name: e.target.value});
                          if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                        }}
                        className={`w-full bg-white border rounded-xl px-4 py-2.5 outline-none focus:ring-1 transition-all ${
                          errors.name 
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 text-rose-600' 
                            : 'border-zinc-200/80 focus:border-sky-500 focus:ring-sky-500/20 text-zinc-950'
                        }`}
                        placeholder="Ej. Juan Pérez"
                      />
                      {errors.name && (
                        <p className="text-[11px] font-semibold text-rose-500 mt-1">{errors.name}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-zinc-700">Correo Electrónico</label>
                      <input 
                        type="email" 
                        required
                        value={emailForm.email}
                        onChange={(e) => {
                          setEmailForm({...emailForm, email: e.target.value});
                          if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                        }}
                        className={`w-full bg-white border rounded-xl px-4 py-2.5 outline-none focus:ring-1 transition-all ${
                          errors.email 
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 text-rose-600' 
                            : 'border-zinc-200/80 focus:border-sky-500 focus:ring-sky-500/20 text-zinc-950'
                        }`}
                        placeholder="ejemplo@empresa.cl"
                      />
                      {errors.email && (
                        <p className="text-[11px] font-semibold text-rose-500 mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-700">Asunto / Número de Pedido</label>
                    <input 
                      type="text" 
                      required
                      value={emailForm.subject}
                      onChange={(e) => {
                        setEmailForm({...emailForm, subject: e.target.value});
                        if (errors.subject) setErrors(prev => ({ ...prev, subject: '' }));
                      }}
                      className={`w-full bg-white border rounded-xl px-4 py-2.5 outline-none focus:ring-1 transition-all ${
                        errors.subject 
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 text-rose-600' 
                          : 'border-zinc-200/80 focus:border-sky-500 focus:ring-sky-500/20 text-zinc-950'
                      }`}
                      placeholder="Ej. Problema con despacho - Pedido JD-3420"
                    />
                    {errors.subject && (
                      <p className="text-[11px] font-semibold text-rose-500 mt-1">{errors.subject}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-700">Mensaje / Detalle de la Solicitud</label>
                    <textarea 
                      rows={4}
                      required
                      value={emailForm.message}
                      onChange={(e) => {
                        setEmailForm({...emailForm, message: e.target.value});
                        if (errors.message) setErrors(prev => ({ ...prev, message: '' }));
                      }}
                      className={`w-full bg-white border rounded-xl px-4 py-2.5 outline-none focus:ring-1 transition-all resize-none ${
                        errors.message 
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 text-rose-600' 
                          : 'border-zinc-200/80 focus:border-sky-500 focus:ring-sky-500/20 text-zinc-950'
                      }`}
                      placeholder="Describe los detalles de tu consulta o el inconveniente con tu pedido..."
                    />
                    {errors.message && (
                      <p className="text-[11px] font-semibold text-rose-500 mt-1">{errors.message}</p>
                    )}
                  </div>

                  {/* Honeypot field (hidden from users, filled by bots) */}
                  <div className="hidden" aria-hidden="true">
                    <input 
                      type="text" 
                      name="website_url" 
                      value={honeypot} 
                      onChange={(e) => setHoneypot(e.target.value)} 
                      tabIndex={-1} 
                      autoComplete="off" 
                    />
                  </div>

                  {/* Math Captcha to prevent bot submissions */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-700 flex items-center gap-2">
                      <span>Verificación de Seguridad</span>
                      <span className="text-xs text-zinc-400 font-normal">(Resuelve la suma para verificar que eres humano)</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-2.5 font-bold text-zinc-800 select-none tracking-wide text-sm shrink-0">
                        {mounted ? `${mathNums.n1} + ${mathNums.n2} =` : '... + ... ='}
                      </div>
                      <input 
                        type="text" 
                        required
                        value={userMathAnswer}
                        onChange={(e) => {
                          setUserMathAnswer(e.target.value);
                          if (captchaError) setCaptchaError(false);
                        }}
                        className={`w-24 bg-white border rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 text-center font-bold text-sm ${
                          captchaError ? 'border-rose-500 ring-1 ring-rose-500/20 text-rose-600' : 'border-zinc-200/80 text-zinc-900'
                        }`}
                        placeholder="?"
                      />
                    </div>
                    {captchaError && (
                      <p className="text-xs font-semibold text-rose-500 mt-1">El resultado es incorrecto. Por favor vuelve a intentarlo.</p>
                    )}
                  </div>

                  <Button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-bold h-11 rounded-xl cursor-pointer"
                  >
                    {submitting ? 'Enviando...' : 'Enviar Solicitud de Ayuda'}
                  </Button>

                  {submitError && (
                    <p className="text-xs font-semibold text-rose-500 text-center mt-2">{submitError}</p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>



      <PublicFooter />
    </div>
  );
}
