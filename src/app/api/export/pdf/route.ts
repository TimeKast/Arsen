import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db, companies } from '@/lib/db';
import { eq } from 'drizzle-orm';
import {
    generateComparisonPdfBinary,
    generateProfitSharingPdfBinary,
    generateResultsPdfBinary,
    generateBudgetsPdfBinary,
} from '@/lib/export/pdf-binary';
import { getComparisonData } from '@/actions/comparison';
import { getProfitSharingResults } from '@/actions/profit-sharing-calc';
import { getResultsForView } from '@/actions/results-view';
import { getBudgetsForView } from '@/actions/budget-view';

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('type');
    const companyId = searchParams.get('companyId');
    const year = parseInt(searchParams.get('year') || '2024');
    const month = parseInt(searchParams.get('month') || '1');

    if (!reportType || !companyId) {
        return NextResponse.json({ error: 'Parametros faltantes' }, { status: 400 });
    }

    try {
        // Get company name
        const company = await db.query.companies.findFirst({
            where: eq(companies.id, companyId),
        });
        const companyName = company?.name || 'Empresa';
        const period = `${year}-${String(month).padStart(2, '0')}`;

        let pdfBuffer: Buffer;

        switch (reportType) {
            case 'comparison':
                const comparisonData = await getComparisonData(companyId, year, month);
                pdfBuffer = generateComparisonPdfBinary(
                    companyName,
                    period,
                    comparisonData.incomeRows,
                    comparisonData.costRows,
                    comparisonData.totals
                );
                break;

            case 'profit-sharing':
                const psData = await getProfitSharingResults(companyId, year, month);
                const totalProfit = psData.reduce((s, d) => s + d.netProfit, 0);
                const totalShare = psData.reduce((s, d) => s + d.totalShare, 0);
                pdfBuffer = generateProfitSharingPdfBinary(
                    companyName,
                    period,
                    psData,
                    { totalProfit, totalShare, clientShare: totalProfit - totalShare }
                );
                break;

            case 'results':
                const resultsData = await getResultsForView(companyId, year, month);
                pdfBuffer = generateResultsPdfBinary(companyName, period, resultsData);
                break;

            case 'budgets':
                const budgetsData = await getBudgetsForView(companyId, year, month);
                pdfBuffer = generateBudgetsPdfBinary(companyName, period, budgetsData);
                break;

            default:
                return NextResponse.json({ error: 'Tipo de reporte invalido' }, { status: 400 });
        }

        const filename = `${reportType}_${companyName.replace(/\s+/g, '_')}_${period}.pdf`;

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': String(pdfBuffer.length),
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Error al exportar' }, { status: 500 });
    }
}
