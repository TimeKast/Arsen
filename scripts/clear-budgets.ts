// Script to clear all budget data
import 'dotenv/config';
import { db, budgets } from '../src/lib/db';

async function clearBudgets() {
    console.log('Limpiando presupuestos...');
    const result = await db.delete(budgets);
    console.log('✓ Todos los presupuestos han sido eliminados');
    console.log('Ahora puedes re-importar los archivos de presupuesto.');
    process.exit(0);
}

clearBudgets().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
