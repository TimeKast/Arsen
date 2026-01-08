'use server';

import { eq, and } from 'drizzle-orm';
import { db, budgets } from '@/lib/db';
import { auth } from '@/lib/auth/config';

/**
 * Get budgets for export view
 */
export async function getBudgetsForView(
    companyId: string,
    year: number,
    month: number
) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    const results = await db.query.budgets.findMany({
        where: and(
            eq(budgets.companyId, companyId),
            eq(budgets.year, year),
            eq(budgets.month, month)
        ),
        with: {
            area: true,
            concept: true,
        },
    });

    return results.map(r => ({
        areaName: r.area?.name || '-',
        conceptName: r.concept?.name || '-',
        conceptType: r.concept?.type || '-',
        amount: parseFloat(r.amount) || 0,
    }));
}
