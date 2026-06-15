'use client';

import React from 'react';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { FileSpreadsheet, Download, HelpCircle, FileText, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function PortalFacturacionPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <PublicHeader />

      <main className="flex-grow max-w-[1000px] mx-auto w-full px-6 py-16 md:py-24 space-y-12">
        {/* Page Header */}
        <div className="space-y-4 border-b border-zinc-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-white rounded-full">
            <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
            Finanzas & Administración
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight uppercase">
            Portal de Facturación B2B
          </h1>
          <p className="text-zinc-650 text-base md:text-lg font-medium">
            Acceso a documentos tributarios electrónicos (DTE), notas de crédito e historial financiero de tu empresa.
          </p>
        </div>

        {/* Content sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Descargar DTEs */}
          <div className="p-8 rounded-[36px] bg-white border border-zinc-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Facturas y Documentos</h3>
              <p className="text-sm font-medium text-zinc-500 leading-relaxed">
                Todas las facturas electrónicas emitidas a nombre de tu razón social se asocian de forma automática a tu RUT y quedan almacenadas para descarga en formato PDF.
              </p>
            </div>
            <div className="pt-6">
              <Link href="/dashboard/orders" className="inline-flex items-center gap-2 px-6 py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all">
                Ver Historial de Pedidos
                <ArrowUpRight className="h-4.5 w-4.5 text-primary" />
              </Link>
            </div>
          </div>

          {/* Card 2: Consultas Financieras */}
          <div className="p-8 rounded-[36px] bg-white border border-zinc-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Consultas de Crédito y Pagos</h3>
              <p className="text-sm font-medium text-zinc-500 leading-relaxed">
                Si requieres copias de estados de cuenta consolidado, aclaración de facturas pendientes o informar transferencias bancarias de abono, puedes contactar al área de contabilidad corporativa.
              </p>
            </div>
            <div className="pt-6">
              <Link href="/support" className="inline-flex items-center gap-2 px-6 py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all">
                Soporte de Cobranza
                <ArrowUpRight className="h-4.5 w-4.5 text-primary" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
