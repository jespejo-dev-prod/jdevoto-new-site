/**
 * Cloudinary Custom Image Loader para Next.js
 * Optimiza las imágenes utilizando la API "fetch" de Cloudinary,
 * lo que evita agotar la cuota de optimización de imágenes de Vercel.
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const params = ['f_auto', 'c_limit', `w_${width}`, `q_${quality || 'auto'}`];

  // 1. Si la imagen ya viene subida a Cloudinary
  if (src.includes('res.cloudinary.com')) {
    // Ejemplo: https://res.cloudinary.com/demo/image/upload/v1234/foto.jpg
    const parts = src.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/${params.join(',')}/${parts[1]}`;
    }
    return src; // Fallback
  }

  // 2. Si es una ruta relativa local (ej. /storage/products/123.jpg)
  let urlForCloudinary = src;
  if (src.startsWith('/')) {
    // Cloudinary no puede hacer fetch a "localhost". 
    // En desarrollo, simplemente devolvemos la ruta nativa para que cargue desde el disco sin optimizar por cloudinary.
    if (process.env.NODE_ENV !== 'production') {
      return `${src}?w=${width}&q=${quality || 75}`;
    }
    // En producción (y Vercel Previews), necesitamos la URL absoluta para que Cloudinary haga fetch.
    // NEXT_PUBLIC_VERCEL_URL es inyectada automáticamente por Vercel en cada branch/preview.
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : '';
    const baseUrl = vercelUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://www.jdevoto.cl';
    urlForCloudinary = `${baseUrl}${src}`;
  }

  // 3. Usar Cloudinary Fetch API
  // Reemplaza 'dfcilrav2' con tu cloud_name o usa variable de entorno
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dfcilrav2';
  
  return `https://res.cloudinary.com/${cloudName}/image/fetch/${params.join(',')}/${urlForCloudinary}`;
}
