import React, { Suspense, cache } from "react";
import { Metadata } from "next";
import { getProductDetailsUseCase } from "@/modules/catalog/application/getProductDetails.use-case";
import { getRelatedProductsUseCase } from "@/modules/catalog/application/getRelatedProducts.use-case";
import { getBundleSuggestionUseCase } from "@/modules/catalog/application/getBundleSuggestion.use-case";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { AdminEditButton } from "./AdminEditButton";
import { AuthRender } from "@/components/auth/auth-render";
import sanitizeHtml from 'sanitize-html';

import {
  ChevronRight,
  ChevronLeft,
  Plus,
  ChevronDown,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ProductGallery } from "@/modules/catalog/presentation/components/ProductGallery/ProductGallery";
import { BuyBox } from "@/modules/catalog/presentation/components/BuyBox/BuyBox";
import { ProductSlider } from "@/components/ui/product-slider";
import { BundleAction } from "@/modules/catalog/presentation/components/BundleAction/BundleAction";
import { prisma } from "@/lib/client";
import { TAX_RATE } from "@/types/domain";
import { TrackProduct } from "@/components/catalog/track-product";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductList/ProductCard";
import { RecentlyViewedSlider } from "@/components/home/client-sliders";
import { serializeDecimal } from "@/lib/utils";
import { priceService } from "@/modules/pricing/domain/price.service";

/**
 * Request-level cache:
 * Compartido entre generateMetadata y el componente de página.
 * Una sola query a la DB por request, sin duplicación (DRY).
 *
 * CRÍTICO: getProductDetailsUseCase NO llama al PriceService.
 * Resultado: el critical path de la página solo hace 1 query a la DB.
 *
 * El precio B2B se calcula de forma asíncrona en el BuyBox (cliente)
 * a través de /api/products/[slug]/price → patrón "Opción A".
 */
const getCachedProduct = cache(getProductDetailsUseCase);

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// ISR: 1 hora — datos de producto son estables.
// generateStaticParams pre-construye todas las URLs en build.
export const revalidate = 3600;

/**
 * generateStaticParams
 * Pre-construye todas las páginas de producto activas en build time.
 * En dev no tiene efecto, pero en producción sirve HTML pre-generado → velocidad máxima.
 */
export async function generateStaticParams() {
  // Retornar arreglo vacío para no pre-generar ningún producto en el build de Vercel.
  // Esto evita agotar el límite de conexiones a la base de datos (connection timeout).
  // Los productos se generarán automáticamente (ISR) cuando el primer usuario los visite.
  return [];
}

