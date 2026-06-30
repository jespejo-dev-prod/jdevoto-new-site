/**
 * modules/pricing/domain/price.service.ts
 *
 * Motor de Precios B2B.
 *
 * Responsabilidad: dado un producto y una empresa, calcular el precio correcto
 * aplicando la siguiente jerarquía (de mayor a menor prioridad):
 *   1. OUTLET   → precio base sin descuento (categoría outlet)
 *   2. LISTA    → precio específico desde lista de precios (empresa o general)
 *   3. PROMOCIÓN → descuento por marca o categoría
 *   4. DESCUENTO → descuento por defecto de la empresa
 *   5. BASE     → precio base sin descuento (fallback)
 */

import { prisma } from "@/lib/client";
import { unstable_cache } from "next/cache";
import type { PriceBreakdown, ProductWithPrice } from "@/types/domain";
import { TAX_RATE } from "@/types/domain";
import { NotFoundError } from "@/lib/errors";
import type { Product, PriceListItem, PriceList, Promotion, Category } from "@prisma/client";

// ─── Tipos internos ────────────────────────────────────────────────────────────

type ProductWithCategory = Product & { category?: Category | null };

type PriceListWithItems = PriceList & { items: PriceListItem[] };

/** Mapa O(1): productId → { netPrice, totalDiscount, type } */
type ListPriceMap = Map<string, { netPrice: number; totalDiscount: number; type: string }>;

// ─── Resolver de precio ────────────────────────────────────────────────────────

/**
 * resolvePrice
 *
 * Elige el precio correcto para un producto según la jerarquía de prioridad.
 * Reemplaza el Strategy Pattern previo con lógica lineal simple.
 */
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

  // 1. Outlet: sin descuento, precio base
  if (product.category?.isOutlet) {
    return buildPrice(product, basePrice, 0, "OUTLET");
  }

  // 2. Lista de precios (empresa o general)
  const listItem = listPriceMap.get(product.id);
  if (listItem) {
    const source = listItem.type === "COMPANY" ? "COMPANY_LIST" : "GENERAL_LIST";
    return buildPrice(product, listItem.netPrice, listItem.totalDiscount, source);
  }

  // 3. Promoción por marca y/o categoría
  //    Prioridad: Combinado (categoría+marca) > Categoría > Marca
  const combinedKey = product.categoryId && product.brandId
    ? `${product.categoryId}:${product.brandId}`
    : null;
  let combinedPromo = combinedKey ? promotionCombinedMap.get(combinedKey) : undefined;
  
  // Buscar promoción combinada usando la categoría padre
  const parentId = product.categoryId ? categoryParentMap[product.categoryId] : null;
  if (!combinedPromo && parentId && product.brandId) {
    combinedPromo = promotionCombinedMap.get(`${parentId}:${product.brandId}`);
  }

  const categoryPromo = product.categoryId ? promotionCategoryMap.get(product.categoryId) : undefined;
  
  // Buscar promoción de categoría usando la categoría padre si no hay directa
  const parentCategoryPromo = !categoryPromo && parentId
    ? promotionCategoryMap.get(parentId)
    : undefined;

  const brandPromo = product.brandId ? promotionBrandMap.get(product.brandId) : undefined;
  
  const promo = combinedPromo || categoryPromo || parentCategoryPromo || brandPromo;
  if (promo) {
    return buildPrice(product, basePrice, Number(promo.discount), "PROMOTION");
  }

  // 4. Descuento por defecto de la empresa - DESACTIVADO POR SOLICITUD DE USUARIO (Se maneja a nivel global de orden en Carrito y Checkout)
  /*
  if (companyDefaultDiscount > 0) {
    return buildPrice(product, basePrice, companyDefaultDiscount, "BASE_PRICE");
  }
  */

  // 5. Fallback: precio base sin descuento
  return buildPrice(product, basePrice, 0, "BASE_PRICE");
}

// ─── PriceService ──────────────────────────────────────────────────────────────

