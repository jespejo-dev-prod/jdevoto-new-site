const { PrismaClient } = require('../src/generated/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: { status: { not: 'DRAFT' } },
    include: {
      items: {
        include: {
          product: { include: { brand: true, category: true } }
        }
      }
    }
  });

  const productStats = {};
  let totalItemsSold = 0;
  let totalRevenue = 0;

  orders.forEach(order => {
    if (order.orderNumber.startsWith('TEST')) return;

    order.items.forEach(item => {
      if (!productStats[item.productSku]) {
        productStats[item.productSku] = {
          name: item.productName,
          sku: item.productSku,
          brand: item.product?.brand?.name || 'Sin Marca',
          category: item.product?.category?.name || 'Sin Categoría',
          quantitySold: 0,
          revenue: 0
        };
      }
      productStats[item.productSku].quantitySold += item.quantity;
      const lineTotal = parseFloat(item.lineTotal);
      productStats[item.productSku].revenue += lineTotal;
      totalItemsSold += item.quantity;
      totalRevenue += lineTotal;
    });
  });

  const allProducts = Object.values(productStats);
  const topByQty = [...allProducts].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 10);
  const topByRev = [...allProducts].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const sortedAll = [...allProducts].sort((a, b) => b.revenue - a.revenue);

  let md = `# Informe Completo de Productos Vendidos (Corregido)\n\n`;
  md += `Este informe refleja la información consolidada y verificada de la base de datos de producción (sitio actual), excluyendo ventas de prueba y anomalías previas.\n\n`;
  
  md += `## 1. Resumen General del Catálogo Vendido\n`;
  md += `* **SKUs Únicos Vendidos:** ${allProducts.length}\n`;
  md += `* **Total de Unidades Físicas (Picking):** ${totalItemsSold}\n`;
  md += `* **Ingresos Brutos por Ítems:** $${new Intl.NumberFormat('es-CL').format(totalRevenue)}\n\n`;

  md += `## 2. Top 10 Productos con Mayor Recaudación\n\n`;
  md += `| SKU | Producto | Marca | Categoría | Ingreso Bruto ($) | Unidades |\n`;
  md += `| :--- | :--- | :--- | :--- | :---: | :---: |\n`;
  topByRev.forEach(p => {
    md += `| **${p.sku}** | ${p.name.replace(/\|/g,'-')} | ${p.brand} | ${p.category} | **$${new Intl.NumberFormat('es-CL').format(p.revenue)}** | ${p.quantitySold} |\n`;
  });

  md += `\n## 3. Top 10 Productos Más Vendidos (Por Volumen / Cantidad)\n\n`;
  md += `| SKU | Producto | Marca | Categoría | Unidades Vendidas |\n`;
  md += `| :--- | :--- | :--- | :--- | :---: |\n`;
  topByQty.forEach(p => {
    md += `| **${p.sku}** | ${p.name.replace(/\|/g,'-')} | ${p.brand} | ${p.category} | **${p.quantitySold}** |\n`;
  });

  md += `\n---\n`;
  md += `\n## 4. Listado Completo del Catálogo (Todos los Productos)\n\n`;
  md += `A continuación el detalle de los ${allProducts.length} productos registrados en ventas reales, ordenados por mayor recaudación.\n\n`;
  md += `| SKU | Producto | Categoría | Unidades | Ingreso Bruto ($) |\n`;
  md += `| :--- | :--- | :--- | :---: | :---: |\n`;
  
  sortedAll.forEach(p => {
    md += `| ${p.sku} | ${p.name.replace(/\|/g,'-')} | ${p.category} | ${p.quantitySold} | $${new Intl.NumberFormat('es-CL').format(p.revenue)} |\n`;
  });

  fs.writeFileSync('C:/Users/jespejo/.gemini/antigravity/brain/a7b4b2cb-ea74-4e1a-97af-7410690f7440/informe_productos_final.md', md, 'utf8');
  console.log('Done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
