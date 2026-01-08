const xlsx = require('xlsx');

const wb = xlsx.readFile('plan/samples/resultados/EF wepark 11.25.xls');

// Extract concepts from "Desglose de Ingresos y costos m"
console.log('=== CONCEPTOS EN "Desglose de Ingresos y costos m" ===\n');
const ws1 = wb.Sheets['Desglose de Ingresos y costos m'];
const data1 = xlsx.utils.sheet_to_json(ws1, { header: 1 });

console.log('INGRESOS:');
let inCosts = false;
data1.forEach((row, i) => {
    if (row[0] === 'Costos') {
        inCosts = true;
        console.log('\nCOSTOS:');
        return;
    }
    if (row[0] === 'Total de ingresos' || row[0] === 'Total de costos') return;
    if (i >= 7 && row[0] && typeof row[0] === 'string' && !row[0].includes('Wepark') && !row[0].includes('Desglose')) {
        console.log(`  - ${row[0]}`);
    }
});

// Extract concepts from "Gastos administrativos"
console.log('\n\n=== CONCEPTOS EN "Gastos administrativos" ===\n');
const ws2 = wb.Sheets['Gastos administrativos'];
const data2 = xlsx.utils.sheet_to_json(ws2, { header: 1 });

data2.forEach((row, i) => {
    if (i >= 6 && row[0] && typeof row[0] === 'string' &&
        !row[0].includes('Wepark') &&
        !row[0].includes('Desglose') &&
        !row[0].includes('Total') &&
        !row[0].includes('Concepto')) {
        console.log(`  - ${row[0]}`);
    }
});

// Extract projects from header row
console.log('\n\n=== PROYECTOS (columnas de Desglose) ===\n');
const headerRow = data1[5]; // Row 6 (0-indexed = 5)
if (headerRow) {
    headerRow.slice(1).forEach((proj, i) => {
        if (proj) console.log(`  ${i + 1}. ${proj}`);
    });
}
