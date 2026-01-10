'use server';

import { eq, and, inArray, isNull, or } from 'drizzle-orm';
import { db, budgets, results, concepts, areas, projects } from '@/lib/db';
import { auth } from '@/lib/auth/config';

// Special ID for admin/no-project items
const ADMIN_PROJECT_ID = '__ADMIN__';

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
    projectIds?: string[]
): Promise<ComparisonData> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // Check if admin is selected
    const includeAdmin = projectIds?.includes(ADMIN_PROJECT_ID);
    const realProjectIds = projectIds?.filter(id => id !== ADMIN_PROJECT_ID) || [];

    // Build budget conditions - month=0 means all months
    const budgetConditions = [
        eq(budgets.companyId, companyId),
        eq(budgets.year, year),
    ];
    if (month > 0) {
        budgetConditions.push(eq(budgets.month, month));
    }
    // Filter by multiple projects if specified
    if (projectIds && projectIds.length > 0) {
        if (realProjectIds.length > 0 && includeAdmin) {
            budgetConditions.push(or(inArray(budgets.projectId, realProjectIds), isNull(budgets.projectId))!);
        } else if (realProjectIds.length > 0) {
            budgetConditions.push(inArray(budgets.projectId, realProjectIds));
        } else if (includeAdmin) {
            budgetConditions.push(isNull(budgets.projectId));
        }
    }

    // Get all budgets for the period
    const periodBudgets = await db.query.budgets.findMany({
        where: and(...budgetConditions),
        with: {
            concept: true,
            area: true,
        },
    });

    console.log(`[COMPARISON] Query: companyId=${companyId}, year=${year}, month=${month === 0 ? 'ALL' : month}, projectIds=${projectIds?.join(',') || 'all'}`);
    console.log(`[COMPARISON] Found ${periodBudgets.length} budgets`);

    // Build result conditions - month=0 means all months
    const resultConditions = [
        eq(results.companyId, companyId),
        eq(results.year, year),
    ];
    if (month > 0) {
        resultConditions.push(eq(results.month, month));
    }
    // Filter by multiple projects if specified
    if (projectIds && projectIds.length > 0) {
        if (realProjectIds.length > 0 && includeAdmin) {
            resultConditions.push(or(inArray(results.projectId, realProjectIds), isNull(results.projectId))!);
        } else if (realProjectIds.length > 0) {
            resultConditions.push(inArray(results.projectId, realProjectIds));
        } else if (includeAdmin) {
            resultConditions.push(isNull(results.projectId));
        }
    }

    // Get all results for the period
    const periodResults = await db.query.results.findMany({
        where: and(...resultConditions),
        with: {
            concept: true,
        },
    });

    console.log(`[COMPARISON] Query: company=${companyId}, year=${year}, month=${month}, budgets=${periodBudgets.length}, results=${periodResults.length}`);

    // Group results by CONCEPT NAME (not ID) - to handle duplicate concepts with same name
    const resultsByName = new Map<string, { amount: number; hasOtrosSource: boolean; conceptId: string; conceptType: 'INCOME' | 'COST' }>();
    for (const result of periodResults) {
        const conceptName = result.concept?.name || 'Desconocido';
        if (!resultsByName.has(conceptName)) {
            resultsByName.set(conceptName, {
                amount: 0,
                hasOtrosSource: false,
                conceptId: result.conceptId,
                conceptType: result.concept?.type || 'COST'
            });
        }
        const entry = resultsByName.get(conceptName)!;
        entry.amount += parseFloat(result.amount) || 0;
        if (result.source === 'O') {
            entry.hasOtrosSource = true;
        }
    }

    // Group budgets by CONCEPT NAME - track if concept has ANY non-Otros budget
    const budgetsByName = new Map<string, {
        amount: number;
        hasOtrosBudget: boolean;
        hasNonOtrosBudget: boolean;
        conceptId: string;
        conceptType: 'INCOME' | 'COST';
        areaName?: string;
    }>();

    for (const budget of periodBudgets) {
        const conceptName = budget.concept?.name || 'Desconocido';
        const budgetAmount = parseFloat(budget.amount) || 0;
        const isFromOtrosArea = isOtrosArea(budget.area?.name);

        if (!budgetsByName.has(conceptName)) {
            budgetsByName.set(conceptName, {
                amount: 0,
                hasOtrosBudget: false,
                hasNonOtrosBudget: false,
                conceptId: budget.conceptId,
                conceptType: budget.concept?.type || 'COST',
                areaName: budget.area?.name,
            });
        }

        const entry = budgetsByName.get(conceptName)!;
        entry.amount += budgetAmount;
        if (isFromOtrosArea) {
            entry.hasOtrosBudget = true;
        } else {
            entry.hasNonOtrosBudget = true;
        }
    }

    // Build final rows - each CONCEPT NAME appears exactly once
    const rowMap = new Map<string, ComparisonRow>();

    // First, add all concepts that have budgets
    for (const [conceptName, budgetData] of budgetsByName) {
        // Concept is "Otros" only if it has Otros budget AND no non-Otros budget
        const isOtros = budgetData.hasOtrosBudget && !budgetData.hasNonOtrosBudget;

        rowMap.set(conceptName, {
            conceptId: budgetData.conceptId,
            conceptName,
            conceptType: budgetData.conceptType,
            areaName: budgetData.areaName,
            isOtros,
            budget: budgetData.amount,
            actual: 0,
            difference: 0,
            percentDeviation: 0,
        });
    }

    // Add actual values from results
    for (const [conceptName, resultData] of resultsByName) {
        if (!rowMap.has(conceptName)) {
            // Concept only in results (no budget) - it's "Otros" if all its results are from source 'O'
            rowMap.set(conceptName, {
                conceptId: resultData.conceptId,
                conceptName,
                conceptType: resultData.conceptType,
                isOtros: resultData.hasOtrosSource,
                budget: 0,
                actual: resultData.amount,
                difference: -resultData.amount,
                percentDeviation: -100,
            });
        } else {
            const row = rowMap.get(conceptName)!;
            row.actual = resultData.amount;
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

    // Debug log
    console.log(`[COMPARISON] Total unique concepts (by name): ${rowMap.size}`);

    // Separate into income, cost, and otros rows
    // A concept goes to otrosRows if its budget is from Otros area
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

    // Debug: Check for any concept appearing in multiple arrays (should be impossible)
    const incomeIds = new Set(incomeRows.map(r => r.conceptId));
    const costIds = new Set(costRows.map(r => r.conceptId));
    const otrosIds = new Set(otrosRows.map(r => r.conceptId));

    console.log(`[COMPARISON] Income rows: ${incomeRows.length}, Cost rows: ${costRows.length}, Otros rows: ${otrosRows.length}`);

    // Check for duplicates within each array
    const checkDuplicates = (arr: ComparisonRow[], name: string) => {
        const seen = new Set<string>();
        for (const r of arr) {
            if (seen.has(r.conceptId)) {
                console.error(`[COMPARISON] DUPLICATE in ${name}: ${r.conceptId} - ${r.conceptName}`);
            }
            seen.add(r.conceptId);
        }
    };
    checkDuplicates(incomeRows, 'incomeRows');
    checkDuplicates(costRows, 'costRows');
    checkDuplicates(otrosRows, 'otrosRows');

    // Check for overlap between arrays
    for (const id of incomeIds) {
        if (costIds.has(id)) console.error(`[COMPARISON] Concept ${id} in BOTH income AND cost!`);
        if (otrosIds.has(id)) console.error(`[COMPARISON] Concept ${id} in BOTH income AND otros!`);
    }
    for (const id of costIds) {
        if (otrosIds.has(id)) console.error(`[COMPARISON] Concept ${id} in BOTH cost AND otros!`);
    }

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
