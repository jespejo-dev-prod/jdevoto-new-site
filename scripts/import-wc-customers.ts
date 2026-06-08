import { prisma } from '../src/lib/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import * as XLSX from 'xlsx';
import * as path from 'path';

// Helper para limpiar y formatear el RUT chileno (ej. "77.156.770-3" -> "77156770-3")
function cleanRut(rutStr: string): string {
  if (!rutStr) return '';
  let cleaned = rutStr.toString().replace(/\./g, '').replace(/\s+/g, '').replace(/-/g, '').trim();
  if (cleaned.length < 2) return '';
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1).toUpperCase();
  return `${body}-${dv}`;
}

// Generador de RUTs temporales válidos Modulo 11
function generateValidRut(index: number): string {
  const num = 77000000 + index;
  let sum = 0;
  let multiplier = 2;
  const s = num.toString();
  for (let i = s.length - 1; i >= 0; i--) {
    sum += parseInt(s[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  let dv = "";
  if (remainder === 11) dv = "0";
  else if (remainder === 10) dv = "K";
  else dv = remainder.toString();
  return `${num}-${dv}`;
}

async function main() {
  console.log('🚀 Iniciando script de migración de clientes desde Excel...');

  const filePath = path.join(process.cwd(), 'excel_users', 'clientes-woocommerce.xlsx');
  console.log('📂 Leyendo archivo:', filePath);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];
  console.log(`📊 Se encontraron ${rows.length} registros en el archivo.`);

  // 1. Obtener o crear una empresa del sistema/staff (Obligatoria para asociar a los administradores y vendedores)
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

  // 2. Cargar vendedores existentes o crearlos si no existen
  const sellerMap = new Map<string, string>();
  const dbSellers = await prisma.user.findMany({
    where: { role: 'SALES_REP' },
    select: { id: true, email: true }
  });
  for (const s of dbSellers) {
    sellerMap.set(s.email.toLowerCase(), s.id);
  }

  // Extraer todos los correos de vendedores únicos del Excel
  const uniqueSellerEmails = new Set<string>();
  rows.forEach(row => {
    const seller = row['Vendedor'];
    if (seller && seller.toString().trim() !== '') {
      uniqueSellerEmails.add(seller.toString().trim().toLowerCase());
    }
  });

  console.log(`👤 Detectados ${uniqueSellerEmails.size} vendedores únicos en el archivo.`);

  for (const email of uniqueSellerEmails) {
    if (!sellerMap.has(email)) {
      // Crear vendedor con contraseña aleatoria (para que deban recuperarla)
      const randomPass = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPass, 10);
      const prefix = email.split('@')[0];
      const firstName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      
      const newSeller = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName: 'Vendedor',
          role: 'SALES_REP',
          companyId: staffCompany.id,
          isActive: true
        }
      });
      sellerMap.set(email, newSeller.id);
      console.log(`✅ Vendedor creado: ${email}`);
    }
  }

  // 3. Cargar mapa de empresas en memoria por su RUT para evitar duplicados
  const processedRuts = new Map<string, string>();
  const dbCompanies = await prisma.company.findMany({ select: { id: true, rut: true } });
  for (const c of dbCompanies) {
    processedRuts.set(c.rut, c.id);
  }

  let successCount = 0;
  let skippedCount = 0;
  let dummyRutIndex = 1;

  // 4. Procesar clientes
  for (const row of rows) {
    const email = row['Email'] ? row['Email'].toString().trim().toLowerCase() : '';
    if (!email) {
      console.log('⚠️ Fila omitida: Correo electrónico vacío.');
      skippedCount++;
      continue;
    }

    // Verificar si el usuario ya existe en el sistema
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log(`ℹ️ Usuario omitido (ya existe): ${email}`);
      skippedCount++;
      continue;
    }

    // Limpiar y validar RUT
    let rut = cleanRut(row['RUT'] ? row['RUT'].toString() : '');
    if (!rut) {
      // Generar RUT temporal válido si no viene en el archivo
      rut = generateValidRut(dummyRutIndex++);
    }

    // Obtener o crear Empresa
    let companyId = processedRuts.get(rut);
    if (!companyId) {
      const razonSocial = row['Razón Social'] ? row['Razón Social'].toString().trim() : (row['Nombre'] ? row['Nombre'].toString().trim() : `Empresa Importada ${rut}`);
      const giro = row['Giro'] ? row['Giro'].toString().trim() : 'Comercio B2B';
      const defaultDiscount = row['Descuento'] ? parseFloat(row['Descuento'].toString()) : 0;
      const ciudad = row['Ciudad'] ? row['Ciudad'].toString().trim() : null;
      const direccion = row['Dirección'] ? row['Dirección'].toString().trim() : null;
      const telefono = row['Teléfono'] ? row['Teléfono'].toString().trim() : null;
      
      const sellerEmail = row['Vendedor'] ? row['Vendedor'].toString().trim().toLowerCase() : '';
      const salesRepId = sellerEmail ? sellerMap.get(sellerEmail) : null;

      const newCompany = await prisma.company.create({
        data: {
          rut,
          razonSocial,
          giro,
          defaultDiscount,
          ciudad,
          direccion,
          telefono,
          email,
          salesRepId,
          pais: 'CL'
        }
      });
      companyId = newCompany.id;
      processedRuts.set(rut, companyId);
      console.log(`🏢 Empresa creada: ${razonSocial} (RUT: ${rut})`);
    }

    // Procesar campos del usuario
    const nameStr = row['Nombre'] ? row['Nombre'].toString().trim() : '';
    let firstName = '';
    let lastName = '';
    if (nameStr) {
      const parts = nameStr.split(/\s+/);
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || '-';
    } else {
      firstName = email.split('@')[0];
      lastName = '-';
    }

    const telefono = row['Teléfono'] ? row['Teléfono'].toString().trim() : null;
    const estado = row['Estado'] ? row['Estado'].toString().trim().toLowerCase() : '';
    const isActive = estado === 'approved';

    // Generar contraseña aleatoria e indescifrable (fuerza a usar /forgot-password)
    const randomUserPass = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(randomUserPass, 10);

    // Crear Usuario
    await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone: telefono,
        passwordHash,
        role: 'BUYER',
        companyId,
        isActive
      }
    });

    successCount++;
  }

  console.log('\n🏁 Migración Finalizada.');
  console.log(`✅ Usuarios migrados con éxito: ${successCount}`);
  console.log(`ℹ️ Registros omitidos (vacíos o ya existentes): ${skippedCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error crítico en la ejecución del script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
