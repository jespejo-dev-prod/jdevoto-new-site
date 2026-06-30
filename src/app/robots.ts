import { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jdevoto.cl';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/products',
          '/products/',
          '/privacy',
          '/terms',
          '/support',
        ],
        disallow: [
          '/dashboard/',
          '/cart',
          '/checkout',
          '/profile',
          '/wishlist',
          '/compra-rapida',
          '/portal-facturacion',
          '/track-order',
          '/api/',
          '/login',
          '/register',
          '/reset-password',
          '/forgot-password',
          '/api-docs',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
