import { prisma } from '../src/lib/client';
import { priceService } from '../src/modules/pricing/domain/price.service';

async function main() {
  const skus = ['2950002', '2950008', '2950012'];
  console.log('Testing validation for SKUs:', skus);

  // 3. Buscar productos en la base de datos
  const productsRaw = await prisma.product.findMany({
    where: {
      sku: { in: skus },
      isActive: true,
    },
    select: {
      id: true,
      sku: true,
      name: true,
      slug: true,
      brandId: true,
      unit: true,
      inner: true,
      minOrderQty: true,
      stockQuantity: true,
      basePrice: true,
      brand: { select: { name: true } },
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true },
      },
    },
  });

  console.log(`Found ${productsRaw.length} products in DB.`);

  // 4. Enriquecer los productos
  console.log('Enriching products with prices...');
  const enrichedProducts = await priceService.enrichProductsWithPrices(
    productsRaw as any,
    null // companyId
  );

  console.log('Enriched products sample:', JSON.stringify(enrichedProducts.slice(0, 1), null, 2));

  // 5. Procesar los resultados
  const results = skus.map(requestedSku => {
    const product = enrichedProducts.find(p => p.sku === requestedSku);
    if (!product) {
      console.log(`SKU ${requestedSku} not found in enriched products!`);
      return;
    }
    
    console.log(`Processing ${requestedSku}...`);
    try {
      const priceObj = {
        unitNetPrice: Number(product.price.unitNetPrice),
        discountedNetPrice: Number(product.price.discountedNetPrice),
        unitGrossPrice: Number(product.price.unitGrossPrice),
        originalPrice: Number(product.price.unitNetPrice),
        discountPercent: Number(product.price.discountPercent),
        priceSource: product.price.priceSource,
      };
      console.log(`Price object for ${requestedSku}:`, priceObj);
    } catch (e: any) {
      console.error(`💥 Error processing ${requestedSku}:`, e.message, e.stack);
    }
  });
}

main()
  .catch(e => console.error('Unhandled error:', e))
  .finally(() => prisma.$disconnect());
