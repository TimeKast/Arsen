import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validSheetNames } from '@/lib/db/schema';

// Spanish month sheet names to seed
const SPANISH_MONTH_SHEET_NAMES = [
    // Lowercase 3-letter abbreviations
    { name: 'ene', description: 'Enero - abreviado minúscula' },
    { name: 'feb', description: 'Febrero - abreviado minúscula' },
    { name: 'mar', description: 'Marzo - abreviado minúscula' },
    { name: 'abr', description: 'Abril - abreviado minúscula' },
    { name: 'may', description: 'Mayo - abreviado minúscula' },
    { name: 'jun', description: 'Junio - abreviado minúscula' },
    { name: 'jul', description: 'Julio - abreviado minúscula' },
    { name: 'ago', description: 'Agosto - abreviado minúscula' },
    { name: 'sep', description: 'Septiembre - abreviado minúscula' },
    { name: 'oct', description: 'Octubre - abreviado minúscula' },
    { name: 'nov', description: 'Noviembre - abreviado minúscula' },
    { name: 'dic', description: 'Diciembre - abreviado minúscula' },
    // Capitalized 3-letter abbreviations  
    { name: 'Ene', description: 'Enero - abreviado capitalizado' },
    { name: 'Feb', description: 'Febrero - abreviado capitalizado' },
    { name: 'Mar', description: 'Marzo - abreviado capitalizado' },
    { name: 'Abr', description: 'Abril - abreviado capitalizado' },
    { name: 'May', description: 'Mayo - abreviado capitalizado' },
    { name: 'Jun', description: 'Junio - abreviado capitalizado' },
    { name: 'Jul', description: 'Julio - abreviado capitalizado' },
    { name: 'Ago', description: 'Agosto - abreviado capitalizado' },
    { name: 'Sep', description: 'Septiembre - abreviado capitalizado' },
    { name: 'Oct', description: 'Octubre - abreviado capitalizado' },
    { name: 'Nov', description: 'Noviembre - abreviado capitalizado' },
    { name: 'Dic', description: 'Diciembre - abreviado capitalizado' },
    // Full month names lowercase
    { name: 'enero', description: 'Enero - nombre completo minúscula' },
    { name: 'febrero', description: 'Febrero - nombre completo minúscula' },
    { name: 'marzo', description: 'Marzo - nombre completo minúscula' },
    { name: 'abril', description: 'Abril - nombre completo minúscula' },
    { name: 'mayo', description: 'Mayo - nombre completo minúscula' },
    { name: 'junio', description: 'Junio - nombre completo minúscula' },
    { name: 'julio', description: 'Julio - nombre completo minúscula' },
    { name: 'agosto', description: 'Agosto - nombre completo minúscula' },
    { name: 'septiembre', description: 'Septiembre - nombre completo minúscula' },
    { name: 'octubre', description: 'Octubre - nombre completo minúscula' },
    { name: 'noviembre', description: 'Noviembre - nombre completo minúscula' },
    { name: 'diciembre', description: 'Diciembre - nombre completo minúscula' },
    // Full month names capitalized
    { name: 'Enero', description: 'Enero - nombre completo capitalizado' },
    { name: 'Febrero', description: 'Febrero - nombre completo capitalizado' },
    { name: 'Marzo', description: 'Marzo - nombre completo capitalizado' },
    { name: 'Abril', description: 'Abril - nombre completo capitalizado' },
    { name: 'Mayo', description: 'Mayo - nombre completo capitalizado' },
    { name: 'Junio', description: 'Junio - nombre completo capitalizado' },
    { name: 'Julio', description: 'Julio - nombre completo capitalizado' },
    { name: 'Agosto', description: 'Agosto - nombre completo capitalizado' },
    { name: 'Septiembre', description: 'Septiembre - nombre completo capitalizado' },
    { name: 'Octubre', description: 'Octubre - nombre completo capitalizado' },
    { name: 'Noviembre', description: 'Noviembre - nombre completo capitalizado' },
    { name: 'Diciembre', description: 'Diciembre - nombre completo capitalizado' },
];

export async function GET() {
    try {
        let inserted = 0;
        let skipped = 0;

        for (const sheetName of SPANISH_MONTH_SHEET_NAMES) {
            try {
                await db.insert(validSheetNames).values({
                    name: sheetName.name,
                    description: sheetName.description,
                    isActive: true,
                });
                inserted++;
            } catch (error) {
                // Skip duplicates
                if (error instanceof Error && error.message.includes('unique')) {
                    skipped++;
                } else {
                    throw error;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Seed completado: ${inserted} insertados, ${skipped} ya existían`,
            inserted,
            skipped,
        });
    } catch (error) {
        console.error('[SEED SHEET NAMES] Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        );
    }
}
