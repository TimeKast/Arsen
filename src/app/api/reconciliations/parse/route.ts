import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { parseReconciliationsFile, hasOtrosSheet } from '@/lib/excel/reconciliations-parser';

export async function POST(request: NextRequest) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = parseReconciliationsFile(buffer);
        const hasOtros = hasOtrosSheet(buffer);

        return NextResponse.json({ ...result, hasOtros });
    } catch (error) {
        console.error('Parse error:', error);
        return NextResponse.json({
            success: false,
            errors: ['Error processing file'],
            data: [],
            rawHeaders: [],
            hasOtros: false
        }, { status: 500 });
    }
}
