import * as XLSX from 'xlsx';

export interface ParsedProject {
    columnIndex: number;
    name: string;
    isRecognized: boolean;
}

export interface ParsedConcept {
    rowIndex: number;
    name: string;
    type: 'INCOME' | 'COST';
    isRecognized: boolean;
}

export interface ParsedValue {
    projectIndex: number;
    conceptIndex: number;
    value: number;
}

export interface ParseWarning {
    type: 'PROJECT_NOT_FOUND' | 'CONCEPT_NOT_FOUND' | 'INVALID_VALUE' | 'STRUCTURE_ERROR';
    message: string;
    row?: number;
    column?: number;
}

export interface ParsedResults {
    success: boolean;
    sheetName: string;
    anchorCell: string;
    projects: ParsedProject[];
    concepts: ParsedConcept[];
    values: ParsedValue[];
    warnings: ParseWarning[];
    totals: {
        incomeRow?: number;
        costRow?: number;
    };
}

// Known concepts for recognition
const KNOWN_INCOME_CONCEPTS = [
    'tarifa horaria', 'pensiones', 'etiquetas', 'boletos sellados', 'eventos',
    'activación tarjeta', 'reposición tarjeta', 'tarifa horaria valet parking',
    'recargos', 'igualas', 'bicicleta', 'venta de equipo', 'vales magnéticos',
    'facturas canceladas', 'sobrantes', 'ganancia cambiaria', 'daño a vehículos',
    'telefonía', 'baños'
];

const KNOWN_COST_CONCEPTS = [
    'nómina operativa', 'nómina gerencial', 'asesoría contable', 'renta fija',
    'renta variable', 'mantenimiento plaza', 'luz', 'teléfono', 'seguridad',
    'seguros y fianzas', 'boletos', 'etiquetas', 'uniformes', 'impresiones',
    'equipo de estacionamiento', 'mantenimiento equipo', 'señalizaciones',
    'licencias', 'papelería y artículos de oficina', 'artículos de limpieza',
    'incidentes', 'viáticos', 'mensajería y paquetería', 'cuotas imss',
    'cuotas infonavit', 'cuotas afore', 'impuesto sobre nóminas',
    'compensaciones', 'varios', 'no deducibles', 'nomina operativa', 'nomina gerencial'
];

function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function isConceptRecognized(name: string, concepts: string[]): boolean {
    const normalized = normalizeString(name);
    return concepts.some(c => normalizeString(c) === normalized);
}

