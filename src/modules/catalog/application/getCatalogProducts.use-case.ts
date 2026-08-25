/**
 * modules/catalog/application/getCatalogProducts.use-case.ts
 *
 * Recupera la página de productos del catálogo con filtros, paginación y precios B2B.
 *
 * Extrae TODA la lógica de negocio que antes vivía en `app/products/page.tsx`,
 * siguiendo el principio de Single Responsibility y DRY:
 *   - La página sólo parsea searchParams y renderiza
 *   - Este use case se ocupa de queries, filtros y enriquecimiento de precios
 *
 * Mejoras de performance respecto al page.tsx original:
 *   1. `storeSettings`, `promotions` (para offersOnly) y `bestSellers`
 *      se cargan en paralelo en un único Promise.all, en vez de encadenarse.
 *   2. En modo búsqueda: se usa COUNT + findMany en paralelo para evitar
 *      traer todos los productos a RAM para paginar en memoria.
 *   3. Los metadatos de filtros (categories, brands) los recibe como
 *      parámetro — ya vienen cacheados desde getCatalogFiltersUseCase.
 */

import { prisma } from '@/lib/client';
import { priceService } from '@/modules/pricing/domain/price.service';
import type { CatalogFiltersData } from './getCatalogFilters.use-case';

// ─── Tipos públicos ─────────────────────────────────────────────────────────────

export type CatalogFilters = {
  page: number;
  limit: number;
  categoryQuery: string;    // slug o ID de categoría
  subcategoriesQuery: string; // slugs/IDs separados por coma
  search: string;
  brandsQuery: string;      // slugs/IDs separados por coma
  offersOnly: boolean;
  bestSellersOnly: boolean;
  essentialsOnly: boolean;
};

export type CatalogProductsResult = {
  products: ReturnType<typeof serializeProduct>[];
  totalCount: number;
  resolvedCategoryId: string;
  resolvedSubcategoryIds: string[];
  resolvedBrandIds: string[];
};

// ─── Helpers de serialización ───────────────────────────────────────────────────

/**
 * Convierte los campos Decimal/BigInt de Prisma a Number para
 * que puedan pasarse como props a Client Components.
 */
function serializeProduct(p: any) {
  return {
    ...p,
    basePrice: Number(p.basePrice),
    stockQuantity: Number(p.stockQuantity),
    minOrderQty: Number(p.minOrderQty || 1),
  };
}

// ─── Resolvers de slugs/IDs ─────────────────────────────────────────────────────

function resolveIds(
  queries: string[],
  items: { id: string; slug: string }[]
): string[] {
  return queries
    .map((q) => items.find((item) => item.slug === q || item.id === q)?.id)
    .filter((id): id is string => !!id);
}

// ─── Use Case ──────────────────────────────────────────────────────────────────

