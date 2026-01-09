// Make total column nullable
import 'dotenv/config';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function run() {
    console.log('Making total column nullable...');
    await db.execute(sql.raw('ALTER TABLE reconciliations ALTER COLUMN total DROP NOT NULL'));
    console.log('Done - total column is now nullable');
    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
