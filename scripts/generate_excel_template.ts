import * as XLSX from 'xlsx';
import * as path from 'path';

async function main() {
  const data = [
    ['SKU', 'Cantidad'],
    ['2950002', 500],
    ['2950008', 200],
    ['2950012', 50]
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Compra Rápida');

  const destPath = path.join(process.cwd(), 'public', 'templates', 'modelo_compra_rapida.xlsx');
  XLSX.writeFile(workbook, destPath);

  console.log('✅ Plantilla de Excel creada exitosamente en:', destPath);
}

main().catch(console.error);
