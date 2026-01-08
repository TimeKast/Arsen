'use server';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db, projects, profitSharingRules } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';
import type { FormulaType, TierConfig, GroupConfig } from '@/lib/profit-sharing/types';

// Schema for profit sharing rule
const ruleSchema = z.object({
    projectId: z.string().uuid(),
    formulaType: z.enum([
        'FIXED_ONLY',
        'PERCENT_SIMPLE',
        'FIXED_PLUS_PERCENT',
        'TIERED',
        'SPECIAL_FORMULA',
        'GROUPED',
        'DYNAMIC',
    ]),
    fixedAmount: z.number().optional(),
    percentRate: z.number().min(0).max(100).optional(),
    tiers: z.array(z.object({
        minProfit: z.number().min(0),
        maxProfit: z.number().optional(),
        percentRate: z.number().min(0).max(100),
    })).optional(),
    minimumProfit: z.number().min(0).optional(),
    maximumShare: z.number().min(0).optional(),
    groups: z.array(z.object({
        groupName: z.string(),
        percentRate: z.number().min(0).max(100),
        members: z.array(z.string()),
    })).optional(),
    baseAmount: z.number().min(0).optional(),
    incrementPercent: z.number().min(0).max(100).optional(),
    incrementThreshold: z.number().min(0).optional(),
});

export type RuleFormData = z.infer<typeof ruleSchema>;

// Get projects that apply profit sharing
export async function getProfitSharingProjects(companyId: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    return await db.query.projects.findMany({
        where: and(
            eq(projects.companyId, companyId),
            eq(projects.appliesProfitSharing, true),
            eq(projects.isActive, true)
        ),
    });
}

// Get existing rule for a project
export async function getProjectRule(projectId: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    return await db.query.profitSharingRules.findFirst({
        where: eq(profitSharingRules.projectId, projectId),
    });
}

// Save or update profit sharing rule
export async function saveProjectRule(data: RuleFormData) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        throw new Error('No autorizado');
    }

    const validated = ruleSchema.parse(data);

    // Check if rule exists
    const existing = await db.query.profitSharingRules.findFirst({
        where: eq(profitSharingRules.projectId, validated.projectId),
    });

    const ruleData = {
        projectId: validated.projectId,
        formulaType: validated.formulaType,
        fixedAmount: validated.fixedAmount?.toString() || null,
        percent1: validated.percentRate?.toString() || (validated.tiers?.[0]?.percentRate?.toString()) || null,
        percent2: validated.tiers?.[1]?.percentRate?.toString() || null,
        threshold1: validated.tiers?.[0]?.maxProfit?.toString() || validated.incrementThreshold?.toString() || null,
        dynamicIncrement: validated.maximumShare?.toString() || validated.baseAmount?.toString() || null,
    };

    if (existing) {
        await db.update(profitSharingRules)
            .set(ruleData)
            .where(eq(profitSharingRules.id, existing.id));
    } else {
        await db.insert(profitSharingRules).values(ruleData);
    }

    revalidatePath('/profit-sharing/config');
    return { success: true };
}

// Delete profit sharing rule
export async function deleteProjectRule(projectId: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    if (session.user.role !== 'ADMIN') {
        throw new Error('No autorizado');
    }

    await db.delete(profitSharingRules)
        .where(eq(profitSharingRules.projectId, projectId));

    revalidatePath('/profit-sharing/config');
    return { success: true };
}
