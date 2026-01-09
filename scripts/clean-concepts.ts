import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../src/lib/db/schema';

async function cleanConceptsAndResults() {
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql, { schema });

    console.log('🧹 Cleaning database...\n');

    // First delete results (they reference concepts and projects)
    console.log('Deleting all results...');
    await sql`DELETE FROM results`;
    console.log('✅ Results deleted\n');

    // Delete concept_mappings (they reference concepts)
    console.log('Deleting all concept_mappings...');
    await sql`DELETE FROM concept_mappings`;
    console.log('✅ Concept mappings deleted\n');

    // Delete concepts
    console.log('Deleting all concepts...');
    await sql`DELETE FROM concepts`;
    console.log('✅ Concepts deleted\n');

    // Also delete projects for fresh start
    console.log('Deleting all projects...');
    await sql`DELETE FROM projects`;
    console.log('✅ Projects deleted\n');

    console.log('🎉 Database cleaned! Concepts and projects will be created during import.');
}

cleanConceptsAndResults().catch(console.error);
