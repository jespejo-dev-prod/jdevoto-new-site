import { PrismaClient } from '@prisma/client';

// 1. Configurar conexiones
const LOCAL_DB_URL = "postgresql://root:root@localhost:5432/b2b_ecommerce?schema=public";
const CLOUD_DB_URL = "postgresql://neondb_owner:npg_rcTx7gWqnzC5@ep-red-dawn-ap7qw888.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  console.log('🔌 Conectando a bases de datos...');
  const localPrisma = new PrismaClient({ datasources: { db: { url: LOCAL_DB_URL } } });
  const cloudPrisma = new PrismaClient({ datasources: { db: { url: CLOUD_DB_URL } } });

  try {
    // Verificar conexiones
    await localPrisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión a Base de Datos Local: OK');
    await cloudPrisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión a Base de Datos Neon (Nube): OK');

    // 2. Limpiar base de datos en la nube de datos del catálogo anterior
    console.log('\n🧹 Limpiando catálogo antiguo en la nube...');
    await cloudPrisma.priceListItem.deleteMany({});
    await cloudPrisma.productImage.deleteMany({});
    await cloudPrisma.product.deleteMany({});
    await cloudPrisma.category.deleteMany({});
    await cloudPrisma.brand.deleteMany({});
    console.log('✅ Catálogo limpio en la nube.');

    // 3. Clonar Marcas (Brands)
    console.log('\n🏷️  Clonando Marcas...');
    const localBrands = await localPrisma.brand.findMany();
    console.log(`   Encontradas ${localBrands.length} marcas en local.`);
    if (localBrands.length > 0) {
      await cloudPrisma.brand.createMany({
        data: localBrands,
        skipDuplicates: true
      });
      console.log('   ✅ Marcas clonadas.');
    }

    // 4. Clonar Categorías (Categories)
    console.log('\n🗂️  Clonando Categorías...');
    const localCategories = await localPrisma.category.findMany();
    console.log(`   Encontradas ${localCategories.length} categorías en local.`);
    if (localCategories.length > 0) {
      // Primer pase: Crear las categorías sin el parentId para evitar errores de clave foránea
      const tempCategories = localCategories.map(({ parentId, ...rest }) => rest);
      await cloudPrisma.category.createMany({
        data: tempCategories,
        skipDuplicates: true
      });

      // Segundo pase: Actualizar el parentId
      for (const cat of localCategories) {
        if (cat.parentId) {
          await cloudPrisma.category.update({
            where: { id: cat.id },
            data: { parentId: cat.parentId }
          });
        }
      }
      console.log('   ✅ Categorías clonadas y vinculadas.');
    }

    // 5. Clonar Productos (Products)
    console.log('\n📦  Clonando Productos...');
    const localProducts = await localPrisma.product.findMany();
    console.log(`   Encontrados ${localProducts.length} productos en local.`);
    if (localProducts.length > 0) {
      // Prisma createMany con tipos de Decimal y BigInt
      // Mapeamos los datos para asegurarnos de que se inserten correctamente
      const mappedProducts = localProducts.map(p => ({
        ...p,
        basePrice: p.basePrice,
        stockQuantity: p.stockQuantity,
        specifications: p.specifications as any
      }));

      // Insertamos en lotes de 100 para evitar desbordar memoria o conexiones
      const batchSize = 100;
      for (let i = 0; i < mappedProducts.length; i += batchSize) {
        const batch = mappedProducts.slice(i, i + batchSize);
        await cloudPrisma.product.createMany({
          data: batch,
          skipDuplicates: true
        });
      }
      console.log('   ✅ Productos clonados.');
    }

    // 6. Clonar Imágenes de Productos (ProductImages)
    console.log('\n🖼️  Clonando Imágenes de Productos...');
    const localImages = await localPrisma.productImage.findMany();
    console.log(`   Encontradas ${localImages.length} imágenes de productos en local.`);
    if (localImages.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < localImages.length; i += batchSize) {
        const batch = localImages.slice(i, i + batchSize);
        await cloudPrisma.productImage.createMany({
          data: batch,
          skipDuplicates: true
        });
      }
      console.log('   ✅ Imágenes clonadas.');
    }

    // 7. Clonar Precios Específicos (PriceListItems)
    console.log('\n💵 Clonando Listas de Precios (si existen)...');
    const localPriceItems = await localPrisma.priceListItem.findMany();
    console.log(`   Encontrados ${localPriceItems.length} ítems de lista de precios en local.`);
    if (localPriceItems.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < localPriceItems.length; i += batchSize) {
        const batch = localPriceItems.slice(i, i + batchSize);
        await cloudPrisma.priceListItem.createMany({
          data: batch,
          skipDuplicates: true
        });
      }
      console.log('   ✅ Listas de precios clonadas.');
    }

    console.log('\n🏁 ¡Sincronización de Catálogo Completada con Éxito!');

  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
  } finally {
    await localPrisma.$disconnect();
    await cloudPrisma.$disconnect();
  }
}

main();
