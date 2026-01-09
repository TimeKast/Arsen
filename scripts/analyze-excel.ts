// Script to delete all results for testing
import 'dotenv/config';
import { db, results } from '../src/lib/db';

async function deleteAllResults() {
    console.log('=== Deleting ALL results ===\n');

    // Count current results
    const allResults = await db.select().from(results);
    console.log(`Current results count: ${allResults.length}`);

    if (allResults.length === 0) {
        console.log('No results to delete.');
        process.exit(0);
    }

    // Delete all
    await db.delete(results);

    // Verify
    const remaining = await db.select().from(results);
    console.log(`Remaining results: ${remaining.length}`);
    console.log('\n✅ All results deleted successfully!');

    process.exit(0);
}

deleteAllResults().catch(console.error);
