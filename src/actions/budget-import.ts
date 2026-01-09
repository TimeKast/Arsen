'use server';

import { db } from '@/lib/db';
import { budgets, areas, projects, concepts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getActiveConceptTypeOverrides } from './concept-type-overrides';

const budgetEntrySchema = z.object({
    areaName: z.string(),
    projectName: z.string().nullable(),
    conceptCode: z.string(),
    amounts: z.array(z.number()),
});

const confirmBudgetImportSchema = z.object({
    companyId: z.string().uuid(),
    year: z.number().int().min(2020).max(2100),
    entries: z.array(budgetEntrySchema),
});

export type BudgetImportResult = {
    success: boolean;
    imported: number;
    skipped: number;
    errors: string[];
};

// Helper to normalize area name for matching
function normalizeAreaName(name: string): string {
    // Remove leading code like "(06) " and normalize
    return name.replace(/^\(\d+\)\s*/, '').trim().toLowerCase();
}

export async function confirmBudgetImport(
    data: z.infer<typeof confirmBudgetImportSchema>
): Promise<BudgetImportResult> {
    try {
        const session = await auth();
        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
            return { success: false, imported: 0, skipped: 0, errors: ['No autorizado'] };
        }

        const parsed = confirmBudgetImportSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, imported: 0, skipped: 0, errors: ['Datos inválidos: ' + parsed.error.message] };
        }

        const { companyId, year, entries } = parsed.data;
        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        // Cache for resolved IDs
        const areaCache = new Map<string, string>(); // normalized name -> id
        const projectCache = new Map<string, string>();
        const conceptCache = new Map<string, string>();

        // Get all areas for this company and build flexible cache
        const companyAreas = await db.select().from(areas).where(eq(areas.companyId, companyId));
        companyAreas.forEach(a => {
            // Store by exact name and normalized name
            areaCache.set(a.name.toLowerCase(), a.id);
            areaCache.set(normalizeAreaName(a.name), a.id);
        });

        // Get all projects for this company
        const companyProjects = await db.select().from(projects).where(eq(projects.companyId, companyId));
        companyProjects.forEach(p => {
            projectCache.set(p.name.toLowerCase(), p.id);
            // Also store without code prefix
            projectCache.set(normalizeAreaName(p.name), p.id);
        });

        // Get all concepts
        const allConcepts = await db.select().from(concepts);
        allConcepts.forEach(c => conceptCache.set(c.name.toLowerCase(), c.id));

        // Get concept type overrides for this company
        const conceptTypeOverrides = await getActiveConceptTypeOverrides(companyId);
        const overrideMap = new Map<string, 'INCOME' | 'COST'>();
        conceptTypeOverrides.forEach(o => overrideMap.set(o.conceptName.toLowerCase(), o.conceptType));

        // Use Map to aggregate amounts for same area/project/concept/month (avoids duplicate key violations)
        const budgetAggregator = new Map<string, {
            companyId: string;
            areaId: string;
            projectId: string | null;
            conceptId: string;
            year: number;
            month: number;
            amount: number;
        }>();

        for (const entry of entries) {
            // Resolve area with flexible matching
            const normalizedEntryArea = normalizeAreaName(entry.areaName);
            let areaId = areaCache.get(entry.areaName.toLowerCase()) || areaCache.get(normalizedEntryArea);

            if (!areaId) {
                errors.push(`Área no encontrada: ${entry.areaName}`);
                skipped++;
                continue;
            }

            // Resolve project with flexible matching (nullable for admin expenses)
            let projectId: string | null = null;
            if (entry.projectName) {
                const normalizedProject = normalizeAreaName(entry.projectName);
                projectId = projectCache.get(entry.projectName.toLowerCase()) || projectCache.get(normalizedProject) || null;
            }

            // Resolve or create concept
            let conceptId = conceptCache.get(entry.conceptCode.toLowerCase());
            if (!conceptId) {
                // Check if there's a type override for this concept
                const overrideType = overrideMap.get(entry.conceptCode.toLowerCase());
                const conceptType = overrideType || 'COST'; // Default to COST if no override

                // Create new concept with the appropriate type
                const [newConcept] = await db.insert(concepts).values({
                    name: entry.conceptCode,
                    type: conceptType,
                }).returning({ id: concepts.id });
                conceptId = newConcept.id;
                conceptCache.set(entry.conceptCode.toLowerCase(), conceptId);
            }

            // Add budget entries for each month (aggregate duplicates by area/project/concept/month)
            for (let month = 1; month <= 12; month++) {
                const amount = entry.amounts[month - 1] || 0;
                if (amount === 0) continue; // Skip zero amounts

                const key = `${areaId}|${projectId}|${conceptId}|${month}`;
                const existing = budgetAggregator.get(key);

                if (existing) {
                    existing.amount += amount;
                } else {
                    budgetAggregator.set(key, {
                        companyId,
                        areaId,
                        projectId,
                        conceptId,
                        year,
                        month,
                        amount,
                    });
                }
            }
        }

        // Convert aggregator to insert array
        const budgetsToInsert = Array.from(budgetAggregator.values()).map(b => ({
            ...b,
            amount: b.amount.toString(),
        }));

        // Get unique area IDs from the entries to import
        const importedAreaIds = [...new Set(budgetsToInsert.map(b => b.areaId))];

        // Delete existing budgets ONLY for the areas being imported (not all areas)
        if (importedAreaIds.length > 0) {
            for (const areaId of importedAreaIds) {
                await db.delete(budgets).where(
                    and(
                        eq(budgets.companyId, companyId),
                        eq(budgets.areaId, areaId),
                        eq(budgets.year, year)
                    )
                );
            }
        }

        // Batch insert new budgets
        if (budgetsToInsert.length > 0) {
            const BATCH_SIZE = 100;
            for (let i = 0; i < budgetsToInsert.length; i += BATCH_SIZE) {
                const batch = budgetsToInsert.slice(i, i + BATCH_SIZE);
                await db.insert(budgets).values(batch);
            }
            imported = budgetsToInsert.length;
        }

        revalidatePath('/budgets');
        return { success: true, imported, skipped, errors };
    } catch (error) {
        console.error('Budget import error:', error);
        return {
            success: false,
            imported: 0,
            skipped: 0,
            errors: [error instanceof Error ? error.message : 'Error desconocido']
        };
    }
}

