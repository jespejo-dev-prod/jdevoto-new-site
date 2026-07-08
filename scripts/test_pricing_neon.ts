import { PrismaClient, UserRole } from '@prisma/client';
import { TAX_RATE } from '../src/types/domain';

const prisma = new PrismaClient();

// Tipos
type Category = any;
type Promotion = any;
type PriceList = any;
type PriceListItem = any;
type Product = any;

type ProductWithCategory = Product & { category?: Category | null };
type PriceListWithItems = PriceList & { items: PriceListItem[] };
type ListPriceMap = Map<string, { netPrice: number; totalDiscount: number; type: string }>;

interface PriceBreakdown {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  inner: number;
  unitNetPrice: number;
  discountPercent: number;
  discountedNetPrice: number;
  taxAmount: number;
  unitGrossPrice: number;
  priceSource: 'OUTLET' | 'COMPANY_LIST' | 'GENERAL_LIST' | 'PROMOTION' | 'BASE_PRICE';
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildPrice(
  product: Product,
  unitNetPrice: number,
  discountPercent: number,
  priceSource: PriceBreakdown["priceSource"]
): PriceBreakdown {
  const discountedNet = unitNetPrice * (1 - discountPercent / 100);
  const tax = discountedNet * TAX_RATE;

  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    unit: product.unit,
    inner: product.inner,
    unitNetPrice: round2(unitNetPrice),
    discountPercent: round2(discountPercent),
    discountedNetPrice: round2(discountedNet),
    taxAmount: round2(tax),
    unitGrossPrice: round2(discountedNet + tax),
    priceSource,
  };
}

function resolvePrice(
  product: ProductWithCategory,
  companyDefaultDiscount: number,
  listPriceMap: ListPriceMap,
  promotionBrandMap: Map<string, Promotion>,
  promotionCategoryMap: Map<string, Promotion>,
  promotionCombinedMap: Map<string, Promotion>,
  categoryParentMap: Record<string, string | null>
): PriceBreakdown {
  const basePrice = Number(product.basePrice);

  if (product.category?.isOutlet) {
    return buildPrice(product, basePrice, 0, 'OUTLET');
  }

  const listItem = listPriceMap.get(product.id);
  if (listItem) {
    const source = listItem.type === 'COMPANY' ? 'COMPANY_LIST' : 'GENERAL_LIST';
    return buildPrice(product, listItem.netPrice, listItem.totalDiscount, source);
  }

  const combinedKey = product.categoryId && product.brandId
    ? `${product.categoryId}:${product.brandId}`
    : null;
  let combinedPromo = combinedKey ? promotionCombinedMap.get(combinedKey) : undefined;
  
  const parentId = product.categoryId ? categoryParentMap[product.categoryId] : null;
  if (!combinedPromo && parentId && product.brandId) {
    combinedPromo = promotionCombinedMap.get(`${parentId}:${product.brandId}`);
  }

  const categoryPromo = product.categoryId ? promotionCategoryMap.get(product.categoryId) : undefined;
  const parentCategoryPromo = !categoryPromo && parentId
    ? promotionCategoryMap.get(parentId)
    : undefined;

  const brandPromo = product.brandId ? promotionBrandMap.get(product.brandId) : undefined;
  
  const promo = combinedPromo || categoryPromo || parentCategoryPromo || brandPromo;
  if (promo) {
    return buildPrice(product, basePrice, Number(promo.discount), 'PROMOTION');
  }

  return buildPrice(product, basePrice, 0, 'BASE_PRICE');
}

function buildListPriceMap(lists: PriceListWithItems[]): ListPriceMap {
  const map: ListPriceMap = new Map();
  for (const list of lists) {
    for (const item of list.items) {
      map.set(item.productId, {
        netPrice: Number(item.netPrice),
        totalDiscount: Math.min(Number(item.discount) + Number(list.globalDiscount), 100),
        type: list.type,
      });
    }
  }
  return map;
}

