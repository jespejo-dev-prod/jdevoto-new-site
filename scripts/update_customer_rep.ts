import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando actualización de vendedor para GABRIEL GIGLIO NAVARRO...');

  const customerEmail = 'gabriel.giglionavarro@gmail.com';
  const salesRepEmail = 'shernandez@jdevoto.cl';

  // 1. Buscar al cliente en la base de datos
  const customer = await prisma.user.findUnique({
    where: { email: customerEmail },
    include: { company: true }
  });

  if (!customer) {
    console.error(`❌ Cliente no encontrado: ${customerEmail}`);
    process.exit(1);
  }

  if (!customer.companyId) {
    console.error(`❌ El cliente ${customerEmail} no está asociado a ninguna empresa.`);
    process.exit(1);
  }

  console.log(`✅ Cliente encontrado: ${customer.firstName} ${customer.lastName}`);
  console.log(`🏢 Empresa asociada: ${customer.company.razonSocial} (RUT: ${customer.company.rut})`);

  // 2. Buscar al vendedor en la base de datos
  let salesRep = await prisma.user.findFirst({
    where: { email: salesRepEmail }
  });

  // Si el vendedor no existe, lo creamos de forma segura
  if (!salesRep) {
    console.log(`ℹ️ El vendedor ${salesRepEmail} no existe en la base de datos. Creándolo...`);
    
    // Obtener la empresa del staff (Distribuidora JDevoto Staff RUT: 76123456-0)
    let staffCompany = await prisma.company.findUnique({ where: { rut: '76123456-0' } });
    if (!staffCompany) {
      staffCompany = await prisma.company.create({
        data: {
          rut: '76123456-0',
          razonSocial: 'Distribuidora JDevoto Staff',
          pais: 'CL',
          giro: 'Servicios de Administración',
          ciudad: 'VALPARAISO',
          direccion: 'Oficina Central'
        }
      });
      console.log('✅ Empresa de Staff creada (RUT: 76123456-0).');
    }

    const randomPass = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(randomPass, 10);
    const prefix = salesRepEmail.split('@')[0];
    const firstName = prefix.charAt(0).toUpperCase() + prefix.slice(1);

    salesRep = await prisma.user.create({
      data: {
        email: salesRepEmail,
        passwordHash,
        firstName,
        lastName: 'Vendedor',
        role: UserRole.SALES_REP,
        companyId: staffCompany.id,
        isActive: true
      }
    });
    console.log(`✅ Vendedor creado con éxito: ${salesRepEmail}`);
  } else {
    console.log(`✅ Vendedor encontrado: ${salesRep.firstName} ${salesRep.lastName} (${salesRep.email})`);
    
    // Asegurar que tenga el rol de vendedor (SALES_REP)
    if (salesRep.role !== UserRole.SALES_REP) {
      await prisma.user.update({
        where: { id: salesRep.id },
        data: { role: UserRole.SALES_REP }
      });
      console.log(`🔄 Rol de ${salesRepEmail} actualizado a SALES_REP.`);
    }
  }

  // 3. Asignar el vendedor a la empresa del cliente
  const updatedCompany = await prisma.company.update({
    where: { id: customer.companyId },
    data: { salesRepId: salesRep.id },
    include: { salesRep: true }
  });

  console.log(`\n🎉 Operación exitosa:`);
  console.log(`   - Empresa: "${updatedCompany.razonSocial}" (RUT: ${updatedCompany.rut})`);
  console.log(`   - Vendedor asignado: "${updatedCompany.salesRep?.firstName} ${updatedCompany.salesRep?.lastName}" (${updatedCompany.salesRep?.email})`);
}

main()
  .catch(e => {
    console.error('❌ Error ejecutando la actualización:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
