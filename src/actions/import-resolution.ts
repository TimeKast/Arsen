'use server';

import { eq, and } from 'drizzle-orm';
import { db, concepts, projects, conceptMappings, projectMappings } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';

// Get existing concepts for mapping
export async function getExistingConcepts() {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    return await db.query.concepts.findMany({
        where: eq(concepts.isActive, true),
        orderBy: (concepts, { asc }) => [asc(concepts.type), asc(concepts.name)],
    });
}

// Get existing projects for a company
export async function getExistingProjects(companyId: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    return await db.query.projects.findMany({
        where: and(
            eq(projects.companyId, companyId),
            eq(projects.isActive, true)
        ),
        orderBy: (projects, { asc }) => [asc(projects.name)],
    });
}

// Get saved mappings for a company
export async function getSavedMappings(companyId: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    return await db.query.conceptMappings.findMany({
        where: eq(conceptMappings.companyId, companyId),
    });
}

// Get saved project mappings for a company
export async function getSavedProjectMappings(companyId: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    return await db.query.projectMappings.findMany({
        where: eq(projectMappings.companyId, companyId),
    });
}

// Resolution types
export type ResolutionAction = 'MAP' | 'CREATE' | 'IGNORE';

export interface ConflictResolution {
    originalName: string;
    type: 'PROJECT' | 'CONCEPT';
    action: ResolutionAction;
    targetId?: string; // For MAP action
    newName?: string;  // For CREATE action
    conceptType?: 'INCOME' | 'COST'; // For concept CREATE
}

const resolutionSchema = z.object({
    companyId: z.string().uuid(),
    resolutions: z.array(z.object({
        originalName: z.string(),
        type: z.enum(['PROJECT', 'CONCEPT']),
        action: z.enum(['MAP', 'CREATE', 'IGNORE']),
        // Allow UUID or __ADMIN__ special value for admin expenses
        targetId: z.string().optional().refine(
            (val) => !val || val === '__ADMIN__' || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val),
            { message: 'Invalid UUID or __ADMIN__ value' }
        ),
        newName: z.string().optional(),
        conceptType: z.enum(['INCOME', 'COST']).optional(),
    })),
});

// Save resolutions (create mappings, create new entities)
export async function saveResolutions(data: z.infer<typeof resolutionSchema>) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    const validated = resolutionSchema.parse(data);
    const createdEntities: { type: string; id: string; name: string }[] = [];

    for (const resolution of validated.resolutions) {
        if (resolution.action === 'MAP' && resolution.targetId) {
            // Save mapping for future use
            if (resolution.type === 'CONCEPT') {
                // Check if mapping already exists
                const existing = await db.query.conceptMappings.findFirst({
                    where: and(
                        eq(conceptMappings.companyId, validated.companyId),
                        eq(conceptMappings.externalName, resolution.originalName)
                    ),
                });

                if (!existing) {
                    await db.insert(conceptMappings).values({
                        companyId: validated.companyId,
                        externalName: resolution.originalName,
                        conceptId: resolution.targetId,
                    });
                } else {
                    // Update existing mapping
                    await db.update(conceptMappings)
                        .set({ conceptId: resolution.targetId })
                        .where(eq(conceptMappings.id, existing.id));
                }
            }

            // Save project mappings
            if (resolution.type === 'PROJECT' && resolution.targetId && resolution.targetId !== '__ADMIN__') {
                const existing = await db.query.projectMappings.findFirst({
                    where: and(
                        eq(projectMappings.companyId, validated.companyId),
                        eq(projectMappings.externalName, resolution.originalName)
                    ),
                });

                if (!existing) {
                    await db.insert(projectMappings).values({
                        companyId: validated.companyId,
                        externalName: resolution.originalName,
                        projectId: resolution.targetId,
                    });
                } else {
                    await db.update(projectMappings)
                        .set({ projectId: resolution.targetId })
                        .where(eq(projectMappings.id, existing.id));
                }
            }
        } else if (resolution.action === 'CREATE' && resolution.newName) {
            console.log(`Creating ${resolution.type}: "${resolution.newName}"`);

            if (resolution.type === 'PROJECT') {
                // Create new project
                const [newProject] = await db.insert(projects).values({
                    companyId: validated.companyId,
                    name: resolution.newName,
                    appliesProfitSharing: false,
                }).returning();

                console.log(`Created project with ID: ${newProject.id}`);
                createdEntities.push({
                    type: 'PROJECT',
                    id: newProject.id,
                    name: newProject.name,
                });
            } else if (resolution.type === 'CONCEPT' && resolution.conceptType) {
                // Check if concept with this name already exists (case-insensitive)
                const allConcepts = await db.query.concepts.findMany();
                let existingConcept = allConcepts.find(c =>
                    c.name.toLowerCase() === resolution.newName!.toLowerCase() &&
                    c.type === resolution.conceptType
                );

                let conceptId: string;

                if (existingConcept) {
                    // Use existing concept instead of creating duplicate
                    console.log(`Concept "${resolution.newName}" already exists, reusing ID: ${existingConcept.id}`);
                    conceptId = existingConcept.id;
                } else {
                    // Create new concept only if it doesn't exist
                    const [newConcept] = await db.insert(concepts).values({
                        name: resolution.newName,
                        type: resolution.conceptType,
                    }).returning();
                    conceptId = newConcept.id;
                    console.log(`Created new concept "${resolution.newName}" with ID: ${conceptId}`);

                    createdEntities.push({
                        type: 'CONCEPT',
                        id: newConcept.id,
                        name: newConcept.name,
                    });
                }

                // Save mapping
                await db.insert(conceptMappings).values({
                    companyId: validated.companyId,
                    externalName: resolution.originalName,
                    conceptId: conceptId,
                });
            }
        }
        // IGNORE action: do nothing
    }

    return { success: true, createdEntities };
}
