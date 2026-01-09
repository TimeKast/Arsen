'use server';

import { eq, and, desc } from 'drizzle-orm';
import { db, results, projects, concepts } from '@/lib/db';
import { auth } from '@/lib/auth/config';

export interface ProjectResult {
    projectId: string | null;
    projectName: string;
    totalIncome: number;
    totalCost: number;
    netResult: number;
    concepts: ConceptResult[];
}

export interface ConceptResult {
    conceptId: string;
    conceptName: string;
    conceptType: 'INCOME' | 'COST';
    amount: number;
    source: 'O' | 'M'; // O=Otros, M=Monthly
}

// Get results for a company/period
export async function getResultsForPeriod(
    companyId: string,
    year: number,
    month: number
): Promise<{ projectResults: ProjectResult[]; adminResults: ProjectResult | null }> {
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
    const projectMap = new Map<string | null, ProjectResult>();

    for (const result of periodResults) {
        const projectId = result.projectId;
        const projectName = result.project?.name || 'Administración';

        if (!projectMap.has(projectId)) {
            projectMap.set(projectId, {
                projectId,
                projectName,
                totalIncome: 0,
                totalCost: 0,
                netResult: 0,
                concepts: [],
            });
        }

        const projectData = projectMap.get(projectId)!;
        const amount = parseFloat(result.amount) || 0;
        const conceptType = result.concept?.type || 'COST';

        if (conceptType === 'INCOME') {
            projectData.totalIncome += amount;
        } else {
            projectData.totalCost += amount;
        }

        projectData.concepts.push({
            conceptId: result.conceptId,
            conceptName: result.concept?.name || 'Desconocido',
            conceptType,
            amount,
            source: (result.source as 'O' | 'M') || 'M',
        });
    }

    // Calculate net result for each project
    for (const project of projectMap.values()) {
        project.netResult = project.totalIncome - project.totalCost;
        // Sort concepts: source M first, then O; within each source: INCOME first, then COST; then by name
        project.concepts.sort((a, b) => {
            // First by source: M (Monthly) before O (Otros)
            if (a.source !== b.source) {
                return a.source === 'M' ? -1 : 1;
            }
            // Then by type: INCOME before COST
            if (a.conceptType !== b.conceptType) {
                return a.conceptType === 'INCOME' ? -1 : 1;
            }
            // Then by name
            return a.conceptName.localeCompare(b.conceptName);
        });
    }

    // Separate admin (null project) from others
    const adminResults = projectMap.get(null) || null;
    projectMap.delete(null);

    // Sort projects by name
    const projectResults = Array.from(projectMap.values()).sort((a, b) =>
        a.projectName.localeCompare(b.projectName)
    );

    return { projectResults, adminResults };
}

// Get available periods that have results
export async function getAvailableResultPeriods(companyId: string): Promise<{ year: number; month: number }[]> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    const allResults = await db.query.results.findMany({
        where: eq(results.companyId, companyId),
        columns: {
            year: true,
            month: true,
        },
    });

    // Get unique periods
    const periodSet = new Set<string>();
    const periods: { year: number; month: number }[] = [];

    for (const result of allResults) {
        const key = `${result.year}-${result.month}`;
        if (!periodSet.has(key)) {
            periodSet.add(key);
            periods.push({ year: result.year, month: result.month });
        }
    }

    // Sort by year desc, month desc
    periods.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    });

    return periods;
}

/**
 * Get flat results for export view
 */
export async function getResultsForView(
    companyId: string,
    year: number,
    month: number
) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    const periodResults = await db.query.results.findMany({
        where: and(
            eq(results.companyId, companyId),
            eq(results.year, year),
            eq(results.month, month)
        ),
        with: {
            project: true,
            concept: {
                with: {
                    area: true,
                },
            },
        },
    });

    return periodResults.map(r => ({
        projectName: r.project?.name || 'Gastos Admin',
        areaName: r.concept?.area?.name || '-',
        conceptName: r.concept?.name || '-',
        conceptType: r.concept?.type || '-',
        amount: parseFloat(r.amount) || 0,
    }));
}
