import { prisma } from '../src/lib/client';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Iniciando script de creación de usuarios...');

  // 1. Opcional: Borrar todos los usuarios (y sus refresh tokens)
  // Cuidado: Si hay Orders creadas por estos usuarios, fallará a menos que también borres las orders.
  try {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('✅ Usuarios anteriores borrados.');
  } catch (error) {
    console.log('⚠️ No se pudieron borrar los usuarios, probablemente tienen pedidos asociados.');
  }

  // 2. Necesitamos una empresa para asociar los usuarios (Obligatorio en este sistema)
  let company = await prisma.company.findFirst();
  
  if (!company) {
    company = await prisma.company.create({
      data: {
        rut: '76123456-0',
        razonSocial: 'Empresa de Pruebas',
        pais: 'CL'
      }
    });
    console.log('✅ Empresa de pruebas creada.');
  }

  // 3. Crear contraseña encriptada (Ej: "Password123!")
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 4. Crear Usuario Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.cl',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Sistema',
      role: 'ADMIN',
      companyId: company.id,
      isActive: true,
    }
  });
  console.log(`✅ Usuario Admin creado -> Email: ${admin.email} | Pass: Password123!`);

  // 5. Crear Usuario Normal (Comprador)
  const buyer = await prisma.user.create({
    data: {
      email: 'buyer@test.cl',
      passwordHash,
      firstName: 'Usuario',
      lastName: 'Normal',
      role: 'BUYER',
      companyId: company.id,
      isActive: true,
    }
  });
  console.log(`✅ Usuario Normal creado -> Email: ${buyer.email} | Pass: Password123!`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
