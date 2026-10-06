const { PrismaClient } = require('../src/generated/client');
const fs = require('fs');
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

  orders.forEach(order => {
    // Descartamos los pedidos de TEST para entregar la data real del negocio
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
      productStats[item.productSku].revenue += parseFloat(item.lineTotal);
    });
  });

  // Ordenamos por recaudación de mayor a menor
  const allProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);

  // 1. Generar CSV (Separado por punto y coma para mejor compatibilidad con Excel en español)
  let csvContent = "SKU;Producto;Marca;Categoría;Unidades Vendidas;Ingreso Bruto ($)\n";
  allProducts.forEach(p => {
    csvContent += `"${p.sku}";"${p.name.replace(/"/g, '""')}";"${p.brand}";"${p.category}";${p.quantitySold};${p.revenue}\n`;
  });
  
  const csvPath = 'C:/Users/jespejo/.gemini/antigravity/brain/a7b4b2cb-ea74-4e1a-97af-7410690f7440/todos_los_productos.csv';
  fs.writeFileSync(csvPath, csvContent, 'utf8');

  // 2. Generar Archivo Markdown con la tabla completa
  let mdContent = "# Listado Completo de Productos Vendidos\n\n";
  mdContent += "Este documento contiene el **total de todos los productos** que se han vendido en los pedidos efectivos del sitio (excluyendo tests), ordenados del que más ha recaudado al que menos.\n\n";
  mdContent += "| SKU | Producto | Marca | Categoría | Unidades Vendidas | Ingreso Bruto ($) |\n";
  mdContent += "| :--- | :--- | :--- | :--- | :---: | :---: |\n";
  
  allProducts.forEach(p => {
    mdContent += `| **${p.sku}** | ${p.name.replace(/\|/g, '-')} | ${p.brand} | ${p.category} | ${p.quantitySold} | $${new Intl.NumberFormat('es-CL').format(p.revenue)} |\n`;
  });
  
  const mdPath = 'C:/Users/jespejo/.gemini/antigravity/brain/a7b4b2cb-ea74-4e1a-97af-7410690f7440/informe_todos_los_productos.md';
  fs.writeFileSync(mdPath, mdContent, 'utf8');

  console.log(`Exportados exitosamente ${allProducts.length} productos únicos.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
