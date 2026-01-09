import * as XLSX from 'xlsx';

export interface ParsedProject {
    columnIndex: number;
    name: string;
    isRecognized: boolean;
    isAdministration?: boolean; // True for "Gastos de Administración" column
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

// Default valid sheet names - used as FALLBACK when no DB entries exist
// These can be managed via /catalogs/sheet-names UI
const DEFAULT_VALID_SHEET_NAMES = [
    // Monthly pattern sheets
    'EneR', 'FebR', 'MarR', 'AbrR', 'MayR', 'JunR',
    'JulR', 'AgoR', 'SepR', 'OctR', 'NovR', 'DicR',
    // Alternative names - MUST BE EXACT
    'Desglose de Ingresos y costm',
    'Desglose de Ingresos y costos m',
];

// Note: These lists are used as fallback when no DB concepts are provided
// When DB is queried, the actual concepts from DB should be passed
const KNOWN_INCOME_CONCEPTS_DEFAULT: string[] = [];
const KNOWN_COST_CONCEPTS_DEFAULT: string[] = [];

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
    knownProjects?: string[],
    validSheetNames?: string[] // From DB or defaults
): ParsedResults {
    const warnings: ParseWarning[] = [];
    const sheetNamesToUse = validSheetNames && validSheetNames.length > 0 ? validSheetNames : DEFAULT_VALID_SHEET_NAMES;

    try {
        // Read workbook
        const workbook = XLSX.read(buffer, { type: 'array' });

        // Find sheet (use specified or find by exact name match)
        let targetSheet = sheetName;
        if (!targetSheet) {
            // Find first matching sheet (case-insensitive exact match)
            targetSheet = workbook.SheetNames.find(name =>
                sheetNamesToUse.some(valid =>
                    name.toLowerCase().trim() === valid.toLowerCase().trim()
                )
            ) || workbook.SheetNames[0];
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
                const normalized = normalizeString(name);
                // Skip summary/calculation columns (but NOT gastos de administración)
                if (normalized.includes('total') ||
                    normalized === '%' ||
                    normalized.includes('porcentaje')) continue;

                // Check if this is the administration expenses column
                const isAdministration = normalized.includes('gastos admon') ||
                    normalized.includes('gastos de admon') ||
                    normalized.includes('gastos de administracion') ||
                    normalized.includes('administracion');

                projects.push({
                    columnIndex: c,
                    name: isAdministration ? 'Gastos de Administración' : name,
                    isRecognized: !!(knownProjects && knownProjects.length > 0 && knownProjects.some(p =>
                        normalizeString(p) === normalizeString(name)
                    )),
                    isAdministration, // Mark as admin expenses
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
                ? isConceptRecognized(conceptName, KNOWN_INCOME_CONCEPTS_DEFAULT)
                : isConceptRecognized(conceptName, KNOWN_COST_CONCEPTS_DEFAULT);

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

// Get valid sheets for import
export function getMonthSheets(buffer: ArrayBuffer, validSheetNames?: string[]): string[] {
    const allSheets = getAvailableSheets(buffer);
    const sheetNamesToUse = validSheetNames && validSheetNames.length > 0 ? validSheetNames : DEFAULT_VALID_SHEET_NAMES;

    // Find sheets that match valid names (case-insensitive exact match)
    return allSheets.filter(name =>
        sheetNamesToUse.some(valid =>
            name.toLowerCase().trim() === valid.toLowerCase().trim()
        )
    );
}

// Get accountant-specific sheets
export function getAccountantSheets(buffer: ArrayBuffer): { desglose?: string; gastosAdmin?: string } {
    const allSheets = getAvailableSheets(buffer);
    return {
        desglose: allSheets.find(s => s.toLowerCase().includes('desglose de ingresos y costos m')),
        gastosAdmin: allSheets.find(s => s.toLowerCase().includes('gastos administrativos')),
    };
}

// Detect date from Excel file (from filename or cell content)
export function detectDateFromFile(buffer: ArrayBuffer, filename?: string): { year: number; month: number } | null {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;

    // Try to extract from filename first (e.g., "EF wepark 11.25.xls" = Nov 2025)
    if (filename) {
        // Pattern: month.year (e.g., 11.25, 11.2025)
        const filenameMatch = filename.match(/(\d{1,2})\.(\d{2,4})/);
        if (filenameMatch) {
            month = parseInt(filenameMatch[1]);
            year = parseInt(filenameMatch[2]);
            if (year < 100) year += 2000; // Convert 25 -> 2025
            return { year, month };
        }

        // Pattern: month name + year (e.g., "noviembre 2025")
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const lowerFilename = filename.toLowerCase();
        for (let i = 0; i < monthNames.length; i++) {
            if (lowerFilename.includes(monthNames[i])) {
                month = i + 1;
                const yearMatch = filename.match(/20\d{2}/);
                if (yearMatch) year = parseInt(yearMatch[0]);
                return { year, month };
            }
        }
    }

    // Try to extract from Excel date cell (row 4 contains Excel date number)
    try {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const accountantSheet = workbook.SheetNames.find(s =>
            s.toLowerCase().includes('desglose de ingresos y costos m')
        );

        if (accountantSheet) {
            const sheet = workbook.Sheets[accountantSheet];
            const data: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                defval: null
            });

            // Row 4 (index 3) contains the Excel date
            if (data[3] && data[3][0] && typeof data[3][0] === 'number') {
                const excelDate = data[3][0];
                // Excel date to JS date conversion
                const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
                return { year: jsDate.getFullYear(), month: jsDate.getMonth() + 1 };
            }

            // Also check string format like "Al 30 de noviembre del 2025"
            if (data[3] && data[3][0] && typeof data[3][0] === 'string') {
                const dateStr = data[3][0].toLowerCase();
                const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                for (let i = 0; i < monthNames.length; i++) {
                    if (dateStr.includes(monthNames[i])) {
                        month = i + 1;
                        const yearMatch = dateStr.match(/\d{4}/);
                        if (yearMatch) year = parseInt(yearMatch[0]);
                        return { year, month };
                    }
                }
            }
        }
    } catch {
        // Ignore parsing errors
    }

    return null;
}

// Check if file is in accountant format
export function isAccountantFormat(buffer: ArrayBuffer): boolean {
    const sheets = getAccountantSheets(buffer);
    return !!sheets.desglose;
}

// Check if file has "Otros" sheet (budget format for results)
export function hasOtrosSheet(buffer: ArrayBuffer): boolean {
    try {
        const workbook = XLSX.read(buffer, { type: 'array' });
        return workbook.SheetNames.some(name => name.toLowerCase() === 'otros');
    } catch {
        return false;
    }
}

// Get year from sheet names (looks for year-named sheet like "2025")
export function getOtrosYear(buffer: ArrayBuffer): number {
    try {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const yearSheet = workbook.SheetNames.find(name => /^\d{4}$/.test(name));
        return yearSheet ? parseInt(yearSheet) : new Date().getFullYear();
    } catch {
        return new Date().getFullYear();
    }
}

// Parse "Otros" sheet (budget format) as ParsedResults for Results import
// This adapts the budget-format Otros sheet to the ParsedResults structure
export function parseOtrosAsResults(
    buffer: ArrayBuffer,
    month: number,
    knownProjects?: string[],
    knownConcepts?: string[]
): ParsedResults {
    const warnings: ParseWarning[] = [];

    // Helper to strip project prefix codes like "(01) " from names for comparison
    const stripProjectPrefix = (name: string): string => {
        return name.replace(/^\(\d+\)\s*/, '').trim();
    };

    try {
        const workbook = XLSX.read(buffer, { type: 'array' });

        // Find Otros sheet
        const otrosSheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'otros');
        if (!otrosSheetName) {
            return {
                success: false,
                sheetName: 'Otros',
                anchorCell: '',
                projects: [],
                concepts: [],
                values: [],
                warnings: [{ type: 'STRUCTURE_ERROR', message: 'No se encontró la hoja "Otros"' }],
                totals: {},
            };
        }

        const sheet = workbook.Sheets[otrosSheetName];
        const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

        // Find header row (contains "Cuenta")
        let headerRow = -1;
        for (let r = 0; r < Math.min(data.length, 10); r++) {
            const row = data[r];
            if (row && row.some((cell: any) => String(cell || '').toLowerCase().includes('cuenta'))) {
                headerRow = r;
                break;
            }
        }

        if (headerRow === -1) {
            return {
                success: false,
                sheetName: otrosSheetName,
                anchorCell: '',
                projects: [],
                concepts: [],
                values: [],
                warnings: [{ type: 'STRUCTURE_ERROR', message: 'No se encontró el encabezado con "Cuenta"' }],
                totals: {},
            };
        }

        // Build projects and concepts from data
        const projectsMap = new Map<string, number>(); // name -> index
        const conceptsMap = new Map<string, number>(); // name -> index
        const projects: ParsedProject[] = [];
        const concepts: ParsedConcept[] = [];
        const values: ParsedValue[] = [];

        // Month column index (0-based, months start at column 4)
        const monthColIndex = 3 + month; // Column 4 = Jan (month 1), etc.

        // Parse data rows
        for (let r = headerRow + 1; r < data.length; r++) {
            const row = data[r];
            if (!row || row.length < 5) continue;

            const areaName = String(row[0] || '').trim();
            const projectName = row[1] ? String(row[1]).trim() : null;
            const conceptCode = String(row[2] || '').trim();

            // Skip empty rows or header repeats
            if (!areaName || !conceptCode) continue;
            if (areaName.toLowerCase() === 'area') continue;

            // Get value for the selected month
            const amount = typeof row[monthColIndex] === 'number' ? row[monthColIndex] : 0;
            if (amount === 0) continue;

            // Get or create project index
            const projectKey = projectName || 'Sin Proyecto';
            let projectIndex = projectsMap.get(projectKey);
            if (projectIndex === undefined) {
                projectIndex = projects.length;
                projectsMap.set(projectKey, projectIndex);
                // Check if project is known (case-insensitive, ignoring prefix codes)
                // Strip (XX) prefix for comparison so "(01) C. Polanco" matches "C. Polanco"
                const strippedProjectKey = stripProjectPrefix(projectKey);
                const isRecognized = knownProjects?.some(
                    p => normalizeString(stripProjectPrefix(p)) === normalizeString(strippedProjectKey)
                ) ?? false;
                // Check for administration pattern
                const isAdministration = /administraci[oó]n|admin/i.test(projectKey);
                projects.push({
                    columnIndex: projectIndex,
                    name: projectKey,
                    isRecognized: isRecognized || isAdministration,
                    isAdministration,
                });
            }

            // Get or create concept index
            // Extract concept name from code (e.g., "A01 Seguridad" -> "Seguridad")
            const conceptName = conceptCode.split(/\s+/).slice(1).join(' ') || conceptCode;
            let conceptIndex = conceptsMap.get(conceptName);
            if (conceptIndex === undefined) {
                conceptIndex = concepts.length;
                conceptsMap.set(conceptName, conceptIndex);
                // Check if concept is known (case-insensitive)
                const isRecognized = knownConcepts?.some(
                    c => normalizeString(c) === normalizeString(conceptName)
                ) ?? false;
                concepts.push({
                    rowIndex: r,
                    name: conceptName,
                    type: 'COST', // Otros sheet typically contains costs
                    isRecognized,
                });
            }

            // Add value
            values.push({
                projectIndex,
                conceptIndex,
                value: amount,
            });
        }

        // Generate warnings only for unrecognized projects and concepts
        projects.filter(p => !p.isRecognized).forEach(p => {
            warnings.push({
                type: 'PROJECT_NOT_FOUND',
                message: `Proyecto no reconocido: "${p.name}"`,
                column: p.columnIndex,
            });
        });

        concepts.filter(c => !c.isRecognized).forEach(c => {
            warnings.push({
                type: 'CONCEPT_NOT_FOUND',
                message: `Concepto no reconocido: "${c.name}" (${c.type})`,
                row: c.rowIndex,
            });
        });

        return {
            success: true,
            sheetName: otrosSheetName,
            anchorCell: `A${headerRow + 1}`,
            projects,
            concepts,
            values,
            warnings,
            totals: {},
        };

    } catch (error) {
        return {
            success: false,
            sheetName: 'Otros',
            anchorCell: '',
            projects: [],
            concepts: [],
            values: [],
            warnings: [{ type: 'STRUCTURE_ERROR', message: error instanceof Error ? error.message : 'Error parsing Otros sheet' }],
            totals: {},
        };
    }
}

// Parse "Otros" sheet and return entries for ALL 12 months at once
// Returns a map of month number (1-12) to array of parsed values
export interface OtrosMonthlyData {
    projects: ParsedProject[];
    concepts: ParsedConcept[];
    valuesByMonth: Map<number, ParsedValue[]>;
    warnings: ParseWarning[];
    year: number;
}

export function parseOtrosAllMonths(
    buffer: ArrayBuffer,
    knownProjects?: string[],
    knownConcepts?: string[]
): OtrosMonthlyData {
    const warnings: ParseWarning[] = [];

    // Helper to strip project prefix codes like "(01) " from names for comparison
    const stripProjectPrefix = (name: string): string => {
        return name.replace(/^\(\d+\)\s*/, '').trim();
    };

    try {
        const workbook = XLSX.read(buffer, { type: 'array' });

        // Find Otros sheet
        const otrosSheetName = workbook.SheetNames.find(name =>
            /otros/i.test(name)
        );

        if (!otrosSheetName) {
            throw new Error('No se encontró hoja "Otros"');
        }

        const sheet = workbook.Sheets[otrosSheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

        // Get year from sheet names - first look for a sheet that is just a 4-digit year (e.g., "2025")
        // Then fall back to checking the Otros sheet name itself
        const yearSheetName = workbook.SheetNames.find(name => /^20\d{2}$/.test(name.trim()));
        let year: number;
        if (yearSheetName) {
            year = parseInt(yearSheetName.trim());
        } else {
            const yearMatch = otrosSheetName.match(/(\d{4})/);
            year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
        }

        // Find header row with "Cuenta" or similar
        let headerRow = -1;
        for (let r = 0; r < Math.min(20, data.length); r++) {
            const row = data[r];
            if (row && row.some(cell => String(cell).toLowerCase().includes('cuenta'))) {
                headerRow = r;
                break;
            }
        }

        if (headerRow === -1) {
            throw new Error('No se encontró encabezado con "Cuenta"');
        }

        // Build projects and concepts from data
        const projectsMap = new Map<string, number>(); // name -> index
        const conceptsMap = new Map<string, number>(); // name -> index
        const projects: ParsedProject[] = [];
        const concepts: ParsedConcept[] = [];
        const valuesByMonth = new Map<number, ParsedValue[]>();

        // Initialize arrays for each month
        for (let m = 1; m <= 12; m++) {
            valuesByMonth.set(m, []);
        }

        // Parse data rows
        for (let r = headerRow + 1; r < data.length; r++) {
            const row = data[r];
            if (!row || row.length < 5) continue;

            const areaName = String(row[0] || '').trim();
            const projectName = row[1] ? String(row[1]).trim() : null;
            const conceptCode = String(row[2] || '').trim();

            // Skip empty rows or header repeats
            if (!areaName || !conceptCode) continue;
            if (areaName.toLowerCase() === 'area') continue;

            // Get or create project index
            const projectKey = projectName || 'Sin Proyecto';
            let projectIndex = projectsMap.get(projectKey);
            if (projectIndex === undefined) {
                projectIndex = projects.length;
                projectsMap.set(projectKey, projectIndex);
                const strippedProjectKey = stripProjectPrefix(projectKey);
                const isRecognized = knownProjects?.some(
                    p => normalizeString(stripProjectPrefix(p)) === normalizeString(strippedProjectKey)
                ) ?? false;
                const isAdministration = /administraci[oó]n|admin/i.test(projectKey);
                projects.push({
                    columnIndex: projectIndex,
                    name: projectKey,
                    isRecognized: isRecognized || isAdministration,
                    isAdministration,
                });
            }

            // Get or create concept index
            const conceptName = conceptCode.split(/\s+/).slice(1).join(' ') || conceptCode;
            let conceptIndex = conceptsMap.get(conceptName);
            if (conceptIndex === undefined) {
                conceptIndex = concepts.length;
                conceptsMap.set(conceptName, conceptIndex);
                const isRecognized = knownConcepts?.some(
                    c => normalizeString(c) === normalizeString(conceptName)
                ) ?? false;
                concepts.push({
                    rowIndex: r,
                    name: conceptName,
                    type: 'COST',
                    isRecognized,
                });
            }

            // Add values for ALL 12 months
            for (let month = 1; month <= 12; month++) {
                const monthColIndex = 3 + month; // Column 4 = Jan (month 1), etc.
                const amount = typeof row[monthColIndex] === 'number' ? row[monthColIndex] : 0;
                if (amount !== 0) {
                    valuesByMonth.get(month)!.push({
                        projectIndex,
                        conceptIndex,
                        value: amount,
                    });
                }
            }
        }

        // Generate warnings only for unrecognized projects and concepts
        projects.filter(p => !p.isRecognized).forEach(p => {
            warnings.push({
                type: 'PROJECT_NOT_FOUND',
                message: `Proyecto no reconocido: "${p.name}"`,
                column: p.columnIndex,
            });
        });

        concepts.filter(c => !c.isRecognized).forEach(c => {
            warnings.push({
                type: 'CONCEPT_NOT_FOUND',
                message: `Concepto no reconocido: "${c.name}" (${c.type})`,
                row: c.rowIndex,
            });
        });

        return { projects, concepts, valuesByMonth, warnings, year };

    } catch (error) {
        return {
            projects: [],
            concepts: [],
            valuesByMonth: new Map(),
            warnings: [{ type: 'STRUCTURE_ERROR', message: error instanceof Error ? error.message : 'Error parsing Otros sheet' }],
            year: new Date().getFullYear(),
        };
    }
}
