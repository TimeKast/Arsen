'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, isNull } from 'drizzle-orm';
import { db, concepts, areas, results, budgets, conceptMappings } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';

const conceptSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(255),
    type: z.enum(['INCOME', 'COST']),
    areaId: z.string().uuid().optional().nullable(),
});

export type ConceptFormData = z.infer<typeof conceptSchema>;

// Get all concepts
export async function getConcepts() {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    return await db.query.concepts.findMany({
        with: {
            area: true,
        },
        orderBy: (concepts, { asc }) => [asc(concepts.type), asc(concepts.name)],
    });
}

// Get areas for select
export async function getAreasForSelect() {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    return await db.query.areas.findMany({
        where: eq(areas.isActive, true),
        orderBy: (areas, { asc }) => [asc(areas.name)],
    });
}

// Create concept
export async function createConcept(data: ConceptFormData) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new Error('No autorizado');
    }

    const validated = conceptSchema.parse(data);

    const [concept] = await db.insert(concepts).values({
        name: validated.name,
        type: validated.type,
        areaId: validated.areaId || null,
    }).returning();

    revalidatePath('/catalogs/concepts');
    return concept;
}

// Update concept
export async function updateConcept(id: string, data: ConceptFormData) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new Error('No autorizado');
    }

    const validated = conceptSchema.parse(data);

    const [concept] = await db.update(concepts)
        .set({
            name: validated.name,
            type: validated.type,
            areaId: validated.areaId || null,
        })
        .where(eq(concepts.id, id))
        .returning();

    revalidatePath('/catalogs/concepts');
    return concept;
}

// Toggle concept active
export async function toggleConceptActive(id: string) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new Error('No autorizado');
    }

    const concept = await db.query.concepts.findFirst({
        where: eq(concepts.id, id),
    });

    if (!concept) {
        throw new Error('Concepto no encontrado');
    }

    const [updated] = await db.update(concepts)
        .set({
            isActive: !concept.isActive,
        })
        .where(eq(concepts.id, id))
        .returning();

    revalidatePath('/catalogs/concepts');
    return updated;
}

// Check if concept can be deleted (no results, budgets, or mappings references)
export async function canDeleteConcept(id: string): Promise<boolean> {
    const [resultRef, budgetRef, mappingRef] = await Promise.all([
        db.query.results.findFirst({ where: eq(results.conceptId, id) }),
        db.query.budgets.findFirst({ where: eq(budgets.conceptId, id) }),
        db.query.conceptMappings.findFirst({ where: eq(conceptMappings.conceptId, id) }),
    ]);
    return !resultRef && !budgetRef && !mappingRef;
}

// Delete concept (only if no historical data)
export async function deleteConcept(id: string): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        return { success: false, error: 'No autorizado' };
    }

    const canDelete = await canDeleteConcept(id);
    if (!canDelete) {
        return { success: false, error: 'No se puede eliminar: tiene datos históricos asociados. Desactívalo en su lugar.' };
    }

    await db.delete(concepts).where(eq(concepts.id, id));
    revalidatePath('/catalogs/concepts');
    return { success: true };
}

// Check if a concept with the given name already exists (excluding the current concept)
// If sourceType is provided, prioritize finding concepts of the same type
export async function checkConceptNameExists(
    name: string,
    excludeId?: string,
    sourceType?: 'INCOME' | 'COST'
): Promise<{ exists: boolean; existingId?: string; existingType?: string }> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // Find all concepts with the given name (case-insensitive)
    const allConcepts = await db.query.concepts.findMany();
    const matchingConcepts = allConcepts.filter(c =>
        c.name.toLowerCase().trim() === name.toLowerCase().trim() && c.id !== excludeId
    );

    if (matchingConcepts.length === 0) {
        return { exists: false };
    }

    // If sourceType is provided, prioritize concepts of the same type
    if (sourceType) {
        const sameTypeConcept = matchingConcepts.find(c => c.type === sourceType);
        if (sameTypeConcept) {
            return { exists: true, existingId: sameTypeConcept.id, existingType: sameTypeConcept.type };
        }
    }

    // Return the first matching concept
    return { exists: true, existingId: matchingConcepts[0].id, existingType: matchingConcepts[0].type };
}

// Get stats for a concept (count of related records)
export interface ConceptStats {
    budgetsCount: number;
    resultsCount: number;
    mappingsCount: number;
    reconciliationsCount: number;
}

