'use client';

import React from 'react';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { Lock, Eye, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <PublicHeader />

      <main className="flex-grow max-w-[1000px] mx-auto w-full px-6 py-16 md:py-24 space-y-12">
        {/* Page Header */}
        <div className="space-y-4 border-b border-zinc-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-white rounded-full">
            <Lock className="h-3.5 w-3.5 text-primary" />
            Privacidad & Protección
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight uppercase">
            Política de Privacidad B2B
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Última actualización: 9 de junio de 2026. Cumplimiento legal de protección de datos corporativos.
          </p>
        </div>

        {/* Content sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main text column */}
          <div className="lg:col-span-8 space-y-8 text-zinc-700 text-sm leading-relaxed font-semibold">
            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                1. Información que Recopilamos
              </h2>
              <p>
                Recopilamos información relacionada con las personas jurídicas registradas (Razón Social, RUT, Giro, Dirección de Facturación y de Despacho) así como de los representantes comerciales autorizados (Nombre, Teléfono, Correo Electrónico y Rol dentro de la empresa) con el fin exclusivo de procesar transacciones comerciales y coordinar la logística.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                2. Uso y Finalidad de los Datos
              </h2>
              <p>
                Los datos recolectados se utilizan exclusivamente para:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Validar la vigencia comercial de la empresa registrada y verificar poderes de compra.</li>
                <li>Generar cotizaciones formales, facturas electrónicas y guías de despacho.</li>
                <li>Coordinar los despachos logísticos con transportistas oficiales y externos autorizados.</li>
                <li>Evaluar solicitudes y comportamiento de pago para el otorgamiento de líneas de crédito corporativas.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                3. Intercambio y Transferencia de Datos
              </h2>
              <p>
                No vendemos ni comercializamos bases de datos comerciales o listas de correo de nuestros clientes con terceros ajenos al negocio. Los datos necesarios para el transporte y facturación solo se comparten con proveedores de servicios de despacho y con entes gubernamentales (Servicio de Impuestos Internos) para efectos de cumplimiento legal tributario.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                4. Seguridad e Integridad de la Información
              </h2>
              <p>
                Implementamos estándares de seguridad tecnológica avanzados para resguardar la confidencialidad de la información corporativa almacenada. El acceso a su portal está encriptado y restringido únicamente al personal que usted autorice mediante credenciales individuales seguras.
              </p>
            </section>
          </div>

          {/* Quick sidebar summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-zinc-200 p-6 rounded-[28px] shadow-sm space-y-6">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">
                Garantías de Seguridad
              </h3>
              <ul className="space-y-4 text-xs font-bold text-zinc-500">
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Cifrado de datos en tránsito y almacenamiento.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Acceso restringido por credenciales cifradas.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Cumplimiento tributario en facturas y notas fiscales.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Uso exclusivo para comercio e inventarios corporativos.</span>
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
