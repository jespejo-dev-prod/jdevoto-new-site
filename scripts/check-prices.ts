import { prisma } from '../src/lib/client';
import { priceService } from '../src/modules/pricing/domain/price.service';

async function main() {
  const skus = ['3702006', '3702012', '3806010'];
  const products = await prisma.product.findMany({
    where: { sku: { in: skus } },
    include: { category: true, brand: true }
  });

  console.log("Products in DB:");
  for (const p of products) {
    const price = await priceService.getPriceForProduct(p.id, null);
    console.log({
      sku: p.sku,
      name: p.name,
      basePrice: Number(p.basePrice),
      calculatedPrice: price.discountedNetPrice,
      priceSource: price.priceSource,
      discountPercent: price.discountPercent
    });
  }
}

main().catch(console.error);
