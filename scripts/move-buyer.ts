import { prisma } from '../src/lib/client';

async function main() {
  console.log('Iniciando asignación de usuario a nueva empresa...');

  // 1. Crear una nueva empresa
  const newCompany = await prisma.company.create({
    data: {
      rut: '77777777-7',
      razonSocial: 'Compradores B2B SpA',
      pais: 'CL',
      creditLimit: 500000, // Le damos algo de crédito para pruebas
    }
  });
  console.log('✅ Nueva empresa creada:', newCompany.razonSocial);

  // 2. Buscar al usuario buyer@test.cl
  const buyerUser = await prisma.user.findUnique({
    where: { email: 'buyer@test.cl' }
  });

  if (!buyerUser) {
    console.log('❌ El usuario buyer@test.cl no fue encontrado.');
    return;
  }

  // 3. Asignarlo a la nueva empresa
  await prisma.user.update({
    where: { email: 'buyer@test.cl' },
    data: {
      companyId: newCompany.id
    }
  });

  console.log('✅ El usuario buyer@test.cl ahora pertenece a "Compradores B2B SpA".');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
