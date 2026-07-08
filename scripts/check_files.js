const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const csvPath = path.join(__dirname, '..', 'excel_users', 'clientes-woocommerce.csv');
const xlsxPath = path.join(__dirname, '..', 'excel_users', 'clientes-woocommerce.xlsx');

console.log('--- CSV/HTML Check ---');
try {
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  console.log('CSV size:', csvContent.length);
  console.log('CSV first 500 chars:', csvContent.substring(0, 500));
} catch (e) {
  console.error('CSV error:', e.message);
}

console.log('\n--- XLSX Check ---');
try {
  const workbook = xlsx.readFile(xlsxPath);
  const sheetNames = workbook.SheetNames;
  console.log('Sheet Names:', sheetNames);
  if (sheetNames.length > 0) {
    const sheet = workbook.Sheets[sheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log('Rows count:', data.length);
    if (data.length > 0) {
      console.log('First row keys:', Object.keys(data[0]));
      console.log('First 2 rows:', JSON.stringify(data.slice(0, 2)));
    }
  }
} catch (e) {
  console.error('XLSX error:', e.message);
}
