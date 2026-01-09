const XLSX = require('xlsx');
const path = require('path');

const filePath = process.argv[2] || 'plan/samples/presupuestos/Presupuesto Sigma - Comercial 2026.xlsx';
console.log('Analyzing:', filePath);

const wb = XLSX.readFile(filePath);
console.log('\\nSheets:', wb.SheetNames);

wb.SheetNames.forEach(sheetName => {
    console.log(`\\n=== Sheet: ${sheetName} ===`);
    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`Rows: ${data.length}`);
    data.slice(0, 20).forEach((row, i) => {
        if (row && row.length > 0) {
            console.log(`[${i}]:`, JSON.stringify(row.slice(0, 15)));
        }
    });
});