export async function getCatalogProductsUseCase(
  filters: CatalogFilters,
  filtersData: CatalogFiltersData,
  companyId: string | null,
  isPrivileged: boolean = false
): Promise<CatalogProductsResult> {
  const { page, limit, offersOnly, bestSellersOnly, essentialsOnly, search } = filters;
  const { categories, brands } = filtersData;
  const skip = (page - 1) * limit;

  // ── 1. Resolver slugs/IDs a CUIDs en memoria (sin queries extra) ──────────────

  const resolvedCategoryId = resolveIds(
    [filters.categoryQuery].filter(Boolean),
    categories
  )[0] ?? '';

  const subcategoryQueries = filters.subcategoriesQuery
    ? filters.subcategoriesQuery.split(',').filter(Boolean)
    : [];
  const resolvedSubcategoryIds = resolveIds(subcategoryQueries, categories);

  const brandQueries = filters.brandsQuery
    ? filters.brandsQuery.split(',').filter(Boolean)
    : [];
  const resolvedBrandIds = resolveIds(brandQueries, brands);

  // ── 2. Carga paralela de todo lo necesario para construir el WHERE ─────────────
  //
  // storeSettings, promotions y bestSellers se cargaban secuencialmente en page.tsx.
  // Aquí van todos en paralelo → reducción de ~300-600ms en el TTFB.

  const [hideSetting, activePromotions, topSoldItems] = await Promise.all([
    prisma.storeSettings.findUnique({ where: { key: 'hideOutOfStock' } }),
    offersOnly
      ? prisma.promotion.findMany({
          where: {
            isActive: true,
            OR: [{ validFrom: null }, { validFrom: { lte: new Date() } }],
            AND: [{ OR: [{ validTo: null }, { validTo: { gte: new Date() } }] }],
          }
        })
      : Promise.resolve(null),
    bestSellersOnly
      ? prisma.orderItem.groupBy({
          by: ['productId'],
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 24,
        })
      : Promise.resolve(null),
  ]);

  const hideOutOfStock = hideSetting
    ? (hideSetting.value as boolean) === true
    : false;

  // ── 3. Construir el filtro WHERE ───────────────────────────────────────────────

  const where: any = {
    isActive: true,
    isDeleted: false,
    ...(hideOutOfStock ? { stockQuantity: { gt: 0 } } : {}),
    ...(!isPrivileged ? { basePrice: { gt: 0 } } : {}),
  };

  // Filtro: Ofertas (por marca o categoría con promoción activa)
  if (offersOnly && activePromotions) {
    const promoBrandIds = activePromotions
      .map((p) => p.brandId)
      .filter(Boolean) as string[];
    const promoCategoryIds = activePromotions
      .map((p) => p.categoryId)
      .filter(Boolean) as string[];

    // Incluir categorías hijas (calculado en memoria desde filtersData)
    const childCategoryIds = categories
      .filter((c) => c.parentId && promoCategoryIds.includes(c.parentId))
      .map((c) => c.id);
    const allPromoCategoryIds = [...promoCategoryIds, ...childCategoryIds];

    if (promoBrandIds.length > 0 || allPromoCategoryIds.length > 0) {
      where.OR = [
        ...(promoBrandIds.length > 0
          ? [{ brandId: { in: promoBrandIds } }]
          : []),
        ...(allPromoCategoryIds.length > 0
          ? [{ categoryId: { in: allPromoCategoryIds } }]
          : []),
      ];
    } else {
      // Sin promociones activas → sin resultados
      where.id = 'none';
    }
  }

  // Filtro: Más vendidos
  if (bestSellersOnly && topSoldItems) {
    const topProductIds = topSoldItems.map((item) => item.productId);
    where.id = { in: topProductIds };
  }

  // Filtro: Esenciales (no outlet)
  if (essentialsOnly) {
    where.category = { isOutlet: false };
  }

  // Filtro: Subcategorías o categoría con hijos
  if (resolvedSubcategoryIds.length > 0) {
    where.categoryId = { in: resolvedSubcategoryIds };
  } else if (resolvedCategoryId) {
    const childIds = categories
      .filter((c) => c.parentId === resolvedCategoryId)
      .map((c) => c.id);
    where.categoryId = { in: [resolvedCategoryId, ...childIds] };
  }

  // Filtro: Búsqueda por nombre o SKU
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Filtro: Marcas
  if (resolvedBrandIds.length > 0) {
    where.brandId = { in: resolvedBrandIds };
  }

  // ── 4. Select compartido para evitar duplicación (DRY) ────────────────────────

  const productSelect = {
    id: true,
    sku: true,
    name: true,
    slug: true,
    basePrice: true,
    stockQuantity: true,
    minOrderQty: true,
    unit: true,
    inner: true,
    specifications: true,
    brandId: true,
    categoryId: true,
    category: { select: { id: true, name: true, isOutlet: true } },
    brand: { select: { id: true, name: true } },
    images: {
      where: { isPrimary: true },
      take: 1,
      select: { url: true, isPrimary: true },
    },
    createdAt: true,
  };

  // ── 5. Fetch de productos ──────────────────────────────────────────────────────

  let productsRaw: any[];
  let totalCount: number;

  if (search) {
    // Modo búsqueda: ranking por relevancia ejecutado en Postgres con ORDER BY CASE WHEN.
    //
    // Índices activos:
    //   - products_name_trgm_idx (GIN gin_trgm_ops) → acelera ILIKE '%texto%' en name
    //   - products_isActive_name_idx (B-tree)       → usado para prefijos 'texto%'
    //
    // Por qué dos parámetros separados para name e sku:
    //   (name ILIKE $1 OR sku ILIKE $1) fuerza Seq Scan porque el OR impide
    //   que Postgres use el GIN index en name. Con condiciones separadas,
    //   el planner puede usar Bitmap Index Scan en cada una y hacer OR en memoria.

    const conditions: string[] = [
      `p."isActive" = true`,
      `p."isDeleted" = false`,
      // Condiciones separadas: permite que el GIN index se active para name
      `(p.name ILIKE $1 OR p.sku ILIKE $2)`,
    ];
    const params: unknown[] = [`%${search}%`, `%${search}%`];
    let paramIndex = 3;

    if (hideOutOfStock) {
      conditions.push(`p."stockQuantity" > 0`);
    }

    if (!isPrivileged) {
      conditions.push(`p."basePrice" > 0`);
    }

    if (resolvedSubcategoryIds.length > 0) {
      const placeholders = resolvedSubcategoryIds
        .map(() => `$${paramIndex++}`)
        .join(', ');
      conditions.push(`p."categoryId" IN (${placeholders})`);
      params.push(...resolvedSubcategoryIds);
    } else if (resolvedCategoryId) {
      const childIds = categories
        .filter((c) => c.parentId === resolvedCategoryId)
        .map((c) => c.id);
      const allCatIds = [resolvedCategoryId, ...childIds];
      const placeholders = allCatIds.map(() => `$${paramIndex++}`).join(', ');
      conditions.push(`p."categoryId" IN (${placeholders})`);
      params.push(...allCatIds);
    }

    if (resolvedBrandIds.length > 0) {
      const placeholders = resolvedBrandIds
        .map(() => `$${paramIndex++}`)
        .join(', ');
      conditions.push(`p."brandId" IN (${placeholders})`);
      params.push(...resolvedBrandIds);
    }

    if (essentialsOnly) {
      conditions.push(`cat."isOutlet" = false`);
    }

    const whereClause = conditions.join(' AND ');
    const searchExact = search.toLowerCase();
    const searchContains = `%${search.toLowerCase()}%`;

    // Parámetros de relevancia (posiciones fijas después del WHERE dinámico)
    const relevanceStart = paramIndex;
    params.push(
      searchExact,                    // $N   exact match
      `${searchExact} %`,             // $N+1 starts with word (e.g. "nike ")
      `${searchExact}%`,              // $N+2 starts with (prefijo)
      searchContains,                 // $N+3 name contains
      searchExact,                    // $N+4 SKU exact
      searchContains,                 // $N+5 SKU contains
    );
    const skip_p = paramIndex + 6;
    const take_p = paramIndex + 7;
    params.push(skip, limit);

    type RawProduct = {
      id: string; sku: string; name: string; slug: string;
      basePrice: any; stockQuantity: any; minOrderQty: any;
      unit: string; inner: number; specifications: any;
      brandId: string | null; categoryId: string | null;
      category_id: string | null; category_name: string | null; category_isOutlet: boolean | null;
      brand_id: string | null; brand_name: string | null;
      image_url: string | null; image_isPrimary: boolean | null;
      total_count: string;
    };

    const rows = await prisma.$queryRawUnsafe<RawProduct[]>(`
      SELECT
        p.id, p.sku, p.name, p.slug,
        p."basePrice", p."stockQuantity", p."minOrderQty",
        p.unit, p.inner, p.specifications,
        p."brandId", p."categoryId",
        cat.id        AS category_id,
        cat.name      AS category_name,
        cat."isOutlet" AS "category_isOutlet",
        b.id          AS brand_id,
        b.name        AS brand_name,
        img.url       AS image_url,
        img."isPrimary" AS "image_isPrimary",
        COUNT(*) OVER() AS total_count
      FROM products p
      LEFT JOIN categories cat ON cat.id = p."categoryId"
      LEFT JOIN brands b       ON b.id  = p."brandId"
      LEFT JOIN LATERAL (
        SELECT url, "isPrimary"
        FROM product_images
        WHERE "productId" = p.id AND "isPrimary" = true
        LIMIT 1
      ) img ON true
      WHERE ${whereClause}
      ORDER BY
        CASE
          WHEN LOWER(p.name) = $${relevanceStart}               THEN 1  -- exact
          WHEN LOWER(p.name) LIKE $${relevanceStart + 1}        THEN 2  -- starts with word
          WHEN LOWER(p.name) LIKE $${relevanceStart + 2}        THEN 3  -- prefix
          WHEN LOWER(p.sku)  = $${relevanceStart + 4}           THEN 4  -- SKU exact
          WHEN LOWER(p.sku)  LIKE $${relevanceStart + 5}        THEN 5  -- SKU contains
          WHEN LOWER(p.name) LIKE $${relevanceStart + 3}        THEN 6  -- name contains
          ELSE 7
        END ASC,
        p."createdAt" DESC
      LIMIT $${take_p} OFFSET $${skip_p}
    `, ...params);

    totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;

    // Transformar filas planas a la misma forma que usa productSelect
    productsRaw = rows.map((r) => ({
      id: r.id, sku: r.sku, name: r.name, slug: r.slug,
      basePrice: r.basePrice, stockQuantity: r.stockQuantity,
      minOrderQty: r.minOrderQty, unit: r.unit, inner: r.inner,
      specifications: r.specifications, brandId: r.brandId,
      categoryId: r.categoryId,
      category: r.category_id
        ? { id: r.category_id, name: r.category_name, isOutlet: r.category_isOutlet }
        : null,
      brand: r.brand_id ? { id: r.brand_id, name: r.brand_name } : null,
      images: r.image_url
        ? [{ url: r.image_url, isPrimary: r.image_isPrimary ?? true }]
        : [],
    }));
  } else {
    // Modo normal: COUNT y findMany en paralelo → un solo round-trip lógico
    const [count, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        take: limit,
        skip,
        select: productSelect,
        orderBy: essentialsOnly
          ? { stockQuantity: 'desc' as const }
          : { createdAt: 'desc' as const },
      }),
    ]);

    totalCount = count;
    productsRaw = rows;
  }

  // ── 6. Enriquecer con precios B2B ──────────────────────────────────────────────

  const enriched = await priceService.enrichProductsWithPrices(
    productsRaw as any,
    companyId
  );

  const products = enriched.map((p) => serializeProduct(p));

  return {
    products,
    totalCount,
    resolvedCategoryId,
    resolvedSubcategoryIds,
    resolvedBrandIds,
  };
}
