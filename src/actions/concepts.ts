'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
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

