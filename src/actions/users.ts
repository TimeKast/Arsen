'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db, users, userCompanies, companies, areas } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';

const userSchema = z.object({
    email: z.string().email('Email invalido'),
    name: z.string().min(1, 'El nombre es requerido').max(255),
    password: z.string().transform(val => val === '' ? undefined : val).optional().refine(
        (val) => val === undefined || val.length >= 6,
        { message: 'La contrasena debe tener al menos 6 caracteres' }
    ),
    role: z.enum(['ADMIN', 'STAFF', 'AREA_USER', 'READONLY']),
    areaId: z.string().uuid().optional().nullable(),
    companyIds: z.array(z.string().uuid()).min(1, 'Debe asignar al menos una empresa'),
});

export type UserFormData = z.infer<typeof userSchema>;

// Get all users with their companies
export async function getUsers() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('No autorizado');
    }

    const allUsers = await db.query.users.findMany({
        with: {
            area: true,
            companies: {
                with: {
                    company: true,
                },
            },
        },
        orderBy: (users, { asc }) => [asc(users.name)],
    });

    return allUsers;
}

// Get companies for user assignment
export async function getCompaniesForUserSelect() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('No autorizado');
    }

    return await db.query.companies.findMany({
        where: eq(companies.isActive, true),
        orderBy: (companies, { asc }) => [asc(companies.name)],
    });
}

// Get areas for user assignment
export async function getAreasForUserSelect() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('No autorizado');
    }

    return await db.query.areas.findMany({
        where: eq(areas.isActive, true),
        orderBy: (areas, { asc }) => [asc(areas.name)],
    });
}

// Create user
export async function createUser(data: UserFormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('No autorizado');
    }

    const validated = userSchema.parse(data);

    if (!validated.password) {
        throw new Error('La contrasena es requerida para nuevos usuarios');
    }

    // Check if email exists
    const existing = await db.query.users.findFirst({
        where: eq(users.email, validated.email),
    });

    if (existing) {
        throw new Error('El email ya esta registrado');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 10);

    // Create user
    const [user] = await db.insert(users).values({
        email: validated.email,
        name: validated.name,
        passwordHash,
        role: validated.role,
        areaId: validated.role === 'AREA_USER' ? validated.areaId : null,
    }).returning();

    // Assign companies
    if (validated.companyIds.length > 0) {
        await db.insert(userCompanies).values(
            validated.companyIds.map((companyId) => ({
                userId: user.id,
                companyId,
            }))
        );
    }

    revalidatePath('/users');
    return user;
}

// Update user
export async function updateUser(id: string, data: UserFormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('No autorizado');
    }

    const validated = userSchema.parse(data);

    // Check if email exists (excluding current user)
    const existing = await db.query.users.findFirst({
        where: eq(users.email, validated.email),
    });

    if (existing && existing.id !== id) {
        throw new Error('El email ya esta registrado');
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
        email: validated.email,
        name: validated.name,
        role: validated.role,
        areaId: validated.role === 'AREA_USER' ? validated.areaId : null,
        updatedAt: new Date(),
    };

    // Update password if provided
    if (validated.password) {
        updateData.passwordHash = await bcrypt.hash(validated.password, 10);
    }

    // Update user
    const [user] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

    // Update companies: remove old, add new
    await db.delete(userCompanies).where(eq(userCompanies.userId, id));

    if (validated.companyIds.length > 0) {
        await db.insert(userCompanies).values(
            validated.companyIds.map((companyId) => ({
                userId: id,
                companyId,
            }))
        );
    }

    revalidatePath('/users');
    return user;
}

// Toggle user active
export async function toggleUserActive(id: string) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('No autorizado');
    }

    // Prevent self-deactivation
    if (session.user.id === id) {
        throw new Error('No puedes desactivar tu propia cuenta');
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, id),
    });

    if (!user) {
        throw new Error('Usuario no encontrado');
    }

    const [updated] = await db.update(users)
        .set({
            isActive: !user.isActive,
            updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

    revalidatePath('/users');
    return updated;
}
