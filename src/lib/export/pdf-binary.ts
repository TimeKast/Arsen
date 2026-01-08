/**
 * Binary PDF Generator using jspdf
 * Generates actual PDF files instead of HTML
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PdfReportOptions {
    title: string;
    subtitle?: string;
    companyName: string;
    period: string;
    generatedAt: string;
}

interface TableColumn {
    header: string;
    key: string;
}

interface TableSection {
    title?: string;
    columns: TableColumn[];
    data: Record<string, unknown>[];
    totalsRow?: Record<string, unknown>;
}

/**
 * Format currency value for display
 */
function formatCurrency(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
        return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    }
    return String(value);
}

/**
 * Generate binary PDF buffer from report data
 */
export function generatePdfBinary(
    options: PdfReportOptions,
    sections: TableSection[]
): Buffer {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header - Company name
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235); // Blue
    doc.text(options.companyName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    // Title
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175); // Darker blue
    doc.text(options.title, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    // Subtitle if present
    if (options.subtitle) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(options.subtitle, pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
    }

    // Meta info
    doc.setFontSize(9);
    doc.setTextColor(136, 136, 136);
    doc.text(`Periodo: ${options.period} | Generado: ${options.generatedAt}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Line separator
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 10;

    // Process each section
    for (const section of sections) {
        // Section title
        if (section.title) {
            doc.setFontSize(12);
            doc.setTextColor(30, 64, 175);
            doc.text(section.title, 15, yPos);
            yPos += 8;
        }

        // Prepare table data
        const headers = section.columns.map(col => col.header);
        const body = section.data.map(row =>
            section.columns.map(col => formatCurrency(row[col.key]))
        );

        // Add totals row if present
        if (section.totalsRow) {
            const totalsData = section.columns.map(col => formatCurrency(section.totalsRow![col.key]));
            body.push(totalsData);
        }

        // Generate table
        autoTable(doc, {
            startY: yPos,
            head: [headers],
            body: body,
            theme: 'striped',
            headStyles: {
                fillColor: [243, 244, 246],
                textColor: [55, 65, 81],
                fontStyle: 'bold',
                fontSize: 9,
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [51, 51, 51],
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251],
            },
            margin: { left: 15, right: 15 },
            didParseCell: (data) => {
                // Style totals row (last row if totalsRow exists)
                if (section.totalsRow && data.row.index === body.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [229, 231, 235];
                }
            },
        });

        // Update Y position after table
        yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

        // Check for page break
        if (yPos > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            yPos = 20;
        }
    }

    // Return as buffer
    return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate comparison PDF binary
 */
export function generateComparisonPdfBinary(
    companyName: string,
    period: string,
    incomeRows: { conceptName: string; budget: number; actual: number; difference: number; percentDeviation: number }[],
    costRows: { conceptName: string; budget: number; actual: number; difference: number; percentDeviation: number }[],
    totals: { budgetIncome: number; actualIncome: number; budgetCost: number; actualCost: number }
): Buffer {
    const columns: TableColumn[] = [
        { header: 'Concepto', key: 'conceptName' },
        { header: 'Presupuesto', key: 'budget' },
        { header: 'Real', key: 'actual' },
        { header: 'Diferencia', key: 'difference' },
        { header: '% Desv.', key: 'percentDeviation' },
    ];

    const incomeData = incomeRows.map(r => ({
        ...r,
        percentDeviation: `${r.percentDeviation.toFixed(1)}%`
    }));

    const costData = costRows.map(r => ({
        ...r,
        percentDeviation: `${r.percentDeviation.toFixed(1)}%`
    }));

    return generatePdfBinary(
        {
            title: 'Comparativo Real vs Presupuesto',
            companyName,
            period,
            generatedAt: new Date().toLocaleDateString('es-MX'),
        },
        [
            {
                title: 'INGRESOS',
                columns,
                data: incomeData,
                totalsRow: {
                    conceptName: 'Total Ingresos',
                    budget: totals.budgetIncome,
                    actual: totals.actualIncome,
                    difference: totals.actualIncome - totals.budgetIncome,
                    percentDeviation: '',
                },
            },
            {
                title: 'COSTOS',
                columns,
                data: costData,
                totalsRow: {
                    conceptName: 'Total Costos',
                    budget: totals.budgetCost,
                    actual: totals.actualCost,
                    difference: totals.actualCost - totals.budgetCost,
                    percentDeviation: '',
                },
            },
        ]
    );
}

/**
 * Generate profit sharing PDF binary
 */
export function generateProfitSharingPdfBinary(
    companyName: string,
    period: string,
    data: { projectName: string; formulaType: string; netProfit: number; totalShare: number }[],
    totals: { totalProfit: number; totalShare: number; clientShare: number }
): Buffer {
    const processedData = data.map(r => ({
        ...r,
        clientShare: r.netProfit - r.totalShare,
    }));

    return generatePdfBinary(
        {
            title: 'Reparto de Utilidades',
            companyName,
            period,
            generatedAt: new Date().toLocaleDateString('es-MX'),
        },
        [
            {
                columns: [
                    { header: 'Proyecto', key: 'projectName' },
                    { header: 'Formula', key: 'formulaType' },
                    { header: 'Utilidad Bruta', key: 'netProfit' },
                    { header: 'Honorario', key: 'totalShare' },
                    { header: 'Cliente', key: 'clientShare' },
                ],
                data: processedData,
                totalsRow: {
                    projectName: 'TOTAL',
                    formulaType: '',
                    netProfit: totals.totalProfit,
                    totalShare: totals.totalShare,
                    clientShare: totals.clientShare,
                },
            },
        ]
    );
}

/**
 * Generate results PDF binary
 */
export function generateResultsPdfBinary(
    companyName: string,
    period: string,
    data: { projectName: string; areaName: string; conceptName: string; conceptType: string; amount: number }[]
): Buffer {
    return generatePdfBinary(
        {
            title: 'Resultados del Periodo',
            companyName,
            period,
            generatedAt: new Date().toLocaleDateString('es-MX'),
        },
        [
            {
                columns: [
                    { header: 'Proyecto', key: 'projectName' },
                    { header: 'Area', key: 'areaName' },
                    { header: 'Concepto', key: 'conceptName' },
                    { header: 'Tipo', key: 'conceptType' },
                    { header: 'Monto', key: 'amount' },
                ],
                data,
            },
        ]
    );
}

/**
 * Generate budgets PDF binary
 */
export function generateBudgetsPdfBinary(
    companyName: string,
    period: string,
    data: { areaName: string; conceptName: string; conceptType: string; amount: number }[]
): Buffer {
    return generatePdfBinary(
        {
            title: 'Presupuestos',
            companyName,
            period,
            generatedAt: new Date().toLocaleDateString('es-MX'),
        },
        [
            {
                columns: [
                    { header: 'Area', key: 'areaName' },
                    { header: 'Concepto', key: 'conceptName' },
                    { header: 'Tipo', key: 'conceptType' },
                    { header: 'Monto', key: 'amount' },
                ],
                data,
            },
        ]
    );
}
