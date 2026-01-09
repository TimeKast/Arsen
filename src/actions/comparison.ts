'use server';

import { eq, and } from 'drizzle-orm';
import { db, budgets, results, concepts, areas, projects } from '@/lib/db';
import { auth } from '@/lib/auth/config';

export interface ComparisonRow {
    conceptId: string;
    conceptName: string;
    conceptType: 'INCOME' | 'COST';
    areaName?: string;
    budget: number;
    actual: number;
    difference: number;
    percentDeviation: number;
}

export interface ComparisonData {
    incomeRows: ComparisonRow[];
    costRows: ComparisonRow[];
    totals: {
        budgetIncome: number;
        actualIncome: number;
        budgetCost: number;
        actualCost: number;
        budgetNet: number;
        actualNet: number;
    };
}

// Get comparison data for a company/period
export async function getComparisonData(
    companyId: string,
    year: number,
    month: number,
    projectId?: string
): Promise<ComparisonData> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // Build budget conditions
    const budgetConditions = [
        eq(budgets.companyId, companyId),
        eq(budgets.year, year),
        eq(budgets.month, month)
    ];
    if (projectId) {
        budgetConditions.push(eq(budgets.projectId, projectId));
    }

    // Get all budgets for the period
    const periodBudgets = await db.query.budgets.findMany({
        where: and(...budgetConditions),
        with: {
            concept: true,
            area: true,
        },
    });

    // Build result conditions
    const resultConditions = [
        eq(results.companyId, companyId),
        eq(results.year, year),
        eq(results.month, month)
    ];
    if (projectId) {
        resultConditions.push(eq(results.projectId, projectId));
    }

    // Get all results for the period (sum by concept)
    const periodResults = await db.query.results.findMany({
        where: and(...resultConditions),
        with: {
            concept: true,
        },
    });

    // Group results by concept
    const resultsByConceptId = new Map<string, number>();
    for (const result of periodResults) {
        const current = resultsByConceptId.get(result.conceptId) || 0;
        resultsByConceptId.set(result.conceptId, current + (parseFloat(result.amount) || 0));
    }

    // Build comparison rows from budgets
    const rowMap = new Map<string, ComparisonRow>();

    for (const budget of periodBudgets) {
        const conceptId = budget.conceptId;
        const budgetAmount = parseFloat(budget.amount) || 0;

        if (!rowMap.has(conceptId)) {
            rowMap.set(conceptId, {
                conceptId,
                conceptName: budget.concept?.name || 'Desconocido',
                conceptType: budget.concept?.type || 'COST',
                areaName: budget.area?.name,
                budget: 0,
                actual: 0,
                difference: 0,
                percentDeviation: 0,
            });
        }

        const row = rowMap.get(conceptId)!;
        row.budget += budgetAmount;
    }

    // Add actual values and calculate deviations
    for (const [conceptId, actualAmount] of resultsByConceptId) {
        if (!rowMap.has(conceptId)) {
            // Concept exists in results but not in budget
            const result = periodResults.find(r => r.conceptId === conceptId);
            rowMap.set(conceptId, {
                conceptId,
                conceptName: result?.concept?.name || 'Desconocido',
                conceptType: result?.concept?.type || 'COST',
                budget: 0,
                actual: actualAmount,
                difference: -actualAmount,
                percentDeviation: -100,
            });
        } else {
            const row = rowMap.get(conceptId)!;
            row.actual = actualAmount;
        }
    }

    // Calculate differences and percentages
    for (const row of rowMap.values()) {
        row.difference = row.budget - row.actual;
        if (row.budget !== 0) {
            row.percentDeviation = ((row.budget - row.actual) / row.budget) * 100;
        } else if (row.actual !== 0) {
            row.percentDeviation = -100; // Over budget
        }
    }

    // Separate into income and cost rows
    const incomeRows = Array.from(rowMap.values())
        .filter(r => r.conceptType === 'INCOME')
        .sort((a, b) => a.conceptName.localeCompare(b.conceptName));

    const costRows = Array.from(rowMap.values())
        .filter(r => r.conceptType === 'COST')
        .sort((a, b) => a.conceptName.localeCompare(b.conceptName));

    // Calculate totals
    const totals = {
        budgetIncome: incomeRows.reduce((sum, r) => sum + r.budget, 0),
        actualIncome: incomeRows.reduce((sum, r) => sum + r.actual, 0),
        budgetCost: costRows.reduce((sum, r) => sum + r.budget, 0),
        actualCost: costRows.reduce((sum, r) => sum + r.actual, 0),
        budgetNet: 0,
        actualNet: 0,
    };
    totals.budgetNet = totals.budgetIncome - totals.budgetCost;
    totals.actualNet = totals.actualIncome - totals.actualCost;

    return { incomeRows, costRows, totals };
}
