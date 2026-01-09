'use server';

import { db } from '@/lib/db';
import { budgets, areas, projects, concepts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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

export async function confirmBudgetImport(
    data: z.infer<typeof confirmBudgetImportSchema>
): Promise<BudgetImportResult> {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
        return { success: false, imported: 0, skipped: 0, errors: ['No autorizado'] };
    }

    const parsed = confirmBudgetImportSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, imported: 0, skipped: 0, errors: ['Datos inválidos'] };
    }

    const { companyId, year, entries } = parsed.data;
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Cache for resolved IDs
    const areaCache = new Map<string, string>();
    const projectCache = new Map<string, string>();
    const conceptCache = new Map<string, string>();

    // Get all areas for this company
    const companyAreas = await db.select().from(areas).where(eq(areas.companyId, companyId));
    companyAreas.forEach(a => areaCache.set(a.name, a.id));

    // Get all projects for this company
    const companyProjects = await db.select().from(projects).where(eq(projects.companyId, companyId));
    companyProjects.forEach(p => projectCache.set(p.name, p.id));

    // Get all concepts
    const allConcepts = await db.select().from(concepts);
    allConcepts.forEach(c => conceptCache.set(c.name, c.id));

    // Prepare batch inserts
    const budgetsToInsert: {
        companyId: string;
        areaId: string;
        conceptId: string;
        year: number;
        month: number;
        amount: string;
    }[] = [];

    for (const entry of entries) {
        // Resolve area
        const areaId = areaCache.get(entry.areaName);
        if (!areaId) {
            errors.push(`Área no encontrada: ${entry.areaName}`);
            skipped++;
            continue;
        }

        // Resolve or create concept
        let conceptId = conceptCache.get(entry.conceptCode);
        if (!conceptId) {
            // Create new concept (as COST type, most budgets are costs)
            const [newConcept] = await db.insert(concepts).values({
                name: entry.conceptCode,
                type: 'COST',
            }).returning({ id: concepts.id });
            conceptId = newConcept.id;
            conceptCache.set(entry.conceptCode, conceptId);
        }

        // Add budget entries for each month
        for (let month = 1; month <= 12; month++) {
            const amount = entry.amounts[month - 1] || 0;
            if (amount === 0) continue; // Skip zero amounts

            budgetsToInsert.push({
                companyId,
                areaId,
                conceptId,
                year,
                month,
                amount: amount.toString(),
            });
        }
    }

    // Delete existing budgets for this company/year
    await db.delete(budgets).where(
        and(eq(budgets.companyId, companyId), eq(budgets.year, year))
    );

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
}
