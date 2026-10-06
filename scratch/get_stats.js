const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching detailed statistics...");
  
  const allOrders = await prisma.order.findMany({
    where: {
      status: { not: 'DRAFT' }
    },
    include: {
      salesRep: true,
      items: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const totalUsers = await prisma.user.count();
  const totalCompanies = await prisma.company.count();
  const totalProducts = await prisma.product.count({ where: { isActive: true } });

  let totalGross = 0;
  let countNoRep = 0;
  let grossNoRep = 0;
  let countVentasWeb = 0;
  let grossVentasWeb = 0;
  let countWithRep = 0;
  let grossWithRep = 0;

  const statusCount = {};
  
  allOrders.forEach(order => {
    const total = parseFloat(order.totalGross);
    totalGross += total;
    
    // Status distribution
    statusCount[order.status] = (statusCount[order.status] || 0) + 1;

    if (!order.salesRepId) {
      countNoRep++;
      grossNoRep += total;
    } else {
      const isVentasWeb = order.salesRep?.email?.toLowerCase().includes('ventasweb') || 
                          order.salesRep?.firstName?.toLowerCase().includes('ventasweb') ||
                          order.salesRep?.lastName?.toLowerCase().includes('ventasweb');
      if (isVentasWeb) {
        countVentasWeb++;
        grossVentasWeb += total;
      } else {
        countWithRep++;
        grossWithRep += total;
      }
    }
  });

  console.log(JSON.stringify({
    general: {
      totalUsers,
      totalCompanies,
      totalProducts,
      totalOrders: allOrders.length,
      totalGross: totalGross
    },
    statusDistribution: statusCount,
    salesRepStats: {
      pureWeb: {
        count: countNoRep,
        gross: grossNoRep,
        avgTicket: countNoRep > 0 ? grossNoRep / countNoRep : 0
      },
      ventasWeb: {
        count: countVentasWeb,
        gross: grossVentasWeb,
        avgTicket: countVentasWeb > 0 ? grossVentasWeb / countVentasWeb : 0
      },
      traditionalRep: {
        count: countWithRep,
        gross: grossWithRep,
        avgTicket: countWithRep > 0 ? grossWithRep / countWithRep : 0
      },
      combinedWeb: {
        count: countNoRep + countVentasWeb,
        gross: grossNoRep + grossVentasWeb,
        avgTicket: (countNoRep + countVentasWeb) > 0 ? (grossNoRep + grossVentasWeb) / (countNoRep + countVentasWeb) : 0
      }
    }
  }, null, 2));
}

main().finally(() => prisma.$disconnect());
