'use client';

import React from 'react';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { Shield, FileText, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <PublicHeader />

      <main className="flex-grow max-w-[1100px] mx-auto w-full px-6 py-16 md:py-24 space-y-12">
        {/* Page Header */}
        <div className="space-y-4 border-b border-zinc-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-white rounded-full">
            <Shield className="h-3.5 w-3.5 text-sky-400" />
            Legal & Cumplimiento B2B
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight uppercase">
            Términos y Condiciones de Servicio
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Última actualización: 23 de junio de 2026. Vigente para toda persona que acceda a la plataforma y para transacciones comerciales en JDevoto.cl.
          </p>
        </div>

        {/* Content sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main text column */}
          <div className="lg:col-span-8 space-y-8 text-zinc-700 text-sm leading-relaxed font-semibold">
            
            {/* --- SECCIÓN GENERALES --- */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-500" />
                1. Aceptación de los Términos y Uso del Sitio
              </h2>
              <p>
                Al acceder, navegar o utilizar el sitio web JDevoto.cl, el usuario acepta de manera expresa y sin reservas todas las disposiciones contenidas en este documento. Si no está de acuerdo con alguno de estos términos, debe abstenerse de utilizar el sitio y sus servicios relacionados.
              </p>
              <p>
                Este sitio está destinado a proporcionar información y servicios de compra electrónica de insumos de papelería, ferretería, oficina y regalos. El usuario se compromete a realizar un uso de buena fe del portal, evitando cualquier tipo de actividad que atente contra la seguridad del sistema o el normal funcionamiento del mismo.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-500" />
                2. Propiedad Intelectual y Uso Aceptable
              </h2>
              <p>
                Todo el contenido disponible en JDevoto.cl, incluyendo de manera enunciativa pero no limitativa: logos, textos, diseños, gráficos, imágenes, códigos fuente, bases de datos y marcas comerciales, es propiedad exclusiva de JDevoto o de sus respectivos licenciantes, estando protegido por las leyes de propiedad intelectual de la República de Chile y tratados internacionales.
              </p>
              <p>
                Queda estrictamente prohibida la reproducción, copia, distribución, modificación, extracción masiva de datos (web scraping malintencionado) o cualquier explotación comercial de la información y componentes del sitio sin la autorización expresa y por escrito de JDevoto.
              </p>
            </section>

            {/* --- SECCIÓN ESPECÍFICOS B2B --- */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-500" />
                3. Registro, Representación y Cuentas B2B
              </h2>
              <p>
                El acceso, cotización y compra mayorista en nuestra plataforma B2B de JDevoto.cl está reservado de manera exclusiva para personas jurídicas o personas naturales con inicio de actividades vigentes en el Servicio de Impuestos Internos (SII).
              </p>
              <p>
                Al registrar su empresa, declara bajo juramento contar con las facultades legales necesarias para comprometer financieramente a la persona jurídica titular. Los administradores de cuenta (Company Admin) son responsables directos por el uso del cupo, la gestión de subcuentas compradoras y el resguardo de las credenciales de acceso creadas en su panel corporativo.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-500" />
                4. Precios Netos, Facturación y Pedido Mínimo Corporativo
              </h2>
              <p>
                Todos los precios listados en nuestro catálogo digital son de carácter **neto**, lo que significa que no incluyen el Impuesto al Valor Agregado (19% de IVA) ni los cobros adicionales por concepto de flete. Estos valores se totalizarán y desglosarán debidamente en el carrito y en el proceso de finalización de compra.
              </p>
              <p>
                El monto mínimo de compra neto por cada pedido enviado a través de la plataforma es de **$100.000 CLP** (cien mil pesos chilenos netos). Este monto mínimo obligatorio se calcula sobre la base de los precios de lista del catálogo y **no incluye ni considera los descuentos específicos adicionales aplicados a empresas o convenios corporativos** (es decir, el mínimo debe cumplirse antes de la aplicación de dichos descuentos corporativos específicos). No se procesarán ni facturarán órdenes por montos inferiores a dicho límite bajo ninguna condición.
              </p>
              <p>
                Las cotizaciones emitidas de manera formal en formato PDF a través del carrito de compras tienen una validez temporal y quedan sujetas a variaciones en la disponibilidad física de inventario al momento del pago o procesamiento definitivo.
              </p>
              <p>
                Las facturas electrónicas oficiales serán enviadas directamente adjuntas como archivo PDF a través del sistema de mensajería (chat) de cada pedido. Adicionalmente, el cliente recibirá una notificación automática a su correo electrónico registrado avisando que su factura está disponible para descarga.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-500" />
                5. Condiciones de Despacho y Fletes
              </h2>
              <p>
                JDevoto ofrece la modalidad de **Flete Pagado (Despacho Gratuito)** para compras que alcancen los siguientes montos mínimos de compra neta por cada pedido de forma consolidada:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-zinc-600 font-medium">
                <li>**Región Metropolitana:** Despacho gratuito en compras desde **$100.000 CLP netos**, entregado vía transportes T. Espinoza en un plazo de 24 a 48 horas hábiles.</li>
                <li>**Zona Extrema Norte (Arica, Iquique, Antofagasta, Calama):** Despacho gratuito en compras desde **$500.000 CLP netos**, transportado vía FedEx o G y G en un plazo estimado de 24 a 96 horas hábiles.</li>
                <li>**Zona Extrema Sur (Coyhaique, Aysén, Punta Arenas, Porvenir):** Despacho gratuito en compras desde **$1.000.000 CLP netos**, transportado vía Swisslog o A.T.E. en un plazo estimado de 5 a 8 días hábiles.</li>
                <li>**Otras regiones principales (Centro y Sur):** Despacho gratuito sujeto a políticas vigentes de zona geográfica, distribuido vía Ecoex o FedEx en 24 a 48 horas hábiles.</li>
                <li>**Zonas insulares y territorios especiales:** Quedan permanentemente excluidos de la política de despacho gratuito.</li>
              </ul>
              <p>
                **Flete por Pagar:** Si el monto de su compra no califica para flete pagado gratis en su zona geográfica, el despacho se enviará por cobrar. El usuario deberá seleccionar obligatoriamente al finalizar la compra su courier de preferencia (Starken, Chilexpress, Blue Express, Pullman Cargo, Varmontt o Cruz del Sur) y cancelar el costo logístico correspondiente al recibir el pedido.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-500" />
                6. Líneas de Crédito B2B, Plazos y Descuentos
              </h2>
              <p>
                Las compras pueden cancelarse mediante transferencias bancarias directas, pasarelas de pago online autorizadas (Mercado Pago con tarjetas de débito/crédito) o utilizando la línea de crédito B2B asignada por nuestro departamento de finanzas posterior a una evaluación de riesgo comercial de la empresa.
              </p>
              <p>
                Los descuentos financieros del catálogo varían de manera directa según la condición de pago aprobada y seleccionada:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-zinc-600 font-medium">
                <li>**Pago al Contado (0 días):** Otorga un **10%** de descuento adicional directo sobre el valor de lista de los productos.</li>
                <li>**Plazo de Crédito a 30 días:** Otorga un **7%** de descuento adicional sobre el total.</li>
                <li>**Plazo de Crédito a 60 días:** Otorga un **4%** de descuento adicional sobre el total.</li>
                <li>**Plazo de Crédito a 90 días:** Otorga un **0%** de descuento (precio neto establecido de lista).</li>
              </ul>
              <p>
                **Descuento a Empresas (Convenios Corporativos):** JDevoto podrá asignar un descuento especial fijo y personalizado a cuentas de empresas específicas en base a convenios comerciales vigentes. Este descuento se aplica de manera automática en el catálogo e independientemente de los descuentos financieros por plazos de pago descritos anteriormente.
              </p>
              <p>
                **Liberación del cupo:** Al realizar pedidos a crédito, se reducirá el cupo disponible de la empresa en JDevoto.cl. El pago de las facturas corporativas en la sección de facturación puede hacerse con tarjetas, transferencias o saldos vía Mercado Pago / Mercado Libre, liberando de manera automática el límite de crédito en el portal web.
              </p>
              <p>
                **Mora:** El atraso en el pago diferido de facturas otorgará el derecho de suspender la línea de crédito de la cuenta y congelar todos los despachos pendientes y futuros de forma inmediata.
              </p>
            </section>

            {/* --- SECCIÓN GARANTÍAS Y RECLAMACIONES --- */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-500" />
                7. Garantías, Devoluciones y Reclamaciones B2B
              </h2>
              <p>
                Al tratarse de transacciones de carácter comercial e institucional entre personas jurídicas y/o comerciantes, **no es aplicable el derecho a retracto unilateral** de compra contemplado en la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores (LPC), salvo acuerdo explícito y por escrito en un contrato comercial específico.
              </p>
              <p>
                Cualquier reclamo o disconformidad respecto de diferencias en la cantidad recibida, productos dañados o errores en el despacho de mercadería deberá ser notificado obligatoriamente dentro de los **5 días hábiles** siguientes a la fecha de entrega, adjuntando fotografías de respaldo a través de los canales de soporte autorizados o el chat del pedido. Una vez transcurrido dicho plazo, se considerará que la mercadería fue recibida a entera conformidad.
              </p>
              <p>
                Los productos de ferretería y herramientas cuentan con una garantía comercial de **6 meses** exclusivamente por fallas o defectos de fabricación. Quedan excluidos de esta garantía los desperfectos ocasionados por mal uso, desgaste natural o intervención no autorizada de los equipos.
              </p>
            </section>

            {/* --- SECCIÓN PRIVACIDAD --- */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-500" />
                8. Privacidad y Seguridad de Datos Comerciales
              </h2>
              <p>
                JDevoto se compromete a resguardar la confidencialidad de toda la información corporativa, datos de facturación, RUTs, direcciones comerciales y datos personales de contacto proporcionados en el portal.
              </p>
              <p>
                Estos datos serán utilizados estrictamente para la operación comercial, el procesamiento de despachos y la cobranza, y solo serán compartidos con terceros indispensables para la ejecución del servicio (tales como pasarelas de pago y empresas de transporte logístico).
              </p>
            </section>

            {/* --- SECCIÓN LEGAL Y JURISDICCIÓN --- */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-500" />
                9. Limitación de Responsabilidad, Modificaciones y Jurisdicción
              </h2>
              <p>
                JDevoto realiza sus mejores esfuerzos por mantener la disponibilidad ininterrumpida de su plataforma; sin embargo, no se responsabiliza por interrupciones temporales debido a labores de mantenimiento, actualizaciones técnicas o fallas de fuerza mayor fuera de su control logístico directo.
              </p>
              <p>
                JDevoto se reserva el derecho de modificar estos términos y condiciones en cualquier momento, bastando para ello la publicación del documento actualizado en esta sección de la plataforma.
              </p>
              <p>
                Estos términos y condiciones se rigen en todos sus puntos por las leyes vigentes de la República de Chile. Cualquier controversia, discrepancia o reclamación que derive de la interpretación o ejecución de este contrato será sometida a la jurisdicción ordinaria de los Tribunales de Justicia de la ciudad de Valparaíso.
              </p>
            </section>
          </div>

          {/* Quick sidebar summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-zinc-200 p-6 rounded-[28px] shadow-sm space-y-6">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">
                Resumen de Normas
              </h3>
              <ul className="space-y-4 text-xs font-bold text-zinc-500">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Precios Netos (+19% de IVA) en todos los productos del catálogo B2B.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Monto mínimo neto por pedido obligatorio de $100.000 CLP.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Despacho gratis en Santiago desde $100.000 CLP netos vía T. Espinoza.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Fletes por Pagar son despachados por Starken, Chilexpress u otros couriers elegidos.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Descuentos financieros decrecientes según plazos de pago (10%, 7%, 4%, 0%).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Crédito B2B liberable al instante pagando con Mercado Pago o Mercado Libre.</span>
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
