import * as XLSX from 'xlsx';
import * as path from 'path';

async function main() {
  console.log('Generando archivo Excel de prueba...');

  const data = [
    {
      SKU: 'FER-001',
      Nombre: 'Tornillo Cabeza Plana 1"',
      Descripcion: 'Tornillos autoroscantes galvanizados de excelente resistencia y durabilidad.',
      'Precio Base': 1500,
      Stock: 100,
      'Alerta Stock': 10,
      Inner: 12,
      Unidad: 'UN',
      Categoria: 'Ferretería',
      Marca: 'Bosch',
    },
    {
      SKU: 'FER-002',
      Nombre: 'Taladro Percutor 12V',
      Descripcion: 'Taladro percutor inalámbrico con batería de litio de alto rendimiento.',
      'Precio Base': 45000,
      Stock: 15,
      'Alerta Stock': 3,
      Inner: 1,
      Unidad: 'UN',
      Categoria: 'Ferretería',
      Marca: 'Bosch',
    },
    {
      SKU: 'ASE-001',
      Nombre: 'Cloro Gel Tradicional 1L',
      Descripcion: 'Limpiador desinfectante concentrado para superficies y baños.',
      'Precio Base': 1200,
      Stock: 200,
      'Alerta Stock': 15,
      Inner: 6,
      Unidad: 'UN',
      Categoria: 'Aseo',
      Marca: 'Unilever',
    },
    {
      SKU: 'ASE-002',
      Nombre: 'Detergente Líquido Omo 3L',
      Descripcion: 'Detergente líquido concentrado para remoción profunda de manchas en ropa.',
      'Precio Base': 8500,
      Stock: 50,
      'Alerta Stock': 5,
      Inner: 4,
      Unidad: 'UN',
      Categoria: 'Aseo',
      Marca: 'Unilever',
    },
    {
      SKU: 'OFI-001',
      Nombre: 'Papel A4 Report 75g',
      Descripcion: 'Resma de papel A4 multipropósito ideal para impresiones de oficina.',
      'Precio Base': 3800,
      Stock: 150,
      'Alerta Stock': 20,
      Inner: 5,
      Unidad: 'UN',
      Categoria: 'Oficina',
      Marca: '3M',
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

  // Guardar en la raíz del proyecto
  const filePath = path.join(process.cwd(), 'test-products.xlsx');
  XLSX.writeFile(workbook, filePath);

  console.log(`✓ Archivo Excel de prueba creado exitosamente en: ${filePath}`);
}

main().catch(err => {
  console.error('Error al generar el Excel de prueba:', err);
});
