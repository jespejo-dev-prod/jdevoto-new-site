/**
 * src/scripts/import-wc-products.ts
 *
 * Importer masivo oficial y definitivo.
 * Lee wc-product.xlsx, descarga imágenes localmente a public/storage/products/ con concurrencia controlada,
 * crea categorías jerárquicas Padre > Hija en un pase secuencial previo (evitando condiciones de carrera),
 * y realiza un mapeo perfecto de las columnas solicitadas.
 */

import 'dotenv/config';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// ─── Inicialización de Base de Datos ──────────────────────────────────────────
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Error: La variable de entorno DATABASE_URL no está definida.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

// ─── Configuración de Carpetas ───────────────────────────────────────────────
const publicStorageDir = path.resolve('public/storage/products');
if (!fs.existsSync(publicStorageDir)) {
  fs.mkdirSync(publicStorageDir, { recursive: true });
}

// Caches de memoria para velocidad extrema
const categoryCache = new Map<string, string>(); // slug -> id
const brandCache = new Map<string, string>();    // slug -> id
const downloadedImages = new Set<string>();      // URLs ya descargadas localmente en esta sesión

// Helper para generar slugs limpios
function slugifyStr(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Helper para parsear categorías complejas o separadas por comas en jerarquías uniformes Padre > Hija
function parseCategory(categoryStr: string): { parent: string; child?: string } | null {
  const clean = categoryStr.trim();
  if (!clean) return null;

  // Separar por comas para manejar categorías múltiples de WooCommerce
  const parts = clean.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  // Verificar si alguna de las partes es exactamente "OUTLET" (insensible a mayúsculas/minúsculas)
  const hasOutlet = parts.some(p => p.toUpperCase() === 'OUTLET');

  if (hasOutlet) {
    const parent = 'OUTLET';
    // Buscar la otra categoría en la lista que no sea "OUTLET"
    const otherPart = parts.find(p => p.toUpperCase() !== 'OUTLET');
    if (!otherPart) {
      return { parent };
    }
    // Extraer la subcategoría de esa otra categoría (ej. "FERRETERIA > PISTOLA" -> "FERRETERIA")
    const child = otherPart.includes('>') 
      ? otherPart.split('>')[0].trim() 
      : otherPart;
    return { parent, child };
  }

  // Si no tiene "OUTLET", buscar la parte que tenga una jerarquía ">"
  const hierarchicalPart = parts.find(p => p.includes('>'));
  if (hierarchicalPart) {
    const subParts = hierarchicalPart.split('>');
    const parent = subParts[0].trim();
    const child = subParts[1].trim();
    return { parent, child };
  }

  // Fallback a la primera parte limpia
  return { parent: parts[0] };
}


// Helper para descargar una imagen localmente de forma segura y veloz
async function downloadProductImage(url: string, productName: string): Promise<string> {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return '/placeholder-product.png';
  }

  try {
    const parsedUrl = new URL(url);
    const filename = path.basename(parsedUrl.pathname);
    
    if (!filename || filename === '/' || !filename.includes('.')) {
      return '/placeholder-product.png';
    }

    const localPath = path.join(publicStorageDir, filename);
    const relativeUrl = `/storage/products/${filename}`;

    // 1. Si ya existe en disco, saltar descarga
    if (fs.existsSync(localPath)) {
      return relativeUrl;
    }

    // 2. Si ya está en cola de descargas activas, retornar la misma ruta
    if (downloadedImages.has(url)) {
      return relativeUrl;
    }
    
    downloadedImages.add(url);

    // 3. Descargar el buffer por red
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 segundos de timeout
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Código de servidor HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync(localPath, buffer);
    return relativeUrl;
  } catch (err: any) {
    console.warn(`   ⚠️ Advertencia: No se pudo descargar la imagen para "${productName}" (${url}). Detalle: ${err.message}. Se usará como fallback.`);
    return '/placeholder-product.png';
  }
}

interface WcRow {
  SKU?: string | number;
  Nombre?: string;
  Descripción?: string;
  'Precio normal'?: number | string;
  Inventario?: number | string;
  Categorías?: string;
  Imágenes?: string;
  Brand?: string;
  Publicado?: number | string;
  'Meta: min_quantity'?: number | string;
  'Meta: group_of_quantity'?: number | string;
  'Meta: product_step'?: number | string;
  Unidad?: string;
}