export async function getConceptStats(id: string): Promise<ConceptStats> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // Import reconciliations for the count
    const { reconciliations } = await import('@/lib/db');

    const [budgetsList, resultsList, mappingsList, reconciliationsList] = await Promise.all([
        db.query.budgets.findMany({ where: eq(budgets.conceptId, id) }),
        db.query.results.findMany({ where: eq(results.conceptId, id) }),
        db.query.conceptMappings.findMany({ where: eq(conceptMappings.conceptId, id) }),
        db.query.reconciliations.findMany({ where: eq(reconciliations.conceptId, id) }),
    ]);

    return {
        budgetsCount: budgetsList.length,
        resultsCount: resultsList.length,
        mappingsCount: mappingsList.length,
        reconciliationsCount: reconciliationsList.length,
    };
}

// Merge two concepts: move all references from source to target, then delete source
export interface MergeResult {
    success: boolean;
    error?: string;
    budgetsMoved?: number;
    resultsMoved?: number;
    mappingsMoved?: number;
    reconciliationsMoved?: number;
}

export async function mergeConcepts(sourceId: string, targetId: string): Promise<MergeResult> {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        return { success: false, error: 'No autorizado' };
    }

    // Validate both concepts exist
    const [source, target] = await Promise.all([
        db.query.concepts.findFirst({ where: eq(concepts.id, sourceId) }),
        db.query.concepts.findFirst({ where: eq(concepts.id, targetId) }),
    ]);

    if (!source) {
        return { success: false, error: 'Concepto origen no encontrado' };
    }
    if (!target) {
        return { success: false, error: 'Concepto destino no encontrado' };
    }

    // Validate same type
    if (source.type !== target.type) {
        return { success: false, error: `No se pueden fusionar: tipos diferentes (${source.type} vs ${target.type})` };
    }

    // Import reconciliations
    const { reconciliations } = await import('@/lib/db');

    console.log(`[MERGE] Starting merge: ${source.name} (${sourceId}) -> ${target.name} (${targetId})`);

    try {
        // Import sql for raw queries
        const { sql } = await import('drizzle-orm');

        // 1. Handle budgets - merge by summing amounts if there's a conflict
        // First, get all budgets for the source concept
        const sourceBudgets = await db.query.budgets.findMany({ where: eq(budgets.conceptId, sourceId) });
        let budgetsMoved = 0;

        for (const sourceBudget of sourceBudgets) {
            // Build conditions array - handle null projectId correctly
            const budgetConditions = [
                eq(budgets.conceptId, targetId),
                eq(budgets.areaId, sourceBudget.areaId),
                eq(budgets.year, sourceBudget.year),
                eq(budgets.month, sourceBudget.month),
                eq(budgets.companyId, sourceBudget.companyId),
            ];
            // Handle null projectId
            if (sourceBudget.projectId === null) {
                budgetConditions.push(isNull(budgets.projectId));
            } else {
                budgetConditions.push(eq(budgets.projectId, sourceBudget.projectId));
            }

            const existingBudget = await db.query.budgets.findFirst({
                where: and(...budgetConditions),
            });

            if (existingBudget) {
                // Sum amounts and delete source
                const newAmount = (parseFloat(existingBudget.amount) + parseFloat(sourceBudget.amount)).toFixed(2);
                await db.update(budgets).set({ amount: newAmount }).where(eq(budgets.id, existingBudget.id));
                await db.delete(budgets).where(eq(budgets.id, sourceBudget.id));
                console.log(`[MERGE] Budget conflict resolved: summed amounts for ${source.name}`);
            } else {
                // No conflict, just update conceptId
                await db.update(budgets).set({ conceptId: targetId }).where(eq(budgets.id, sourceBudget.id));
            }
            budgetsMoved++;
        }
        console.log(`[MERGE] Moved/merged ${budgetsMoved} budgets`);

        // 2. Handle results - merge by summing amounts if there's a conflict
        const sourceResults = await db.query.results.findMany({ where: eq(results.conceptId, sourceId) });
        let resultsMoved = 0;

        for (const sourceResult of sourceResults) {
            // Build conditions array - handle null projectId correctly
            const resultConditions = [
                eq(results.conceptId, targetId),
                eq(results.year, sourceResult.year),
                eq(results.month, sourceResult.month),
                eq(results.source, sourceResult.source),
                eq(results.companyId, sourceResult.companyId),
            ];
            // Handle null projectId
            if (sourceResult.projectId === null) {
                resultConditions.push(isNull(results.projectId));
            } else {
                resultConditions.push(eq(results.projectId, sourceResult.projectId));
            }

            const existingResult = await db.query.results.findFirst({
                where: and(...resultConditions),
            });

            if (existingResult) {
                const newAmount = (parseFloat(existingResult.amount) + parseFloat(sourceResult.amount)).toFixed(2);
                await db.update(results).set({ amount: newAmount }).where(eq(results.id, existingResult.id));
                await db.delete(results).where(eq(results.id, sourceResult.id));
                console.log(`[MERGE] Result conflict resolved: summed amounts for ${source.name}`);
            } else {
                await db.update(results).set({ conceptId: targetId }).where(eq(results.id, sourceResult.id));
            }
            resultsMoved++;
        }
        console.log(`[MERGE] Moved/merged ${resultsMoved} results`);

        // 3. Update concept mappings (no unique constraint issues here, just update)
        const mappingsUpdated = await db.update(conceptMappings)
            .set({ conceptId: targetId })
            .where(eq(conceptMappings.conceptId, sourceId))
            .returning();
        console.log(`[MERGE] Moved ${mappingsUpdated.length} mappings`);

        // 4. Update reconciliations (no unique constraint, just update)
        const reconciliationsUpdated = await db.update(reconciliations)
            .set({ conceptId: targetId })
            .where(eq(reconciliations.conceptId, sourceId))
            .returning();
        console.log(`[MERGE] Moved ${reconciliationsUpdated.length} reconciliations`);

        // 5. Delete source concept
        await db.delete(concepts).where(eq(concepts.id, sourceId));
        console.log(`[MERGE] Deleted source concept: ${source.name}`);

        revalidatePath('/catalogs/concepts');
        revalidatePath('/budgets');
        revalidatePath('/results');
        revalidatePath('/comparison');

        return {
            success: true,
            budgetsMoved,
            resultsMoved,
            mappingsMoved: mappingsUpdated.length,
            reconciliationsMoved: reconciliationsUpdated.length,
        };
    } catch (error) {
        console.error('[MERGE] Error:', error);
        return { success: false, error: `Error al fusionar conceptos: ${String(error)}` };
    }
}

