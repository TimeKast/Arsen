'use server';

import { db } from '@/lib/db';
import { validSheetNames } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/config';

export type ValidSheetName = typeof validSheetNames.$inferSelect;

// Get all valid sheet names
export async function getValidSheetNames(): Promise<ValidSheetName[]> {
    return await db.select().from(validSheetNames).orderBy(asc(validSheetNames.name));
}

// Get only active sheet names (for parser)
export async function getActiveSheetNames(): Promise<string[]> {
    const names = await db.select({ name: validSheetNames.name })
        .from(validSheetNames)
        .where(eq(validSheetNames.isActive, true))
        .orderBy(asc(validSheetNames.name));
    return names.map(n => n.name);
}

// Create a new valid sheet name
export async function createValidSheetName(name: string, description?: string): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        await db.insert(validSheetNames).values({
            name: name.trim(),
            description: description?.trim() || null,
        });
        revalidatePath('/catalogs/sheet-names');
        return { success: true };
    } catch (error) {
        if (error instanceof Error && error.message.includes('unique')) {
            return { success: false, error: 'Este nombre ya existe' };
        }
        return { success: false, error: 'Error al crear' };
    }
}

// Toggle active status
export async function toggleValidSheetName(id: string): Promise<{ success: boolean }> {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
        return { success: false };
    }

    const [current] = await db.select().from(validSheetNames).where(eq(validSheetNames.id, id));
    if (!current) return { success: false };

    await db.update(validSheetNames)
        .set({ isActive: !current.isActive })
        .where(eq(validSheetNames.id, id));

    revalidatePath('/catalogs/sheet-names');
    return { success: true };
}

// Delete a valid sheet name
export async function deleteValidSheetName(id: string): Promise<{ success: boolean }> {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
        return { success: false };
    }

    await db.delete(validSheetNames).where(eq(validSheetNames.id, id));
    revalidatePath('/catalogs/sheet-names');
    return { success: true };
}
