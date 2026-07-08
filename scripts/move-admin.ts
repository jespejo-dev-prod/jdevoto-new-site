import { prisma } from '../src/lib/client';

async function main() {
  console.log('Iniciando movimiento de usuario admin...');

  // 1. Buscar la nueva empresa (Compradores B2B SpA)
  const targetCompany = await prisma.company.findUnique({
    where: { rut: '77777777-7' }
  });

  if (!targetCompany) {
    console.log('❌ No se encontró la empresa Compradores B2B SpA.');
    return;
  }

  // 2. Mover a admin@test.cl a esa empresa
  await prisma.user.update({
    where: { email: 'admin@test.cl' },
    data: { companyId: targetCompany.id }
  });

  console.log('✅ El usuario admin@test.cl ha sido movido a la empresa:', targetCompany.razonSocial);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
