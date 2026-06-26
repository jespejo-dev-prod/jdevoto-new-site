/**
 * lib/client.ts
 *
 * Singleton del cliente Prisma — la única conexión a PostgreSQL.
 *
 * ¿Por qué Singleton?
 * En desarrollo, Next.js recarga módulos constantemente (HMR).
 * Sin este patrón, cada recarga crearía una nueva instancia de PrismaClient,
 * agotando el pool de conexiones de PostgreSQL en segundos.
 *
 * Solución: guardar la instancia en `globalThis` para reutilizarla entre
 * recargas. En producción, el módulo se carga solo una vez, por lo que
 * el patrón no es necesario — pero tampoco hace daño.
 *
 * Adaptador pg:
 * Se usa @prisma/adapter-pg para conectar Prisma 7 con el driver nativo
 * de PostgreSQL (pg). Esto permite usar connection pooling a nivel de pg.Pool.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

/**
 * prismaClientSingleton
 *
 * Crea una nueva instancia de PrismaClient con el adaptador pg.
 * Solo se llama si no existe ya una instancia en globalThis.
 */
const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;

  // ── Pool de conexiones pg ──────────────────────────────────────────────────
  //
  // Regla general: max = (número de CPU del servidor DB * 2) + disco activos
  // Para un servidor típico con 2-4 vCPU → 10 conexiones es un punto de partida.
  //
  // En dev: 5 evita agotar el Postgres local con HMR de Next.js.
  // En prod: 10 permite mayor concurrencia de SSR requests simultáneos.
  //
  // Si usas PgBouncer o Supabase Pooler en producción, baja max a 2-3
  // porque el pooler ya gestiona las conexiones reales a Postgres.
  const isProd = process.env.NODE_ENV === 'production';

  const pool = new pg.Pool({
    connectionString,
    max: isProd ? 10 : 5,            // conexiones máximas al pool
    idleTimeoutMillis: 30_000,       // cerrar conexiones idle tras 30s
    connectionTimeoutMillis: 5_000,  // error si no hay conexión libre en 5s
  });

  const adapter = new PrismaPg(pool);

  // @ts-ignore - Ignore type error with Prisma's adapter option during TypeScript check
  return new PrismaClient({ adapter });
};

/**
 * globalForPrisma
 *
 * Tipado de globalThis para que TypeScript sepa que puede tener `prisma`.
 * globalThis persiste entre recargas de módulos en desarrollo (HMR).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * prisma — Instancia singleton exportada.
 *
 * - Primera vez: llama prismaClientSingleton() y la guarda en globalThis
 * - Recargas siguientes: reutiliza la instancia ya guardada en globalThis
 */
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Solo en desarrollo: persistir en globalThis para sobrevivir HMR
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}