// ─── SEO Metadata ────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jdevoto.cl";
  try {
    const product = await getCachedProduct(slug);
    
    if (product.sku === 'TEST-001') {
      const { getServerUser } = await import('@/lib/server-auth');
      const user = await getServerUser();
      if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        return { title: "No Encontrado" };
      }
    }

    const brandName =
      typeof product.brand === "string"
        ? product.brand
        : (product.brand as any)?.name || "";

    // Limpiar HTML y truncar a 155 chars para meta description
    const rawDesc = product.description || "";
    const cleanDesc = rawDesc
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const metaDesc =
      cleanDesc.length > 0
        ? cleanDesc.length > 155
          ? cleanDesc.substring(0, 152) + "..."
          : cleanDesc
        : `Compra ${product.name}${brandName ? ` de ${brandName}` : ""} al mejor precio mayorista en J. Devoto.`;

    const canonicalUrl = `${baseUrl}/products/${product.slug}`;
    const ogImages = (product.images as any[]).map((img) => ({
      url: img.url,
      width: 800,
      height: 800,
      alt: `${product.name}${brandName ? ` — ${brandName}` : ""}`,
    }));

    return {
      title: `${product.name}${brandName ? ` | ${brandName}` : ""}`,
      description: metaDesc,
      alternates: { canonical: canonicalUrl },
      robots: { index: true, follow: true },
      openGraph: {
        title: `${product.name}${brandName ? ` — ${brandName}` : ""} | J. Devoto`,
        description: metaDesc,
        url: canonicalUrl,
        type: "website",
        locale: "es_CL",
        siteName: "J. Devoto",
        images: ogImages,
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.name}${brandName ? ` | ${brandName}` : ""} | J. Devoto`,
        description: metaDesc,
        images: ogImages.length > 0 ? [ogImages[0].url] : [],
      },
    };
  } catch {
    return { title: "Producto no encontrado", robots: { index: false } };
  }
}

// ─── Page Component ────────────────────────────────────────────────────────────
export default async function DynamicProductPage(props: ProductPageProps) {
  const params = await props.params;

  /**
   * CRITICAL PATH — UNA sola query a la DB.
   * Sin getServerUser(), sin PriceService, sin listas de precios.
   * El servidor genera el HTML en ~20-50ms de proceso.
   *
   * El precio B2B se calcula en el BuyBox (cliente) de forma asíncrona.
   */
  let product: Awaited<ReturnType<typeof getProductDetailsUseCase>>;

  try {
    product = await getCachedProduct(params.slug);
    
    if (product.sku === 'TEST-001') {
      const { getServerUser } = await import('@/lib/server-auth');
      const user = await getServerUser();
      if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        notFound();
      }
    }
  } catch {
    notFound();
    return; // TypeScript guard
  }

  // Redireccionamiento estilo WordPress:
  // Si el usuario entró al producto usando su ID en lugar del slug en la URL,
  // redirigimos de forma limpia a su slug oficial para asegurar SEO.
  if (product.id === params.slug) {
    const { redirect } = await import("next/navigation");
    redirect(`/products/${product.slug}`);
  }

  const primaryImage = (product.images.find((img: any) => img.isPrimary) ||
    product.images[0]) as any;
  const brandName =
    typeof product.brand === "string"
      ? product.brand
      : (product.brand as any)?.name || "";

  const hasDimensions =
    (Number(product.length) || 0) > 0 ||
    (Number(product.width) || 0) > 0 ||
    (Number(product.height) || 0) > 0 ||
    (Number(product.weight) || 0) > 0 ||
    (Number(product.weight) || 0) > 0;

  // Limpiar HTML de description para JSON-LD
  const cleanDescription = (product.description || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jdevoto.cl";
  const canonicalUrl = `${baseUrl}/products/${product.slug}`;

  // Precio base con IVA para el JSON-LD (el BuyBox lo actualizará con precio B2B)
  const basePriceGross = Math.round(Number(product.basePrice) * (1 + TAX_RATE));

  // JSON-LD: Producto
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((img: any) => img.url),
    description: cleanDescription,
    sku: product.sku,
    mpn: product.sku,
    brand: { "@type": "Brand", name: brandName || "J. Devoto" },
    category: (product.category as any)?.name,
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "CLP",
      price: basePriceGross,
      availability:
        product.stockQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Comercial J. Devoto" },
    },
  };

  // JSON-LD: Breadcrumb
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: baseUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Catálogo",
        item: `${baseUrl}/products`,
      },
      ...((product.category as any)?.name
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: (product.category as any).name,
              item: `${baseUrl}/categorias/${(product.category as any).slug || ""}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: (product.category as any)?.name ? 4 : 3,
        name: product.name,
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-zinc-900 font-sans selection:bg-primary/20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <PublicHeader />
      <TrackProduct slug={product.slug} />

      <main className="flex-grow max-w-[1500px] mx-auto p-6 lg:px-12 pt-8 pb-24 w-full">
        {/* Navegación y Botón de Edición */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <nav className="flex items-center gap-2.5 text-xs font-bold text-zinc-400 uppercase tracking-widest overflow-hidden">
            <Link
              href={
                product.category?.slug
                  ? `/categorias/${product.category.slug}`
                  : "/products"
              }
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors font-black shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>
                {(product.category as any)?.name || "Catálogo General"}
              </span>
            </Link>
            <span className="text-zinc-300 shrink-0">/</span>
            <span className="text-zinc-900 truncate font-black max-w-[150px] xs:max-w-none">
              {product.name}
            </span>
          </nav>

          <AdminEditButton productId={product.id} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* GALLERY & INFO & DESCRIPTION (9 cols on desktop, stacks first on mobile) */}
          <div className="lg:col-span-9 space-y-8 lg:space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-9 gap-8 lg:gap-12 items-start">
              {/* GALLERY (6 cols on md+) */}
              <ProductGallery
                images={product.images as any}
                productName={product.name}
              />

              {/* PRODUCT INFO (3 cols on md+) */}
              <div className="md:col-span-3 space-y-6 lg:space-y-8">
                <div className="space-y-3 lg:space-y-4">
                  {brandName && (
                    <div className="flex items-center gap-2 text-[14px] font-black uppercase tracking-widest text-zinc-400">
                      <span className="text-blue-600">{brandName}</span>
                    </div>
                  )}

                  <h1 className="text-[28px] sm:text-[38px] lg:text-[44px] font-black text-zinc-950 leading-[1.1] tracking-tight">
                    {product.name}
                  </h1>
                </div>

                {/* Specs compactas */}
                <div className="pt-6 lg:pt-8 border-t border-zinc-100">
                  <table className="w-full text-[16px] uppercase tracking-tight">
                    <tbody className="divide-y divide-zinc-50">
                      <tr className="group">
                        <td className="py-2.5 text-zinc-500 group-hover:text-zinc-700 transition-colors">
                          SKU
                        </td>
                        <td className="py-2.5 text-right text-zinc-950">
                          {product.sku}
                        </td>
                      </tr>
                      <tr className="group">
                        <td className="py-2.5 text-zinc-500 group-hover:text-zinc-700 transition-colors">
                          Marca
                        </td>
                        <td className="py-2.5 text-right text-zinc-950">
                          {brandName || "—"}
                        </td>
                      </tr>
                      <tr className="group">
                        <td className="py-2.5 text-zinc-500 group-hover:text-zinc-700 transition-colors">
                          Unidad
                        </td>
                        <td className="py-2.5 text-right text-zinc-950">
                          {product.unit}
                        </td>
                      </tr>
                      <tr className="group">
                        <td className="py-2.5 text-zinc-500 group-hover:text-zinc-700 transition-colors">
                          Unidades Inner
                        </td>
                        <td className="py-2.5 text-right text-zinc-950">
                          {product.inner ?? 1}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* DESCRIPCIÓN DEL PRODUCTO */}
            <div className="pt-8 lg:pt-12 border-t border-zinc-100">
              <section className="max-w-4xl">
                <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight mb-4 lg:mb-6">
                  Descripción del producto
                </h2>
                <div
                  className="prose prose-zinc max-w-none text-zinc-600 prose-p:leading-relaxed prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-zinc-900 prose-ul:my-4 prose-li:my-1 text-sm md:text-base leading-relaxed whitespace-pre-wrap space-y-4"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(
                      (product.description || "Sin descripción disponible.").replace(/\\n/g, '\n'),
                      {
                        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe']),
                        allowedAttributes: {
                          ...sanitizeHtml.defaults.allowedAttributes,
                          img: ['src', 'alt', 'width', 'height'],
                          iframe: ['src', 'width', 'height', 'allowfullscreen', 'frameborder']
                        }
                      }
                    ),
                  }}
                />
              </section>
            </div>
          </div>

          {/* BUY BOX (3 cols on desktop, stacks second on mobile - right below Gallery & Info) */}
          <div className="lg:col-span-3 self-start w-full">
            <div className="sticky top-12 space-y-6">
              <BuyBox product={product} slug={product.slug} />

              {/* MEDIOS DE PAGO */}
              <div className="p-6 sm:p-8 rounded-[36px] sm:rounded-[48px] border border-zinc-100 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.05)] space-y-6">
                <h3 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                  Medios de pago
                </h3>
                <div className="bg-[#00a650] p-4 rounded-xl flex items-center gap-3 text-white">
                  <Package className="h-6 w-6 shrink-0" />
                  <p className="text-sm sm:text-base font-bold leading-snug">
                    ¡Compra ahora y paga en 30, 60 o 90 días con tu crédito B2B!
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs sm:text-[13px] font-black text-zinc-500 uppercase tracking-widest mb-3">
                      Crédito Directo
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {["Contado", "30 días", "60 días", "90 días"].map(
                        (term) => (
                          <div
                            key={term}
                            className="px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-100 text-xs sm:text-[13px] font-bold text-zinc-750"
                          >
                            {term}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-[13px] font-black text-zinc-500 uppercase tracking-widest mb-3">
                      Tarjetas de Crédito y Débito
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {["Mercado Pago", "Transferencia"].map((method) => (
                        <div
                          key={method}
                          className="px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-100 text-xs sm:text-[13px] font-bold text-zinc-750"
                        >
                          {method}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-50">
                  <Link
                    href="/terms"
                    className="text-sm sm:text-base font-bold text-blue-600 hover:underline"
                  >
                    Conoce nuestros términos de crédito
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MÁS INFORMACIÓN DEL PRODUCTO (Full Width) */}
        <div className="mt-20 border-t border-zinc-200 pt-16 space-y-12">
          <section className="space-y-10">
            <div className="bg-blue-600 text-white px-6 py-2.5 text-xl sm:text-2xl font-black uppercase tracking-widest w-fit rounded-lg shadow-lg shadow-blue-600/20">
              Más información del producto
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Características */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b-2 border-zinc-100 pb-4">
                  <h3 className="text-2xl font-black text-zinc-950 tracking-tight">
                    Características y especificaciones
                  </h3>
                  <ChevronDown className="h-6 w-6 text-zinc-400" />
                </div>
                <table className="w-full text-base sm:text-lg">
                  <tbody className="divide-y divide-zinc-50">
                    {product.specifications &&
                    Array.isArray(product.specifications) &&
                    product.specifications.length > 0 ? (
                      product.specifications.map((spec: any, idx: number) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? "bg-zinc-50/30" : ""}
                        >
                          <td className="py-4 px-4 font-bold text-zinc-900 w-1/2 uppercase text-xs sm:text-[13px] tracking-wider">
                            {spec.label || spec.name}
                          </td>
                          <td className="py-4 px-4 text-zinc-700 font-medium">
                            {spec.value}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className="py-5 px-4 text-zinc-500 italic text-base sm:text-lg"
                          colSpan={2}
                        >
                          No hay especificaciones disponibles.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Detalles */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b-2 border-zinc-100 pb-4">
                  <h3 className="text-2xl font-black text-zinc-950 tracking-tight">
                    Detalles del producto
                  </h3>
                  <ChevronDown className="h-6 w-6 text-zinc-400" />
                </div>
                <div className="p-8 rounded-3xl bg-zinc-50 border border-zinc-100 text-base sm:text-lg text-zinc-700 space-y-6 font-medium">
                  {hasDimensions && (
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 uppercase font-black text-xs sm:text-[13px] tracking-widest">
                        Dimensiones
                      </span>
                      <span className="text-zinc-950 font-bold">
                        {Number(product.length) || "—"} x{" "}
                        {Number(product.width) || "—"} x{" "}
                        {Number(product.height) || "—"} cm;{" "}
                        {Number(product.weight) || "—"} kg
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 uppercase font-black text-xs sm:text-[13px] tracking-widest">
                      Fabricante
                    </span>
                    <span className="text-zinc-950 font-bold">
                      {brandName || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 uppercase font-black text-xs sm:text-[13px] tracking-widest">
                      SKU
                    </span>
                    <span className="text-zinc-950 font-mono font-black">
                      {product.sku}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/*
          SECCIONES SECUNDARIAS — carga en streaming (no bloquean el HTML inicial).
          Usan companyId=null → precios base. No bloquean el render principal.
        */}
        <Suspense fallback={null}>
          <AuthRender>
            <BundleSuggestionSection
              product={product}
              primaryImageUrl={primaryImage?.url}
            />
          </AuthRender>
        </Suspense>

        <Suspense fallback={null}>
          <RelatedProductsSection
            categoryId={product.categoryId}
            currentProductId={product.id}
          />
        </Suspense>
      </main>

      <PublicFooter />
    </div>
  );
}

// ─── Server Components Secundarios ─────────────────────────────────────────────
// Cargan en streaming (Suspense fallback=null).
// Usan companyId=null para no bloquear — precios base, no B2B.

async function RelatedProductsSection({
  categoryId,
  currentProductId,
}: {
  categoryId: string | null;
  currentProductId: string;
}) {
  // isAuthenticated se determina en el cliente (ProductCard tiene isAuthenticated=false por defecto).
  // No usamos getServerUser() aquí para no introducir cookies() y romper ISR.
  const isAuthenticated = false;

  const hideSetting = await prisma.storeSettings.findUnique({
    where: { key: "hideOutOfStock" },
  });
  const hideOutOfStock = hideSetting
    ? (hideSetting.value as boolean) === true
    : false;

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
    brandId: true,
    categoryId: true,
    category: { select: { id: true, name: true, isOutlet: true } },
    brand: { select: { id: true, name: true } },
    images: {
      where: { isPrimary: true },
      take: 1,
      select: { url: true, isPrimary: true },
    },
  };

  async function fetchEnrichedProducts(
    whereClause: any,
    limit: number,
  ): Promise<any[]> {
    const products = await prisma.product.findMany({
      where: {
        ...whereClause,
        isActive: true,
        isDeleted: false,
        ...(hideOutOfStock ? { stockQuantity: { gt: 0 } } : {}),
      },
      take: limit,
      orderBy: [{ stockQuantity: "desc" }, { createdAt: "desc" }],
      select: productSelect,
    });

    if (products.length === 0) return [];

    const enriched = await priceService.enrichProductsWithPrices(
      products as any,
      null,
    );
    return enriched.map((p: any) =>
      serializeDecimal(p as Record<string, unknown>),
    );
  }

  // 1. Fetch child category products
  const childProducts = categoryId
    ? await fetchEnrichedProducts(
        { categoryId, id: { not: currentProductId } },
        8,
      )
    : [];

  // Determine parent category
  let parentId: string | null = null;
  let parentName: string | null = null;
  let childName: string | null = null;
  let parentCategoryIds: string[] = [];

  if (categoryId) {
    const currentCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, parentId: true },
    });

    if (currentCategory) {
      childName = currentCategory.name;
      if (currentCategory.parentId) {
        parentId = currentCategory.parentId;
        const parentCategory = await prisma.category.findUnique({
          where: { id: parentId },
          select: { name: true },
        });
        parentName = parentCategory?.name || null;
      } else {
        parentId = currentCategory.id;
        parentName = currentCategory.name;
      }
    }
  }

  if (parentId) {
    const subcategories = await prisma.category.findMany({
      where: { parentId },
      select: { id: true },
    });
    parentCategoryIds = [parentId, ...subcategories.map((c) => c.id)];
  } else if (categoryId) {
    parentCategoryIds = [categoryId];
  }

  // 2. Fetch parent category products
  const showChildSlider = childProducts.length >= 1;
  const excludeIds: string[] = [currentProductId];
  if (showChildSlider) {
    excludeIds.push(...childProducts.map((p: any) => p.id as string));
  }

  const parentProducts =
    parentCategoryIds.length > 0
      ? await fetchEnrichedProducts(
          { categoryId: { in: parentCategoryIds }, id: { notIn: excludeIds } },
          8,
        )
      : [];

  if (parentProducts.length === 0 && childProducts.length === 0) return null;

  return (
    <div className="mt-12 border-t border-zinc-100 pt-16 space-y-16">
      {/* 1. Direct Category (Child/Hijo) Slider - Only shown if it has >= 1 products */}
      {showChildSlider && (
        <ProductSlider
          title={
            childName ? `Productos de ${childName}` : "Productos Relacionados"
          }
        >
          {childProducts.map((p: any, idx: number) => (
            <div
              key={`${p.id}-${idx}`}
              className="w-[85vw] sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)] shrink-0 snap-start"
            >
              <ProductCard
                product={p}
                variant="catalog"
                isAuthenticated={isAuthenticated}
              />
            </div>
          ))}
        </ProductSlider>
      )}

      {/* 2. Parent Category Slider - Always shown */}
      {parentProducts.length > 0 && (
        <ProductSlider title={parentName || "Categoría Principal"}>
          {parentProducts.map((p: any, idx: number) => (
            <div
              key={`${p.id}-${idx}`}
              className="w-[85vw] sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)] shrink-0 snap-start"
            >
              <ProductCard
                product={p}
                variant="catalog"
                isAuthenticated={isAuthenticated}
              />
            </div>
          ))}
        </ProductSlider>
      )}

      {/* 3. Vistos Recientemente Slider - Always shown */}
      <RecentlyViewedSlider fallbackProducts={parentProducts.slice(0, 10)} />
    </div>
  );
}

async function BundleSuggestionSection({
  product,
  primaryImageUrl,
}: {
  product: any;
  primaryImageUrl: string;
}) {
  // La verificación de auth se omite aquí para no usar cookies() y romper ISR.
  // BundleAction es un Client Component que gestiona el carrito; si el usuario
  // no está autenticado, el CartContext lo redirigirá al login al intentar agregar.

  const bundle = await getBundleSuggestionUseCase(
    product.categoryId,
    product.brandId,
    product.id,
    null,
  );
  if (!bundle) return null;

  return (
    <section className="mt-20 p-5 sm:p-8 lg:p-10 rounded-[32px] sm:rounded-[48px] border-2 border-zinc-50 bg-zinc-50/30 overflow-hidden relative">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col gap-6 w-full lg:flex-1">
          <div className="flex flex-col gap-2 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
              Sugerencia de compra
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-bold uppercase tracking-wider">
              Aumenta tu rentabilidad combinando estos productos
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 justify-center lg:justify-start">
            <div className="flex items-center gap-4 sm:gap-6 justify-center shrink-0">
              {/* Producto Actual */}
              <div className="group relative shrink-0">
                <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-[24px] bg-white border border-zinc-100 shadow-xl flex items-center justify-center hover:scale-105 transition-transform duration-500 relative overflow-hidden">
                  <Image
                    src={primaryImageUrl || "/placeholder-product.png"}
                    fill
                    sizes="144px"
                    className="object-contain p-4 mix-blend-multiply"
                    alt="Producto actual"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-zinc-900 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                  x{product.inner || product.minOrderQty || 1}
                </div>
              </div>

              <Plus className="h-5 w-5 text-zinc-300 shrink-0" />

              {/* Producto Sugerido */}
              <div className="group relative shrink-0">
                <Link
                  href={`/products/${bundle.slug}`}
                  className="block w-24 h-24 sm:w-36 sm:h-36 rounded-[24px] bg-white border border-zinc-100 shadow-xl flex items-center justify-center hover:scale-105 transition-transform duration-500 relative overflow-hidden"
                >
                  <Image
                    src={
                      (bundle.images as any)?.[0]?.url ||
                      "/placeholder-product.png"
                    }
                    fill
                    sizes="144px"
                    className="object-contain p-4 mix-blend-multiply"
                    alt={bundle.name}
                  />
                </Link>
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                  x{bundle.inner || bundle.minOrderQty || 1}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-center sm:text-left max-w-sm">
              <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                Sugerido
              </div>
              <Link
                href={`/products/${bundle.slug}`}
                className="text-sm sm:text-base font-black text-zinc-950 hover:text-blue-600 transition-colors line-clamp-2 uppercase leading-snug"
              >
                {bundle.name}
              </Link>
            </div>
          </div>
        </div>

        <BundleAction currentProduct={product} suggestedProduct={bundle} />
      </div>
    </section>
  );
}
