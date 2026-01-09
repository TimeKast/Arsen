// Add missing columns to reconciliations table
import 'dotenv/config';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('Adding missing columns to reconciliations table...');

    // Add columns one by one (they may already exist, so we use IF NOT EXISTS via raw SQL)
    const columns = [
        { name: 'business_unit', type: 'varchar(100)' },
        { name: 'account', type: 'varchar(100)' },
        { name: 'cancelled', type: 'decimal(15,2)' },
        { name: 'in_transit', type: 'decimal(15,2)' },
        { name: 'entries', type: 'decimal(15,2)' },
        { name: 'withdrawals', type: 'decimal(15,2)' },
        { name: 'balance', type: 'decimal(15,2)' },
        { name: 'observations', type: 'text' },
    ];

    for (const col of columns) {
        try {
            await db.execute(sql.raw(`ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`));
            console.log(`✓ Added/verified column: ${col.name}`);
        } catch (err: any) {
            if (err.message?.includes('already exists')) {
                console.log(`  Column ${col.name} already exists`);
            } else {
                console.error(`✗ Error with ${col.name}:`, err.message);
            }
        }
    }

    console.log('Done!');
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
