import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const top = await prisma.order.groupBy({
    by: ['companyId'],
    _sum: { totalGross: true },
    _count: { _all: true },
    orderBy: { _sum: { totalGross: 'desc' } },
    take: 5
  });
  console.log(top);
  const ids = top.map(t => t.companyId);
  const companies = await prisma.company.findMany({ where: { id: { in: ids } } });
  console.log(companies.map(c => ({ id: c.id, name: c.razonSocial })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
