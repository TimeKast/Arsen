import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { budgets, results } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado - solo ADMIN' }, { status: 401 });
        }

        // Count before deletion
        const [budgetCountBefore] = await db.execute(sql`SELECT COUNT(*) as count FROM budgets`);
        const [resultCountBefore] = await db.execute(sql`SELECT COUNT(*) as count FROM results`);

        // Delete all budgets
        await db.delete(budgets);

        // Delete all results  
        await db.delete(results);

        return NextResponse.json({
            success: true,
            message: 'Datos eliminados exitosamente',
            deleted: {
                budgets: Number((budgetCountBefore as { count: string }).count),
                results: Number((resultCountBefore as { count: string }).count),
            },
            preserved: [
                'concepts',
                'projects',
                'areas',
                'companies',
                'users',
                'mappings',
                'import-rules',
                'valid-sheet-names',
                'concept-type-overrides'
            ]
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
}

// GET to show instructions
export async function GET() {
    return NextResponse.json({
        warning: '⚠️ Este endpoint BORRARÁ todos los presupuestos y resultados',
        instructions: 'Envía una petición POST para ejecutar la limpieza (solo ADMIN)',
        willDelete: ['budgets', 'results'],
        willPreserve: ['concepts', 'projects', 'areas', 'companies', 'users', 'mappings']
    });
}
