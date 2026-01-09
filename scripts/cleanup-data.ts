// Script to cleanup budgets and results from the database
// Run with: npx tsx scripts/cleanup-data.ts

import 'dotenv/config';
import { db } from '../src/lib/db';
import { budgets, results } from '../src/lib/db/schema';
import { count } from 'drizzle-orm';

async function cleanup() {
    console.log('🧹 Starting database cleanup...\n');

    // Count before deletion
    const [budgetCount] = await db.select({ count: count() }).from(budgets);
    const [resultCount] = await db.select({ count: count() }).from(results);

    console.log(`Found ${budgetCount?.count || 0} budgets`);
    console.log(`Found ${resultCount?.count || 0} results`);
    console.log('');

    // Delete all results (includes "Otros" M source results)
    console.log('Deleting all results (including Otros)...');
    await db.delete(results);
    console.log('✓ Results deleted');

    // Delete all budgets
    console.log('Deleting all budgets...');
    await db.delete(budgets);
    console.log('✓ Budgets deleted');

    console.log('\n✅ Cleanup complete!');
    console.log('Preserved: concepts, projects, areas, companies, users, mappings, rules');

    process.exit(0);
}

cleanup().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
