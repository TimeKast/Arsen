'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, companies } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';

// Validation schema
const companySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(255),
    code: z.string().max(50).optional().nullable(),
    handlesProfitSharing: z.boolean().default(false),
});

export type CompanyFormData = z.infer<typeof companySchema>;

// Get all companies
export async function getCompanies() {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    return await db.query.companies.findMany({
        orderBy: (companies, { asc }) => [asc(companies.name)],
    });
}

// Create company
export async function createCompany(data: CompanyFormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('No autorizado');
    }

    const validated = companySchema.parse(data);

    const [company] = await db.insert(companies).values({
        name: validated.name,
        code: validated.code || null,
        handlesProfitSharing: validated.handlesProfitSharing,
    }).returning();

    revalidatePath('/catalogs/companies');
    return company;
}

// Update company
export async function updateCompany(id: string, data: CompanyFormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('No autorizado');
    }

    const validated = companySchema.parse(data);

    const [company] = await db.update(companies)
        .set({
            name: validated.name,
            code: validated.code || null,
            handlesProfitSharing: validated.handlesProfitSharing,
            updatedAt: new Date(),
        })
        .where(eq(companies.id, id))
        .returning();

    revalidatePath('/catalogs/companies');
    return company;
}

// Toggle company active status
export async function toggleCompanyActive(id: string) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('No autorizado');
    }

    const company = await db.query.companies.findFirst({
        where: eq(companies.id, id),
    });

    if (!company) {
        throw new Error('Empresa no encontrada');
    }

    const [updated] = await db.update(companies)
        .set({
            isActive: !company.isActive,
            updatedAt: new Date(),
        })
        .where(eq(companies.id, id))
        .returning();

    revalidatePath('/catalogs/companies');
    return updated;
}

// Toggle profit sharing
export async function toggleProfitSharing(id: string) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('No autorizado');
    }

    const company = await db.query.companies.findFirst({
        where: eq(companies.id, id),
    });

    if (!company) {
        throw new Error('Empresa no encontrada');
    }

    const [updated] = await db.update(companies)
        .set({
            handlesProfitSharing: !company.handlesProfitSharing,
            updatedAt: new Date(),
        })
        .where(eq(companies.id, id))
        .returning();

    revalidatePath('/catalogs/companies');
    return updated;
}
