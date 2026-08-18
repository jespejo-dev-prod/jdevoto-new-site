import { getServerUser } from '@/lib/server-auth';
import { prisma } from '@/lib/client';
import { redirect } from 'next/navigation';
import { FileText, Download, Calendar, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

import FacturasFilter from './FacturasFilter';
import { Suspense } from 'react';

export const metadata = {
  title: 'Facturas | J. Devoto B2B',
};

export default async function FacturasPage({ searchParams }: { searchParams: Promise<{ companyId?: string }> }) {
  const user = await getServerUser();

  if (!user) {
    redirect('/auth/login');
  }

  const resolvedParams = await searchParams;
  const companyId = resolvedParams.companyId;
  const from = resolvedParams.from;
  const to = resolvedParams.to;

  // Filtrar los mensajes con adjuntos (facturas) según el rol
  const whereClause: any = {
    attachmentUrl: { not: null },
  };

  if (from || to) {
    whereClause.createdAt = {};
    if (from) {
      whereClause.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
    }
    if (to) {
      whereClause.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
    }
  }

  // Si no es ADMIN/SUPER_ADMIN, restringir acceso
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    // Admin puede ver todo, opcionalmente filtrar por empresa
    if (companyId && companyId !== 'ALL') {
      whereClause.order = { companyId: companyId };
    }
  } else if (user.role === 'SALES_REP') {
    // Vendedor solo puede ver facturas de sus clientes asignados
    const assignedCompanies = await prisma.company.findMany({
      where: { salesRepId: user.id },
      select: { id: true },
    });
    const assignedIds = assignedCompanies.map((c) => c.id);

    if (assignedIds.length === 0) {
      // Si no tiene clientes asignados, no ver nada
      whereClause.order = { companyId: 'NONE' };
    } else if (companyId && companyId !== 'ALL') {
      // Solo permitir filtrar por empresas que tiene asignadas
      if (assignedIds.includes(companyId)) {
        whereClause.order = { companyId: companyId };
      } else {
        whereClause.order = { companyId: 'NONE' };
      }
    } else {
      // Sin filtro específico: mostrar todas las de sus clientes
      whereClause.order = { companyId: { in: assignedIds } };
    }
  } else {
    // BUYER / COMPANY_ADMIN: solo puede ver las de su empresa, y que estén visibles
    whereClause.order = { companyId: user.companyId };
    whereClause.isCustomerVisible = true;
  }

  const facturas = await prisma.orderMessage.findMany({
    where: whereClause,
    include: {
      order: {
        include: {
          company: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Facturas
          </h1>
          <p className="text-base text-zinc-500 mt-1 font-medium">
            Historial de facturas y documentos adjuntos en tus pedidos.
          </p>
        </div>
        
        <Suspense fallback={<div className="h-10 w-48 bg-zinc-900 rounded-xl animate-pulse"></div>}>
          <FacturasFilter />
        </Suspense>
      </div>

      {/* List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {facturas.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-zinc-500 space-y-4">
            <FileText className="h-12 w-12 opacity-20" />
            <p className="text-lg font-medium">No se encontraron facturas</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {facturas.map((factura) => (
              <div key={factura.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/20 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">
                      {factura.attachmentName || 'Documento adjunto'}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(factura.createdAt), "dd 'de' MMMM, yyyy - HH:mm", { locale: es })}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Pedido {factura.order.orderNumber}
                    </span>
                    {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'SALES_REP') && factura.order.company && (
                      <span className="text-primary/80">
                        {factura.order.company.razonSocial}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <Link href={`/dashboard/orders/${factura.order.id}`} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-colors">
                    Ver Pedido
                  </Link>
                  <a 
                    href={factura.attachmentUrl!} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-black rounded-xl text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Descargar
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
