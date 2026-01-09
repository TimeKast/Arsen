/**
 * Reconciliations Excel Parser
 * Updated to include all columns from conciliation files
 */

import * as XLSX from 'xlsx';

export interface ParsedReconciliation {
    date: Date;
    reference: string;
    invoice: string;
    policy: string;
    checkNumber: string;
    supplier: string;
    businessUnit: string;   // U. Negocio
    account: string;        // Cuenta
    cancelled: number;      // Cancelados
    inTransit: number;      // Transito
    entries: number;        // Entradas
    subtotal: number;
    tax: number;
    withdrawals: number;    // Salidas
    balance: number;        // Saldo
    observations: string;   // Observaciones
    projectName?: string;
    conceptName?: string;
}

export interface ReconciliationParseResult {
    success: boolean;
    data: ParsedReconciliation[];
    errors: string[];
    rawHeaders: string[];
    sheetName: string;
}

interface ColumnMapping {
    date: number;
    reference: number;
    invoice: number;
    policy: number;
    checkNumber: number;
    supplier: number;
    businessUnit: number;
    account: number;
    cancelled: number;
    inTransit: number;
    entries: number;
    subtotal: number;
    tax: number;
    withdrawals: number;
    balance: number;
    observations: number;
    project?: number;
    concept?: number;
}

const HEADER_PATTERNS: Record<keyof ColumnMapping, RegExp> = {
    date: /fecha|date/i,
    reference: /referencia|reference|ref/i,
    invoice: /factura|invoice|cfdi/i,
    policy: /poliza|policy|póliza/i,
    checkNumber: /cheque|check|numero.*cheque/i,
    supplier: /proveedor|supplier|beneficiario|vendor/i,
    businessUnit: /u\.?\s*negocio|unidad.*negocio|business.*unit/i,
    account: /^cuenta$|account/i,
    cancelled: /cancelado|cancelled/i,
    inTransit: /transito|transit/i,
    entries: /entrada|entradas|income|ingreso/i,
    subtotal: /subtotal|importe/i,
    tax: /iva|impuesto|tax/i,
    withdrawals: /salida|salidas|withdrawal|egreso/i,
    balance: /saldo|balance/i,
    observations: /observacion|observation|nota|note|comentario/i,
    project: /proyecto|project/i,
    concept: /concepto|concept|descripcion/i,
};

export function parseReconciliationsFile(buffer: Buffer, targetSheet?: string): ReconciliationParseResult {
    const errors: string[] = [];
    const data: ParsedReconciliation[] = [];

    try {
        const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

        // Find the year-named sheet (like "2025") or use specified sheet
        let sheetName = targetSheet;
        if (!sheetName) {
            sheetName = workbook.SheetNames.find(name => /^\d{4}$/.test(name)) || workbook.SheetNames[0];
        }

        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            return { success: false, data: [], errors: [`Hoja "${sheetName}" no encontrada`], rawHeaders: [], sheetName: '' };
        }

        const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        if (rawData.length < 2) {
            return { success: false, data: [], errors: ['Archivo vacio o sin datos'], rawHeaders: [], sheetName };
        }

        const headers = (rawData[0] as string[]).map(h => String(h || '').trim());

        // Auto-detect column mapping
        const mapping = detectColumnMapping(headers);

        // Parse data rows
        for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i] as any[];
            if (!row || row.length === 0) continue;

            try {
                // Skip empty rows (check various amount columns)
                const hasData = parseNumber(row[mapping.subtotal]) !== 0 ||
                    parseNumber(row[mapping.withdrawals]) !== 0 ||
                    parseNumber(row[mapping.entries]) !== 0 ||
                    parseNumber(row[mapping.balance]) !== 0;

                if (!hasData && !row[mapping.supplier]) continue;

                const reconciliation: ParsedReconciliation = {
                    date: parseDate(row[mapping.date]) || new Date(),
                    reference: String(row[mapping.reference] || ''),
                    invoice: String(row[mapping.invoice] || ''),
                    policy: String(row[mapping.policy] || ''),
                    checkNumber: String(row[mapping.checkNumber] || ''),
                    supplier: String(row[mapping.supplier] || ''),
                    businessUnit: String(row[mapping.businessUnit] || ''),
                    account: String(row[mapping.account] || ''),
                    cancelled: parseNumber(row[mapping.cancelled]),
                    inTransit: parseNumber(row[mapping.inTransit]),
                    entries: parseNumber(row[mapping.entries]),
                    subtotal: parseNumber(row[mapping.subtotal]),
                    tax: parseNumber(row[mapping.tax]),
                    withdrawals: parseNumber(row[mapping.withdrawals]),
                    balance: parseNumber(row[mapping.balance]),
                    observations: String(row[mapping.observations] || ''),
                    projectName: mapping.project !== undefined ? String(row[mapping.project] || '') : undefined,
                    conceptName: mapping.concept !== undefined ? String(row[mapping.concept] || '') : undefined,
                };

                data.push(reconciliation);
            } catch (err) {
                errors.push(`Fila ${i + 1}: Error de formato`);
            }
        }

        return { success: true, data, errors, rawHeaders: headers, sheetName };
    } catch (error) {
        return {
            success: false,
            data: [],
            errors: [`Error al leer archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`],
            rawHeaders: [],
            sheetName: ''
        };
    }
}

