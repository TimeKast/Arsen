'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { db, results, projects, concepts } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';

// Schema for result entry
const resultEntrySchema = z.object({
    projectId: z.string().uuid().nullable(),
    conceptId: z.string().uuid(),
    amount: z.number(),
});

const confirmImportSchema = z.object({
    companyId: z.string().uuid(),
    year: z.number().min(2020).max(2100),
    month: z.number().min(1).max(12),
    entries: z.array(z.object({
        projectId: z.string().uuid().nullable(),
        conceptId: z.string().uuid(),
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

    // Delete existing data for this period
    await db.delete(results).where(
        and(
            eq(results.companyId, validated.companyId),
            eq(results.year, validated.year),
            eq(results.month, validated.month)
        )
    );

    // Insert new entries
    let insertedCount = 0;
    for (const entry of validated.entries) {
        if (entry.amount === 0) continue; // Skip zero values

        await db.insert(results).values({
            companyId: validated.companyId,
            projectId: entry.projectId,
            conceptId: entry.conceptId,
            year: validated.year,
            month: validated.month,
            amount: entry.amount.toFixed(2),
            importedBy: session.user.id,
        });
        insertedCount++;
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
        insertedCount,
        period: `${validated.year}-${String(validated.month).padStart(2, '0')}`,
        profitSharingCalculated: profitSharingResults.length,
    };
}

