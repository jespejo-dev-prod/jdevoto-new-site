import { MetadataRoute } from 'next';
import { prisma } from '@/lib/client';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jdevoto.cl';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Páginas estáticas públicas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date('2026-07-08'),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date('2026-07-08'),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date('2026-07-08'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-07-08'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-07-08'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Categorías padre (sin outlet) — indexables como páginas de categoría
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null, isOutlet: false },
      select: { slug: true, updatedAt: true },
      orderBy: { name: 'asc' },
    });

    categoryPages = categories
      .filter((c) => c.slug)
      .map((c) => ({
        url: `${baseUrl}/categorias/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
  } catch {
    console.warn('⚠️ sitemap: no se pudo conectar a la DB para categorías.');
  }

  // Páginas de producto — el mayor activo SEO
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isDeleted: false },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    productPages = products
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${baseUrl}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
  } catch {
    console.warn('⚠️ sitemap: no se pudo conectar a la DB para productos.');
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
