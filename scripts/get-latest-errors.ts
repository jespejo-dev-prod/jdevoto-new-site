process.env.DATABASE_URL = "postgresql://neondb_owner:npg_rcTx7gWqnzC5@ep-red-dawn-ap7qw888.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";
import { prisma } from '../src/lib/client';

async function main() {
  console.log('Querying SystemErrorLog...');
  const logs = await prisma.systemErrorLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log(`Total logs in DB: ${logs.length}`);
  logs.forEach((log, index) => {
    console.log(`\n--- Log #${index + 1} ---`);
    console.log(`ID: ${log.id}`);
    console.log(`Path: ${log.path}`);
    console.log(`Method: ${log.method}`);
    console.log(`Error Name: ${log.errorName}`);
    console.log(`Message: ${log.message}`);
    console.log(`Created At: ${log.createdAt}`);
    console.log(`Stack Trace:\n${log.stack?.substring(0, 400)}...\n`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
