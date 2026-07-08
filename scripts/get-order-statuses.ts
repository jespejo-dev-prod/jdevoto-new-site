process.env.DATABASE_URL = "postgresql://neondb_owner:npg_rcTx7gWqnzC5@ep-red-dawn-ap7qw888.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";
import { prisma } from '../src/lib/client';

async function main() {
  console.log('Querying distinct order statuses from Neon...');
  const res: any[] = await prisma.$queryRaw`
    SELECT DISTINCT status FROM orders
  `;
  console.log('Unique statuses in orders table:', res.map(r => r.status));
}

main().catch(console.error).finally(() => prisma.$disconnect());
