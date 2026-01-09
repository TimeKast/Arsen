import * as XLSX from 'xlsx';

export interface ParsedBudgetEntry {
    areaName: string;
    projectName: string | null;
    conceptCode: string;      // e.g., "A01 Seguridad"
    description: string | null;
    amounts: number[];        // 12 months (Jan-Dec)
}

export interface ParsedBudget {
    success: boolean;
    sheetName: string;
    areaName: string;
    entries: ParsedBudgetEntry[];
    year: number;
    warnings: string[];
}

// Parse a single budget sheet
function parseSheet(sheet: XLSX.WorkSheet, sheetName: string): ParsedBudgetEntry[] {
    const data: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: null
    });

    const entries: ParsedBudgetEntry[] = [];

    // Find header row (contains "Area", "Proyecto", "Cuenta")
    let headerRow = -1;
    for (let r = 0; r < Math.min(data.length, 10); r++) {
        const row = data[r];
        if (row && row.some(cell => String(cell).toLowerCase().includes('cuenta'))) {
            headerRow = r;
            break;
        }
    }

    if (headerRow === -1) {
        console.warn(`No header row found in sheet ${sheetName}`);
        return entries;
    }

    // Data starts after header
    for (let r = headerRow + 1; r < data.length; r++) {
        const row = data[r];
        if (!row || row.length < 5) continue;

        const areaName = String(row[0] || '').trim();
        const projectName = row[1] ? String(row[1]).trim() : null;
        const conceptCode = String(row[2] || '').trim();

        // Skip empty rows
        if (!areaName || !conceptCode) continue;
        if (areaName.toLowerCase() === 'area') continue; // Skip header

        const description = row[3] ? String(row[3]).trim() : null;

        // Extract 12 month amounts (columns 4-15)
        const amounts: number[] = [];
        for (let m = 0; m < 12; m++) {
            const val = row[4 + m];
            amounts.push(typeof val === 'number' ? val : 0);
        }

        // Only add if at least one month has a value
        if (amounts.some(a => a !== 0)) {
            entries.push({
                areaName,
                projectName,
                conceptCode,
                description,
                amounts
            });
        }
    }

    return entries;
}

// Main parser function
export function parseBudgetFile(buffer: ArrayBuffer, year: number): ParsedBudget[] {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const results: ParsedBudget[] = [];
    const warnings: string[] = [];

    // Sheets to parse (Presupuesto is the main one, Otros is secondary)
    const dataSheets = ['Presupuesto', 'Otros'];

    for (const sheetName of dataSheets) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) continue;

        const entries = parseSheet(sheet, sheetName);
        if (entries.length === 0) {
            warnings.push(`Sin datos en hoja ${sheetName}`);
            continue;
        }

        // Group by area
        const areaGroups = new Map<string, ParsedBudgetEntry[]>();
        for (const entry of entries) {
            const group = areaGroups.get(entry.areaName) || [];
            group.push(entry);
            areaGroups.set(entry.areaName, group);
        }

        // Create result per area
        for (const [areaName, areaEntries] of areaGroups) {
            results.push({
                success: true,
                sheetName,
                areaName,
                entries: areaEntries,
                year,
                warnings: []
            });
        }
    }

    if (results.length === 0) {
        return [{
            success: false,
            sheetName: 'unknown',
            areaName: 'unknown',
            entries: [],
            year,
            warnings: ['No se encontraron datos de presupuesto']
        }];
    }

    return results;
}

// Get available sheets info
export function getBudgetSheetInfo(buffer: ArrayBuffer): { sheets: string[]; areas: string[] } {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const dataSheets = ['Presupuesto', 'Otros'].filter(n => workbook.Sheets[n]);

    const areas: Set<string> = new Set();

    for (const sheetName of dataSheets) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) continue;

        const entries = parseSheet(sheet, sheetName);
        entries.forEach(e => areas.add(e.areaName));
    }

    return {
        sheets: dataSheets,
        areas: Array.from(areas)
    };
}
