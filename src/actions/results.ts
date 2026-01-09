'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, ilike } from 'drizzle-orm';
import { db, results, projects, concepts } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';

// Schema for result entry - now accepts name OR uuid for flexibility
const confirmImportSchema = z.object({
    companyId: z.string().uuid(),
    year: z.number().min(2020).max(2100),
    month: z.number().min(1).max(12),
    source: z.enum(['O', 'M']).default('M'), // O=Otros, M=Monthly
    entries: z.array(z.object({
        projectId: z.string().nullable(), // Can be UUID or null
        projectName: z.string().nullable().optional(), // Project name for lookup (null for admin expenses)
        conceptId: z.string().optional(), // Can be UUID
        conceptName: z.string().optional(), // Concept name for lookup
        conceptType: z.enum(['INCOME', 'COST']).optional(), // For differentiation
        amount: z.number(),
    })),
});

export type ConfirmImportData = z.infer<typeof confirmImportSchema>;

// Check if data exists for the period (filtered by source)
export async function checkExistingResults(
    companyId: string,
    year: number,
    month: number,
    source: 'O' | 'M' = 'M'
): Promise<{ exists: boolean; count: number }> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    const existing = await db.query.results.findMany({
        where: and(
            eq(results.companyId, companyId),
            eq(results.year, year),
            eq(results.month, month),
            eq(results.source, source)
        ),
    });

    return { exists: existing.length > 0, count: existing.length };
}

// Helper to find concept by name and optionally type (case insensitive)
async function findConceptByName(name: string, type?: 'INCOME' | 'COST'): Promise<string | null> {
    const conditions = [ilike(concepts.name, name)];
    if (type) {
        conditions.push(eq(concepts.type, type));
    }

    const concept = await db.query.concepts.findFirst({
        where: and(...conditions),
    });
    return concept?.id || null;
}


// Helper to find project by name in company (case insensitive)
// Also tries stripping (XX) prefix codes for Otros sheet compatibility
async function findProjectByName(name: string, companyId: string): Promise<string | null> {
    // First try exact match
    let project = await db.query.projects.findFirst({
        where: and(
            ilike(projects.name, name),
            eq(projects.companyId, companyId)
        ),
    });

    // If not found, try stripping (XX) prefix for Otros compatibility
    if (!project) {
        const strippedName = name.replace(/^\(\d+\)\s*/, '').trim();
        if (strippedName !== name) {
            project = await db.query.projects.findFirst({
                where: and(
                    ilike(projects.name, strippedName),
                    eq(projects.companyId, companyId)
                ),
            });
        }
    }

    return project?.id || null;
}

