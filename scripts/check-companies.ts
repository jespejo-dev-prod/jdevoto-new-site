import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    orderBy: { razonSocial: 'asc' },
    select: { id: true, razonSocial: true, rut: true }
  });
  
  console.log('--- COMPANIES LIST ---');
  companies.forEach((c, idx) => {
    console.log(`${idx}: ID: ${c.id}, RUT: ${c.rut}, Razón Social: "${c.razonSocial}"`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
