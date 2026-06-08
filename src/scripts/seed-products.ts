/**
 * src/scripts/seed-products.ts
 *
 * Inserta 1000 productos mock en la base de datos para pruebas de performance.
 * Usa createMany en batches de 100 para máxima eficiencia.
 *
 * Uso:
 *   npx tsx src/scripts/seed-products.ts
 */

import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Inicializar Prisma con el mismo adapter que usa la app
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

// ─── Datos de muestra ────────────────────────────────────────────────────────

const CATEGORY_NAMES = [
  'Papelería', 'Aseo', 'Ferretería', 'Oficina', 'Alimentos',
  'Electrónica', 'Herramientas', 'Seguridad', 'Limpieza Industrial', 'Computación',
];

const BRAND_NAMES = [
  'Procter & Gamble', 'Unilever', '3M', 'Samsung', 'LG',
  'Bosch', 'Makita', 'Faber-Castell', 'HP', 'Epson',
];

const PRODUCT_PREFIXES = [
  'Resma', 'Caja de', 'Pack de', 'Set', 'Kit', 'Juego de', 'Unidad', 'Bolsa de',
  'Galón de', 'Tarro de', 'Rollo de', 'Paquete de',
];

const PRODUCT_NOUNS = [
  'Papel A4 75g', 'Papel A4 80g', 'Folder Manila', 'Archivador Lomo Ancho',
  'Cloro Industrial', 'Desinfectante Multi', 'Detergente Ropa', 'Jabón Líquido',
  'Tornillos 1/4"', 'Pernos M8', 'Tuercas Hex', 'Clavos 2"', 'Lija Grano 120',
  'Resaltador Amarillo', 'Bolígrafo Azul', 'Lápiz Grafito 2B', 'Plumón N°1',
  'Azúcar Blanca 1kg', 'Café Molido 250g', 'Té Negro Caja', 'Sal Fina 1kg',
  'Cable HDMI 2m', 'Mouse Inalámbrico', 'Teclado USB', 'Monitor 24"',
  'Guantes de Látex', 'Mascarilla N95', 'Lentes de Seguridad', 'Casco EPP',
  'Escoba Estándar', 'Lampazo de Microfibra', 'Balde Plástico 12L', 'Mopa Húmeda',
  'Tóner HP 85A', 'Cartucho Epson T664', 'Papel Foto A4', 'Sobre Manila',
  'Perforadora 2 Agujeros', 'Engrapadora 26/6', 'Tijera Acero', 'Cutter Mediano',
];

