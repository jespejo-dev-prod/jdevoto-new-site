import { prisma } from '../src/lib/client';

async function main() {
  const promotions = await prisma.promotion.findMany({
    include: {
      category: true,
      brand: true,
    }
  });
  console.log('--- PROMOTIONS ---');
  console.dir(promotions, { depth: null });
  
  const activePromos = promotions.filter(p => p.isActive);
  console.log(`\nActive promotions count: ${activePromos.length}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
