'use server';

import { eq, and, desc } from 'drizzle-orm';
import { db, results, projects, concepts, budgets } from '@/lib/db';
import { auth } from '@/lib/auth/config';

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
    month: number
): Promise<DashboardKPIs> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // Get results for the period
    const periodResults = await db.query.results.findMany({
        where: and(
            eq(results.companyId, companyId),
            eq(results.year, year),
            eq(results.month, month)
        ),
        with: {
            concept: true,
        },
    });

    // Get budgets for the period
    const periodBudgets = await db.query.budgets.findMany({
        where: and(
            eq(budgets.companyId, companyId),
            eq(budgets.year, year),
            eq(budgets.month, month)
        ),
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
    month: number
): Promise<TopProject[]> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // Get all results for the period
    const periodResults = await db.query.results.findMany({
        where: and(
            eq(results.companyId, companyId),
            eq(results.year, year),
            eq(results.month, month)
        ),
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

// Get trend data for last 6 months
export async function getTrendData(
    companyId: string,
    year: number,
    month: number
): Promise<TrendDataPoint[]> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const trendData: TrendDataPoint[] = [];

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
        let targetMonth = month - i;
        let targetYear = year;

        while (targetMonth <= 0) {
            targetMonth += 12;
            targetYear--;
        }

        // Get results for this month
        const monthResults = await db.query.results.findMany({
            where: and(
                eq(results.companyId, companyId),
                eq(results.year, targetYear),
                eq(results.month, targetMonth)
            ),
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
