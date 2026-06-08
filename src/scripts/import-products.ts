/**
 * src/scripts/import-products.ts
 *
 * Lee un archivo de Excel (.xlsx), elimina por completo los pedidos y productos de prueba actuales,
 * e importa los nuevos productos definidos en el archivo.
 *
 * Convenciones:
 * - Si la categoría o marca especificada en el Excel no existe, se creará automáticamente.
 * - Todos los productos anteriores y sus dependencias (pedidos, ítems, imágenes) se borran
 *   para evitar problemas de integridad referencial.
 *
 * Uso:
 *   npx tsx src/scripts/import-products.ts <ruta-archivo-excel>
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

// ─── Helpers de formateo y strings ────────────────────────────────────────────

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

const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=60',
];

interface ExcelRow {
  SKU?: string | number;
  Nombre?: string;
  Descripcion?: string;
  'Precio Base'?: number | string;
  Stock?: number | string;
  'Alerta Stock'?: number | string;
  'Cant Minima Pedido'?: number | string;
  Inner?: number | string;
  Unidad?: string;
  Categoria?: string;
  Marca?: string;
}

// ─── Función Principal ────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('\n❌ Error: Debes especificar la ruta del archivo Excel.');
    console.error('Uso: npx tsx src/scripts/import-products.ts <ruta-archivo.xlsx>\n');
    process.exit(1);
  }

  const excelPath = path.resolve(args[0]);
  if (!fs.existsSync(excelPath)) {
    console.error(`\n❌ Error: El archivo especificado no existe en la ruta: ${excelPath}\n`);
    process.exit(1);
  }

  console.log(`\n📖 Leyendo archivo Excel: ${path.basename(excelPath)}...`);

  // 1. Cargar y leer el archivo Excel
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

  if (rows.length === 0) {
    console.error('❌ Error: El archivo Excel está vacío o no tiene el formato correcto.');
    process.exit(1);
  }

  console.log(`✓ Se encontraron ${rows.length} registros en la hoja "${sheetName}"`);

  // 2. Conectarse y verificar la base de datos
  await prisma.$queryRaw`SELECT 1`;
  console.log('✓ Conexión establecida con PostgreSQL');

  // 3. Ejecutar Limpieza y Carga de forma atómica en una transacción
  console.log('\n🧹 Iniciando limpieza completa de datos de prueba...');

  await prisma.$transaction(async (tx) => {
    // A. Eliminar Mensajes de Órdenes
    const deletedMessages = await tx.orderMessage.deleteMany();
    if (deletedMessages.count > 0) {
      console.log(`   - ${deletedMessages.count} mensajes de órdenes eliminados.`);
    }

    // B. Eliminar Ítems de Órdenes
    const deletedOrderItems = await tx.orderItem.deleteMany();
    if (deletedOrderItems.count > 0) {
      console.log(`   - ${deletedOrderItems.count} ítems de pedidos eliminados.`);
    }

    // C. Eliminar Pedidos (Orders)
    const deletedOrders = await tx.order.deleteMany();
    if (deletedOrders.count > 0) {
      console.log(`   - ${deletedOrders.count} pedidos eliminados.`);
    }

    // D. Eliminar Ítems de Listas de Precios
    const deletedPriceListItems = await tx.priceListItem.deleteMany();
    if (deletedPriceListItems.count > 0) {
      console.log(`   - ${deletedPriceListItems.count} ítems de listas de precios eliminados.`);
    }

    // E. Eliminar Imágenes de Productos
    const deletedImages = await tx.productImage.deleteMany();
    if (deletedImages.count > 0) {
      console.log(`   - ${deletedImages.count} imágenes de productos eliminadas.`);
    }

    // F. Eliminar Productos
    const deletedProducts = await tx.product.deleteMany();
    console.log(`   - ${deletedProducts.count} productos de prueba eliminados.`);
    console.log('✓ Limpieza completada exitosamente.');

    // 4. Importar nuevos registros
    console.log('\n📥 Procesando e importando nuevos productos...');
    let importedCount = 0;

    for (const row of rows) {
      const sku = String(row.SKU || '').trim();
      const name = String(row.Nombre || '').trim();

      if (!sku || !name) {
        console.warn(`⚠️ Fila omitida debido a SKU o Nombre faltante: SKU='${sku}', Nombre='${name}'`);
        continue;
      }

      const basePriceVal = parseFloat(String(row['Precio Base'] || '0'));
      const stockQuantityVal = parseInt(String(row.Stock || '0'), 10);
      const stockAlertVal = parseInt(String(row['Alerta Stock'] || '5'), 10);
      const innerVal = parseInt(String(row.Inner || '1'), 10);
      const minOrderQtyVal = innerVal; // Mapea Pedido Mínimo a unidades Inner de forma directa
      const unit = String(row.Unidad || 'UN').trim();
      const description = row.Descripcion ? String(row.Descripcion).trim() : `${name}. Importado mediante carga masiva.`;

      // Resolver o crear categoría
      let categoryId: string | null = null;
      if (row.Categoria) {
        const catName = String(row.Categoria).trim();
        const catSlug = slugifyStr(catName);

        const category = await tx.category.upsert({
          where: { slug: catSlug },
          update: {},
          create: {
            name: catName,
            slug: catSlug,
            description: `Categoría importada: ${catName}`
          },
          select: { id: true }
        });
        categoryId = category.id;
      }

      // Resolver o crear marca
      let brandId: string | null = null;
      if (row.Marca) {
        const brandName = String(row.Marca).trim();
        const brandSlug = slugifyStr(brandName);

        const brand = await tx.brand.upsert({
          where: { slug: brandSlug },
          update: {},
          create: {
            name: brandName,
            slug: brandSlug,
            description: `Marca importada: ${brandName}`
          },
          select: { id: true }
        });
        brandId = brand.id;
      }

      // Generar slug para el producto
      const productSlug = slugifyStr(`${name}-${sku}`);

      // Crear producto
      const product = await tx.product.create({
        data: {
          sku,
          name,
          slug: productSlug,
          description,
          basePrice: new Prisma.Decimal(basePriceVal),
          stockQuantity: BigInt(stockQuantityVal),
          stockAlert: stockAlertVal,
          minOrderQty: minOrderQtyVal,
          inner: innerVal,
          unit,
          isActive: true,
          categoryId,
          brandId,
          seoTitle: name,
          seoDescription: `Compra ${name} al por mayor. Distribución B2B.`,
          images: {
            create: {
              url: IMAGE_POOL[importedCount % IMAGE_POOL.length],
              position: 0,
              altText: `Imagen de ${name}`,
              isPrimary: true
            }
          }
        }
      });

      importedCount++;
      console.log(`   [${importedCount}/${rows.length}] Producto importado: SKU=${sku} - ${name}`);
    }

    console.log(`\n🎉 Transacción completada con éxito. Se importaron ${importedCount} productos.`);
  });
}

main()
  .catch((e) => {
    console.error('\n❌ Error durante el proceso de importación:', e.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
