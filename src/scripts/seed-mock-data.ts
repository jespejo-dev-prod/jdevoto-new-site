import { prisma } from "../lib/client";

async function main() {
  console.log("🧹 Limpiando promociones y pedidos previos...");
  await prisma.promotion.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();

  // Find a company and user
  const company = await prisma.company.findFirst();
  const user = await prisma.user.findFirst();

  if (!company || !user) {
    console.error("❌ Debe haber al menos una empresa y un usuario en la base de datos.");
    return;
  }

  console.log(`Using company: ${company.razonSocial} (${company.id})`);
  console.log(`Using user: ${user.email} (${user.id})`);

  // 1. Create active promotions
  console.log("🏷️ Creando promociones activas...");
  const brandTorre = await prisma.brand.findFirst({ where: { name: { contains: "Torre", mode: "insensitive" } } });
  const catBlock = await prisma.category.findFirst({ where: { slug: "escolar-block" } });

  const promos = [];
  if (brandTorre) {
    const p1 = await prisma.promotion.create({
      data: {
        name: "Especial Torre - 10% OFF",
        discount: 10.00,
        brandId: brandTorre.id,
        isActive: true,
      }
    });
    promos.push(p1);
  }

  if (catBlock) {
    const p2 = await prisma.promotion.create({
      data: {
        name: "Semana del Block - 15% OFF",
        discount: 15.00,
        categoryId: catBlock.id,
        isActive: true,
      }
    });
    promos.push(p2);
  }

  console.log(`✓ Se crearon ${promos.length} promociones.`);

  // 2. Create mock orders to build "Más Vendidos" (Best Sellers)
  console.log("📦 Creando pedidos simulados para generar los Más Vendidos...");
  const products = await prisma.product.findMany({ take: 50, where: { isActive: true } });

  if (products.length < 15) {
    console.error("❌ Se necesitan al menos 15 productos activos en la base de datos.");
    return;
  }

  // We want to make certain products clearly top sellers (e.g. products 0, 1, 2, 3, 4, 5, 6, 7, 8, 9)
  for (let i = 0; i < 20; i++) {
    const orderNumber = `ORD-MOCK-${1000 + i}`;
    
    // Choose 3-6 random products, but with bias to the first ones
    const orderProducts = [];
    const numItems = Math.floor(Math.random() * 4) + 3; // 3 to 6 items
    const selectedIndices = new Set<number>();
    
    while (selectedIndices.size < numItems) {
      // 60% chance to select a product from the top 10 to make them best sellers
      if (Math.random() < 0.6) {
        selectedIndices.add(Math.floor(Math.random() * 10));
      } else {
        selectedIndices.add(Math.floor(Math.random() * products.length));
      }
    }

    let subtotalNet = 0;
    const itemsData = [];

    for (const idx of selectedIndices) {
      const p = products[idx];
      const qty = Math.floor(Math.random() * 50) + 10; // quantity 10 to 60
      const price = Number(p.basePrice);
      const lineNet = price * qty;
      subtotalNet += lineNet;

      itemsData.push({
        productId: p.id,
        productSku: p.sku,
        productName: p.name,
        quantity: qty,
        unitNetPrice: price,
        discount: 0,
        lineNetTotal: lineNet,
        lineTax: lineNet * 0.19,
        lineTotal: lineNet * 1.19,
      });
    }

    const taxAmount = subtotalNet * 0.19;
    const totalGross = subtotalNet + taxAmount;

    await prisma.order.create({
      data: {
        orderNumber,
        companyId: company.id,
        createdById: user.id,
        status: "CONFIRMED",
        paymentStatus: "PENDING",
        paymentMethod: "CREDITO_DIRECTO",
        subtotalNet,
        taxAmount,
        totalGross,
        discountAmount: 0,
        items: {
          create: itemsData
        }
      }
    });
  }

  console.log("✓ Se crearon 20 pedidos simulados con éxito.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
