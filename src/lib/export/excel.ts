/**
 * Excel Export Utilities
 * Uses XLSX library for spreadsheet generation
 */

import * as XLSX from 'xlsx';

interface ExportColumn {
    header: string;
    key: string;
    width?: number;
}

interface ExportOptions {
    sheetName?: string;
    columns: ExportColumn[];
    data: Record<string, any>[];
    title?: string;
    subtitle?: string;
}

/**
 * Generate Excel workbook from data
 */
export function generateExcelWorkbook(options: ExportOptions): XLSX.WorkBook {
    const { sheetName = 'Datos', columns, data, title, subtitle } = options;

    const workbook = XLSX.utils.book_new();

    // Build rows array
    const rows: (string | number)[][] = [];

    // Add title and subtitle if provided
    let startRow = 0;
    if (title) {
        rows.push([title]);
        startRow++;
    }
    if (subtitle) {
        rows.push([subtitle]);
        startRow++;
    }
    if (title || subtitle) {
        rows.push([]); // Empty row
        startRow++;
    }

    // Add header row
    rows.push(columns.map(col => col.header));

    // Add data rows
    for (const row of data) {
        rows.push(columns.map(col => row[col.key] ?? ''));
    }

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Set column widths
    const colWidths = columns.map(col => ({ wch: col.width || 15 }));
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    return workbook;
}

/**
 * Export workbook to buffer
 */
export function workbookToBuffer(workbook: XLSX.WorkBook): Buffer {
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Generate Excel for comparison report
 */
export function generateComparisonExcel(
    companyName: string,
    period: string,
    incomeRows: any[],
    costRows: any[],
    totals: any
): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();

    // Income sheet
    const incomeData = [
        [`Comparativo Real vs Presupuesto - ${companyName}`],
        [`Periodo: ${period}`],
        [],
        ['INGRESOS'],
        ['Concepto', 'Presupuesto', 'Real', 'Diferencia', '% Desviacion'],
        ...incomeRows.map(r => [
            r.conceptName,
            r.budgetAmount,
            r.actualAmount,
            r.difference,
            `${r.deviationPercent.toFixed(1)}%`
        ]),
        [],
        ['Total Ingresos', totals.budgetIncome, totals.actualIncome, totals.actualIncome - totals.budgetIncome, '']
    ];

    // Cost sheet
    const costData = [
        [],
        ['COSTOS'],
        ['Concepto', 'Presupuesto', 'Real', 'Diferencia', '% Desviacion'],
        ...costRows.map(r => [
            r.conceptName,
            r.budgetAmount,
            r.actualAmount,
            r.difference,
            `${r.deviationPercent.toFixed(1)}%`
        ]),
        [],
        ['Total Costos', totals.budgetCost, totals.actualCost, totals.actualCost - totals.budgetCost, ''],
        [],
        ['UTILIDAD NETA', totals.budgetNet, totals.actualNet, totals.actualNet - totals.budgetNet, '']
    ];

    const allData = [...incomeData, ...costData];
    const worksheet = XLSX.utils.aoa_to_sheet(allData);
    worksheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comparativo');

    return workbook;
}

/**
 * Generate Excel for profit sharing report
 */
export function generateProfitSharingExcel(
    companyName: string,
    period: string,
    data: any[],
    totals: { totalProfit: number; totalShare: number; clientShare: number }
): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();

    const rows = [
        [`Reparto de Utilidades - ${companyName}`],
        [`Periodo: ${period}`],
        [],
        ['Proyecto', 'Formula', 'Utilidad Bruta', 'Honorario', 'Utilidad Cliente'],
        ...data.map(r => [
            r.projectName,
            r.formulaType,
            r.netProfit,
            r.totalShare,
            r.netProfit - r.totalShare
        ]),
        [],
        ['TOTAL', '', totals.totalProfit, totals.totalShare, totals.clientShare]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reparto');

    return workbook;
}

/**
 * Generate Excel for results report
 */
export function generateResultsExcel(
    companyName: string,
    period: string,
    data: any[]
): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();

    const rows = [
        [`Resultados - ${companyName}`],
        [`Periodo: ${period}`],
        [],
        ['Proyecto', 'Area', 'Concepto', 'Tipo', 'Monto'],
        ...data.map(r => [
            r.projectName || 'Gastos Admin',
            r.areaName || '-',
            r.conceptName,
            r.conceptType,
            r.amount
        ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultados');

    return workbook;
}

/**
 * Generate Excel for budgets report
 */
export function generateBudgetsExcel(
    companyName: string,
    period: string,
    data: any[]
): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();

    const rows = [
        [`Presupuestos - ${companyName}`],
        [`Periodo: ${period}`],
        [],
        ['Area', 'Concepto', 'Tipo', 'Monto'],
        ...data.map(r => [
            r.areaName,
            r.conceptName,
            r.conceptType,
            r.amount
        ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Presupuestos');

    return workbook;
}
