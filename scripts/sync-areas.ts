import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Areas to sync (based on budget Excel files)
const AREAS = [
    { code: '01', name: 'Compras' },
    { code: '02', name: 'Comercial' },
    { code: '03', name: 'RH' },
    { code: '04', name: 'Operación' },
    { code: '05', name: 'Licencias' },
    { code: '06', name: 'Finanzas' },
    { code: '07', name: 'Otros' },
];

async function syncAreas() {
    console.log('🔄 Syncing areas...\n');

    // Get all companies
    const companies = await sql`SELECT id, name FROM companies WHERE is_active = true`;
    console.log(`Found ${companies.length} active companies\n`);

    for (const company of companies) {
        console.log(`\n📁 Processing: ${company.name}`);

        for (const area of AREAS) {
            const fullName = `(${area.code}) ${area.name}`;

            // Check if area exists
            const existing = await sql`
                SELECT id FROM areas 
                WHERE company_id = ${company.id} 
                AND name = ${fullName}
            `;

            if (existing.length === 0) {
                // Create area
                await sql`
                    INSERT INTO areas (company_id, name, is_active)
                    VALUES (${company.id}, ${fullName}, true)
                `;
                console.log(`  ✅ Created: ${fullName}`);
            } else {
                console.log(`  ⏭️  Exists: ${fullName}`);
            }
        }
    }

    console.log('\n🎉 Areas synced successfully!');
}

syncAreas().catch(console.error);
