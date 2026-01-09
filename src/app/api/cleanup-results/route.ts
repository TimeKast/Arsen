import { eq } from 'drizzle-orm';
import { db, results } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

// Cleanup API - GET /api/cleanup-results?year=2026
export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get('year') || '0');

    if (!year || year < 2020 || year > 2100) {
        return NextResponse.json({ error: 'Año inválido' }, { status: 400 });
    }

    try {
        await db.delete(results).where(eq(results.year, year));

        revalidatePath('/results');
        revalidatePath('/profit-sharing');
        revalidatePath('/comparison');

        return NextResponse.json({
            success: true,
            message: `Resultados del año ${year} eliminados correctamente`
        });
    } catch (error) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Error al eliminar'
        }, { status: 500 });
    }
}