function buildPromotionMaps(promotions: Promotion[]) {
  const promotionBrandMap = new Map<string, Promotion>();
  const promotionCategoryMap = new Map<string, Promotion>();
  const promotionCombinedMap = new Map<string, Promotion>();

  for (const promo of promotions) {
    if (promo.brandId && promo.categoryId) {
      promotionCombinedMap.set(`${promo.categoryId}:${promo.brandId}`, promo);
    } else if (promo.categoryId) {
      promotionCategoryMap.set(promo.categoryId, promo);
    } else if (promo.brandId) {
      promotionBrandMap.set(promo.brandId, promo);
    }
  }

  return { promotionBrandMap, promotionCategoryMap, promotionCombinedMap };
}

// Mocking loaders sin unstable_cache
async function loadPriceLists(companyId: string | null): Promise<PriceListWithItems[]> {
  const now = new Date();
  const dateFilter = {
    OR: [{ validFrom: null }, { validFrom: { lte: now } }],
    AND: [{ OR: [{ validTo: null }, { validTo: { gte: now } }] }],
  };

  const [generalLists, companyLists] = await Promise.all([
    prisma.priceList.findMany({
      where: { isActive: true, type: 'GENERAL', ...dateFilter },
      include: { items: true },
    }),
    companyId
      ? prisma.priceList.findMany({
          where: {
            isActive: true,
            type: 'COMPANY',
            companies: { some: { companyId } },
            ...dateFilter,
          },
          include: { items: true },
        })
      : Promise.resolve([]),
  ]);

  return [...generalLists, ...companyLists] as PriceListWithItems[];
}

async function loadPromotions(): Promise<Promotion[]> {
  const now = new Date();
  return prisma.promotion.findMany({
    where: {
      isActive: true,
      OR: [{ validFrom: null }, { validFrom: { lte: now } }],
      AND: [{ OR: [{ validTo: null }, { validTo: { gte: now } }] }],
    },
  });
}

async function loadCompanyDiscount(companyId: string | null) {
  if (!companyId) return null;
  return prisma.company.findUnique({
    where: { id: companyId },
    select: { defaultDiscount: true },
  });
}

async function loadCategoryParentMap(): Promise<Record<string, string | null>> {
  const categories = await prisma.category.findMany({
    select: { id: true, parentId: true },
  });
  const map: Record<string, string | null> = {};
  for (const cat of categories) {
    map[cat.id] = cat.parentId;
  }
  return map;
}

async function getPricesForProducts(
  products: ProductWithCategory[],
  companyId: string | null
): Promise<PriceBreakdown[]> {
  if (products.length === 0) return [];

  const [priceLists, promotions, company, categoryParentMap] = await Promise.all([
    loadPriceLists(companyId),
    loadPromotions(),
    loadCompanyDiscount(companyId),
    loadCategoryParentMap(),
  ]);

  const companyDefaultDiscount = company ? Number(company.defaultDiscount) : 0;
  const listPriceMap = buildListPriceMap(priceLists);
  const { promotionBrandMap, promotionCategoryMap, promotionCombinedMap } = buildPromotionMaps(promotions);

  return products.map((product) =>
    resolvePrice(product, companyDefaultDiscount, listPriceMap, promotionBrandMap, promotionCategoryMap, promotionCombinedMap, categoryParentMap)
  );
}

async function main() {
  const skus = ['2950002', '2950008', '2950012'];
  console.log('🚀 Iniciando test de motor de precios (sin cache) en base de datos...');
  console.log('SKUs a consultar:', skus);

  // 1. Obtener productos
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

  // 2. Calcular precios sin cache
  console.log('Calculando precios...');
  const prices = await getPricesForProducts(productsRaw as any, null);
  
  const enriched = productsRaw.map((product, i) => ({
    ...product,
    price: prices[i]
  }));

  console.log('Enriched products success! Count:', enriched.length);
  enriched.forEach(p => {
    console.log(`SKU: ${p.sku} | Name: ${p.name} | Price:`, p.price);
  });
}

main()
  .catch(e => console.error('💥 Unhandled error:', e))
  .finally(() => prisma.$disconnect());
