import { prisma } from '../src/lib/client';

async function main() {
  const now = new Date();
  const promos = await prisma.promotion.findMany();
  console.log("All promotions in DB:");
  promos.forEach(p => {
    console.log({
      id: p.id,
      name: p.name,
      isActive: p.isActive,
      validFrom: p.validFrom,
      validTo: p.validTo,
      now: now,
      isExpiredDbQuery: p.validTo ? p.validTo < now : false,
      isExpiredInMemory: p.validTo ? new Date(p.validTo).getTime() < now.getTime() : false,
    });
  });
}

main().catch(console.error);
