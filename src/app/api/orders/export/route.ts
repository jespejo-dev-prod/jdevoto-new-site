import { NextRequest } from "next/server";
import { prisma } from "@/lib/client";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { STATUS_CONFIG } from "@/modules/orders/presentation/components/OrderStatusBadge";

export async function GET(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    requireRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN, 'VIEWER' as UserRole]);

    const orders = await prisma.order.findMany({
      include: {
        company: { select: { razonSocial: true, rut: true } },
        createdBy: { select: { email: true, firstName: true, lastName: true } },
        salesRep: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    const dataRows: any[][] = [
      ['ID Pedido', 'Nro Pedido', 'Fecha', 'Cliente (Razon Social)', 'RUT', 'Vendedor Asignado', 'Usuario', 'Estado', 'Total Neto', 'Total Bruto', 'Metodo de Pago', 'Estado Pago']
    ];

    for (const o of orders) {
      const salesRepName = o.salesRep ? `${o.salesRep.firstName} ${o.salesRep.lastName}`.trim() : 'N/A';
      const userName = o.createdBy ? `${o.createdBy.firstName} ${o.createdBy.lastName}`.trim() : 'N/A';
      const date = new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago' }).format(new Date(o.createdAt));
      const statusLabel = STATUS_CONFIG[o.status as keyof typeof STATUS_CONFIG]?.label || o.status;

      dataRows.push([
        o.id,
        o.orderNumber,
        date,
        o.company?.razonSocial || 'N/A',
        o.company?.rut || 'N/A',
        salesRepName,
        `${userName} (${o.createdBy?.email || 'N/A'})`,
        statusLabel,
        Number(o.subtotalNet),
        Number(o.totalGross),
        o.paymentMethod || 'N/A',
        o.paymentStatus === 'PAID' ? 'Pagado' : 'Pendiente'
      ]);
    }

    const xlsx = require('xlsx');
    const ws = xlsx.utils.aoa_to_sheet(dataRows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Pedidos");
    
    const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="pedidos_b2b_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting orders:', error);
    return new Response('Error al exportar pedidos', { status: 500 });
  }
}