export class PriceService {
  /**
   * getPricesForProducts
   *
   * Calcula el precio B2B para un lote de productos.
   * Carga listas de precios y promociones en paralelo (una sola vez por request
   * gracias a unstable_cache), luego resuelve cada producto en O(1).
   */
  async getPricesForProducts(
    products: ProductWithCategory[],
    companyId: string | null
  ): Promise<PriceBreakdown[]> {
    if (products.length === 0) return [];

    // Carga paralela: listas de precios + promociones + descuento de empresa + mapa de padres
    const [priceLists, promotions, company, categoryParentMap] = await Promise.all([
      this.loadPriceLists(companyId),
      this.loadPromotions(),
      this.loadCompanyDiscount(companyId),
      this.loadCategoryParentMap(),
    ]);

    const companyDefaultDiscount = company ? Number(company.defaultDiscount) : 0;

    // Construir mapas O(1) para lookup instantáneo por producto
    const listPriceMap = buildListPriceMap(priceLists);
    const { promotionBrandMap, promotionCategoryMap, promotionCombinedMap } = buildPromotionMaps(promotions);

    // Resolver precio de cada producto
    return products.map((product) =>
      resolvePrice(product, companyDefaultDiscount, listPriceMap, promotionBrandMap, promotionCategoryMap, promotionCombinedMap, categoryParentMap)
    );
  }

  /**
   * enrichProductsWithPrices
   *
   * Agrega el precio calculado a cada producto del array.
   * Usado por los use cases del catálogo para devolver productos con precio listo.
   */
  async enrichProductsWithPrices(
    products: (Product & { images?: unknown[]; category?: unknown })[],
    companyId: string | null
  ): Promise<ProductWithPrice[]> {
    const prices = await this.getPricesForProducts(products as ProductWithCategory[], companyId);

    return products.map((product, i) => ({
      ...product,
      category: (product as ProductWithCategory).category ?? null,
      images: product.images ?? [],
      price: prices[i],
    } as unknown as ProductWithPrice));
  }

  /**
   * getPriceForProduct
   *
   * Calcula el precio B2B para un solo producto por ID.
   * Usado por el endpoint /api/catalog/price/[slug].
   */
  async getPriceForProduct(productId: string, companyId: string | null): Promise<PriceBreakdown> {
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
      include: { category: true },
    });

    if (!product) throw new NotFoundError("Producto", productId);

    const [price] = await this.getPricesForProducts([product], companyId);
    return price;
  }

  // ─── Loaders con caché Next.js (5 minutos) ──────────────────────────────────

  /**
   * Carga las listas de precios activas y vigentes para la empresa.
   * GENERAL siempre se carga; COMPANY solo si hay companyId.
   * unstable_cache persiste entre requests (Data Cache de Next.js).
   */
  private async loadPriceLists(companyId: string | null): Promise<PriceListWithItems[]> {
    const cacheKey = companyId ?? "public";

    const fetchFn = async () => {
      const now = new Date();
      const dateFilter = {
        OR: [{ validFrom: null }, { validFrom: { lte: now } }],
        AND: [{ OR: [{ validTo: null }, { validTo: { gte: now } }] }],
      };

      const [generalLists, companyLists] = await Promise.all([
        // Lista general (aplica a todos)
        prisma.priceList.findMany({
          where: { isActive: true, type: "GENERAL", ...dateFilter },
          include: { items: true },
        }),
        // Lista específica de la empresa (mayor prioridad)
        companyId
          ? prisma.priceList.findMany({
              where: {
                isActive: true,
                type: "COMPANY",
                companies: { some: { companyId } },
                ...dateFilter,
              },
              include: { items: true },
            })
          : Promise.resolve([]),
      ]);

      // General primero → empresa sobreescribe si hay colisión (prioridad correcta)
      return [...generalLists, ...companyLists] as PriceListWithItems[];
    };

    try {
      return await unstable_cache(
        fetchFn,
        [`price-lists-${cacheKey}`],
        { revalidate: 300, tags: ["price-lists"] }
      )();
    } catch (error: any) {
      if (error?.message?.includes("incrementalCache")) {
        return fetchFn();
      }
      throw error;
    }
  }

  /** Carga las promociones activas y vigentes. */
  private async loadPromotions(): Promise<Promotion[]> {
    const fetchFn = async () => {
      const now = new Date();
      return prisma.promotion.findMany({
        where: {
          isActive: true,
          OR: [{ validFrom: null }, { validFrom: { lte: now } }],
          AND: [{ OR: [{ validTo: null }, { validTo: { gte: now } }] }],
        },
      });
    };

    try {
      return await unstable_cache(
        fetchFn,
        ["promotions-active"],
        { revalidate: 300, tags: ["promotions"] }
      )();
    } catch (error: any) {
      if (error?.message?.includes("incrementalCache")) {
        return fetchFn();
      }
      throw error;
    }
  }

  /** Carga el descuento por defecto de la empresa. */
  private async loadCompanyDiscount(companyId: string | null) {
    if (!companyId) return Promise.resolve(null);

    const fetchFn = () =>
      prisma.company.findUnique({
        where: { id: companyId },
        select: { defaultDiscount: true },
      });

    try {
      return await unstable_cache(
        fetchFn,
        [`company-discount-${companyId}`],
        { revalidate: 300, tags: ["companies"] }
      )();
    } catch (error: any) {
      if (error?.message?.includes("incrementalCache")) {
        return fetchFn();
      }
      throw error;
    }
  }

  /** Carga el mapa de parentId por categoryId. */
  private async loadCategoryParentMap(): Promise<Record<string, string | null>> {
    const fetchFn = async () => {
      const categories = await prisma.category.findMany({
        select: { id: true, parentId: true },
      });
      const map: Record<string, string | null> = {};
      for (const cat of categories) {
        map[cat.id] = cat.parentId;
      }
      return map;
    };

    try {
      return await unstable_cache(
        fetchFn,
        ["category-parent-map"],
        { revalidate: 300, tags: ["categories"] }
      )();
    } catch (error: any) {
      if (error?.message?.includes("incrementalCache")) {
        return fetchFn();
      }
      throw error;
    }
  }

}

