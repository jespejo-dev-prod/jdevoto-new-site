import { NextRequest } from "next/server";
import { prisma } from "@/lib/client";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    requireRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN, 'VIEWER' as UserRole]);

    const customers = await prisma.company.findMany({
      where: {
        razonSocial: {
          not: ''
        }
      },
      include: {
        salesRep: { select: { firstName: true, lastName: true, email: true } },
        users: { select: { email: true, firstName: true, lastName: true, role: true } }
      },
      orderBy: { razonSocial: 'asc' }
    });

    const dataRows = [
      ['Razon Social', 'RUT', 'Email', 'Telefono', 'Vendedor Asignado', 'Limite Credito', 'Credito Usado', 'Descuento Base', 'Activo', 'Usuarios B2B (Emails)']
    ];

    for (const c of customers) {
      const salesRepName = c.salesRep ? `${c.salesRep.firstName} ${c.salesRep.lastName}`.trim() : 'Sin Vendedor';
      const usersList = c.users.map(u => u.email).join('; ');

      dataRows.push([
        c.razonSocial,
        c.rut,
        c.email || '',
        c.telefono || '',
        salesRepName,
        c.creditLimit?.toString() || '0',
        c.creditUsed?.toString() || '0',
        c.defaultDiscount?.toString() || '0',
        c.isActive ? 'Si' : 'No',
        usersList
      ]);
    }

    const xlsx = require('xlsx');
    const ws = xlsx.utils.aoa_to_sheet(dataRows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Clientes");
    
    const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="clientes_b2b_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting customers:', error);
    return new Response('Error al exportar clientes', { status: 500 });
  }
}
