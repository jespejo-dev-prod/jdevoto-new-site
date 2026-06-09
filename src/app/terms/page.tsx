'use client';

import React from 'react';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { Shield, FileText, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <PublicHeader />

      <main className="flex-grow max-w-[1000px] mx-auto w-full px-6 py-16 md:py-24 space-y-12">
        {/* Page Header */}
        <div className="space-y-4 border-b border-zinc-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-white rounded-full">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Legal & Cumplimiento
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight uppercase">
            Términos de Servicio B2B
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Última actualización: 9 de junio de 2026. Vigente para transacciones comerciales e institucionales.
          </p>
        </div>

        {/* Content sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main text column */}
          <div className="lg:col-span-8 space-y-8 text-zinc-700 text-sm leading-relaxed font-semibold">
            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                1. Relación Contractual y Elegibilidad B2B
              </h2>
              <p>
                El acceso y uso de esta plataforma de e-commerce está destinado exclusivamente a personas jurídicas y personas naturales con inicio de actividades comerciales válidas en el territorio nacional. Al registrarse, usted declara contar con los poderes de representación necesarios para comprometer financieramente a su empresa.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                2. Cotizaciones, Pedidos y Precios
              </h2>
              <p>
                Todos los precios expuestos en nuestro catálogo son netos (no incluyen IVA) y están sujetos a confirmación de inventario. El envío de una orden a través del portal constituye una propuesta de compra que será confirmada mediante la emisión de una nota de venta o factura de despacho.
              </p>
              <p>
                Los descuentos automáticos por volumen de compra y tarifas asignadas a cuentas específicas de clientes se aplicarán conforme a las condiciones acordadas en los contratos marco vigentes con cada empresa cliente.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                3. Condiciones de Despacho y Logística
              </h2>
              <p>
                La entrega física de los productos comprados se efectuará en las direcciones registradas en la cuenta del cliente. La opción de despacho gratuito está sujeta a los montos de compra mínima por pedido y limitaciones territoriales definidas para zonas urbanas e industriales de distribución directa.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                4. Medios de Pago y Crédito Corporativo
              </h2>
              <p>
                Las transacciones procesadas en este sitio se cancelan mediante transferencias bancarias protegidas, pagos directos en línea o mediante la línea de crédito corporativo otorgada previa evaluación comercial. La mora o atraso en el pago diferido dará derecho a la suspensión inmediata del despacho de pedidos subsiguientes.
              </p>
            </section>
          </div>

          {/* Quick sidebar summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-zinc-200 p-6 rounded-[28px] shadow-sm space-y-6">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">
                Puntos Clave para Empresas
              </h3>
              <ul className="space-y-4 text-xs font-bold text-zinc-500">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Precios Netos (+IVA) en todo el catálogo.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Monto mínimo de compra para facturación B2B.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Despacho condicionado a zonas industriales de cobertura.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Evaluación requerida para líneas de pago diferido.</span>
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
