'use server';

import { eq, and } from 'drizzle-orm';
import { db, companies, projects, profitSharingRules, results, concepts } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { calculateProfitSharing, type ProfitSharingInput, type ProfitSharingResult, type ProfitSharingRules } from '@/lib/profit-sharing/engine';

export interface CalculatedProfitSharing {
    projectId: string;
    projectName: string;
    netProfit: number;
    totalShare: number;
    formulaType: string;
    breakdown: { description: string; amount: number }[];
}

/**
 * Calculate profit sharing for all projects in a company/period
 * Called automatically after confirmResultsImport
 */
export async function calculateProfitSharingForPeriod(
    companyId: string,
    year: number,
    month: number
): Promise<CalculatedProfitSharing[]> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // Check if company handles profit sharing
    const company = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
    });

    if (!company?.handlesProfitSharing) {
        return []; // Company doesn't handle profit sharing
    }

    // Get all projects that apply profit sharing
    const eligibleProjects = await db.query.projects.findMany({
        where: and(
            eq(projects.companyId, companyId),
            eq(projects.appliesProfitSharing, true),
            eq(projects.isActive, true)
        ),
        with: {
            profitSharingRule: true,
        },
    });

    if (eligibleProjects.length === 0) {
        return []; // No eligible projects
    }

    // Get results for the period to calculate profit data
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

    // Group results by project
    const projectProfits = new Map<string, { income: number; cost: number }>();

    for (const result of periodResults) {
        if (!result.projectId) continue; // Skip admin costs

        if (!projectProfits.has(result.projectId)) {
            projectProfits.set(result.projectId, { income: 0, cost: 0 });
        }

        const projectData = projectProfits.get(result.projectId)!;
        const amount = parseFloat(result.amount) || 0;

        if (result.concept?.type === 'INCOME') {
            projectData.income += amount;
        } else {
            projectData.cost += amount;
        }
    }

    // Calculate profit sharing for each eligible project
    const calculatedResults: CalculatedProfitSharing[] = [];

    for (const project of eligibleProjects) {
        const rule = project.profitSharingRule;
        if (!rule) continue; // No rule configured

        const profitData = projectProfits.get(project.id) || { income: 0, cost: 0 };
        const netProfit = profitData.income - profitData.cost;

        // Convert DB rule to engine format
        const engineRules: ProfitSharingRules = {
            formulaType: rule.formulaType as any,
            fixedAmount: rule.fixedAmount ? parseFloat(rule.fixedAmount) : undefined,
            percentRate: rule.percent1 ? parseFloat(rule.percent1) : undefined,
        };

        // Handle tiered formulas
        if (rule.formulaType === 'TIERED' && rule.threshold1) {
            engineRules.tiers = [
                {
                    minProfit: 0,
                    maxProfit: parseFloat(rule.threshold1),
                    percentRate: rule.percent1 ? parseFloat(rule.percent1) : 0
                },
                {
                    minProfit: parseFloat(rule.threshold1),
                    percentRate: rule.percent2 ? parseFloat(rule.percent2) : 0
                },
            ];
        }

        // Handle special formula
        if (rule.formulaType === 'SPECIAL_FORMULA') {
            engineRules.maximumShare = rule.dynamicIncrement ? parseFloat(rule.dynamicIncrement) : undefined;
        }

        // Handle dynamic formula
        if (rule.formulaType === 'DYNAMIC') {
            engineRules.baseAmount = rule.fixedAmount ? parseFloat(rule.fixedAmount) : undefined;
            engineRules.incrementPercent = rule.percent1 ? parseFloat(rule.percent1) : undefined;
            engineRules.incrementThreshold = rule.threshold1 ? parseFloat(rule.threshold1) : undefined;
        }

        const input: ProfitSharingInput = {
            projectId: project.id,
            projectName: project.name,
            totalIncome: profitData.income,
            totalCost: profitData.cost,
            netProfit,
            rules: engineRules,
        };

        try {
            const result = calculateProfitSharing(input);
            calculatedResults.push({
                projectId: result.projectId,
                projectName: result.projectName,
                netProfit: result.netProfit,
                totalShare: result.totalShare,
                formulaType: result.formulaType,
                breakdown: result.breakdown,
            });
        } catch (error) {
            console.error(`Error calculating profit sharing for ${project.name}:`, error);
        }
    }

    return calculatedResults;
}

/**
 * Get profit sharing calculations for display
 */
export async function getProfitSharingResults(
    companyId: string,
    year: number,
    month: number
): Promise<CalculatedProfitSharing[]> {
    // Recalculate on-demand (could be changed to fetch from stored results)
    return await calculateProfitSharingForPeriod(companyId, year, month);
}
