'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileText, Wrench, PenTool, Sparkles, Search, MessageCircle, Phone, Mail, 
  ArrowRight, ChevronRight, X, Send, Smartphone, ChevronDown, Check, MapPin, CheckCircle
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
  const [chatOpen, setChatOpen] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Captcha & Honeypot State
  const [mathNums, setMathNums] = useState(() => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    return { n1, n2 };
  });
  const [userMathAnswer, setUserMathAnswer] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  // Email Ticket State
  const [emailForm, setEmailForm] = useState({ name: '', email: '', subject: '', message: '' });

  // Live Chat Simulator State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    { sender: 'bot', text: '¡Hola! Gracias por contactar al Centro de Soporte de jdevoto.cl. ¿En qué podemos ayudarte hoy?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // --- DATA ---
  const faqs: FAQ[] = [
    { 
      category: 'manualidades', 
      categoryName: 'Manualidades y Escolar',
      q: '¿Tienen precios especiales para librerías o compras escolares por volumen?', 
      a: 'Sí, en jdevoto.cl nos especializamos en ventas al por mayor para oficinas y librerías. Al agregar productos al carrito, puedes seleccionar la opción "Solicitar Cotización" para recibir un descuento por volumen.' 
    },
    { 
      category: 'manualidades', 
      categoryName: 'Manualidades y Escolar',
      q: '¿Los materiales para manualidades (como goma EVA y paño lenci) son seguros para niños?', 
      a: 'Todos nuestros productos escolares y de manualidades cumplen con las normativas de seguridad chilenas vigentes y son libres de elementos tóxicos, siendo totalmente aptos para el uso escolar.' 
    },
    { 
      category: 'oficina', 
      categoryName: 'Oficina y Escritorio',
      q: '¿Tienen stock continuo de repuestos como corchetes y papel térmico?', 
      a: 'Sí, mantenemos un stock permanente de corchetes 26/6, N°10, grapas de acero de distintas medidas y rollos de papel térmico para boletas y terminales de punto de venta (POS).' 
    },
    { 
      category: 'oficina', 
      categoryName: 'Oficina y Escritorio',
      q: '¿Cómo descargo mi factura electrónica?', 
      a: 'Todas las facturas electrónicas emitidas por JDevoto se envían automáticamente al correo registrado en el Servicio de Impuestos Internos. También puedes visualizarlas y descargarlas en tu panel de usuario en la sección de "Mis Pedidos".' 
    },
    { 
      category: 'ferreteria', 
      categoryName: 'Ferretería y Fijaciones',
      q: '¿Qué tipo de garantía tienen las herramientas de mano y pistolas de silicona?', 
      a: 'Todos nuestros productos de ferretería y herramientas cuentan con la garantía de 6 meses ante fallas o defectos de fabricación. Si tu equipo presenta problemas, puedes iniciar un caso de cambio o devolución.' 
    },
    { 
      category: 'ferreteria', 
      categoryName: 'Ferretería y Fijaciones',
      q: '¿Los clavos de exterior y las grapas galvanizadas resisten la humedad?', 
      a: 'Sí, las líneas de clavos exterior y grapas galvanizadas de nuestro catálogo cuentan con tratamientos anticorrosivos que les permiten soportar la humedad y la intemperie, siendo ideales para carpintería exterior.' 
    },
    { 
      category: 'regalos', 
      categoryName: 'Regalos y Novedades',
      q: '¿Los juegos de mesa, tarots y naipes vienen sellados?', 
      a: 'Sí, todas las barajas de naipes emoji, tarots y juegos de mesa comercializados en nuestra tienda son productos 100% nuevos y vienen con el sello hermético de fábrica para asegurar la integridad de todas sus cartas.' 
    },
    { 
      category: 'regalos', 
      categoryName: 'Regalos y Novedades',
      q: '¿Cuáles son las políticas si compro un regalo y quiero cambiarlo?', 
      a: 'Dispones de 10 días corridos desde la recepción de tu compra para solicitar cambios o retracto. El producto debe estar sellado, sin uso, y con su empaque original intacto.' 
    }
  ];

  // --- HANDLERS ---
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) {
      console.log('Bot submission detected via Honeypot');
      return;
    }
    if (parseInt(userMathAnswer) !== mathNums.n1 + mathNums.n2) {
      setCaptchaError(true);
      return;
    }
    setCaptchaError(false);
    if (!emailForm.name || !emailForm.email || !emailForm.message) return;
    setEmailSent(true);
    setTimeout(() => {
      setEmailSent(false);
      setEmailForm({ name: '', email: '', subject: '', message: '' });
      setUserMathAnswer('');
      // Regenerate Captcha
      const n1 = Math.floor(Math.random() * 9) + 1;
      const n2 = Math.floor(Math.random() * 9) + 1;
      setMathNums({ n1, n2 });
    }, 3000);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    // Simulate response based on user input
    setTimeout(() => {
      let response = '';
      const query = userMsg.toLowerCase();
      
      if (query.includes('pedido') || query.includes('rastrear') || query.includes('seguimiento') || query.includes('despacho')) {
        response = 'Para consultar el estado de tu pedido, puedes escribirnos con tu RUT o número de compra a soporte@jdevoto.cl o iniciar un ticket en el formulario de contacto.';
      } else if (query.includes('factura') || query.includes('xml')) {
        response = 'Las facturas electrónicas se envían automáticamente al correo de facturación tras el despacho. También puedes revisarlas en tu perfil, en la pestaña "Mis Pedidos".';
      } else if (query.includes('garantia') || query.includes('fallo') || query.includes('devolver') || query.includes('cambiar')) {
        response = 'Nuestros productos de ferretería y herramientas cuentan con garantía de 6 meses. Escríbenos directamente o abre un caso de soporte para gestionar el cambio.';
      } else if (query.includes('volumen') || query.includes('cotizar') || query.includes('mayorista')) {
        response = 'Ofrecemos precios preferenciales por volumen en papelería, aseo y ferretería. Solicita tu cotización formal al momento de procesar tu carro.';
      } else if (query.includes('humano') || query.includes('hablar') || query.includes('persona')) {
        response = 'Te estamos transfiriendo con un ejecutivo de servicio al cliente. Te responderemos aquí en breves instantes.';
      } else {
        response = 'He recibido tu mensaje. Para asistirte de forma óptima, ¿podrías indicarnos el SKU del producto o el número de tu pedido?';
      }
      
      setChatMessages(prev => [...prev, { sender: 'bot', text: response }]);
    }, 800);
  };

  // Pre-fill search from tags
  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
  };

  // FAQ Filter Logic (Filters questions directly as user types)
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    return faqs.filter(faq => 
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
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
          <p className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto">
            Busca respuestas rápidas sobre tus compras de papelería, oficina, herramientas de ferretería y regalos.
          </p>

          {/* Clean Functional Search Bar */}
          <div className="max-w-2xl mx-auto mt-8 relative">
            <div className="relative flex items-center bg-white shadow-2xl rounded-full border border-zinc-800/20 overflow-hidden focus-within:ring-2 focus-within:ring-sky-500 transition-all duration-300">
              <Search className="absolute left-6 h-5 w-5 text-zinc-400 pointer-events-none" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ingresa tu duda (ej. despacho, factura, corchetera)..." 
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

            {/* Quick Suggestions underneath */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-500">Búsquedas populares:</span>
              {['Factura Electrónica', 'Garantía', 'Despacho', 'Goma EVA'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 font-medium px-3 py-1 rounded-full transition-all duration-200 cursor-pointer"
                >
                  {tag}
                </button>
              ))}
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
                <Button 
                  size="sm"
                  onClick={() => setChatOpen(true)}
                  className="text-xs rounded-full bg-zinc-950 text-white cursor-pointer"
                >
                  Chatear con Soporte
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
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

            {/* Channel 2: Live Chat */}
            <div className="p-8 rounded-[36px] bg-white border border-zinc-200/80 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-6">
                <div className="h-12 w-12 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center relative">
                  <MessageCircle className="h-6 w-6" />
                  <span className="absolute top-0.5 right-0.5 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <h3 className="text-lg font-bold text-zinc-950">Chat en Vivo</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Chatea directamente con un ejecutivo de servicio al cliente de JDevoto en Valparaíso.</p>
                <div className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Disponible Online</span>
                </div>
              </div>
              <button 
                onClick={() => setChatOpen(true)}
                className="mt-6 w-full rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold h-11 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Iniciar Chat</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Channel 3: Email Support */}
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

            {/* Channel 4: Phone Support */}
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
                        onChange={(e) => setEmailForm({...emailForm, name: e.target.value})}
                        className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
                        placeholder="Ej. Juan Pérez"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-zinc-700">Correo Electrónico</label>
                      <input 
                        type="email" 
                        required
                        value={emailForm.email}
                        onChange={(e) => setEmailForm({...emailForm, email: e.target.value})}
                        className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
                        placeholder="ejemplo@empresa.cl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-700">Asunto / Número de Pedido</label>
                    <input 
                      type="text" 
                      required
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                      className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
                      placeholder="Ej. Problema con despacho - Pedido JD-3420"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-700">Mensaje / Detalle de la Solicitud</label>
                    <textarea 
                      rows={4}
                      required
                      value={emailForm.message}
                      onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                      className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 resize-none"
                      placeholder="Describe los detalles de tu consulta o el inconveniente con tu pedido..."
                    />
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
                        {mathNums.n1} + {mathNums.n2} =
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
                    className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold h-11 rounded-xl cursor-pointer"
                  >
                    Enviar Solicitud de Ayuda
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- FLOATING CHAT WIDGET (LIVE CHAT SIMULATOR) --- */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-3xl border border-zinc-200 shadow-2xl z-50 overflow-hidden flex flex-col h-[480px]">
          {/* Chat Header */}
          <div className="bg-[#0c0d12] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-sky-500 flex items-center justify-center text-white relative">
                <MessageCircle className="h-5 w-5" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 border-2 border-[#0c0d12] rounded-full" />
              </div>
              <div>
                <h4 className="text-xs md:text-sm font-bold leading-tight">Chat de Atención JDevoto</h4>
                <span className="text-[10px] text-zinc-400">Respuesta típica: menos de 5 min</span>
              </div>
            </div>
            <button 
              onClick={() => setChatOpen(false)}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-grow p-4 overflow-y-auto bg-zinc-50 space-y-3 flex flex-col justify-end">
            <div className="space-y-3 max-h-[320px] overflow-y-auto flex flex-col pb-2">
              {chatMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs ${
                    msg.sender === 'user' 
                      ? 'bg-zinc-950 text-white self-end rounded-tr-none' 
                      : 'bg-white border border-zinc-200 text-zinc-800 self-start rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          </div>

          {/* Predefined Quick Questions */}
          <div className="p-2 border-t border-zinc-100 flex gap-1.5 overflow-x-auto whitespace-nowrap bg-white text-[10px] scrollbar-none">
            {[
              '¿Estado de mi pedido?',
              'Compras de papelería por volumen',
              'Medidas de papel térmico',
              'Hablar con ejecutivo'
            ].map(q => (
              <button
                key={q}
                onClick={() => {
                  setChatInput(q);
                }}
                className="bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChatMessage} className="p-3 border-t border-zinc-100 bg-white flex gap-2">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="w-full bg-zinc-50 rounded-xl px-4 py-2 outline-none text-xs border border-zinc-200 focus:border-sky-500"
            />
            <button 
              type="submit"
              className="p-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
