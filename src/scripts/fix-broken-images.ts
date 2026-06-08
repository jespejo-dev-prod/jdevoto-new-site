/**
 * src/scripts/fix-broken-images.ts
 *
 * Busca la URL de Unsplash que da 404 y la reemplaza por una válida
 * en todos los registros de la base de datos.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  const BROKEN_URL = 'https://images.unsplash.com/photo-1581093196867-ca8b00cf4c02?w=500&auto=format&fit=crop&q=60';
  const WORKING_URL = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';

  console.log('🔍 Buscando imágenes con URL rota...');

  const affected = await prisma.productImage.updateMany({
    where: {
      url: BROKEN_URL
    },
    data: {
      url: WORKING_URL
    }
  });

  console.log(`✅ Se han actualizado ${affected.count} imágenes rotas.`);
  
  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
