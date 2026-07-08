import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Iniciando auditoría comparativa de clientes (Excel vs Base de Datos)...');

  // 1. Cargar archivo Excel
  const filePath = path.join(process.cwd(), 'excel_users', 'clientes-woocommerce.xlsx');
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo Excel no encontrado en: ${filePath}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];
  console.log(`📊 Se leyeron ${rows.length} filas del archivo Excel.`);

  // Inspeccionar todas las columnas únicas presentes en el Excel
  const allKeys = new Set<string>();
  rows.forEach(r => Object.keys(r).forEach(k => allKeys.add(k)));
  console.log('🔑 Columnas detectadas en el Excel:', Array.from(allKeys));

  // 2. Cargar todos los usuarios de la base de datos
  const dbUsers = await prisma.user.findMany({
    include: {
      company: {
        include: {
          salesRep: true
        }
      }
    }
  });
  console.log(`🗄️ Se cargaron ${dbUsers.length} usuarios de la base de datos.`);

  // Crear un mapa indexado por email (minúsculas) de la DB
  const dbUserMap = new Map<string, typeof dbUsers[0]>();
  dbUsers.forEach(u => {
    dbUserMap.set(u.email.toLowerCase().trim(), u);
  });

  const missingUsers: any[] = [];
  const matchedUsers: any[] = [];
  const repMismatches: any[] = [];
  const activeStatusMismatches: any[] = [];

  // 3. Comparar
  for (const row of rows) {
    const excelEmail = row['Email'] ? row['Email'].toString().trim().toLowerCase() : '';
    if (!excelEmail) {
      continue;
    }

    const excelName = row['Nombre'] ? row['Nombre'].toString().trim() : '';
    const excelCompany = row['Razón Social'] ? row['Razón Social'].toString().trim() : '';
    const excelRut = row['RUT'] ? row['RUT'].toString().trim() : '';
    const excelRep = row['Vendedor'] ? row['Vendedor'].toString().trim().toLowerCase() : '';
    const excelEstado = row['Estado'] ? row['Estado'].toString().trim().toLowerCase() : '';
    const excelIsActive = excelEstado === 'approved';

    const dbUser = dbUserMap.get(excelEmail);

    if (!dbUser) {
      // Usuario falta por completo en la DB
      missingUsers.push({
        email: excelEmail,
        name: excelName,
        companyName: excelCompany,
        rut: excelRut,
        expectedRep: excelRep || 'Sin asignar',
        expectedState: excelEstado
      });
    } else {
      // El usuario existe en la DB, validamos detalles
      const dbRepEmail = dbUser.company?.salesRep?.email?.toLowerCase() || '';
      const dbRepName = dbUser.company?.salesRep 
        ? `${dbUser.company.salesRep.firstName} ${dbUser.company.salesRep.lastName}`.trim()
        : '';
      const dbCompanyName = dbUser.company?.razonSocial || '';
      const dbRut = dbUser.company?.rut || '';
      const dbIsActive = dbUser.isActive;

      const details = {
        email: excelEmail,
        name: dbUser.firstName + ' ' + dbUser.lastName,
        excelCompany,
        dbCompany: dbCompanyName,
        excelRut,
        dbRut,
        excelRep: excelRep || 'Sin asignar',
        dbRep: dbRepEmail ? `${dbRepName} (${dbRepEmail})` : 'Sin asignar',
        excelIsActive,
        dbIsActive
      };

      matchedUsers.push(details);

      // Chequear vendedor asignado
      if (excelRep !== dbRepEmail) {
        repMismatches.push({
          email: excelEmail,
          name: details.name,
          company: dbCompanyName,
          rut: dbRut,
          excelRep: excelRep || 'Sin asignar',
          dbRep: dbRepEmail || 'Sin asignar'
        });
      }

      // Chequear estado activo/aprobado
      if (excelIsActive !== dbIsActive) {
        activeStatusMismatches.push({
          email: excelEmail,
          name: details.name,
          excelIsActive,
          dbIsActive
        });
      }
    }
  }

  // 4. Generar reporte detallado
  console.log(`\n==================================================`);
  console.log(`📊 RESULTADOS DE LA COMPARACIÓN`);
  console.log(`==================================================`);
  console.log(`Clientes totales en Excel:    ${rows.length}`);
  console.log(`Clientes encontrados en DB:   ${matchedUsers.length}`);
  console.log(`Clientes FALTANTES en DB:     ${missingUsers.length}`);
  console.log(`Vendedores DESCOINCIDENTES:   ${repMismatches.length}`);
  console.log(`Diferencias de Estado Activo: ${activeStatusMismatches.length}`);
  console.log(`==================================================\n`);

  // Escribir reporte completo en Markdown
  const reportPath = path.join(
    'C:', 'Users', 'jespejo', '.gemini', 'antigravity', 'brain', 
    '4c2dde51-4094-4bcf-8993-e07d21eddbb6', 'auditoria_clientes.md'
  );

  let mdContent = `# 📊 Reporte de Auditoría: Comparación de Clientes\n\n`;
  mdContent += `Generado el: ${new Date().toLocaleString()}\n`;
  mdContent += `Origen de datos: \`clientes-woocommerce.xlsx\` vs Base de Datos Postgres (Prisma)\n\n`;

  mdContent += `## 📈 Resumen General\n\n`;
  mdContent += `| Métrica | Cantidad | Descripción |\n`;
  mdContent += `| :--- | :---: | :--- |\n`;
  mdContent += `| **Clientes Totales en Excel** | ${rows.length} | Cantidad de registros cargados desde el archivo WooCommerce |\n`;
  mdContent += `| **Clientes en Base de Datos** | ${matchedUsers.length} | Clientes que ya están registrados y vinculados |\n`;
  mdContent += `| **Clientes FALTANTES** | ${missingUsers.length} | Clientes del sitio anterior que **no se encuentran** en la DB |\n`;
  mdContent += `| **Diferencias de Vendedor** | ${repMismatches.length} | Clientes cuyo vendedor asignado en la DB no coincide con el Excel |\n`;
  mdContent += `| **Diferencias de Estado** | ${activeStatusMismatches.length} | Clientes cuyo estado de aprobación difiere entre Excel y DB |\n\n`;

  if (missingUsers.length > 0) {
    mdContent += `## ❌ Clientes Faltantes en la Base de Datos (${missingUsers.length})\n\n`;
    mdContent += `Estos clientes existen en el Excel de WooCommerce pero no tienen una cuenta en la base de datos actual:\n\n`;
    mdContent += `| Razón Social | RUT | Nombre | Email | Vendedor Esperado | Estado |\n`;
    mdContent += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    missingUsers.slice(0, 150).forEach(u => {
      mdContent += `| ${u.companyName || '—'} | ${u.rut || '—'} | ${u.name || '—'} | ${u.email} | ${u.expectedRep} | ${u.expectedState} |\n`;
    });
    if (missingUsers.length > 150) {
      mdContent += `\n*(Mostrando los primeros 150 registros. Total faltantes: ${missingUsers.length})*\n`;
    }
    mdContent += `\n`;
  } else {
    mdContent += `## ❌ Clientes Faltantes en la Base de Datos\n\n¡Todos los clientes del Excel están presentes en la base de datos! 🎉\n\n`;
  }

  if (repMismatches.length > 0) {
    mdContent += `## ⚠️ Diferencias de Vendedor Asignado (${repMismatches.length})\n\n`;
    mdContent += `Clientes existentes cuyas asignaciones de vendedor no coinciden con el Excel original:\n\n`;
    mdContent += `| Cliente / Razón Social | RUT | Email | Vendedor en Excel | Vendedor en DB |\n`;
    mdContent += `| :--- | :--- | :--- | :--- | :--- |\n`;
    repMismatches.slice(0, 150).forEach(m => {
      mdContent += `| ${m.name} (${m.company}) | ${m.rut} | ${m.email} | **${m.excelRep}** | **${m.dbRep}** |\n`;
    });
    if (repMismatches.length > 150) {
      mdContent += `\n*(Mostrando los primeros 150 registros. Total desajustes: ${repMismatches.length})*\n`;
    }
    mdContent += `\n`;
  } else {
    mdContent += `## ⚠️ Diferencias de Vendedor Asignado\n\n¡Todas las asignaciones de vendedor coinciden perfectamente!  🎉\n\n`;
  }

  if (activeStatusMismatches.length > 0) {
    mdContent += `## 🔒 Diferencias de Estado de Cuenta (${activeStatusMismatches.length})\n\n`;
    mdContent += `| Nombre | Email | Aprobado en Excel | Activo en DB |\n`;
    mdContent += `| :--- | :--- | :---: | :---: |\n`;
    activeStatusMismatches.slice(0, 150).forEach(s => {
      mdContent += `| ${s.name} | ${s.email} | ${s.excelIsActive ? '✅ SÍ' : '❌ NO'} | ${s.dbIsActive ? '✅ SÍ' : '❌ NO'} |\n`;
    });
    if (activeStatusMismatches.length > 150) {
      mdContent += `\n*(Mostrando primeros 150 de ${activeStatusMismatches.length})*\n`;
    }
  }

  fs.writeFileSync(reportPath, mdContent, 'utf8');
  console.log(`📝 Reporte detallado escrito en: ${reportPath}`);
}

main()
  .catch(e => console.error('💥 Error en auditoría:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
