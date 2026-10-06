const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const allOrders = await prisma.order.findMany({
    where: { status: { not: 'DRAFT' } },
    include: {
      company: true,
      salesRep: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const ordersData = allOrders.map(o => {
    let repType = "Puro Web";
    if (o.salesRep) {
      const isVentasWeb = o.salesRep.email?.toLowerCase().includes('ventasweb') || 
                          o.salesRep.firstName?.toLowerCase().includes('ventasweb') ||
                          o.salesRep.lastName?.toLowerCase().includes('ventasweb');
      repType = isVentasWeb ? "VentasWeb" : `${o.salesRep.firstName} ${o.salesRep.lastName}`;
    }

    return {
      numero: o.orderNumber,
      empresa: o.company.razonSocial,
      fecha: o.createdAt.toISOString().split('T')[0],
      estado: o.status,
      total: parseFloat(o.totalGross),
      tipoVendedor: repType
    };
  });

  console.log(JSON.stringify(ordersData, null, 2));
}

main().finally(() => prisma.$disconnect());
