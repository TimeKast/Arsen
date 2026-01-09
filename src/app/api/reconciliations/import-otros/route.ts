import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { parseOtrosSheet } from '@/lib/excel/reconciliations-parser';
import { db, results, concepts, projects } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const companyId = formData.get('companyId') as string;

        if (!file || !companyId) {
            return NextResponse.json({ error: 'File and companyId required' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const parsed = parseOtrosSheet(buffer);

        if (!parsed || parsed.entries.length === 0) {
            return NextResponse.json({ error: 'No data found in Otros sheet' }, { status: 400 });
        }

        const { year, entries } = parsed;

        // Build concept cache
        const allConcepts = await db.query.concepts.findMany({
            where: eq(concepts.isActive, true),
        });
        const conceptByName = new Map<string, { id: string; type: string }>();
        for (const c of allConcepts) {
            conceptByName.set(c.name.toLowerCase(), { id: c.id, type: c.type });
        }

        // Build project cache
        const allProjects = await db.query.projects.findMany({
            where: and(eq(projects.companyId, companyId), eq(projects.isActive, true)),
        });
        const projectByName = new Map<string, string>();
        for (const p of allProjects) {
            projectByName.set(p.name.toLowerCase(), p.id);
        }

        // Track which months have data (to delete existing)
        const monthsWithData = new Set<number>();
        const resultEntries: Array<{
            companyId: string;
            projectId: string | null;
            conceptId: string;
            year: number;
            month: number;
            amount: string;
            importedBy: string;
        }> = [];

        const skippedConcepts = new Set<string>();
        const matchedConcepts = new Set<string>();

        for (const entry of entries) {
            // Find concept by code (e.g., "A01 Seguridad" -> look for "Seguridad")
            const conceptName = entry.conceptCode.split(/\s+/).slice(1).join(' ') || entry.conceptCode;
            const conceptInfo = conceptByName.get(conceptName.toLowerCase());

            if (!conceptInfo) {
                skippedConcepts.add(conceptName);
                continue; // Skip if concept not found
            }
            matchedConcepts.add(conceptName);

            const projectId = entry.projectName
                ? projectByName.get(entry.projectName.toLowerCase()) || null
                : null;

            // Create entries for each month with value
            for (let month = 1; month <= 12; month++) {
                const amount = entry.amounts[month - 1];
                if (amount === 0) continue;

                monthsWithData.add(month);

                resultEntries.push({
                    companyId,
                    projectId,
                    conceptId: conceptInfo.id,
                    year,
                    month,
                    amount: amount.toFixed(2),
                    importedBy: session.user.id,
                });
            }
        }

        console.log('Otros import - Year:', year);
        console.log('Otros import - Entries parsed:', entries.length);
        console.log('Otros import - Matched concepts:', Array.from(matchedConcepts).slice(0, 10));
        console.log('Otros import - Skipped concepts (not found):', Array.from(skippedConcepts).slice(0, 10));
        console.log('Otros import - Result entries to insert:', resultEntries.length);

        // Delete existing results for affected months
        for (const month of monthsWithData) {
            await db.delete(results).where(
                and(
                    eq(results.companyId, companyId),
                    eq(results.year, year),
                    eq(results.month, month)
                )
            );
        }

        // Insert new results in batches
        const BATCH_SIZE = 100;
        let insertedCount = 0;
        for (let i = 0; i < resultEntries.length; i += BATCH_SIZE) {
            const batch = resultEntries.slice(i, i + BATCH_SIZE);
            await db.insert(results).values(batch);
            insertedCount += batch.length;
        }

        revalidatePath('/results');

        return NextResponse.json({
            success: true,
            year,
            insertedCount,
            monthsAffected: Array.from(monthsWithData).sort((a, b) => a - b)
        });
    } catch (error) {
        console.error('Import Otros error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error importing results'
        }, { status: 500 });
    }
}
