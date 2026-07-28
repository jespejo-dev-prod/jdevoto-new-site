import { prisma } from '@/lib/client';
import { ExportButton } from './ExportButton';
import { Database } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default async function RawDataPage() {
  // Fetch only the latest 100 events to avoid overwhelming the UI
  const transactionalEvents = [
    'added_to_cart', 'removed_from_cart', 'checkout_started', 
    'payment_method_selected', 'payment_failed', 'order_confirmed',
    'order_pending', 'order_shipped', 'order_delivered', 
    'order_cancelled', 'order_rejected', 'order_status_changed',
    'promotion_clicked', 'promotion_product_clicked'
  ];

  const events = await prisma.analyticsEvent.findMany({
    where: {
      eventType: { in: transactionalEvents }
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Manually fetch users since there is no Prisma relation defined in the schema
  const userIds = [...new Set(events.map(e => e.userId).filter(Boolean))] as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, role: true }
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  // Combine them
  const eventsWithUser = events.map(evt => ({
    ...evt,
    user: evt.userId ? userMap.get(evt.userId) : null
  }));

  return (
    <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            Datos de Eventos (Raw)
          </h1>
          <p className="text-zinc-500 font-medium mt-1">
            Visualiza y exporta los últimos eventos transaccionales capturados.
          </p>
        </div>
        <ExportButton />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs uppercase bg-zinc-950 text-zinc-500 font-bold tracking-widest border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Evento</th>
                <th className="px-6 py-4">Usuario (B2B)</th>
                <th className="px-6 py-4">Datos (JSON)</th>
                <th className="px-6 py-4">Ruta / Referrer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {eventsWithUser.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    No hay eventos registrados aún.
                  </td>
                </tr>
              ) : (
                eventsWithUser.map((evt) => (
                  <tr key={evt.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(evt.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      <span className="px-2 py-1 bg-zinc-800 rounded-md text-xs">
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {evt.user ? (
                        <div className="flex flex-col">
                          <span className="text-white">{evt.user.email}</span>
                          <span className="text-xs text-zinc-500">{evt.user.role}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 italic">Anónimo</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs overflow-x-auto custom-scrollbar">
                        <pre className="text-[10px] text-zinc-300 bg-zinc-950 p-2 rounded">
                          {JSON.stringify(evt.eventData, null, 2)}
                        </pre>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="truncate max-w-[200px]" title={evt.pageUrl}>
                        {evt.pageUrl}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
