'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, projects, companies } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';

const projectSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(255),
    code: z.string().max(50).optional().nullable(),
    companyId: z.string().uuid('ID de empresa invalido'),
    appliesProfitSharing: z.boolean().default(false),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

// Get projects by company
export async function getProjectsByCompany(companyId: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    return await db.query.projects.findMany({
        where: eq(projects.companyId, companyId),
        orderBy: (projects, { asc }) => [asc(projects.name)],
    });
}

// Get companies for select
export async function getCompaniesForProjectSelect() {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    return await db.query.companies.findMany({
        where: eq(companies.isActive, true),
        orderBy: (companies, { asc }) => [asc(companies.name)],
    });
}

// Create project
export async function createProject(data: ProjectFormData) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new Error('No autorizado');
    }

    const validated = projectSchema.parse(data);

    const [project] = await db.insert(projects).values({
        name: validated.name,
        code: validated.code || null,
        companyId: validated.companyId,
        appliesProfitSharing: validated.appliesProfitSharing,
    }).returning();

    revalidatePath('/catalogs/projects');
    return project;
}

// Update project
export async function updateProject(id: string, data: ProjectFormData) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new Error('No autorizado');
    }

    const validated = projectSchema.parse(data);

    const [project] = await db.update(projects)
        .set({
            name: validated.name,
            code: validated.code || null,
            appliesProfitSharing: validated.appliesProfitSharing,
            updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning();

    revalidatePath('/catalogs/projects');
    return project;
}

// Toggle project active
export async function toggleProjectActive(id: string) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new Error('No autorizado');
    }

    const project = await db.query.projects.findFirst({
        where: eq(projects.id, id),
    });

    if (!project) {
        throw new Error('Proyecto no encontrado');
    }

    const [updated] = await db.update(projects)
        .set({
            isActive: !project.isActive,
            updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning();

    revalidatePath('/catalogs/projects');
    return updated;
}

// Toggle profit sharing
export async function toggleProjectProfitSharing(id: string) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        throw new Error('No autorizado');
    }

    const project = await db.query.projects.findFirst({
        where: eq(projects.id, id),
    });

    if (!project) {
        throw new Error('Proyecto no encontrado');
    }

    const [updated] = await db.update(projects)
        .set({
            appliesProfitSharing: !project.appliesProfitSharing,
            updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning();

    revalidatePath('/catalogs/projects');
    return updated;
}
