import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import bcrypt from 'bcryptjs';
import * as schema from '../src/lib/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
    console.log('🌱 Starting seed...');

    // ============ COMPANIES ============
    console.log('📦 Creating companies...');

    const [wepark] = await db.insert(schema.companies).values({
        name: 'Wepark',
        code: 'WPK',
        handlesProfitSharing: true,
        isActive: true,
    }).returning();

    const [sigma] = await db.insert(schema.companies).values({
        name: 'Sigma',
        code: 'SGM',
        handlesProfitSharing: false,
        isActive: true,
    }).returning();

    console.log(`  ✓ Created: ${wepark.name}, ${sigma.name}`);

    // ============ AREAS ============
    console.log('🏢 Creating areas...');

    const areasData = [
        { name: 'Compras', companyId: wepark.id },
        { name: 'Recursos Humanos', companyId: wepark.id },
        { name: 'Operaciones', companyId: wepark.id },
        { name: 'Finanzas', companyId: wepark.id },
        { name: 'Administracion', companyId: sigma.id },
        { name: 'Ventas', companyId: sigma.id },
    ];

    const areas = await db.insert(schema.areas).values(areasData).returning();
    console.log(`  ✓ Created ${areas.length} areas`);

    // ============ CONCEPTS ============
    console.log('📊 Creating concepts...');

    const conceptsData = [
        // Income concepts
        { name: 'Tarifa horaria', type: 'INCOME' as const, areaId: null },
        { name: 'Pensiones mensuales', type: 'INCOME' as const, areaId: null },
        { name: 'Servicio de valet', type: 'INCOME' as const, areaId: null },
        { name: 'Eventos especiales', type: 'INCOME' as const, areaId: null },
        { name: 'Multas y recargos', type: 'INCOME' as const, areaId: null },
        // Cost concepts
        { name: 'Nomina', type: 'COST' as const, areaId: areas.find(a => a.name === 'Recursos Humanos')?.id },
        { name: 'Renta', type: 'COST' as const, areaId: null },
        { name: 'Servicios publicos', type: 'COST' as const, areaId: null },
        { name: 'Mantenimiento', type: 'COST' as const, areaId: areas.find(a => a.name === 'Operaciones')?.id },
        { name: 'Seguros', type: 'COST' as const, areaId: null },
        { name: 'Impuestos', type: 'COST' as const, areaId: areas.find(a => a.name === 'Finanzas')?.id },
        { name: 'Publicidad', type: 'COST' as const, areaId: null },
        { name: 'Suministros', type: 'COST' as const, areaId: areas.find(a => a.name === 'Compras')?.id },
    ];

    const concepts = await db.insert(schema.concepts).values(conceptsData).returning();
    console.log(`  ✓ Created ${concepts.length} concepts`);

    // ============ PROJECTS ============
    console.log('🏗️ Creating projects...');

    const projectsData = [
        // Wepark projects
        { name: 'Estacionamiento Centro', code: 'WPK-001', companyId: wepark.id, appliesProfitSharing: true },
        { name: 'Estacionamiento Norte', code: 'WPK-002', companyId: wepark.id, appliesProfitSharing: true },
        { name: 'Estacionamiento Sur', code: 'WPK-003', companyId: wepark.id, appliesProfitSharing: false },
        { name: 'Valet Premium', code: 'WPK-VAL', companyId: wepark.id, appliesProfitSharing: true },
        // Sigma projects
        { name: 'Proyecto Alpha', code: 'SGM-A', companyId: sigma.id, appliesProfitSharing: false },
        { name: 'Proyecto Beta', code: 'SGM-B', companyId: sigma.id, appliesProfitSharing: false },
    ];

    const projects = await db.insert(schema.projects).values(projectsData).returning();
    console.log(`  ✓ Created ${projects.length} projects`);

    // ============ ADMIN USER ============
    console.log('👤 Creating admin user...');

    const passwordHash = await bcrypt.hash('admin123', 10);

    const [adminUser] = await db.insert(schema.users).values({
        email: 'admin@arsen.local',
        name: 'Administrador',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
    }).returning();

    // Assign admin to all companies
    await db.insert(schema.userCompanies).values([
        { userId: adminUser.id, companyId: wepark.id },
        { userId: adminUser.id, companyId: sigma.id },
    ]);

    console.log(`  ✓ Created admin user: ${adminUser.email}`);

    // ============ SAMPLE USERS ============
    console.log('👥 Creating sample users...');

    const staffPasswordHash = await bcrypt.hash('staff123', 10);
    const [staffUser] = await db.insert(schema.users).values({
        email: 'staff@arsen.local',
        name: 'Usuario Staff',
        passwordHash: staffPasswordHash,
        role: 'STAFF',
        isActive: true,
    }).returning();

    await db.insert(schema.userCompanies).values([
        { userId: staffUser.id, companyId: wepark.id },
        { userId: staffUser.id, companyId: sigma.id },
    ]);

    const areaPasswordHash = await bcrypt.hash('area123', 10);
    const [areaUser] = await db.insert(schema.users).values({
        email: 'compras@arsen.local',
        name: 'Usuario Compras',
        passwordHash: areaPasswordHash,
        role: 'AREA_USER',
        areaId: areas.find(a => a.name === 'Compras')?.id,
        isActive: true,
    }).returning();

    await db.insert(schema.userCompanies).values([
        { userId: areaUser.id, companyId: wepark.id },
    ]);

    console.log(`  ✓ Created sample users: staff@arsen.local, compras@arsen.local`);

    console.log('\n✅ Seed completed successfully!\n');
    console.log('🔐 Login credentials:');
    console.log('   Admin: admin@arsen.local / admin123');
    console.log('   Staff: staff@arsen.local / staff123');
    console.log('   Area:  compras@arsen.local / area123');
}

seed()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    });
