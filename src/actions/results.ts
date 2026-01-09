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
    entries: z.array(z.object({
        projectId: z.string().nullable(), // Can be UUID or null
        projectName: z.string().optional(), // Project name for lookup
        conceptId: z.string().optional(), // Can be UUID
        conceptName: z.string().optional(), // Concept name for lookup
        amount: z.number(),
    })),
});

export type ConfirmImportData = z.infer<typeof confirmImportSchema>;

// Check if data exists for the period
export async function checkExistingResults(
    companyId: string,
    year: number,
    month: number
): Promise<{ exists: boolean; count: number }> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    const existing = await db.query.results.findMany({
        where: and(
            eq(results.companyId, companyId),
            eq(results.year, year),
            eq(results.month, month)
        ),
    });

    return { exists: existing.length > 0, count: existing.length };
}

// Helper to find concept by name (case insensitive)
async function findConceptByName(name: string): Promise<string | null> {
    const concept = await db.query.concepts.findFirst({
        where: ilike(concepts.name, name),
    });
    return concept?.id || null;
}

// Helper to find project by name in company (case insensitive)
async function findProjectByName(name: string, companyId: string): Promise<string | null> {
    const project = await db.query.projects.findFirst({
        where: and(
            ilike(projects.name, name),
            eq(projects.companyId, companyId)
        ),
    });
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

    // Delete existing data for this period
    await db.delete(results).where(
        and(
            eq(results.companyId, validated.companyId),
            eq(results.year, validated.year),
            eq(results.month, validated.month)
        )
    );

    // Resolve concept/project IDs and filter out zero values
    const entriesToInsert: Array<{
        companyId: string;
        projectId: string | null;
        conceptId: string;
        year: number;
        month: number;
        amount: string;
        importedBy: string;
    }> = [];

    for (const entry of validated.entries) {
        if (entry.amount === 0) continue;

        // Resolve concept ID
        let conceptId = entry.conceptId;
        if (!conceptId && entry.conceptName) {
            // Check cache first
            if (conceptCache.has(entry.conceptName)) {
                conceptId = conceptCache.get(entry.conceptName)!;
            } else {
                const foundId = await findConceptByName(entry.conceptName);
                if (foundId) {
                    conceptCache.set(entry.conceptName, foundId);
                    conceptId = foundId;
                }
            }
        }

        if (!conceptId) {
            console.warn(`Concept not found: ${entry.conceptName}, skipping entry`);
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
            amount: entry.amount.toFixed(2),
            importedBy: session.user.id,
        });
    }

    // Batch insert all entries at once
    if (entriesToInsert.length > 0) {
        await db.insert(results).values(entriesToInsert);
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


