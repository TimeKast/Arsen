'use server';

import { eq, and, desc, inArray, isNull, or } from 'drizzle-orm';
import { db, results, projects, concepts, budgets } from '@/lib/db';
import { auth } from '@/lib/auth/config';

// Special ID for admin/no-project items
const ADMIN_PROJECT_ID = '__ADMIN__';

export interface DashboardKPIs {
    totalIncome: number;
    totalCost: number;
    netProfit: number;
    budgetDeviation: number;
    budgetDeviationPercent: number;
}

export interface TopProject {
    projectId: string;
    projectName: string;
    income: number;
    cost: number;
    profit: number;
}

export interface TrendDataPoint {
    year: number;
    month: number;
    label: string;
    income: number;
    cost: number;
    profit: number;
}

// Get dashboard KPIs for the current period
export async function getDashboardKPIs(
    companyId: string,
    year: number,
    month: number,
    projectIds?: string[]
): Promise<DashboardKPIs> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // Check if admin is selected
    const includeAdmin = projectIds?.includes(ADMIN_PROJECT_ID);
    const realProjectIds = projectIds?.filter(id => id !== ADMIN_PROJECT_ID) || [];

    // Build conditions - month=0 means all months
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

    // Get results for the period
    const periodResults = await db.query.results.findMany({
        where: and(...resultConditions),
        with: {
            concept: true,
        },
    });

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

    // Get budgets for the period
    const periodBudgets = await db.query.budgets.findMany({
        where: and(...budgetConditions),
        with: {
            concept: true,
        },
    });

    // Calculate actual income and cost
    let totalIncome = 0;
    let totalCost = 0;

    for (const result of periodResults) {
        const amount = parseFloat(result.amount) || 0;
        if (result.concept?.type === 'INCOME') {
            totalIncome += amount;
        } else {
            totalCost += amount;
        }
    }

    // Calculate budget totals
    let budgetIncome = 0;
    let budgetCost = 0;

    for (const budget of periodBudgets) {
        const amount = parseFloat(budget.amount) || 0;
        if (budget.concept?.type === 'INCOME') {
            budgetIncome += amount;
        } else {
            budgetCost += amount;
        }
    }

    const netProfit = totalIncome - totalCost;
    const budgetNet = budgetIncome - budgetCost;
    const budgetDeviation = netProfit - budgetNet;
    const budgetDeviationPercent = budgetNet !== 0
        ? ((netProfit - budgetNet) / Math.abs(budgetNet)) * 100
        : 0;

    return {
        totalIncome,
        totalCost,
        netProfit,
        budgetDeviation,
        budgetDeviationPercent,
    };
}

// Get top 5 projects by profit
export async function getTopProjects(
    companyId: string,
    year: number,
    month: number,
    projectIds?: string[]
): Promise<TopProject[]> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // Get real project IDs (excluding admin)
    const realProjectIds = projectIds?.filter(id => id !== ADMIN_PROJECT_ID) || [];

    // Build conditions - month=0 means all months
    const conditions = [
        eq(results.companyId, companyId),
        eq(results.year, year),
    ];
    if (month > 0) {
        conditions.push(eq(results.month, month));
    }
    // Filter by multiple projects if specified
    if (realProjectIds.length > 0) {
        conditions.push(inArray(results.projectId, realProjectIds));
    }

    // Get all results for the period
    const periodResults = await db.query.results.findMany({
        where: and(...conditions),
        with: {
            project: true,
            concept: true,
        },
    });

    // Group by project
    const projectMap = new Map<string, TopProject>();

    for (const result of periodResults) {
        if (!result.projectId) continue; // Skip admin costs

        if (!projectMap.has(result.projectId)) {
            projectMap.set(result.projectId, {
                projectId: result.projectId,
                projectName: result.project?.name || 'Desconocido',
                income: 0,
                cost: 0,
                profit: 0,
            });
        }

        const project = projectMap.get(result.projectId)!;
        const amount = parseFloat(result.amount) || 0;

        if (result.concept?.type === 'INCOME') {
            project.income += amount;
        } else {
            project.cost += amount;
        }
    }

    // Calculate profit and sort
    for (const project of projectMap.values()) {
        project.profit = project.income - project.cost;
    }

    return Array.from(projectMap.values())
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5);
}

// Get trend data - when month=0, show all 12 months; otherwise show last 6 months
export async function getTrendData(
    companyId: string,
    year: number,
    month: number,
    projectIds?: string[]
): Promise<TrendDataPoint[]> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // Check if admin is selected
    const includeAdmin = projectIds?.includes(ADMIN_PROJECT_ID);
    const realProjectIds = projectIds?.filter(id => id !== ADMIN_PROJECT_ID) || [];

    const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const trendData: TrendDataPoint[] = [];

    // Determine which months to show
    const monthsToShow: { targetYear: number; targetMonth: number }[] = [];

    if (month === 0) {
        // Show all 12 months of the selected year
        for (let m = 1; m <= 12; m++) {
            monthsToShow.push({ targetYear: year, targetMonth: m });
        }
    } else {
        // Show last 6 months relative to selected month
        for (let i = 5; i >= 0; i--) {
            let targetMonth = month - i;
            let targetYear = year;

            while (targetMonth <= 0) {
                targetMonth += 12;
                targetYear--;
            }
            monthsToShow.push({ targetYear, targetMonth });
        }
    }

    for (const { targetYear, targetMonth } of monthsToShow) {
        const conditions: ReturnType<typeof eq>[] = [
            eq(results.companyId, companyId),
            eq(results.year, targetYear),
            eq(results.month, targetMonth)
        ];
        // Filter by multiple projects if specified
        if (projectIds && projectIds.length > 0) {
            if (realProjectIds.length > 0 && includeAdmin) {
                conditions.push(or(inArray(results.projectId, realProjectIds), isNull(results.projectId)) as ReturnType<typeof eq>);
            } else if (realProjectIds.length > 0) {
                conditions.push(inArray(results.projectId, realProjectIds) as ReturnType<typeof eq>);
            } else if (includeAdmin) {
                conditions.push(isNull(results.projectId) as ReturnType<typeof eq>);
            }
        }

        // Get results for this month
        const monthResults = await db.query.results.findMany({
            where: and(...conditions),
            with: {
                concept: true,
            },
        });

        let income = 0;
        let cost = 0;

        for (const result of monthResults) {
            const amount = parseFloat(result.amount) || 0;
            if (result.concept?.type === 'INCOME') {
                income += amount;
            } else {
                cost += amount;
            }
        }

        trendData.push({
            year: targetYear,
            month: targetMonth,
            label: MONTH_NAMES[targetMonth - 1],
            income,
            cost,
            profit: income - cost,
        });
    }

    return trendData;
}
