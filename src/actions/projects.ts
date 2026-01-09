'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, projects, companies, results } from '@/lib/db';
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

// Get all active projects across all companies (for filters)
export async function getAllActiveProjects() {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    return await db.query.projects.findMany({
        where: eq(projects.isActive, true),
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

// Check if project can be deleted (no results reference)
export async function canDeleteProject(id: string): Promise<boolean> {
    const resultRef = await db.query.results.findFirst({
        where: eq(results.projectId, id),
    });
    return !resultRef;
}

// Delete project (only if no historical data)
export async function deleteProject(id: string): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
        return { success: false, error: 'No autorizado' };
    }

    const canDelete = await canDeleteProject(id);
    if (!canDelete) {
        return { success: false, error: 'No se puede eliminar: tiene resultados históricos asociados. Desactívalo en su lugar.' };
    }

    await db.delete(projects).where(eq(projects.id, id));
    revalidatePath('/catalogs/projects');
    return { success: true };
}

