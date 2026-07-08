import { prisma } from '../src/lib/client';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Iniciando script de creación de COMPANY_ADMIN...');

  // 1. Buscar la empresa (Compradores B2B SpA)
  const targetCompany = await prisma.company.findUnique({
    where: { rut: '77777777-7' }
  });

  if (!targetCompany) {
    console.log('❌ No se encontró la empresa Compradores B2B SpA.');
    return;
  }

  // 2. Crear contraseña encriptada (Ej: "Password123!")
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 3. Crear Usuario COMPANY_ADMIN
  const companyAdmin = await prisma.user.upsert({
    where: { email: 'companyadmin@test.cl' },
    update: {
      passwordHash,
      role: 'COMPANY_ADMIN',
      companyId: targetCompany.id
    },
    create: {
      email: 'companyadmin@test.cl',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Empresa',
      role: 'COMPANY_ADMIN',
      companyId: targetCompany.id,
      isActive: true,
    }
  });

  console.log(`✅ Usuario COMPANY_ADMIN creado/actualizado -> Email: ${companyAdmin.email} | Pass: Password123!`);
  console.log(`Pertenece a la empresa: ${targetCompany.razonSocial}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
