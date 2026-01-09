'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { db, budgets, concepts, areas, projects } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';

// Budget entry schema
const budgetEntrySchema = z.object({
    conceptId: z.string().uuid(),
    month: z.number().min(1).max(12),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Valor invalido'),
});

const saveBudgetSchema = z.object({
    companyId: z.string().uuid(),
    areaId: z.string().uuid(),
    year: z.number().min(2020).max(2100),
    entries: z.array(budgetEntrySchema),
});

export type BudgetEntry = z.infer<typeof budgetEntrySchema>;
export type SaveBudgetData = z.infer<typeof saveBudgetSchema>;

// Get areas for budget capture (filtered by user for AREA_USER)
export async function getAreasForBudget(companyId: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // AREA_USER only sees their assigned area
    if (session.user.role === 'AREA_USER' && session.user.areaId) {
        return await db.query.areas.findMany({
            where: and(
                eq(areas.companyId, companyId),
                eq(areas.id, session.user.areaId),
                eq(areas.isActive, true)
            ),
            orderBy: (areas, { asc }) => [asc(areas.name)],
        });
    }

    // Others see all areas of the company
    return await db.query.areas.findMany({
        where: and(
            eq(areas.companyId, companyId),
            eq(areas.isActive, true)
        ),
        orderBy: (areas, { asc }) => [asc(areas.name)],
    });
}

// Get concepts for an area (or unassigned concepts)
export async function getConceptsForArea(areaId: string | null) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // Get concepts assigned to the area OR unassigned (null areaId) 
    const allConcepts = await db.query.concepts.findMany({
        where: eq(concepts.isActive, true),
        orderBy: (concepts, { asc }) => [asc(concepts.type), asc(concepts.name)],
    });

    // Filter: concepts with matching areaId or null areaId (global concepts)
    return allConcepts.filter(c => c.areaId === areaId || c.areaId === null);
}

// Get budget for a specific area/year
export async function getBudgetData(companyId: string, areaId: string, year: number) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // Verify access for AREA_USER
    if (session.user.role === 'AREA_USER' && session.user.areaId !== areaId) {
        throw new Error('No autorizado para esta area');
    }

    const budgetData = await db.query.budgets.findMany({
        where: and(
            eq(budgets.companyId, companyId),
            eq(budgets.areaId, areaId),
            eq(budgets.year, year)
        ),
    });

    return budgetData;
}

// Save budget entries (batch upsert)
export async function saveBudget(data: SaveBudgetData) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // Only ADMIN, STAFF, AREA_USER can save
    const allowedRoles = ['ADMIN', 'STAFF', 'AREA_USER'];
    if (!allowedRoles.includes(session.user.role)) {
        throw new Error('No autorizado');
    }

    // Verify access for AREA_USER
    if (session.user.role === 'AREA_USER' && session.user.areaId !== data.areaId) {
        throw new Error('No autorizado para esta area');
    }

    const validated = saveBudgetSchema.parse(data);

    // Process each entry
    for (const entry of validated.entries) {
        const amount = parseFloat(entry.amount);
        if (amount < 0) {
            throw new Error('Los valores deben ser >= 0');
        }

        // Check if exists
        const existing = await db.query.budgets.findFirst({
            where: and(
                eq(budgets.companyId, validated.companyId),
                eq(budgets.areaId, validated.areaId),
                eq(budgets.conceptId, entry.conceptId),
                eq(budgets.year, validated.year),
                eq(budgets.month, entry.month)
            ),
        });

        if (existing) {
            // Update
            await db.update(budgets)
                .set({
                    amount: entry.amount,
                    updatedAt: new Date(),
                })
                .where(eq(budgets.id, existing.id));
        } else {
            // Insert
            await db.insert(budgets).values({
                companyId: validated.companyId,
                areaId: validated.areaId,
                conceptId: entry.conceptId,
                year: validated.year,
                month: entry.month,
                amount: entry.amount,
                createdBy: session.user.id,
            });
        }
    }

    revalidatePath('/budgets');
    return { success: true };
}

// Project budget result type
export interface ProjectBudget {
    projectId: string | null;
    projectName: string;
    totalIncome: number;
    totalCost: number;
    netBudget: number;
    concepts: {
        conceptId: string;
        conceptName: string;
        conceptType: 'INCOME' | 'COST';
        amount: number;
    }[];
}

// Get budgets grouped by project for a year
export async function getBudgetsByProject(companyId: string, year: number): Promise<ProjectBudget[]> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // Get all budgets for the year with relations
    const budgetData = await db.query.budgets.findMany({
        where: and(
            eq(budgets.companyId, companyId),
            eq(budgets.year, year)
        ),
    });

    // Get all concepts and projects for lookup
    const allConcepts = await db.select().from(concepts);
    const conceptMap = new Map(allConcepts.map(c => [c.id, { name: c.name, type: c.type }]));

    const allProjects = await db.select().from(projects).where(eq(projects.companyId, companyId));
    const projectMap = new Map(allProjects.map(p => [p.id, p.name]));

    // Group by project
    const projectGroups = new Map<string, {
        projectName: string;
        conceptAmounts: Map<string, number>;
    }>();

    for (const budget of budgetData) {
        const projectKey = budget.projectId || 'admin';
        const projectName = budget.projectId ? (projectMap.get(budget.projectId) || 'Proyecto Desconocido') : 'Gastos de Administración';

        if (!projectGroups.has(projectKey)) {
            projectGroups.set(projectKey, {
                projectName,
                conceptAmounts: new Map(),
            });
        }

        const group = projectGroups.get(projectKey)!;
        const currentAmount = group.conceptAmounts.get(budget.conceptId) || 0;
        group.conceptAmounts.set(budget.conceptId, currentAmount + Number(budget.amount));
    }

    // Convert to result array
    const results: ProjectBudget[] = [];

    for (const [projectKey, group] of projectGroups) {
        const conceptsList: ProjectBudget['concepts'] = [];
        let totalIncome = 0;
        let totalCost = 0;

        for (const [conceptId, amount] of group.conceptAmounts) {
            const conceptInfo = conceptMap.get(conceptId);
            if (!conceptInfo) continue;

            conceptsList.push({
                conceptId,
                conceptName: conceptInfo.name,
                conceptType: conceptInfo.type,
                amount,
            });

            if (conceptInfo.type === 'INCOME') {
                totalIncome += amount;
            } else {
                totalCost += amount;
            }
        }

        // Sort concepts by type then name
        conceptsList.sort((a, b) => {
            if (a.conceptType !== b.conceptType) return a.conceptType === 'INCOME' ? -1 : 1;
            return a.conceptName.localeCompare(b.conceptName);
        });

        results.push({
            projectId: projectKey === 'admin' ? null : projectKey,
            projectName: group.projectName,
            totalIncome,
            totalCost,
            netBudget: totalIncome - totalCost,
            concepts: conceptsList,
        });
    }

    // Sort: projects first (sorted by name), admin last
    results.sort((a, b) => {
        if (a.projectId === null) return 1;
        if (b.projectId === null) return -1;
        return a.projectName.localeCompare(b.projectName);
    });

    return results;
}
