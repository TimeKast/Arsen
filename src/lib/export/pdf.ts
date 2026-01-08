/**
 * PDF Export Utilities
 * Generates PDF reports using HTML-to-PDF approach
 */

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
    align?: 'left' | 'center' | 'right';
    width?: string;
}

interface TableSection {
    title?: string;
    columns: TableColumn[];
    data: Record<string, any>[];
    totalsRow?: Record<string, any>;
}

/**
 * Generate PDF HTML content
 */
export function generatePdfHtml(
    options: PdfReportOptions,
    sections: TableSection[]
): string {
    const { title, subtitle, companyName, period, generatedAt } = options;

    const headerHtml = `
    <div class="header">
      <div class="company">${companyName}</div>
      <h1>${title}</h1>
      ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
      <div class="meta">Periodo: ${period} | Generado: ${generatedAt}</div>
    </div>
  `;

    const sectionsHtml = sections.map(section => {
        const tableRows = section.data.map(row => {
            const cells = section.columns.map(col =>
                `<td style="text-align: ${col.align || 'left'}">${formatValue(row[col.key])}</td>`
            ).join('');
            return `<tr>${cells}</tr>`;
        }).join('');

        const totalsHtml = section.totalsRow ? `
      <tr class="totals">
        ${section.columns.map(col =>
            `<td style="text-align: ${col.align || 'left'}; font-weight: bold;">
            ${formatValue(section.totalsRow![col.key]) || ''}
          </td>`
        ).join('')}
      </tr>
    ` : '';

        return `
      ${section.title ? `<h2>${section.title}</h2>` : ''}
      <table>
        <thead>
          <tr>
            ${section.columns.map(col =>
            `<th style="text-align: ${col.align || 'left'}; ${col.width ? `width: ${col.width}` : ''}">${col.header}</th>`
        ).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          ${totalsHtml}
        </tbody>
      </table>
    `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Helvetica Neue', Arial, sans-serif; 
          font-size: 11px;
          color: #333;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid #2563eb;
        }
        .company {
          font-size: 14px;
          color: #2563eb;
          font-weight: bold;
          margin-bottom: 5px;
        }
        h1 {
          font-size: 20px;
          color: #1e40af;
          margin: 10px 0;
        }
        .subtitle {
          font-size: 12px;
          color: #666;
        }
        .meta {
          font-size: 10px;
          color: #888;
          margin-top: 10px;
        }
        h2 {
          font-size: 14px;
          color: #1e40af;
          margin: 20px 0 10px 0;
          padding-bottom: 5px;
          border-bottom: 1px solid #e5e7eb;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 8px 10px;
          border: 1px solid #e5e7eb;
        }
        th {
          background: #f3f4f6;
          font-weight: 600;
          font-size: 10px;
          text-transform: uppercase;
          color: #374151;
        }
        tr:nth-child(even) {
          background: #f9fafb;
        }
        .totals {
          background: #e5e7eb !important;
          font-weight: bold;
        }
        .positive { color: #059669; }
        .negative { color: #dc2626; }
      </style>
    </head>
    <body>
      ${headerHtml}
      ${sectionsHtml}
    </body>
    </html>
  `;
}

function formatValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
        return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    }
    return String(value);
}

/**
 * Generate comparison PDF content
 */
export function generateComparisonPdf(
    companyName: string,
    period: string,
    incomeRows: any[],
    costRows: any[],
    totals: any
): string {
    const columns: TableColumn[] = [
        { header: 'Concepto', key: 'conceptName', width: '35%' },
        { header: 'Presupuesto', key: 'budgetAmount', align: 'right' },
        { header: 'Real', key: 'actualAmount', align: 'right' },
        { header: 'Diferencia', key: 'difference', align: 'right' },
        { header: '% Desv.', key: 'deviationPercent', align: 'right' },
    ];

    const incomeData = incomeRows.map(r => ({
        ...r,
        deviationPercent: `${r.deviationPercent.toFixed(1)}%`
    }));

    const costData = costRows.map(r => ({
        ...r,
        deviationPercent: `${r.deviationPercent.toFixed(1)}%`
    }));

    return generatePdfHtml(
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
                    budgetAmount: totals.budgetIncome,
                    actualAmount: totals.actualIncome,
                    difference: totals.actualIncome - totals.budgetIncome,
                    deviationPercent: '',
                },
            },
            {
                title: 'COSTOS',
                columns,
                data: costData,
                totalsRow: {
                    conceptName: 'Total Costos',
                    budgetAmount: totals.budgetCost,
                    actualAmount: totals.actualCost,
                    difference: totals.actualCost - totals.budgetCost,
                    deviationPercent: '',
                },
            },
        ]
    );
}

/**
 * Generate profit sharing PDF content
 */
export function generateProfitSharingPdf(
    companyName: string,
    period: string,
    data: any[],
    totals: { totalProfit: number; totalShare: number; clientShare: number }
): string {
    const processedData = data.map(r => ({
        ...r,
        clientShare: r.netProfit - r.totalShare,
    }));

    return generatePdfHtml(
        {
            title: 'Reparto de Utilidades',
            companyName,
            period,
            generatedAt: new Date().toLocaleDateString('es-MX'),
        },
        [
            {
                columns: [
                    { header: 'Proyecto', key: 'projectName', width: '30%' },
                    { header: 'Formula', key: 'formulaType', align: 'center' },
                    { header: 'Utilidad Bruta', key: 'netProfit', align: 'right' },
                    { header: 'Honorario', key: 'totalShare', align: 'right' },
                    { header: 'Cliente', key: 'clientShare', align: 'right' },
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
 * Generate results PDF content
 */
export function generateResultsPdf(
    companyName: string,
    period: string,
    data: any[]
): string {
    return generatePdfHtml(
        {
            title: 'Resultados del Periodo',
            companyName,
            period,
            generatedAt: new Date().toLocaleDateString('es-MX'),
        },
        [
            {
                columns: [
                    { header: 'Proyecto', key: 'projectName', width: '25%' },
                    { header: 'Area', key: 'areaName' },
                    { header: 'Concepto', key: 'conceptName', width: '30%' },
                    { header: 'Tipo', key: 'conceptType', align: 'center' },
                    { header: 'Monto', key: 'amount', align: 'right' },
                ],
                data,
            },
        ]
    );
}

/**
 * Generate budgets PDF content
 */
export function generateBudgetsPdf(
    companyName: string,
    period: string,
    data: any[]
): string {
    return generatePdfHtml(
        {
            title: 'Presupuestos',
            companyName,
            period,
            generatedAt: new Date().toLocaleDateString('es-MX'),
        },
        [
            {
                columns: [
                    { header: 'Area', key: 'areaName', width: '25%' },
                    { header: 'Concepto', key: 'conceptName', width: '40%' },
                    { header: 'Tipo', key: 'conceptType', align: 'center' },
                    { header: 'Monto', key: 'amount', align: 'right' },
                ],
                data,
            },
        ]
    );
}
