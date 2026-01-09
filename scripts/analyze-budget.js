const XLSX = require('xlsx');
const path = require('path');

const filePath = process.argv[2] || 'plan/samples/presupuestos/Presupuesto Sigma - Comercial 2026.xlsx';
console.log('Analyzing:', filePath);

const wb = XLSX.readFile(filePath);
console.log('\nSheets:', wb.SheetNames);

wb.SheetNames.forEach(sheetName => {
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`Rows: ${data.length}`);

    // Find rows with actual data
    let rowsWithData = 0;
    for (let i = 0; i < Math.min(data.length, 50); i++) {
        const row = data[i];
        if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
            rowsWithData++;
            if (rowsWithData <= 15) {
                console.log(`[${i}]:`, JSON.stringify(row.slice(0, 6)));
            }
        }
    }
    console.log(`Total rows with data (first 50): ${rowsWithData}`);
});