// ─── Helpers de construcción ───────────────────────────────────────────────────

/**
 * buildPrice
 *
 * Construye el objeto PriceBreakdown con todos los campos calculados.
 * Todos los valores se redondean a 2 decimales.
 */
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

/**
 * buildListPriceMap
 *
 * Convierte un array de listas de precios en un Map O(1) por productId.
 * General → Empresa (empresa sobreescribe si hay colisión = mayor prioridad).
 */
function buildListPriceMap(lists: PriceListWithItems[]): ListPriceMap {
  const map: ListPriceMap = new Map();

  for (const list of lists) {
    for (const item of list.items) {
      map.set(item.productId, {
        netPrice: Number(item.netPrice),
        // Descuento total = descuento del ítem + descuento global de la lista
        totalDiscount: Math.min(Number(item.discount) + Number(list.globalDiscount), 100),
        type: list.type,
      });
    }
  }

  return map;
}

/**
 * buildPromotionMaps
 *
 * Convierte el array de promociones en dos mapas O(1):
 * uno por brandId y otro por categoryId.
 */
function buildPromotionMaps(promotions: Promotion[]) {
  const promotionBrandMap = new Map<string, Promotion>();
  const promotionCategoryMap = new Map<string, Promotion>();
  const promotionCombinedMap = new Map<string, Promotion>();

  for (const promo of promotions) {
    if (promo.brandId && promo.categoryId) {
      // Combinado: categoría + marca — mayor prioridad
      promotionCombinedMap.set(`${promo.categoryId}:${promo.brandId}`, promo);
    } else if (promo.categoryId) {
      promotionCategoryMap.set(promo.categoryId, promo);
    } else if (promo.brandId) {
      promotionBrandMap.set(promo.brandId, promo);
    }
  }

  return { promotionBrandMap, promotionCategoryMap, promotionCombinedMap };
}

/** Redondea a 2 decimales. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Instancia singleton exportada — los módulos la importan directamente
export const priceService = new PriceService();
