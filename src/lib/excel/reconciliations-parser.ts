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
