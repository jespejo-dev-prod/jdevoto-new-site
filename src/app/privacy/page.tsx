'use client';

import React from 'react';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { Lock, Eye, ShieldCheck, FileText } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <PublicHeader />

      <main className="flex-grow max-w-[1100px] mx-auto w-full px-6 py-16 md:py-24 space-y-12">
        {/* Page Header */}
        <div className="space-y-4 border-b border-zinc-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-white rounded-full">
            <Lock className="h-3.5 w-3.5 text-sky-400" />
            Privacidad & Protección de Datos
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight uppercase">
            Política de Privacidad
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Última actualización: 23 de junio de 2026. Cumplimiento legal de protección de datos personales y comerciales en JDevoto.cl.
          </p>
        </div>

        {/* Content sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main text column */}
          <div className="lg:col-span-8 space-y-8 text-zinc-700 text-sm leading-relaxed font-semibold">
            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Eye className="h-4 w-4 text-sky-500" />
                1. Información que Recopilamos
              </h2>
              <p>
                Recopilamos información relacionada tanto con las personas jurídicas registradas en el portal como con sus representantes comerciales autorizados:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-zinc-600 font-medium">
                <li>**Datos Corporativos:** Razón Social, RUT de la empresa, Giro comercial, Dirección de Facturación, Dirección de Despacho y Línea de Crédito autorizada.</li>
                <li>**Datos del Representante Comercial:** Nombre completo, número de teléfono, correo electrónico, rol dentro de la empresa e historial de compras.</li>
                <li>**Información de Navegación y Uso:** Cookies técnicas esenciales, tokens de autenticación de sesión B2B y registros de auditoría de acciones realizadas dentro del panel de administración corporativo.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Eye className="h-4 w-4 text-sky-500" />
                2. Uso y Finalidad de los Datos
              </h2>
              <p>
                Los datos personales y comerciales recopilados se utilizan de manera exclusiva para garantizar una correcta experiencia de compra mayorista y el cumplimiento logístico:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-zinc-600 font-medium">
                <li>Validar la vigencia del RUT de la empresa ante el Servicio de Impuestos Internos (SII).</li>
                <li>Generar cotizaciones formales en PDF, facturas electrónicas y guías de despacho correspondientes a los pedidos corporativos.</li>
                <li>Coordinar el despacho de productos con transportistas oficiales y externos asociados a la modalidad seleccionada (Flete Pagado o Flete por Pagar).</li>
                <li>Evaluar comercialmente el comportamiento e historial crediticio para el otorgamiento y mantención de la línea de crédito B2B diferida.</li>
                <li>Enviar notificaciones urgentes e indispensables por correo electrónico (actualización de pedidos, facturas adjuntas en formato PDF o alertas de seguridad de la cuenta).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Eye className="h-4 w-4 text-sky-500" />
                3. Confidencialidad y Transferencia de Datos a Terceros
              </h2>
              <p>
                En JDevoto no vendemos, arrendamos ni comercializamos bases de datos comerciales o listas de correo de nuestros clientes a empresas externas con fines de marketing.
              </p>
              <p>
                Toda la información se maneja con estricta confidencialidad. Los datos solo se comunicarán a terceros indispensables en la cadena operativa:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-zinc-600 font-medium">
                <li>**Pasarela de Pagos (Mercado Pago):** Para procesar transacciones en línea, tarjetas de débito/crédito y liberar el cupo.</li>
                <li>**Empresas de Logística (T. Espinoza, FedEx, Ecoex, Swisslog, Starken, etc.):** Con el fin exclusivo de coordinar y efectuar la entrega física del pedido.</li>
                <li>**Entes Gubernamentales y Fiscales:** Cuando la legislación chilena lo requiera para fines tributarios y contables obligatorios (SII).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Eye className="h-4 w-4 text-sky-500" />
                4. Seguridad e Integridad de la Información
              </h2>
              <p>
                Implementamos altos estándares tecnológicos de seguridad para resguardar el almacenamiento y la transmisión de los datos corporativos de nuestros usuarios:
              </p>
              <p>
                Toda la navegación y llamadas a la API dentro del portal están encriptadas mediante protocolo seguro SSL/HTTPS. Además, las contraseñas y claves de autenticación en nuestra base de datos se almacenan cifradas con algoritmos criptográficos robustos de un solo sentido. El acceso al panel corporativo queda estrictamente condicionado al uso de las credenciales asignadas por el administrador de la cuenta.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Eye className="h-4 w-4 text-sky-500" />
                5. Derechos ARCO de los Titulares (Acceso, Rectificación, Cancelación y Oposición)
              </h2>
              <p>
                Los representantes autorizados de las empresas tienen el derecho en cualquier momento de ejercer sus derechos de acceso, rectificación, cancelación u oposición al tratamiento de sus datos personales.
              </p>
              <p>
                Para solicitar la modificación o actualización de datos de facturación incorrectos, actualizar los nombres de los compradores o solicitar la baja de una cuenta corporativa en desuso, puede escribir directamente a nuestro correo de contacto oficial: **contactoweb@jdevoto.cl**.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Eye className="h-4 w-4 text-sky-500" />
                6. Uso de Cookies Técnicas de Sesión
              </h2>
              <p>
                JDevoto.cl utiliza cookies técnicas estrictamente indispensables para el correcto funcionamiento de la plataforma:
              </p>
              <p>
                Estas cookies tienen como única finalidad mantener activa la sesión B2B del usuario autenticado, almacenar de manera temporal los productos añadidos al carrito de compras y resguardar la seguridad del portal frente a posibles ataques informáticos (como la falsificación de solicitudes entre sitios). Estas tecnologías no recopilan información personal para comercialización publicitaria con redes de terceros.
              </p>
            </section>
          </div>

          {/* Quick sidebar summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-zinc-200 p-6 rounded-[28px] shadow-sm space-y-6">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">
                Garantías de Privacidad
              </h3>
              <ul className="space-y-4 text-xs font-bold text-zinc-500">
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Cifrado HTTPS y encriptación de claves de acceso corporativas.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Uso exclusivo para el procesamiento del pedido y logística B2B.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>No vendemos ni compartimos bases de datos con fines comerciales de terceros.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Cookies técnicas dedicadas exclusivamente al carrito y mantención de sesión.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Derecho a rectificar datos del RUT y razón social de la empresa en cualquier momento.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