// Find all duplicate concepts (same name, different IDs)
export interface DuplicateGroup {
    name: string;
    type: 'INCOME' | 'COST';
    concepts: { id: string; name: string; createdAt: Date }[];
}

export async function findDuplicateConcepts(): Promise<DuplicateGroup[]> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    const allConcepts = await db.query.concepts.findMany({
        orderBy: (concepts, { asc }) => [asc(concepts.name), asc(concepts.createdAt)],
    });

    // Group by name (case-insensitive, trimmed)
    const byName = new Map<string, typeof allConcepts>();
    for (const concept of allConcepts) {
        const key = concept.name.toLowerCase().trim();
        if (!byName.has(key)) {
            byName.set(key, []);
        }
        byName.get(key)!.push(concept);
    }

    // Filter to only groups with more than 1 concept
    const duplicates: DuplicateGroup[] = [];
    for (const [_, group] of byName) {
        if (group.length > 1) {
            duplicates.push({
                name: group[0].name,
                type: group[0].type,
                concepts: group.map(c => ({ id: c.id, name: c.name, createdAt: c.createdAt })),
            });
        }
    }

    return duplicates;
}

// Auto-merge all duplicate concepts (keeps the oldest one as target)
export interface AutoMergeResult {
    success: boolean;
    merged: number;
    errors: string[];
    details: { name: string; mergedCount: number; budgetsMoved: number; resultsMoved: number }[];
}

export async function autoMergeDuplicates(): Promise<AutoMergeResult> {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        return { success: false, merged: 0, errors: ['No autorizado'], details: [] };
    }

    const duplicates = await findDuplicateConcepts();
    console.log(`[AUTO-MERGE] Found ${duplicates.length} groups of duplicate concepts`);

    const result: AutoMergeResult = {
        success: true,
        merged: 0,
        errors: [],
        details: [],
    };

    for (const group of duplicates) {
        // Sort by createdAt, keep oldest as target
        const sorted = [...group.concepts].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const targetId = sorted[0].id;
        const sourcesToMerge = sorted.slice(1);

        console.log(`[AUTO-MERGE] Processing "${group.name}": keeping ${targetId}, merging ${sourcesToMerge.length} duplicates`);

        let totalBudgets = 0;
        let totalResults = 0;

        for (const source of sourcesToMerge) {
            const mergeResult = await mergeConcepts(source.id, targetId);
            if (mergeResult.success) {
                result.merged++;
                totalBudgets += mergeResult.budgetsMoved || 0;
                totalResults += mergeResult.resultsMoved || 0;
            } else {
                result.errors.push(`Error merging "${source.name}" (${source.id}): ${mergeResult.error}`);
            }
        }

        result.details.push({
            name: group.name,
            mergedCount: sourcesToMerge.length,
            budgetsMoved: totalBudgets,
            resultsMoved: totalResults,
        });
    }

    revalidatePath('/catalogs/concepts');
    revalidatePath('/budgets');
    revalidatePath('/results');
    revalidatePath('/comparison');

    console.log(`[AUTO-MERGE] Completed: ${result.merged} concepts merged, ${result.errors.length} errors`);
    return result;
}
