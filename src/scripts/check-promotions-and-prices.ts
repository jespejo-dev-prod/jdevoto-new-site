import { prisma } from "../lib/client";

async function main() {
  console.log("=== COUNT OF DB TABLES ===");
  console.log("PriceList:", await prisma.priceList.count());
  console.log("PriceListItem:", await prisma.priceListItem.count());
  console.log("Promotion:", await prisma.promotion.count());
  console.log("Order:", await prisma.order.count());
  console.log("OrderItem:", await prisma.orderItem.count());
  console.log("Brand:", await prisma.brand.count());
  console.log("Category:", await prisma.category.count());
  console.log("Product:", await prisma.product.count());

  const samplePromos = await prisma.promotion.findMany({ take: 3 });
  console.log("Promotions sample:", samplePromos);

  const sampleLists = await prisma.priceList.findMany({ take: 3 });
  console.log("PriceLists sample:", sampleLists);
}

main().finally(() => prisma.$disconnect());