// Confirm and save results
export async function confirmResultsImport(data: ConfirmImportData) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // Only ADMIN and STAFF can import
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        throw new Error('No autorizado');
    }

    const validated = confirmImportSchema.parse(data);

    // Build a cache for concept/project lookups
    const conceptCache = new Map<string, string>();
    const projectCache = new Map<string, string>();

    // Delete existing data for this period and SOURCE ONLY
    // This prevents Otros import from deleting Monthly data and vice versa
    await db.delete(results).where(
        and(
            eq(results.companyId, validated.companyId),
            eq(results.year, validated.year),
            eq(results.month, validated.month),
            eq(results.source, validated.source)
        )
    );

    // Resolve concept/project IDs and filter out zero values
    const entriesToInsert: Array<{
        companyId: string;
        projectId: string | null;
        conceptId: string;
        year: number;
        month: number;
        source: 'O' | 'M';
        amount: string;
        importedBy: string;
    }> = [];

    for (const entry of validated.entries) {
        if (entry.amount === 0) continue;

        // Resolve concept ID
        let conceptId = entry.conceptId;
        if (!conceptId && entry.conceptName) {
            // Use name+type as cache key to differentiate concepts with same name
            const cacheKey = entry.conceptType
                ? `${entry.conceptName}|${entry.conceptType}`
                : entry.conceptName;

            // Check cache first
            if (conceptCache.has(cacheKey)) {
                conceptId = conceptCache.get(cacheKey)!;
            } else {
                const foundId = await findConceptByName(entry.conceptName, entry.conceptType);
                if (foundId) {
                    conceptCache.set(cacheKey, foundId);
                    conceptId = foundId;
                } else {
                    console.warn(`[IMPORT] Concept not found by name: "${entry.conceptName}" (type: ${entry.conceptType})`);
                }
            }
        }

        if (!conceptId) {
            console.warn(`[IMPORT] Skipping entry - no conceptId. Name: "${entry.conceptName}", Amount: ${entry.amount}`);
            continue;
        }

        // Resolve project ID
        let projectId = entry.projectId;
        if (!projectId && entry.projectName) {
            if (projectCache.has(entry.projectName)) {
                projectId = projectCache.get(entry.projectName)!;
            } else {
                const foundId = await findProjectByName(entry.projectName, validated.companyId);
                if (foundId) {
                    projectCache.set(entry.projectName, foundId);
                    projectId = foundId;
                }
            }
        }

        entriesToInsert.push({
            companyId: validated.companyId,
            projectId: projectId || null,
            conceptId,
            year: validated.year,
            month: validated.month,
            source: validated.source,
            amount: entry.amount.toFixed(2),
            importedBy: session.user.id,
        });
    }

    console.log(`[IMPORT] Total entries to insert: ${entriesToInsert.length}`);
    console.log(`[IMPORT] Sample entries:`, entriesToInsert.slice(0, 3).map(e => ({
        projectId: e.projectId,
        conceptId: e.conceptId,
        amount: e.amount
    })));

    // Batch insert all entries at once
    if (entriesToInsert.length > 0) {
        await db.insert(results).values(entriesToInsert);
        console.log(`[IMPORT] Successfully inserted ${entriesToInsert.length} entries`);
    } else {
        console.warn('[IMPORT] WARNING: No entries to insert!');
    }

    // Hook: Calculate profit sharing after import
    let profitSharingResults: { projectId: string; projectName: string; netProfit: number; totalShare: number; formulaType: string; breakdown: { description: string; amount: number }[] }[] = [];
    try {
        const { calculateProfitSharingForPeriod } = await import('./profit-sharing-calc');
        profitSharingResults = await calculateProfitSharingForPeriod(
            validated.companyId,
            validated.year,
            validated.month
        );
    } catch (error) {
        console.error('Error calculating profit sharing:', error);
    }

    revalidatePath('/results');
    revalidatePath('/profit-sharing');
    return {
        success: true,
        insertedCount: entriesToInsert.length,
        period: `${validated.year}-${String(validated.month).padStart(2, '0')}`,
        profitSharingCalculated: profitSharingResults.length,
    };
}

// Schema for single result entry
const singleResultSchema = z.object({
    companyId: z.string().uuid(),
    projectId: z.string().uuid().nullable(),
    conceptId: z.string().uuid(),
    year: z.number().min(2020).max(2100),
    month: z.number().min(1).max(12),
    amount: z.number(),
});

// Create a single result entry
export async function createResult(data: z.infer<typeof singleResultSchema>) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new Error('No autorizado');
    }

    const validated = singleResultSchema.parse(data);

    const [result] = await db.insert(results).values({
        companyId: validated.companyId,
        projectId: validated.projectId,
        conceptId: validated.conceptId,
        year: validated.year,
        month: validated.month,
        amount: validated.amount.toFixed(2),
        importedBy: session.user.id,
    }).returning();

    revalidatePath('/results');
    revalidatePath('/profit-sharing');
    return result;
}

// Update an existing result entry
export async function updateResult(
    id: string,
    data: { projectId?: string | null; conceptId?: string; amount?: number }
) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new Error('No autorizado');
    }

    const updateData: Record<string, unknown> = {};
    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.conceptId) updateData.conceptId = data.conceptId;
    if (data.amount !== undefined) updateData.amount = data.amount.toFixed(2);

    const [updated] = await db.update(results)
        .set(updateData)
        .where(eq(results.id, id))
        .returning();

    revalidatePath('/results');
    revalidatePath('/profit-sharing');
    return updated;
}

// Delete a single result entry
export async function deleteResult(id: string) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new Error('No autorizado');
    }

    await db.delete(results).where(eq(results.id, id));

    revalidatePath('/results');
    revalidatePath('/profit-sharing');
    return { success: true };
}

// Delete all results for a specific year (for cleanup of incorrect imports)
export async function deleteResultsForYear(companyId: string, year: number) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('No autorizado - solo ADMIN puede eliminar por año');
    }

    const deleted = await db.delete(results).where(
        and(
            eq(results.companyId, companyId),
            eq(results.year, year)
        )
    );

    revalidatePath('/results');
    revalidatePath('/profit-sharing');
    revalidatePath('/comparison');

    console.log(`[CLEANUP] Deleted results for year ${year} in company ${companyId}`);
    return { success: true };
}
