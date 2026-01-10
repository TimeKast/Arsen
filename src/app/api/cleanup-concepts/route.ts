import { NextResponse } from 'next/server';
import { findDuplicateConcepts, autoMergeDuplicates } from '@/actions/concepts';

// GET: Find duplicate concepts (preview)
export async function GET() {
    try {
        const duplicates = await findDuplicateConcepts();
        return NextResponse.json({
            success: true,
            duplicateGroups: duplicates.length,
            duplicates,
        });
    } catch (error) {
        console.error('[CLEANUP-CONCEPTS] Error:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

// POST: Execute auto-merge of duplicates
export async function POST() {
    try {
        const result = await autoMergeDuplicates();
        return NextResponse.json(result);
    } catch (error) {
        console.error('[CLEANUP-CONCEPTS] Error:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
