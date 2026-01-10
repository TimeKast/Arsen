'use server';

import { eq, and } from 'drizzle-orm';
import { db, budgets, results, concepts, areas, projects } from '@/lib/db';
import { auth } from '@/lib/auth/config';

export interface ComparisonRow {
    conceptId: string;
    conceptName: string;
    conceptType: 'INCOME' | 'COST';
    areaName?: string;
    isOtros: boolean; // True if from "Otros" area or source
    budget: number;
    actual: number;
    difference: number;
    percentDeviation: number;
}

export interface ComparisonData {
    incomeRows: ComparisonRow[];
    costRows: ComparisonRow[];
    otrosRows: ComparisonRow[]; // Separate array for Otros items
    totals: {
        budgetIncome: number;
        actualIncome: number;
        budgetCost: number;
        actualCost: number;
        budgetNet: number;
        actualNet: number;
    };
}

// Helper to detect "Otros" area name
const isOtrosArea = (areaName: string | undefined): boolean => {
    if (!areaName) return false;
    const normalized = areaName.toLowerCase().trim();
    return normalized === 'otros' || normalized.endsWith('otros') || /\(\d+\)\s*otros/i.test(areaName);
};

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

    // Build budget conditions - month=0 means all months
    const budgetConditions = [
        eq(budgets.companyId, companyId),
        eq(budgets.year, year),
    ];
    if (month > 0) {
        budgetConditions.push(eq(budgets.month, month));
    }
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

    console.log(`[COMPARISON] Query: companyId=${companyId}, year=${year}, month=${month === 0 ? 'ALL' : month}, projectId=${projectId || 'all'}`);
    console.log(`[COMPARISON] Found ${periodBudgets.length} budgets`);

    // Build result conditions - month=0 means all months
    const resultConditions = [
        eq(results.companyId, companyId),
        eq(results.year, year),
    ];
    if (month > 0) {
        resultConditions.push(eq(results.month, month));
    }
    if (projectId) {
        resultConditions.push(eq(results.projectId, projectId));
    }

    // Get all results for the period
    const periodResults = await db.query.results.findMany({
        where: and(...resultConditions),
        with: {
            concept: true,
        },
    });

    // Group results by concept + source (to separate Otros)
    const resultsByKey = new Map<string, { amount: number; isOtros: boolean }>();
    for (const result of periodResults) {
        const isOtros = result.source === 'O';
        const key = `${result.conceptId}|${isOtros ? 'O' : 'R'}`;
        if (!resultsByKey.has(key)) {
            resultsByKey.set(key, { amount: 0, isOtros });
        }
        resultsByKey.get(key)!.amount += parseFloat(result.amount) || 0;
    }

    // Build comparison rows from budgets
    const rowMap = new Map<string, ComparisonRow>();

    for (const budget of periodBudgets) {
        const conceptId = budget.conceptId;
        const budgetAmount = parseFloat(budget.amount) || 0;
        const budgetIsOtros = isOtrosArea(budget.area?.name);
        const key = `${conceptId}|${budgetIsOtros ? 'O' : 'R'}`;

        if (!rowMap.has(key)) {
            rowMap.set(key, {
                conceptId,
                conceptName: budget.concept?.name || 'Desconocido',
                conceptType: budget.concept?.type || 'COST',
                areaName: budget.area?.name,
                isOtros: budgetIsOtros,
                budget: 0,
                actual: 0,
                difference: 0,
                percentDeviation: 0,
            });
        }

        const row = rowMap.get(key)!;
        row.budget += budgetAmount;
    }

    // Add actual values from results
    for (const [key, data] of resultsByKey) {
        const [conceptId] = key.split('|');

        if (!rowMap.has(key)) {
            // Concept exists in results but not in budget
            const result = periodResults.find(r => r.conceptId === conceptId);
            rowMap.set(key, {
                conceptId,
                conceptName: result?.concept?.name || 'Desconocido',
                conceptType: result?.concept?.type || 'COST',
                isOtros: data.isOtros,
                budget: 0,
                actual: data.amount,
                difference: -data.amount,
                percentDeviation: -100,
            });
        } else {
            const row = rowMap.get(key)!;
            row.actual = data.amount;
        }
    }

    // Calculate differences and percentages
    for (const row of rowMap.values()) {
        row.difference = row.budget - row.actual;
        if (row.budget !== 0) {
            row.percentDeviation = ((row.budget - row.actual) / row.budget) * 100;
        } else if (row.actual !== 0) {
            row.percentDeviation = -100;
        }
    }

    // Separate into income, cost, and otros rows
    const incomeRows = Array.from(rowMap.values())
        .filter(r => r.conceptType === 'INCOME' && !r.isOtros)
        .sort((a, b) => a.conceptName.localeCompare(b.conceptName));

    const costRows = Array.from(rowMap.values())
        .filter(r => r.conceptType === 'COST' && !r.isOtros)
        .sort((a, b) => a.conceptName.localeCompare(b.conceptName));

    const otrosRows = Array.from(rowMap.values())
        .filter(r => r.isOtros)
        .sort((a, b) => {
            if (a.conceptType !== b.conceptType) return a.conceptType === 'INCOME' ? -1 : 1;
            return a.conceptName.localeCompare(b.conceptName);
        });

    // Calculate totals (including Otros in the appropriate category)
    const allRows = Array.from(rowMap.values());
    const totals = {
        budgetIncome: allRows.filter(r => r.conceptType === 'INCOME').reduce((sum, r) => sum + r.budget, 0),
        actualIncome: allRows.filter(r => r.conceptType === 'INCOME').reduce((sum, r) => sum + r.actual, 0),
        budgetCost: allRows.filter(r => r.conceptType === 'COST').reduce((sum, r) => sum + r.budget, 0),
        actualCost: allRows.filter(r => r.conceptType === 'COST').reduce((sum, r) => sum + r.actual, 0),
        budgetNet: 0,
        actualNet: 0,
    };
    totals.budgetNet = totals.budgetIncome - totals.budgetCost;
    totals.actualNet = totals.actualIncome - totals.actualCost;

    return { incomeRows, costRows, otrosRows, totals };
}
