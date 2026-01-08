/**
 * Reconciliations Excel Parser
 */

import * as XLSX from 'xlsx';

export interface ParsedReconciliation {
    date: Date;
    reference: string;
    invoice: string;
    policy: string;
    checkNumber: string;
    supplier: string;
    subtotal: number;
    tax: number;
    total: number;
    projectName?: string;
    conceptName?: string;
}

export interface ReconciliationParseResult {
    success: boolean;
    data: ParsedReconciliation[];
    errors: string[];
    rawHeaders: string[];
}

interface ColumnMapping {
    date: number;
    reference: number;
    invoice: number;
    policy: number;
    checkNumber: number;
    supplier: number;
    subtotal: number;
    tax: number;
    total: number;
    project?: number;
    concept?: number;
}

const HEADER_PATTERNS: Record<keyof ColumnMapping, RegExp> = {
    date: /fecha|date/i,
    reference: /referencia|reference|ref/i,
    invoice: /factura|invoice|cfdi/i,
    policy: /poliza|policy/i,
    checkNumber: /cheque|check|numero.*cheque/i,
    supplier: /proveedor|supplier|beneficiario|vendor/i,
    subtotal: /subtotal|importe/i,
    tax: /iva|impuesto|tax/i,
    total: /total|monto/i,
    project: /proyecto|project/i,
    concept: /concepto|concept|descripcion/i,
};

export function parseReconciliationsFile(buffer: Buffer): ReconciliationParseResult {
    const errors: string[] = [];
    const data: ParsedReconciliation[] = [];

    try {
        const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        if (rawData.length < 2) {
            return { success: false, data: [], errors: ['Archivo vacio o sin datos'], rawHeaders: [] };
        }

        const headers = (rawData[0] as string[]).map(h => String(h || '').trim());

        // Auto-detect column mapping
        const mapping = detectColumnMapping(headers);

        if (mapping.total === -1) {
            errors.push('No se encontro columna de Total');
            return { success: false, data: [], errors, rawHeaders: headers };
        }

        // Parse data rows
        for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i] as any[];
            if (!row || row.length === 0) continue;

            try {
                const total = parseNumber(row[mapping.total]);
                if (total === 0) continue; // Skip empty rows

                const reconciliation: ParsedReconciliation = {
                    date: parseDate(row[mapping.date]) || new Date(),
                    reference: String(row[mapping.reference] || ''),
                    invoice: String(row[mapping.invoice] || ''),
                    policy: String(row[mapping.policy] || ''),
                    checkNumber: String(row[mapping.checkNumber] || ''),
                    supplier: String(row[mapping.supplier] || ''),
                    subtotal: parseNumber(row[mapping.subtotal]),
                    tax: parseNumber(row[mapping.tax]),
                    total,
                    projectName: mapping.project !== undefined ? String(row[mapping.project] || '') : undefined,
                    conceptName: mapping.concept !== undefined ? String(row[mapping.concept] || '') : undefined,
                };

                data.push(reconciliation);
            } catch (err) {
                errors.push(`Fila ${i + 1}: Error de formato`);
            }
        }

        return { success: true, data, errors, rawHeaders: headers };
    } catch (error) {
        return {
            success: false,
            data: [],
            errors: [`Error al leer archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`],
            rawHeaders: []
        };
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
        subtotal: -1,
        tax: -1,
        total: -1,
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
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
}
