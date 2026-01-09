// Script to analyze reconciliation file structure
import 'dotenv/config';
import * as XLSX from 'xlsx';

const filePath = process.argv[2] || 'plan/samples/conciliacion/Conciliación Sigma 2025.xlsx';

console.log('Analyzing:', filePath);
const workbook = XLSX.readFile(filePath);

console.log('\n=== SHEETS ===');
console.log(workbook.SheetNames);

for (const sheetName of workbook.SheetNames) {
    console.log(`\n=== SHEET: ${sheetName} ===`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

    if (data.length > 0) {
        console.log('Headers (Row 1):', data[0]);
        if (data[1]) console.log('Row 2:', data[1]);
        if (data[2]) console.log('Row 3:', data[2]);
        console.log('Total rows:', data.length);
    } else {
        console.log('Empty sheet');
    }
}
