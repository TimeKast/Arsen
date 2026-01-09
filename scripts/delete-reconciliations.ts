// Delete all reconciliations
import 'dotenv/config';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function run() {
    console.log('Deleting all reconciliations...');
    await db.execute(sql.raw('DELETE FROM reconciliations'));
    console.log('Done - all reconciliations deleted');
    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
