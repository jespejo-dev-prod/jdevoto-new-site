import { PrismaClient } from '@prisma/client';

// Este script crea la extensión pg_trgm y los índices GIN
// para acelerar la búsqueda de productos en PostgreSQL.
// Se puede ejecutar localmente o contra producción configurando DATABASE_URL.
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ Error: DATABASE_URL no está definida en las variables de entorno.");
    process.exit(1);
  }

  console.log("Conectando a la base de datos...");
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
  });

  try {
    console.log("Creando extensión pg_trgm (si no existe)...");
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm');

    console.log("Creando índice products_name_trgm_idx...");
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING gin (name gin_trgm_ops)');

    console.log("Creando índice products_sku_trgm_idx...");
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS products_sku_trgm_idx ON products USING gin (sku gin_trgm_ops)');

    console.log("✔ Índices GIN creados con éxito.");
  } catch (error) {
    console.error("❌ Error aplicando índices:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
