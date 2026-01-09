'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, ilike } from 'drizzle-orm';
import { db, importRules, companies } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';

// Types
export type ImportRule = {
    id: string;
    companyId: string;
    ruleType: 'REDIRECT' | 'EXCLUDE';
    sourceProjectName: string | null;
    sourceConceptName: string;
    targetProjectName: string | null;
    isActive: boolean;
    description: string | null;
    createdAt: Date;
};

// Schemas
const createRuleSchema = z.object({
    companyId: z.string().uuid(),
    ruleType: z.enum(['REDIRECT', 'EXCLUDE']),
    sourceProjectName: z.string().nullable(),
    sourceConceptName: z.string().min(1),
    targetProjectName: z.string().nullable(),
    description: z.string().nullable(),
});

const updateRuleSchema = z.object({
    id: z.string().uuid(),
    ruleType: z.enum(['REDIRECT', 'EXCLUDE']).optional(),
    sourceProjectName: z.string().nullable().optional(),
    sourceConceptName: z.string().min(1).optional(),
    targetProjectName: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    description: z.string().nullable().optional(),
});

// Get all rules for a company
export async function getImportRules(companyId: string): Promise<ImportRule[]> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    const rules = await db.query.importRules.findMany({
        where: eq(importRules.companyId, companyId),
        orderBy: (rules, { desc }) => [desc(rules.createdAt)],
    });

    return rules.map(r => ({
        id: r.id,
        companyId: r.companyId,
        ruleType: r.ruleType,
        sourceProjectName: r.sourceProjectName,
        sourceConceptName: r.sourceConceptName,
        targetProjectName: r.targetProjectName,
        isActive: r.isActive,
        description: r.description,
        createdAt: r.createdAt,
    }));
}

// Get active rules for import processing
export async function getActiveImportRules(companyId: string): Promise<ImportRule[]> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    const rules = await db.query.importRules.findMany({
        where: and(
            eq(importRules.companyId, companyId),
            eq(importRules.isActive, true)
        ),
    });

    return rules.map(r => ({
        id: r.id,
        companyId: r.companyId,
        ruleType: r.ruleType,
        sourceProjectName: r.sourceProjectName,
        sourceConceptName: r.sourceConceptName,
        targetProjectName: r.targetProjectName,
        isActive: r.isActive,
        description: r.description,
        createdAt: r.createdAt,
    }));
}

// Create a new rule
export async function createImportRule(data: z.infer<typeof createRuleSchema>) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        throw new Error('No autorizado');
    }

    const validated = createRuleSchema.parse(data);

    // Validate: REDIRECT requires target project
    if (validated.ruleType === 'REDIRECT' && !validated.targetProjectName) {
        throw new Error('Las reglas de redirección requieren un proyecto destino');
    }

    const [rule] = await db.insert(importRules).values({
        companyId: validated.companyId,
        ruleType: validated.ruleType,
        sourceProjectName: validated.sourceProjectName,
        sourceConceptName: validated.sourceConceptName,
        targetProjectName: validated.targetProjectName,
        description: validated.description,
        createdBy: session.user.id,
    }).returning();

    revalidatePath('/catalogs/import-rules');
    return rule;
}

// Update a rule
export async function updateImportRule(data: z.infer<typeof updateRuleSchema>) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        throw new Error('No autorizado');
    }

    const validated = updateRuleSchema.parse(data);
    const { id, ...updates } = validated;

    await db.update(importRules)
        .set(updates)
        .where(eq(importRules.id, id));

    revalidatePath('/catalogs/import-rules');
    return { success: true };
}

// Delete a rule
export async function deleteImportRule(id: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        throw new Error('No autorizado');
    }

    await db.delete(importRules).where(eq(importRules.id, id));

    revalidatePath('/catalogs/import-rules');
    return { success: true };
}

