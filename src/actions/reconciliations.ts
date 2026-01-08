'use server';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db, reconciliations, projects, concepts } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';

// Schema for reconciliation entry
const reconciliationEntrySchema = z.object({
    date: z.string().or(z.date()),
    reference: z.string().optional(),
    invoice: z.string().optional(),
    policy: z.string().optional(),
    checkNumber: z.string().optional(),
    supplier: z.string().optional(),
    subtotal: z.number().optional(),
    tax: z.number().optional(),
    total: z.number(),
    projectId: z.string().uuid().nullable().optional(),
    conceptId: z.string().uuid().nullable().optional(),
});

const confirmImportSchema = z.object({
    companyId: z.string().uuid(),
    entries: z.array(reconciliationEntrySchema),
});

export type ReconciliationEntry = z.infer<typeof reconciliationEntrySchema>;
export type ConfirmReconciliationImport = z.infer<typeof confirmImportSchema>;

// Get reconciliations for a company
export async function getReconciliations(companyId: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    return await db.query.reconciliations.findMany({
        where: eq(reconciliations.companyId, companyId),
        with: {
            project: true,
            concept: true,
        },
        orderBy: (rec, { desc }) => [desc(rec.date)],
    });
}

// Save reconciliations from import
export async function confirmReconciliationImport(data: ConfirmReconciliationImport) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        throw new Error('No autorizado');
    }

    const validated = confirmImportSchema.parse(data);

    // Filter out empty entries and prepare batch insert data
    const entriesToInsert = validated.entries
        .filter(entry => entry.total !== 0)
        .map(entry => ({
            companyId: validated.companyId,
            projectId: entry.projectId || null,
            conceptId: entry.conceptId || null,
            date: new Date(entry.date),
            reference: entry.reference || null,
            invoice: entry.invoice || null,
            policy: entry.policy || null,
            checkNumber: entry.checkNumber || null,
            supplier: entry.supplier || null,
            subtotal: entry.subtotal?.toFixed(2) || null,
            tax: entry.tax?.toFixed(2) || null,
            total: entry.total.toFixed(2),
            createdBy: session.user.id,
        }));

    // Batch insert all entries at once
    if (entriesToInsert.length > 0) {
        await db.insert(reconciliations).values(entriesToInsert);
    }

    revalidatePath('/reconciliations');
    return {
        success: true,
        insertedCount: entriesToInsert.length,
    };
}

// Delete a reconciliation
export async function deleteReconciliation(id: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    if (session.user.role !== 'ADMIN') {
        throw new Error('No autorizado');
    }

    await db.delete(reconciliations).where(eq(reconciliations.id, id));

    revalidatePath('/reconciliations');
    return { success: true };
}

// Resolve project/concept by name
export async function resolveProjectByName(companyId: string, name: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    if (!name) return null;

    const project = await db.query.projects.findFirst({
        where: and(
            eq(projects.companyId, companyId),
            eq(projects.name, name)
        ),
    });

    return project?.id || null;
}

export async function resolveConceptByName(name: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    if (!name) return null;

    const concept = await db.query.concepts.findFirst({
        where: eq(concepts.name, name),
    });

    return concept?.id || null;
}
