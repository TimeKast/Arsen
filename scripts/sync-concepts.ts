import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// Complete list of concepts from accountant Excel
const incomeConceptos = [
    'Tarifa horaria',
    'Pensiones',
    'Etiquetas',
    'Boletos sellados',
    'Eventos',
    'Activación tarjeta',
    'Reposición tarjeta',
    'Tarifa horaria valet parking',
    'Recargos',
    'Igualas',
    'Bicicleta',
    'Venta de equipo',
    'Vales magneticos',
    'Facturas canceladas',
    'Sobrantes',
    'Ganancia Cambiaria',
    'Daño a vehículos',
    'Telefonia',
    'Baños',
];

const costConceptos = [
    'Nomina operativa',
    'Nomina gerencial',
    'Asesoría contable',
    'Renta fija',
    'Renta variable',
    'Mantenimiento plaza',
    'Luz',
    'Teléfono',
    'Seguridad',
    'Seguros y fianzas',
    'Boletos',
    'Uniformes',
    'Impresiones',
    'Equipo de estacionamiento',
    'Mantenimiento equipo de estacionamiento',
    'Señalizaciones',
    'Licencias',
    'Mantenimiento equipo de oficina',
    'Papelería y artículos de oficina',
    'Articulos de limpieza',
    'Incidentes',
    'Anuncios periodicos',
    'Viaticos',
    'Avion',
    'Hospedaje',
    'Taxis',
    'Alimentos',
    'Mensajería y paquetería',
    'Suministros de oficina',
    'Equipo de oficina',
    'Depreciación y amortización',
    'Reparacion equipo de estacionamiento',
    'Comisiones bancarias',
    'Renta sanitario',
    'Honorarios Legal',
    'Gasolina',
    'Publicidad',
    'Cuotas IMSS',
    'Cuotas INFONAVIT',
    'Cuotas AFORE',
    'Impuesto sobre nóminas',
    'Varios',
    'No deducibles',
];

// Wepark projects from Excel
const weparkProjects = [
    { name: 'Corporativo Polanco', code: 'WPK-CPO' },
    { name: 'The ROOM', code: 'WPK-TRM' },
    { name: 'Torre Prisma', code: 'WPK-TPR' },
    { name: 'BETEL', code: 'WPK-BET' },
    { name: 'Interlomas', code: 'WPK-INT' },
    { name: 'Santa Fe', code: 'WPK-STF' },
    { name: 'Leibnitz', code: 'WPK-LEI' },
    { name: 'Cuadrata', code: 'WPK-CUA' },
    { name: 'Puerto Paraíso', code: 'WPK-PPA' },
    { name: 'Summit', code: 'WPK-SUM' },
    { name: 'Monte Pelvoux', code: 'WPK-MPV' },
    { name: 'P. Panorama', code: 'WPK-PAN' },
    { name: 'JP Morgan', code: 'WPK-JPM' },
    { name: 'Andes', code: 'WPK-AND' },
    { name: 'Xochimilco', code: 'WPK-XOC' },
    { name: 'Reforma 115', code: 'WPK-R15' },
    { name: 'Montes Urales', code: 'WPK-MUR' },
    { name: 'Insurgentes', code: 'WPK-INS' },
    { name: 'Las armas', code: 'WPK-ARM' },
    { name: 'Sonora', code: 'WPK-SON' },
    { name: 'Londres', code: 'WPK-LON' },
    { name: 'Plaza Polanco', code: 'WPK-PPO' },
    { name: 'Sabino', code: 'WPK-SAB' },
    { name: 'Citi', code: 'WPK-CIT' },
    { name: 'Warner', code: 'WPK-WAR' },
    { name: 'Garden A.', code: 'WPK-GAR' },
    { name: 'Toluca 2000', code: 'WPK-T20' },
    { name: 'Anima', code: 'WPK-ANI' },
    { name: 'Administración', code: 'WPK-ADM' }, // For admin expenses
];

async function syncConceptsAndProjects() {
    console.log('🔄 Syncing concepts and projects from Excel...\n');

    // Get Wepark company
    const wepark = await db.query.companies.findFirst({
        where: eq(schema.companies.name, 'Wepark'),
    });

    if (!wepark) {
        console.error('❌ Wepark company not found. Run seed first.');
        process.exit(1);
    }

    console.log(`✓ Found company: ${wepark.name} (${wepark.id})\n`);

    // Sync INCOME concepts
    console.log('📊 Syncing INCOME concepts...');
    let addedIncome = 0;
    for (const name of incomeConceptos) {
        const existing = await db.query.concepts.findFirst({
            where: eq(schema.concepts.name, name),
        });
        if (!existing) {
            await db.insert(schema.concepts).values({
                name,
                type: 'INCOME',
                isActive: true,
            });
            console.log(`  + ${name}`);
            addedIncome++;
        }
    }
    console.log(`  ✓ Added ${addedIncome} new income concepts\n`);

    // Sync COST concepts
    console.log('📊 Syncing COST concepts...');
    let addedCost = 0;
    for (const name of costConceptos) {
        const existing = await db.query.concepts.findFirst({
            where: eq(schema.concepts.name, name),
        });
        if (!existing) {
            await db.insert(schema.concepts).values({
                name,
                type: 'COST',
                isActive: true,
            });
            console.log(`  + ${name}`);
            addedCost++;
        }
    }
    console.log(`  ✓ Added ${addedCost} new cost concepts\n`);

    // Sync Wepark projects
    console.log('🏗️ Syncing Wepark projects...');
    let addedProjects = 0;
    for (const proj of weparkProjects) {
        const existing = await db.query.projects.findFirst({
            where: eq(schema.projects.name, proj.name),
        });
        if (!existing) {
            await db.insert(schema.projects).values({
                name: proj.name,
                code: proj.code,
                companyId: wepark.id,
                appliesProfitSharing: true,
                isActive: true,
            });
            console.log(`  + ${proj.name} (${proj.code})`);
            addedProjects++;
        }
    }
    console.log(`  ✓ Added ${addedProjects} new projects\n`);

    console.log('✅ Sync completed!');
}

syncConceptsAndProjects()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    });