// Get available sheets from workbook
export function getReconciliationSheets(buffer: Buffer): string[] {
    try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        return workbook.SheetNames;
    } catch {
        return [];
    }
}

// Check if workbook has "Otros" sheet (for results import)
export function hasOtrosSheet(buffer: Buffer): boolean {
    try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        return workbook.SheetNames.some(name => name.toLowerCase() === 'otros');
    } catch {
        return false;
    }
}

// Parsed result entry from Otros sheet
export interface ParsedOtrosEntry {
    areaName: string;
    projectName: string | null;
    conceptCode: string;
    amounts: number[]; // 12 months
}

// Parse Otros sheet for results import (budget format)
export function parseOtrosSheet(buffer: Buffer): { year: number; entries: ParsedOtrosEntry[] } | null {
    try {
        const workbook = XLSX.read(buffer, { type: 'buffer', cellNF: true });

        // Find year from sheet name (e.g., "2025")
        const yearSheet = workbook.SheetNames.find(name => /^\d{4}$/.test(name));
        const year = yearSheet ? parseInt(yearSheet) : new Date().getFullYear();

        // Find Otros sheet
        const otrosSheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'otros');
        if (!otrosSheetName) return null;

        const sheet = workbook.Sheets[otrosSheetName];
        if (!sheet) return null;

        const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
        const entries: ParsedOtrosEntry[] = [];

        // Find header row (contains "Area" or "Cuenta")
        let headerRow = -1;
        for (let r = 0; r < Math.min(data.length, 10); r++) {
            const row = data[r];
            if (row && row.some((cell: any) => String(cell || '').toLowerCase().includes('cuenta'))) {
                headerRow = r;
                break;
            }
        }

        if (headerRow === -1) return { year, entries: [] };

        // Parse data rows
        for (let r = headerRow + 1; r < data.length; r++) {
            const row = data[r];
            if (!row || row.length < 5) continue;

            const areaName = String(row[0] || '').trim();
            const projectName = row[1] ? String(row[1]).trim() : null;
            const conceptCode = String(row[2] || '').trim();

            // Skip empty rows or header
            if (!areaName || !conceptCode) continue;
            if (areaName.toLowerCase() === 'area') continue;

            // Extract 12 month amounts (columns 4-15)
            const amounts: number[] = [];
            for (let m = 0; m < 12; m++) {
                const val = row[4 + m];
                amounts.push(typeof val === 'number' ? val : 0);
            }

            // Only add if at least one month has a value
            if (amounts.some(a => a !== 0)) {
                entries.push({ areaName, projectName, conceptCode, amounts });
            }
        }

        return { year, entries };
    } catch (error) {
        console.error('Error parsing Otros sheet:', error);
        return null;
    }
}

function detectColumnMapping(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = {
        date: -1,
        reference: -1,
        invoice: -1,
        policy: -1,
        checkNumber: -1,
        supplier: -1,
        businessUnit: -1,
        account: -1,
        cancelled: -1,
        inTransit: -1,
        entries: -1,
        subtotal: -1,
        tax: -1,
        withdrawals: -1,
        balance: -1,
        observations: -1,
    };

    headers.forEach((header, index) => {
        for (const [key, pattern] of Object.entries(HEADER_PATTERNS)) {
            if (pattern.test(header) && (mapping as any)[key] === -1) {
                (mapping as any)[key] = index;
            }
        }
    });

    return mapping;
}

function parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const cleaned = String(value).replace(/[,$\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

function parseDate(value: any): Date | null {
    if (value instanceof Date) return value;
    if (!value) return null;
    // Handle Excel serial date numbers
    if (typeof value === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
}
