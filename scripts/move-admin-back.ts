import { prisma } from '../src/lib/client';

async function main() {
  console.log('Restaurando al Administrador a su empresa original...');

  // 1. Buscar la empresa original ("Empresa de Pruebas" que se creó inicialmente)
  // Si no existe, la creamos como empresa raíz del sistema.
  let rootCompany = await prisma.company.findFirst({
    where: { rut: '76123456-0' }
  });

  if (!rootCompany) {
    rootCompany = await prisma.company.create({
      data: {
        rut: '76123456-0',
        razonSocial: 'Antigravity B2B (System Admin)',
        isActive: true,
      }
    });
  }

  // 2. Mover a admin@test.cl a esa empresa
  await prisma.user.update({
    where: { email: 'admin@test.cl' },
    data: { companyId: rootCompany.id }
  });

  console.log('✅ El usuario admin@test.cl ha sido movido a:', rootCompany.razonSocial);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
