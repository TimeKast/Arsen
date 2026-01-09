import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function checkData() {
    const sql = neon(process.env.DATABASE_URL!);

    console.log('=== PROJECTS ===');
    const projects = await sql`SELECT id, name, company_id FROM projects LIMIT 20`;
    console.table(projects);

    console.log('\n=== CONCEPTS ===');
    const concepts = await sql`SELECT id, name, type FROM concepts LIMIT 20`;
    console.table(concepts);

    console.log('\n=== RESULTS (first 10) ===');
    const results = await sql`
        SELECT r.id, r.project_id, p.name as project_name, c.name as concept_name, r.amount
        FROM results r
        LEFT JOIN projects p ON r.project_id = p.id
        JOIN concepts c ON r.concept_id = c.id
        LIMIT 10
    `;
    console.table(results);
}

checkData().catch(console.error);
