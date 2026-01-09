// Script to simulate the full multi-month import flow
import 'dotenv/config';
import * as fs from 'fs';
import { findMonthlySheets, parseResultsSheet } from '../src/lib/excel/results-parser';

const filePath = 'plan/samples/resultados/Acumulado de Resultados 2025 SG.xlsx';

async function simulateImport() {
    console.log('=== Simulating Full Multi-Month Import Flow ===\n');

    // Read file as buffer (like browser FileReader would)
    const fileData = fs.readFileSync(filePath);
    const buffer = fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength);

    // Get valid sheet names (like from DB)
    const validSheetNames = [
        'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
        'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
    ];

    // Step 1: Find monthly sheets
    console.log('Step 1: Finding monthly sheets...');
    const monthlySheets = findMonthlySheets(buffer as ArrayBuffer, validSheetNames);
    console.log('  Found:', monthlySheets.length, 'sheets');
    console.log('  ', monthlySheets.map(s => `${s.sheetName}→${s.month}`).join(', '));

    // Step 2: Simulate the import loop
    console.log('\nStep 2: Processing each sheet...');
    let totalValues = 0;

    for (const sheet of monthlySheets) {
        console.log(`\n  [${sheet.month}] Processing "${sheet.sheetName}"...`);

        try {
            const sheetData = parseResultsSheet(buffer as ArrayBuffer, sheet.sheetName, undefined, validSheetNames);

            if (!sheetData.success) {
                console.log(`    FAILED: ${sheetData.warnings.map(w => w.message).join(', ')}`);
                continue;
            }

            // Filter entries like the real code does
            const entries = sheetData.values.filter(v => v.value !== 0);
            console.log(`    Parsed: ${sheetData.values.length} values, ${entries.length} non-zero`);

            totalValues += entries.length;

            // Would call confirmResultsImport here...
            console.log(`    Would import ${entries.length} entries for month ${sheet.month}`);

        } catch (error: any) {
            console.log(`    ERROR: ${error.message}`);
        }
    }

    console.log(`\n=== TOTAL: ${totalValues} entries across all months ===`);
}

simulateImport().catch(console.error);
