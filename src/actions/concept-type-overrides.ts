'use server';

import { db } from '@/lib/db';
import { conceptTypeOverrides, companies } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/config';

export type ConceptTypeOverride = typeof conceptTypeOverrides.$inferSelect;

// Get all overrides for a company
export async function getConceptTypeOverrides(companyId: string): Promise<ConceptTypeOverride[]> {
    return await db.select()
        .from(conceptTypeOverrides)
        .where(eq(conceptTypeOverrides.companyId, companyId))
        .orderBy(asc(conceptTypeOverrides.conceptName));
}

// Get only active overrides (for import process)
export async function getActiveConceptTypeOverrides(companyId: string): Promise<Array<{ conceptName: string; conceptType: 'INCOME' | 'COST' }>> {
    const overrides = await db.select({
        conceptName: conceptTypeOverrides.conceptName,
        conceptType: conceptTypeOverrides.conceptType,
    })
        .from(conceptTypeOverrides)
        .where(and(
            eq(conceptTypeOverrides.companyId, companyId),
            eq(conceptTypeOverrides.isActive, true)
        ))
        .orderBy(asc(conceptTypeOverrides.conceptName));

    return overrides as Array<{ conceptName: string; conceptType: 'INCOME' | 'COST' }>;
}

// Create a new override
export async function createConceptTypeOverride(
    companyId: string,
    conceptName: string,
    conceptType: 'INCOME' | 'COST',
    description?: string
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        await db.insert(conceptTypeOverrides).values({
            companyId,
            conceptName: conceptName.trim(),
            conceptType,
            description: description?.trim() || null,
            createdBy: session.user.id,
        });
        revalidatePath('/catalogs/concept-types');
        return { success: true };
    } catch (error) {
        if (error instanceof Error && error.message.includes('unique')) {
            return { success: false, error: 'Este concepto ya existe para esta empresa' };
        }
        return { success: false, error: 'Error al crear' };
    }
}

// Update an override
export async function updateConceptTypeOverride(
    id: string,
    data: { conceptName?: string; conceptType?: 'INCOME' | 'COST'; description?: string }
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        await db.update(conceptTypeOverrides)
            .set({
                conceptName: data.conceptName?.trim(),
                conceptType: data.conceptType,
                description: data.description?.trim() || null,
            })
            .where(eq(conceptTypeOverrides.id, id));
        revalidatePath('/catalogs/concept-types');
        return { success: true };
    } catch (error) {
        if (error instanceof Error && error.message.includes('unique')) {
            return { success: false, error: 'Este concepto ya existe para esta empresa' };
        }
        return { success: false, error: 'Error al actualizar' };
    }
}

// Toggle active status
export async function toggleConceptTypeOverride(id: string): Promise<{ success: boolean }> {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
        return { success: false };
    }

    const [current] = await db.select().from(conceptTypeOverrides).where(eq(conceptTypeOverrides.id, id));
    if (!current) return { success: false };

    await db.update(conceptTypeOverrides)
        .set({ isActive: !current.isActive })
        .where(eq(conceptTypeOverrides.id, id));

    revalidatePath('/catalogs/concept-types');
    return { success: true };
}

// Delete an override
export async function deleteConceptTypeOverride(id: string): Promise<{ success: boolean }> {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
        return { success: false };
    }

    await db.delete(conceptTypeOverrides).where(eq(conceptTypeOverrides.id, id));
    revalidatePath('/catalogs/concept-types');
    return { success: true };
}

// Get companies for dropdown (admin/staff only)
export async function getCompaniesForOverrides(): Promise<Array<{ id: string; name: string }>> {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
        return [];
    }

    const result = await db.select({ id: companies.id, name: companies.name })
        .from(companies)
        .where(eq(companies.isActive, true))
        .orderBy(asc(companies.name));

    return result;
}
