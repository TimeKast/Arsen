'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, areas, companies } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';

const areaSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(255),
    companyId: z.string().uuid('ID de empresa invalido'),
});

export type AreaFormData = z.infer<typeof areaSchema>;

// Get areas by company
export async function getAreasByCompany(companyId: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    return await db.query.areas.findMany({
        where: eq(areas.companyId, companyId),
        orderBy: (areas, { asc }) => [asc(areas.name)],
    });
}

// Get all companies for selector
export async function getCompaniesForSelect() {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    return await db.query.companies.findMany({
        where: eq(companies.isActive, true),
        orderBy: (companies, { asc }) => [asc(companies.name)],
    });
}

// Create area
export async function createArea(data: AreaFormData) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new Error('No autorizado');
    }

    const validated = areaSchema.parse(data);

    const [area] = await db.insert(areas).values({
        name: validated.name,
        companyId: validated.companyId,
    }).returning();

    revalidatePath('/catalogs/areas');
    return area;
}

// Update area
export async function updateArea(id: string, data: AreaFormData) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new Error('No autorizado');
    }

    const validated = areaSchema.parse(data);

    const [area] = await db.update(areas)
        .set({
            name: validated.name,
        })
        .where(eq(areas.id, id))
        .returning();

    revalidatePath('/catalogs/areas');
    return area;
}

// Toggle area active
export async function toggleAreaActive(id: string) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new Error('No autorizado');
    }

    const area = await db.query.areas.findFirst({
        where: eq(areas.id, id),
    });

    if (!area) {
        throw new Error('Area no encontrada');
    }

    const [updated] = await db.update(areas)
        .set({
            isActive: !area.isActive,
        })
        .where(eq(areas.id, id))
        .returning();

    revalidatePath('/catalogs/areas');
    return updated;
}