async function main() {
  const excelFile = 'wc-product.xlsx';
  const excelPath = path.resolve(excelFile);
  
  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Error: El archivo excel no se encuentra en la ruta: ${excelPath}`);
    process.exit(1);
  }

  console.log(`\n📖 Leyendo archivo real de productos: ${excelFile}...`);
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<WcRow>(worksheet);

  console.log(`✓ Se encontraron ${rows.length} filas en la hoja de cálculo.`);

  // 1. Limpieza absoluta antes del import definitivo
  console.log('\n🧹 Vaciando por completo base de datos para importación definitiva y limpia...');
  await prisma.$transaction([
    prisma.promotion.deleteMany(),
    prisma.orderMessage.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.priceListItem.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.brand.deleteMany(),
  ]);
  console.log('✓ Base de datos 100% limpia de datos anteriores.');

  // Pre-cargar caches vacías
  categoryCache.clear();
  brandCache.clear();

  // ============================================================
  // PASO A: Pre-procesar Categorías y Marcas de forma SECUENCIAL
  // ============================================================
  console.log('\n🗂️ Pre-procesando y creando categorías y marcas secuencialmente...');
  const taxonomyStart = Date.now();
  
  for (const row of rows) {
    let sku = String(row.SKU ?? '').trim();
    if (/^\d+$/.test(sku) && sku.length < 7) {
      sku = sku.padStart(7, '0');
    }
    const name = String(row.Nombre ?? '').trim();
    if (!sku || !name) continue;

    // A. Categorías
    if (row.Categorías) {
      const parsed = parseCategory(String(row.Categorías));
      if (parsed) {
        const { parent: parentName, child: childName } = parsed;
        const parentSlug = slugifyStr(parentName);

        // A.1. Crear o buscar Padre
        let parentId: string;
        if (categoryCache.has(parentSlug)) {
          parentId = categoryCache.get(parentSlug)!;
        } else {
          const parentCat = await prisma.category.upsert({
            where: { slug: parentSlug },
            update: {},
            create: {
              name: parentName,
              slug: parentSlug,
              description: `Categoría Padre: ${parentName}`
            },
            select: { id: true }
          });
          categoryCache.set(parentSlug, parentCat.id);
          parentId = parentCat.id;
        }

        // A.2. Crear o buscar Hija (si existe)
        if (childName) {
          const childSlug = slugifyStr(`${parentName}-${childName}`);
          if (!categoryCache.has(childSlug)) {
            const childCat = await prisma.category.upsert({
              where: { slug: childSlug },
              update: {},
              create: {
                name: `${parentName} > ${childName}`,
                slug: childSlug,
                parentId: parentId,
                description: `Categoría Hija: ${parentName} > ${childName}`
              },
              select: { id: true }
            });
            categoryCache.set(childSlug, childCat.id);
          }
        }
      }
    }

    // B. Marcas
    const brandName = String(row.Brand ?? 'Genérico').trim();
    const brandSlug = slugifyStr(brandName);

    if (!brandCache.has(brandSlug)) {
      const brand = await prisma.brand.upsert({
        where: { slug: brandSlug },
        update: {},
        create: {
          name: brandName,
          slug: brandSlug,
          description: `Marca: ${brandName}`
        },
        select: { id: true }
      });
      brandCache.set(brandSlug, brand.id);
    }
  }

  const taxonomyDuration = ((Date.now() - taxonomyStart) / 1000).toFixed(1);
  console.log(`✓ Pre-procesamiento completado en ${taxonomyDuration}s. Categorías totales: ${categoryCache.size}, Marcas totales: ${brandCache.size}.`);

  // ============================================================
  // PASO B: Importar Productos en paralelo (libre de colisiones)
  // ============================================================
  console.log('\n📥 Importando catálogo de productos con descargas locales asíncronas concurrentes...');
  
  const startTime = Date.now();
  let importedCount = 0;

  // Límite de concurrencia: Procesar en bloques de 15 productos paralelos
  const CONCURRENCY = 15;

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const chunk = rows.slice(i, i + CONCURRENCY);

    await Promise.all(chunk.map(async (row) => {
      let sku = String(row.SKU ?? '').trim();
      if (/^\d+$/.test(sku) && sku.length < 7) {
        sku = sku.padStart(7, '0');
      }
      const name = String(row.Nombre ?? '').trim();

      if (!sku || !name) {
        return; // Omitir filas inválidas
      }

      try {
        // 1. Obtener ID de Categoría directamente de la caché en memoria (Cero escrituras en DB)
        let categoryId: string | null = null;
        if (row.Categorías) {
          const parsed = parseCategory(String(row.Categorías));
          if (parsed) {
            const slug = parsed.child 
              ? slugifyStr(`${parsed.parent}-${parsed.child}`) 
              : slugifyStr(parsed.parent);
            categoryId = categoryCache.get(slug) ?? null;
          }
        }

        // 2. Obtener ID de Marca directamente de la caché en memoria
        const brandName = String(row.Brand ?? 'Genérico').trim();
        const brandSlug = slugifyStr(brandName);
        const brandId = brandCache.get(brandSlug) ?? null;

        // 3. Descargar imagen localmente si viene especificada
        let localImageUrl: string | null = null;
        if (row.Imágenes) {
          // Tomar la primera imagen en caso de lista separada por comas
          const firstImageUrl = String(row.Imágenes).split(',')[0].trim();
          localImageUrl = await downloadProductImage(firstImageUrl, name);
        }

        // 4. Mapeo de campos y formateo seguro
        const description = row.Descripción ? String(row.Descripción).trim() : `${name}. Catálogo al por mayor.`;
        const basePriceVal = parseFloat(String(row['Precio normal'] ?? '0')) || 0;
        const stockVal = parseInt(String(row.Inventario ?? '0'), 10) || 0;
        
        // Mapear min_quantity a Unidades Inner y MOQ
        const innerVal = parseInt(String(row['Meta: min_quantity'] ?? row['Meta: group_of_quantity'] ?? '1'), 10) || 1;
        const unit = String(row.Unidad ?? 'UN').trim();

        // Estado Publicado (1 = Publicado, cualquier otro = Borrador)
        const isPublished = parseInt(String(row.Publicado ?? '0'), 10) === 1;

        const productSlug = slugifyStr(`${name}-${sku}`);

        // 5. Crear el Producto definitivo en PostgreSQL
        await prisma.product.create({
          data: {
            sku,
            name,
            slug: productSlug,
            description,
            basePrice: new Prisma.Decimal(basePriceVal),
            stockQuantity: BigInt(stockVal),
            minOrderQty: innerVal, // MOQ acoplado a Inner
            inner: innerVal,       // Múltiplos de compra
            unit,
            isActive: isPublished,
            isDeleted: false,
            categoryId,
            brandId,
            seoTitle: name.substring(0, 255), // SEO Título (Nombre)
            seoDescription: description.substring(0, 1000), // SEO Meta Description
            // Agregar la imagen principal local
            ...(localImageUrl ? {
              images: {
                create: {
                  url: localImageUrl,
                  position: 0,
                  isPrimary: true,
                  altText: `Imagen de ${name}`
                }
              }
            } : {})
          }
        });

        importedCount++;
      } catch (err: any) {
        console.error(`❌ Error importando producto SKU=${sku}:`, err.message);
      }
    }));

    // Imprimir barra de progreso
    if (i % 150 === 0 || i + CONCURRENCY >= rows.length) {
      const currentProgress = Math.min(i + CONCURRENCY, rows.length);
      console.log(`   [${currentProgress}/${rows.length}] productos mapeados y procesados...`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 ¡Importación final completada con éxito!`);
  console.log(`✓ Se importaron ${importedCount} productos a tu base de datos.`);
  console.log(`✓ Se crearon ${categoryCache.size} categorías (agrupadas jerárquicamente en Padre/Hija).`);
  console.log(`✓ Se crearon ${brandCache.size} marcas.`);
  console.log(`✓ Tiempo total: ${duration} segundos.`);
}

main()
  .catch((e) => {
    console.error('\n❌ Error crítico durante la importación:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
