const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: { status: { not: 'DRAFT' } },
    include: {
      items: {
        include: {
          product: {
            include: { brand: true, category: true }
          }
        }
      }
    }
  });

  const productStats = {};
  let totalItemsSold = 0;
  let totalRevenueFromItems = 0;

  orders.forEach(order => {
    // Para no ensuciar tanto la data real con pruebas, podemos separar las ventas de 'TEST' pero el usuario pidio de los pedidos en general
    const isTestOrder = order.orderNumber.startsWith('TEST');
    
    order.items.forEach(item => {
      if (!productStats[item.productSku]) {
        productStats[item.productSku] = {
          name: item.productName,
          sku: item.productSku,
          brand: item.product?.brand?.name || 'Sin Marca',
          category: item.product?.category?.name || 'Sin Categoría',
          quantitySold: 0,
          revenue: 0,
          ordersAppeared: 0,
          testQuantitySold: 0, // Para contabilizar aparte lo de test
          testRevenue: 0
        };
      }
      
      const lineTotal = parseFloat(item.lineTotal);
      
      if (isTestOrder) {
        productStats[item.productSku].testQuantitySold += item.quantity;
        productStats[item.productSku].testRevenue += lineTotal;
      } else {
        productStats[item.productSku].quantitySold += item.quantity;
        productStats[item.productSku].revenue += lineTotal;
        productStats[item.productSku].ordersAppeared += 1;
        totalItemsSold += item.quantity;
        totalRevenueFromItems += lineTotal;
      }
    });
  });

  // Filtrar productos que solo se vendieron en test o que su quantity real es 0
  const realProducts = Object.values(productStats).filter(p => p.quantitySold > 0);

  const sortedByQuantity = [...realProducts].sort((a, b) => b.quantitySold - a.quantitySold);
  const sortedByRevenue = [...realProducts].sort((a, b) => b.revenue - a.revenue);

  console.log(JSON.stringify({
    totalDistinctProducts: realProducts.length,
    totalItemsSold,
    totalRevenueFromItems,
    topByQuantity: sortedByQuantity.slice(0, 15),
    topByRevenue: sortedByRevenue.slice(0, 15)
  }, null, 2));
}

main().finally(() => prisma.$disconnect());
