import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function checkEtiquetas() {
    const sql = neon(process.env.DATABASE_URL!);

    console.log('=== CONCEPTS named Etiquetas ===');
    const concepts = await sql`SELECT id, name, type FROM concepts WHERE name ILIKE '%etiqueta%'`;
    console.table(concepts);

    console.log('\n=== RESULTS with Etiquetas ===');
    const results = await sql`
        SELECT r.id, p.name as project_name, c.name as concept_name, c.type as concept_type, r.amount
        FROM results r
        JOIN concepts c ON r.concept_id = c.id
        LEFT JOIN projects p ON r.project_id = p.id
        WHERE c.name ILIKE '%etiqueta%'
        LIMIT 20
    `;
    console.table(results);

    console.log('\n=== ALL concepts count by type ===');
    const counts = await sql`SELECT type, COUNT(*) FROM concepts GROUP BY type`;
    console.table(counts);
}

checkEtiquetas().catch(console.error);