export function parseResultsSheet(
    buffer: ArrayBuffer,
    sheetName?: string,
    knownProjects?: string[]
): ParsedResults {
    const warnings: ParseWarning[] = [];

    try {
        // Read workbook
        const workbook = XLSX.read(buffer, { type: 'array' });

        // Find sheet (use specified or first with 'R' suffix)
        let targetSheet = sheetName;
        if (!targetSheet) {
            const monthSheets = workbook.SheetNames.filter(name => /^(Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)R$/i.test(name));
            targetSheet = monthSheets[0] || workbook.SheetNames[0];
        }

        const sheet = workbook.Sheets[targetSheet];
        if (!sheet) {
            return {
                success: false,
                sheetName: targetSheet || 'unknown',
                anchorCell: '',
                projects: [],
                concepts: [],
                values: [],
                warnings: [{ type: 'STRUCTURE_ERROR', message: `Hoja "${targetSheet}" no encontrada` }],
                totals: {},
            };
        }

        // Convert to array of arrays
        const data: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: null
        });

        // Find anchor cell "Concepto/Proyecto"
        let anchorRow = -1;
        let anchorCol = -1;

        for (let r = 0; r < Math.min(data.length, 20); r++) {
            const row = data[r];
            if (!row) continue;
            for (let c = 0; c < Math.min(row.length, 5); c++) {
                const cell = row[c];
                if (cell && typeof cell === 'string' &&
                    normalizeString(cell).includes('concepto') &&
                    normalizeString(cell).includes('proyecto')) {
                    anchorRow = r;
                    anchorCol = c;
                    break;
                }
            }
            if (anchorRow >= 0) break;
        }

        if (anchorRow < 0) {
            // Try alternative anchor - look for row with project names
            for (let r = 0; r < Math.min(data.length, 15); r++) {
                const row = data[r];
                if (!row) continue;
                // If row has many text values, might be project names
                const textCells = row.filter(c => c && typeof c === 'string' && c.length > 2).length;
                if (textCells > 3) {
                    anchorRow = r - 1; // Projects are usually one row after number row
                    anchorCol = 0;
                    break;
                }
            }

            if (anchorRow < 0) {
                return {
                    success: false,
                    sheetName: targetSheet,
                    anchorCell: '',
                    projects: [],
                    concepts: [],
                    values: [],
                    warnings: [{ type: 'STRUCTURE_ERROR', message: 'No se encontró la celda ancla "Concepto/Proyecto"' }],
                    totals: {},
                };
            }
        }

        const anchorCell = XLSX.utils.encode_cell({ r: anchorRow, c: anchorCol });

        // Extract projects from the row after anchor (or same row for Concepto/Proyecto pattern)
        const projectRow = data[anchorRow] || [];
        const projects: ParsedProject[] = [];

        // Projects start from column after anchor
        for (let c = anchorCol + 1; c < projectRow.length; c++) {
            const cell = projectRow[c];
            if (cell && typeof cell === 'string' && cell.trim().length > 0) {
                const name = cell.trim();
                // Skip "Total" or summary columns
                if (normalizeString(name).includes('total')) continue;

                projects.push({
                    columnIndex: c,
                    name,
                    isRecognized: !knownProjects || knownProjects.some(p =>
                        normalizeString(p) === normalizeString(name)
                    ),
                });
            }
        }

        if (projects.length === 0) {
            warnings.push({
                type: 'STRUCTURE_ERROR',
                message: 'No se encontraron proyectos en la fila de encabezado',
                row: anchorRow
            });
        }

        // Mark unrecognized projects as warnings
        projects.filter(p => !p.isRecognized).forEach(p => {
            warnings.push({
                type: 'PROJECT_NOT_FOUND',
                message: `Proyecto no reconocido: "${p.name}"`,
                column: p.columnIndex,
            });
        });

        // Extract concepts and values
        const concepts: ParsedConcept[] = [];
        const values: ParsedValue[] = [];
        let currentType: 'INCOME' | 'COST' = 'INCOME';
        let incomeEndRow = -1;
        let costStartRow = -1;
        let costEndRow = -1;

        for (let r = anchorRow + 1; r < data.length; r++) {
            const row = data[r];
            if (!row) continue;

            const conceptCell = row[anchorCol];
            if (!conceptCell || typeof conceptCell !== 'string') continue;

            const conceptName = conceptCell.trim();
            if (!conceptName) continue;

            const normalized = normalizeString(conceptName);

            // Detect section changes
            if (normalized.includes('total de ingresos') || normalized === 'total ingresos') {
                incomeEndRow = r;
                continue;
            }

            if (normalized === 'costos' || normalized === 'costo') {
                currentType = 'COST';
                costStartRow = r;
                continue;
            }

            if (normalized.includes('total de costos') || normalized === 'total costos') {
                costEndRow = r;
                continue;
            }

            // Skip summary/calculation rows
            if (normalized.includes('utilidad') ||
                normalized.includes('reembolso') ||
                normalized.includes('wepark') ||
                normalized.includes('total')) {
                continue;
            }

            // Add concept
            const isRecognized = currentType === 'INCOME'
                ? isConceptRecognized(conceptName, KNOWN_INCOME_CONCEPTS)
                : isConceptRecognized(conceptName, KNOWN_COST_CONCEPTS);

            const conceptIndex = concepts.length;
            concepts.push({
                rowIndex: r,
                name: conceptName,
                type: currentType,
                isRecognized,
            });

            if (!isRecognized) {
                warnings.push({
                    type: 'CONCEPT_NOT_FOUND',
                    message: `Concepto no reconocido: "${conceptName}" (${currentType})`,
                    row: r,
                });
            }

            // Extract values for each project
            for (let p = 0; p < projects.length; p++) {
                const project = projects[p];
                const valueCell = row[project.columnIndex];

                let numericValue = 0;
                if (typeof valueCell === 'number') {
                    numericValue = valueCell;
                } else if (typeof valueCell === 'string') {
                    const parsed = parseFloat(valueCell.replace(/[,$]/g, ''));
                    if (!isNaN(parsed)) {
                        numericValue = parsed;
                    } else if (valueCell.trim() !== '' && valueCell.trim() !== '-') {
                        warnings.push({
                            type: 'INVALID_VALUE',
                            message: `Valor no válido: "${valueCell}"`,
                            row: r,
                            column: project.columnIndex,
                        });
                    }
                }

                values.push({
                    projectIndex: p,
                    conceptIndex,
                    value: numericValue,
                });
            }
        }

        return {
            success: true,
            sheetName: targetSheet,
            anchorCell,
            projects,
            concepts,
            values,
            warnings,
            totals: {
                incomeRow: incomeEndRow > 0 ? incomeEndRow : undefined,
                costRow: costEndRow > 0 ? costEndRow : undefined,
            },
        };

    } catch (error) {
        return {
            success: false,
            sheetName: sheetName || 'unknown',
            anchorCell: '',
            projects: [],
            concepts: [],
            values: [],
            warnings: [{
                type: 'STRUCTURE_ERROR',
                message: error instanceof Error ? error.message : 'Error desconocido al parsear',
            }],
            totals: {},
        };
    }
}

// Get available sheets from a workbook
export function getAvailableSheets(buffer: ArrayBuffer): string[] {
    try {
        const workbook = XLSX.read(buffer, { type: 'array' });
        return workbook.SheetNames;
    } catch {
        return [];
    }
}

// Get month sheets (EneR, FebR, etc.)
export function getMonthSheets(buffer: ArrayBuffer): string[] {
    const allSheets = getAvailableSheets(buffer);
    return allSheets.filter(name =>
        /^(Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)R$/i.test(name)
    );
}