const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1499914485622-a88fac536970?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1608889476518-738c9b1dcb40?w=500&auto=format&fit=crop&q=60',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  Iniciando seed de 1000 productos mock...\n');

  // 1. Verificar conexión
  await prisma.$queryRaw`SELECT 1`;
  console.log('✓  Conexión a la base de datos establecida');

  // 2. Obtener o crear categorías
  console.log('\n📂  Verificando categorías...');
  const categories: { id: string; name: string }[] = [];
  for (const name of CATEGORY_NAMES) {
    const slug = slugifyStr(name);
    const cat = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, description: `Categoría: ${name}` },
      select: { id: true, name: true },
    });
    categories.push(cat);
  }
  console.log(`  ✓  ${categories.length} categorías listas`);

  // 3. Obtener o crear marcas
  console.log('\n🏷️   Verificando marcas...');
  const brands: { id: string; name: string }[] = [];
  for (const name of BRAND_NAMES) {
    const slug = slugifyStr(name);
    const brand = await prisma.brand.upsert({
      where: { slug },
      update: {},
      create: { name, slug, description: `Marca: ${name}` },
      select: { id: true, name: true },
    });
    brands.push(brand);
  }
  console.log(`  ✓  ${brands.length} marcas listas`);

  // 4. Eliminar productos mock anteriores (SKU con prefijo MOCK-)
  console.log('\n🧹  Limpiando productos mock anteriores...');
  const deleted = await prisma.product.deleteMany({
    where: { sku: { startsWith: 'MOCK-' } },
  });
  if (deleted.count > 0) {
    console.log(`  ✓  ${deleted.count} productos mock anteriores eliminados`);
  } else {
    console.log('  ✓  No había productos mock previos');
  }

  // 5. Generar 1000 productos en batches de 100
  const TOTAL = 1000;
  const BATCH_SIZE = 100;
  let created = 0;
  const startTime = Date.now();

  console.log(`\n📦  Insertando ${TOTAL} productos en batches de ${BATCH_SIZE}...`);

  for (let batch = 0; batch < TOTAL / BATCH_SIZE; batch++) {
    const productDataBatch: Prisma.ProductCreateManyInput[] = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const index = batch * BATCH_SIZE + i + 1;
      const prefix = pick(PRODUCT_PREFIXES);
      const noun = pick(PRODUCT_NOUNS);
      const brand = pick(brands);
      const category = pick(categories);
      const sku = `MOCK-${String(index).padStart(4, '0')}`;
      const name = `${prefix} ${noun} #${index}`;
      const baseSlug = slugifyStr(`${noun}-mock-${index}`);

      // Distribución de stock realista para testear badges:
      // ~10% sin stock | ~15% stock bajo | ~75% normal
      let stockQuantity: number;
      const r = Math.random();
      if (r < 0.10) {
        stockQuantity = 0;              // Sin stock
      } else if (r < 0.25) {
        stockQuantity = rand(1, 4);    // Stock bajo (≤ stockAlert=5)
      } else {
        stockQuantity = rand(10, 500); // Stock normal
      }

      productDataBatch.push({
        sku,
        name,
        slug: baseSlug,
        description: `${name}. Producto para distribución B2B en grandes volúmenes. Fabricado por ${brand.name}.`,
        brandId: brand.id,
        categoryId: category.id,
        unit: pick(['UN', 'KG', 'LT', 'CJA', 'PAR', 'BOL']),
        inner: pick([1, 6, 12, 24, 48]),
        basePrice: new Prisma.Decimal(rand(500, 150000)),
        stockQuantity,
        minOrderQty: pick([1, 6, 12, 24]),
        stockAlert: 5,
        isActive: true,
        seoTitle: name,
        seoDescription: `Compra ${name} al por mayor. Precios especiales B2B.`,
        specifications: JSON.stringify([
          { name: 'Origen', value: pick(['Chile', 'China', 'USA', 'Alemania', 'Brasil']) },
          { name: 'Garantía', value: pick(['6 meses', '12 meses', 'Sin garantía']) },
          { name: 'Certificación', value: pick(['ISO 9001', 'CE', 'N/A']) },
        ]),
      });
    }

    // Insertar batch de productos
    await prisma.product.createMany({
      data: productDataBatch,
      skipDuplicates: true,
    });

    created += productDataBatch.length;

    // Insertar imagen principal para cada producto del batch
    const insertedProducts = await prisma.product.findMany({
      where: { sku: { in: productDataBatch.map(p => p.sku as string) } },
      select: { id: true, sku: true },
    });

    const imagesData: Prisma.ProductImageCreateManyInput[] = insertedProducts.map(p => ({
      productId: p.id,
      url: pick(IMAGE_POOL),
      position: 0,
      altText: `Imagen ${p.sku}`,
      isPrimary: true,
    }));

    await prisma.productImage.createMany({ data: imagesData, skipDuplicates: true });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const pct = Math.round((created / TOTAL) * 100);
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    process.stdout.write(
      `\r  [${bar}] ${pct}% — ${created}/${TOTAL} productos (${elapsed}s)`
    );
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  // 6. Estadísticas finales
  const [sinStock, stockBajo, stockNormal, totalProducts] = await Promise.all([
    prisma.product.count({ where: { sku: { startsWith: 'MOCK-' }, stockQuantity: 0 } }),
    prisma.product.count({ where: { sku: { startsWith: 'MOCK-' }, stockQuantity: { gt: 0, lte: 5 } } }),
    prisma.product.count({ where: { sku: { startsWith: 'MOCK-' }, stockQuantity: { gt: 5 } } }),
    prisma.product.count(),
  ]);

  console.log('\n\n' + '─'.repeat(55));
  console.log(`✅  Seed completado exitosamente`);
  console.log(`    Tiempo total           : ${totalTime}s`);
  console.log(`    Productos insertados   : ${created}`);
  console.log(`    Total productos en BD  : ${totalProducts}`);
  console.log('─'.repeat(55));
  console.log('\n📊  Distribución de Stock (productos MOCK):');
  console.log(`    🔴 Sin Stock  (= 0)    : ${sinStock} (${Math.round(sinStock/created*100)}%)`);
  console.log(`    🟠 Stock Bajo (1-5)    : ${stockBajo} (${Math.round(stockBajo/created*100)}%)`);
  console.log(`    🟢 Stock Normal (>5)   : ${stockNormal} (${Math.round(stockNormal/created*100)}%)`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('\n❌  Error durante el seed:', e.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
