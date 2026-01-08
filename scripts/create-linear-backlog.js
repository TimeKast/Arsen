/**
 * create-linear-backlog.js
 * Script para crear backlog de Arsen en Linear
 * 
 * Uso: node create-linear-backlog.js
 * 
 * Prerequisitos:
 * - npm install @linear/sdk dotenv
 * - Archivo .env con LINEAR_API_KEY
 */

require('dotenv').config();
const { LinearClient } = require('@linear/sdk');

// ============================================
// 🔧 CONFIGURACIÓN
// ============================================

const CONFIG = {
    teamName: 'Jose',
    projectName: '🏢 Arsen - Control Presupuestal',
    projectDescription: 'Sistema de Control Presupuestal Multi-Empresa para Wepark y Sigma',
    issuePrefix: 'ARSEN',
};

// ============================================
// 📊 MILESTONES
// ============================================

const MILESTONES = [
    { name: 'M0 Setup & Infraestructura', description: 'Proyecto base listo para desarrollo' },
    { name: 'M1 MVP - Core', description: 'Flujo completo de cierre mensual' },
    { name: 'M2 V1 - Reparto', description: 'Motor de reparto con 7 fórmulas' },
    { name: 'M3 V1 - Exportaciones', description: 'Exportar a Excel y PDF' },
    { name: 'M4 V1.1 - Conciliaciones', description: 'Gestión de conciliaciones' },
];

// ============================================
// 🏷️ LABELS
// ============================================

const LABELS = [
    { name: 'setup', color: '#6B7280' },
    { name: 'frontend', color: '#3B82F6' },
    { name: 'backend', color: '#10B981' },
    { name: 'database', color: '#8B5CF6' },
    { name: 'feature', color: '#F59E0B' },
    { name: 'audit', color: '#EF4444' },
    { name: 'quality', color: '#EC4899' },
];

// ============================================
// 📋 ISSUES (38 total)
// ============================================

const ISSUES = [
    // ========== M0: SETUP ==========
    {
        id: '001',
        milestone: 'M0 Setup & Infraestructura',
        title: 'Setup proyecto Next.js 14',
        labels: ['setup', 'frontend'],
        priority: 1,
        estimate: 2,
        dependencies: [],
        description: `**Objetivo**
Crear proyecto base Next.js 14 con App Router, TypeScript y estructura de carpetas.

**Alcance**
- Inicializar proyecto con create-next-app
- Configurar TypeScript strict
- Estructura de carpetas según arquitectura
- Configurar Tailwind CSS
- Instalar shadcn/ui

**Criterios de aceptación**
- [ ] npm run dev inicia sin errores
- [ ] Tailwind funciona
- [ ] shadcn/ui instalado
- [ ] Estructura de carpetas creada`,
    },
    {
        id: '002',
        milestone: 'M0 Setup & Infraestructura',
        title: 'Configurar Drizzle ORM + Neon',
        labels: ['setup', 'database'],
        priority: 1,
        estimate: 3,
        dependencies: ['001'],
        description: `**Objetivo**
Conectar base de datos PostgreSQL con Drizzle ORM.

**Alcance**
- Instalar drizzle-orm y @neondatabase/serverless
- Crear lib/db/index.ts (cliente)
- Crear lib/db/schema.ts (esquema completo)
- Configurar drizzle.config.ts

**Criterios de aceptación**
- [ ] Conexión a Neon exitosa
- [ ] npm run db:push aplica schema
- [ ] Todas las tablas creadas`,
    },
    {
        id: '003',
        milestone: 'M0 Setup & Infraestructura',
        title: 'Implementar NextAuth.js con 4 roles',
        labels: ['setup', 'backend', 'frontend'],
        priority: 1,
        estimate: 5,
        dependencies: ['002'],
        description: `**Objetivo**
Configurar autenticación con NextAuth.js v5 y RBAC.

**Alcance**
- Credentials Provider
- JWT con role y companyIds  
- Middleware de protección
- Página de login

Roles: ADMIN, STAFF, AREA_USER, READONLY

**Criterios de aceptación**
- [ ] Login con email/password funciona
- [ ] JWT contiene role y companyIds
- [ ] Rutas protegidas redirigen a /login`,
    },
    {
        id: '004',
        milestone: 'M0 Setup & Infraestructura',
        title: 'Crear layout dashboard con sidebar',
        labels: ['frontend'],
        priority: 2,
        estimate: 3,
        dependencies: ['003'],
        description: `**Objetivo**
Crear layout principal con sidebar de navegación según rol.

**Alcance**
- app/(dashboard)/layout.tsx
- Sidebar con navegación
- Header con selector de empresa
- Responsive

**Criterios de aceptación**
- [ ] Sidebar muestra navegación
- [ ] Items se ocultan según rol
- [ ] Layout responsive`,
    },
    {
        id: '005',
        milestone: 'M0 Setup & Infraestructura',
        title: 'Auditoría — Post Setup M0',
        labels: ['audit', 'quality'],
        priority: 2,
        estimate: 2,
        dependencies: ['004'],
        description: `**Tipo:** Auditoría

**Objetivo**
Verificar que el trabajo de setup sigue alineado con la documentación.

**Issues revisados:** ARSEN-001 a ARSEN-004

**Checklist**
- [ ] Estructura de carpetas coincide con arquitectura
- [ ] Schema de BD coincide con modelo de datos
- [ ] Roles implementados coinciden con matriz
- [ ] Build y lint pasan sin errores

**Resultado esperado**
- Lista de hallazgos
- Decisión: continuar / pausar / ajustar`,
    },
    {
        id: '006',
        milestone: 'M0 Setup & Infraestructura',
        title: 'CRUD de empresas',
        labels: ['backend', 'frontend', 'feature'],
        priority: 2,
        estimate: 3,
        dependencies: ['005'],
        description: `**Objetivo**
Implementar gestión de empresas.

**Criterios de aceptación**
- [ ] Listar empresas
- [ ] Crear empresa con nombre, código
- [ ] Toggle handlesProfitSharing
- [ ] Solo Admin puede crear/editar`,
    },
    {
        id: '007',
        milestone: 'M0 Setup & Infraestructura',
        title: 'CRUD de áreas',
        labels: ['backend', 'frontend', 'feature'],
        priority: 2,
        estimate: 2,
        dependencies: ['006'],
        description: `**Objetivo**
Implementar gestión de áreas por empresa.

**Criterios de aceptación**
- [ ] Listar áreas de empresa seleccionada
- [ ] Crear área con nombre
- [ ] Editar área`,
    },
    {
        id: '008',
        milestone: 'M0 Setup & Infraestructura',
        title: 'CRUD de conceptos',
        labels: ['backend', 'frontend', 'feature'],
        priority: 2,
        estimate: 3,
        dependencies: ['007'],
        description: `**Objetivo**
Implementar gestión de conceptos de ingreso/costo.

**Criterios de aceptación**
- [ ] Listar conceptos con tipo y área
- [ ] Crear concepto con nombre, tipo, área
- [ ] Filtrar por tipo`,
    },
    {
        id: '009',
        milestone: 'M0 Setup & Infraestructura',
        title: 'CRUD de proyectos',
        labels: ['backend', 'frontend', 'feature'],
        priority: 2,
        estimate: 3,
        dependencies: ['008'],
        description: `**Objetivo**
Implementar gestión de proyectos por empresa.

**Criterios de aceptación**
- [ ] Listar proyectos de empresa
- [ ] Crear proyecto con nombre, código
- [ ] Toggle appliesProfitSharing`,
    },
    {
        id: '010',
        milestone: 'M0 Setup & Infraestructura',
        title: 'CRUD de usuarios (Admin)',
        labels: ['backend', 'frontend', 'feature'],
        priority: 2,
        estimate: 5,
        dependencies: ['009'],
        description: `**Objetivo**
Implementar gestión completa de usuarios para Admin.

**Criterios de aceptación**
- [ ] Listar usuarios con rol y empresas
- [ ] Crear usuario con email, nombre, contraseña, rol
- [ ] Asignar múltiples empresas
- [ ] Solo ADMIN accede`,
    },
    {
        id: '011',
        milestone: 'M0 Setup & Infraestructura',
        title: 'Selector de empresa funcional',
        labels: ['frontend', 'backend'],
        priority: 2,
        estimate: 2,
        dependencies: ['010'],
        description: `**Objetivo**
Implementar cambio de empresa activa en contexto.

**Criterios de aceptación**
- [ ] Selector muestra solo empresas asignadas
- [ ] Cambio de empresa recarga datos
- [ ] Persiste entre navegaciones`,
    },
    {
        id: '012',
        milestone: 'M0 Setup & Infraestructura',
        title: 'Seed de datos iniciales',
        labels: ['database', 'setup'],
        priority: 3,
        estimate: 2,
        dependencies: ['011'],
        description: `**Objetivo**
Crear script de seed con datos base.

**Criterios de aceptación**
- [ ] npm run db:seed ejecuta sin errores
- [ ] Empresas Wepark y Sigma creadas
- [ ] Usuario admin puede login`,
    },
    {
        id: '013',
        milestone: 'M0 Setup & Infraestructura',
        title: 'Auditoría — Fin M0',
        labels: ['audit', 'quality'],
        priority: 2,
        estimate: 2,
        dependencies: ['012'],
        description: `**Tipo:** Auditoría

**Objetivo**
Verificar que M0 está completo y listo para M1.

**Issues revisados:** ARSEN-005 a ARSEN-012

**Checklist**
- [ ] Todos los catálogos funcionan
- [ ] CRUD de usuarios solo para Admin
- [ ] Selector de empresa filtra correctamente
- [ ] Build pasa sin warnings

**Resultado esperado**
- Milestone M0 marcado como completado
- Decisión: continuar a M1`,
    },

    // ========== M1: MVP CORE ==========
    {
        id: '014',
        milestone: 'M1 MVP - Core',
        title: 'Selector de período (año/mes)',
        labels: ['frontend', 'backend'],
        priority: 2,
        estimate: 2,
        dependencies: ['013'],
        description: `**Objetivo**
Implementar selector de período para filtrar datos.

**Criterios de aceptación**
- [ ] Selector año/mes en header
- [ ] Cambio de período recarga datos
- [ ] Mostrar badge si período cerrado`,
    },
    {
        id: '015',
        milestone: 'M1 MVP - Core',
        title: 'Captura de presupuesto',
        labels: ['frontend', 'backend', 'feature'],
        priority: 2,
        estimate: 5,
        dependencies: ['014'],
        description: `**Objetivo**
Implementar captura de presupuesto por área.

**Criterios de aceptación**
- [ ] Grid conceptos × meses
- [ ] Validación valores ≥ 0
- [ ] AREA_USER solo ve su área`,
    },
    {
        id: '016',
        milestone: 'M1 MVP - Core',
        title: 'Consulta de presupuesto',
        labels: ['frontend', 'backend'],
        priority: 3,
        estimate: 2,
        dependencies: ['015'],
        description: `**Objetivo**
Visualizar presupuestos capturados.

**Criterios de aceptación**
- [ ] Ver presupuesto por área/año
- [ ] Ver totales mensuales y anuales`,
    },
    {
        id: '017',
        milestone: 'M1 MVP - Core',
        title: 'Auditoría — Post Presupuestos',
        labels: ['audit', 'quality'],
        priority: 2,
        estimate: 2,
        dependencies: ['016'],
        description: `**Tipo:** Auditoría

**Issues revisados:** ARSEN-014 a ARSEN-016

**Checklist**
- [ ] Captura funciona para todos los roles permitidos
- [ ] Datos se guardan correctamente en BD
- [ ] Restricción por área funciona`,
    },
    {
        id: '018',
        milestone: 'M1 MVP - Core',
        title: 'Parser de Excel del contador',
        labels: ['backend'],
        priority: 1,
        estimate: 5,
        dependencies: ['017'],
        description: `**Objetivo**
Implementar parser para archivo del contador.

**Criterios de aceptación**
- [ ] Detecta celda ancla "Concepto/Proyecto"
- [ ] Extrae proyectos de columnas
- [ ] Extrae conceptos correctamente
- [ ] Marca items no reconocidos`,
    },
    {
        id: '019',
        milestone: 'M1 MVP - Core',
        title: 'Vista previa de importación',
        labels: ['frontend', 'backend'],
        priority: 1,
        estimate: 5,
        dependencies: ['018'],
        description: `**Objetivo**
UI para subir archivo y ver preview.

**Criterios de aceptación**
- [ ] Upload de archivo
- [ ] Mostrar preview con datos parseados
- [ ] Indicadores visuales de warnings`,
    },
    {
        id: '020',
        milestone: 'M1 MVP - Core',
        title: 'Resolución de conflictos en importación',
        labels: ['frontend', 'backend'],
        priority: 1,
        estimate: 5,
        dependencies: ['019'],
        description: `**Objetivo**
Permitir resolver proyectos/conceptos no reconocidos.

**Criterios de aceptación**
- [ ] Opciones: Mapear, Crear nuevo, Ignorar
- [ ] Guardar mapeos para futuro
- [ ] No permitir confirmar con conflictos pendientes`,
    },
    {
        id: '021',
        milestone: 'M1 MVP - Core',
        title: 'Confirmar y guardar resultados',
        labels: ['backend', 'database'],
        priority: 1,
        estimate: 3,
        dependencies: ['020'],
        description: `**Objetivo**
Guardar resultados confirmados en BD.

**Criterios de aceptación**
- [ ] Guardar todos los resultados
- [ ] Crear entidades nuevas si aplica
- [ ] Advertir y confirmar sobrescritura`,
    },
    {
        id: '022',
        milestone: 'M1 MVP - Core',
        title: 'Consulta de resultados',
        labels: ['frontend', 'backend'],
        priority: 2,
        estimate: 3,
        dependencies: ['021'],
        description: `**Objetivo**
Visualizar resultados importados.

**Criterios de aceptación**
- [ ] Tabla por proyecto con ingresos, costos, utilidad
- [ ] Drill-down a conceptos
- [ ] Sección "Administración" separada`,
    },
    {
        id: '023',
        milestone: 'M1 MVP - Core',
        title: 'Auditoría — Post Importación',
        labels: ['audit', 'quality'],
        priority: 2,
        estimate: 2,
        dependencies: ['022'],
        description: `**Tipo:** Auditoría

**Issues revisados:** ARSEN-018 a ARSEN-022

**Checklist**
- [ ] Parser detecta estructura correctamente
- [ ] Conflictos se resuelven bien
- [ ] Datos en BD coinciden con archivo
- [ ] Gastos Admin se muestran separados`,
    },
    {
        id: '024',
        milestone: 'M1 MVP - Core',
        title: 'Comparativo real vs presupuesto',
        labels: ['frontend', 'backend', 'feature'],
        priority: 2,
        estimate: 5,
        dependencies: ['023'],
        description: `**Objetivo**
Implementar vista comparativa.

**Criterios de aceptación**
- [ ] Tabla: concepto, presupuesto, real, diferencia, %
- [ ] Indicadores de color (rojo/verde)
- [ ] Totales correctos`,
    },
    {
        id: '025',
        milestone: 'M1 MVP - Core',
        title: 'Dashboard ejecutivo',
        labels: ['frontend', 'backend', 'feature'],
        priority: 2,
        estimate: 5,
        dependencies: ['024'],
        description: `**Objetivo**
Implementar dashboard principal.

**Criterios de aceptación**
- [ ] Cards: Ingresos, Costos, Utilidad, Desviación
- [ ] Top 5 proyectos por utilidad
- [ ] Gráfica de tendencia`,
    },
    {
        id: '026',
        milestone: 'M1 MVP - Core',
        title: 'Auditoría — Fin M1 MVP',
        labels: ['audit', 'quality'],
        priority: 2,
        estimate: 3,
        dependencies: ['025'],
        description: `**Tipo:** Auditoría

**Issues revisados:** ARSEN-014 a ARSEN-025

**Checklist**
- [ ] Flujo completo de cierre mensual funcional
- [ ] Datos consistentes entre módulos
- [ ] Sin errores de consola
- [ ] Build de producción funciona

**Resultado esperado**
- Milestone M1 completado
- Ready para M2`,
    },

    // ========== M2: REPARTO ==========
    {
        id: '027',
        milestone: 'M2 V1 - Reparto',
        title: 'Motor de cálculo de reparto (7 fórmulas)',
        labels: ['backend'],
        priority: 1,
        estimate: 8,
        dependencies: ['026'],
        description: `**Objetivo**
Implementar motor con Strategy Pattern para 7 fórmulas.

Fórmulas: FIXED_ONLY, PERCENT_SIMPLE, FIXED_PLUS_PERCENT, TIERED, SPECIAL_FORMULA, GROUPED, DYNAMIC

**Criterios de aceptación**
- [ ] 7 fórmulas implementadas
- [ ] Tests para cada fórmula
- [ ] Cálculos coinciden con ejemplos del cliente`,
    },
    {
        id: '028',
        milestone: 'M2 V1 - Reparto',
        title: 'Configuración de reparto por proyecto',
        labels: ['frontend', 'backend', 'feature'],
        priority: 2,
        estimate: 5,
        dependencies: ['027'],
        description: `**Objetivo**
UI para configurar fórmula de cada proyecto.

**Criterios de aceptación**
- [ ] Seleccionar proyecto y tipo de fórmula
- [ ] Formulario dinámico según tipo
- [ ] Guardar configuración`,
    },
    {
        id: '029',
        milestone: 'M2 V1 - Reparto',
        title: 'Cálculo automático post-importación',
        labels: ['backend'],
        priority: 2,
        estimate: 3,
        dependencies: ['028'],
        description: `**Objetivo**
Calcular reparto automáticamente al importar resultados.

**Criterios de aceptación**
- [ ] Reparto se calcula al confirmar importación
- [ ] Solo proyectos con appliesProfitSharing
- [ ] Solo empresas con handlesProfitSharing`,
    },
    {
        id: '030',
        milestone: 'M2 V1 - Reparto',
        title: 'Vista de reparto calculado',
        labels: ['frontend', 'backend'],
        priority: 2,
        estimate: 3,
        dependencies: ['029'],
        description: `**Objetivo**
Mostrar resultados de reparto.

**Criterios de aceptación**
- [ ] Tabla: proyecto, utilidad bruta, honorario, cliente
- [ ] Detalle con breakdown de fórmula`,
    },
    {
        id: '031',
        milestone: 'M2 V1 - Reparto',
        title: 'Auditoría — Fin M2 Reparto',
        labels: ['audit', 'quality'],
        priority: 2,
        estimate: 3,
        dependencies: ['030'],
        description: `**Tipo:** Auditoría

**Checklist**
- [ ] 7 fórmulas funcionan correctamente
- [ ] Cálculos coinciden con Excel del cliente
- [ ] Configuración se guarda y aplica

**Resultado esperado**
- Validar con datos de Wepark reales`,
    },

    // ========== M3: EXPORTACIONES ==========
    {
        id: '032',
        milestone: 'M3 V1 - Exportaciones',
        title: 'Exportar a Excel',
        labels: ['backend', 'feature'],
        priority: 2,
        estimate: 5,
        dependencies: ['031'],
        description: `**Objetivo**
Implementar exportación a Excel.

**Criterios de aceptación**
- [ ] Exportar cualquier reporte a .xlsx
- [ ] Datos coinciden con vista
- [ ] Formato profesional`,
    },
    {
        id: '033',
        milestone: 'M3 V1 - Exportaciones',
        title: 'Exportar a PDF',
        labels: ['backend', 'feature'],
        priority: 2,
        estimate: 5,
        dependencies: ['032'],
        description: `**Objetivo**
Implementar exportación a PDF.

**Criterios de aceptación**
- [ ] Exportar cualquier reporte a PDF
- [ ] Encabezado profesional
- [ ] Formato legible`,
    },
    {
        id: '034',
        milestone: 'M3 V1 - Exportaciones',
        title: 'Auditoría — Fin M3',
        labels: ['audit', 'quality'],
        priority: 2,
        estimate: 2,
        dependencies: ['033'],
        description: `**Tipo:** Auditoría

**Checklist**
- [ ] Excel se genera correctamente
- [ ] PDF se genera correctamente
- [ ] Datos coinciden con vista
- [ ] Todos los roles pueden exportar`,
    },

    // ========== M4: CONCILIACIONES ==========
    {
        id: '035',
        milestone: 'M4 V1.1 - Conciliaciones',
        title: 'Importación masiva de conciliaciones',
        labels: ['backend', 'frontend', 'feature'],
        priority: 3,
        estimate: 5,
        dependencies: ['034'],
        description: `**Objetivo**
Importar histórico de conciliaciones.

**Criterios de aceptación**
- [ ] Subir archivo y ver preview
- [ ] Resolver conflictos
- [ ] Guardar todas las conciliaciones`,
    },
    {
        id: '036',
        milestone: 'M4 V1.1 - Conciliaciones',
        title: 'Captura manual de conciliaciones',
        labels: ['frontend', 'backend'],
        priority: 4,
        estimate: 3,
        dependencies: ['035'],
        description: `**Objetivo**
Formulario para captura individual.

**Criterios de aceptación**
- [ ] Formulario con campos requeridos
- [ ] Validación
- [ ] Guardar y confirmar`,
    },
    {
        id: '037',
        milestone: 'M4 V1.1 - Conciliaciones',
        title: 'Consulta de conciliaciones',
        labels: ['frontend', 'backend'],
        priority: 3,
        estimate: 3,
        dependencies: ['036'],
        description: `**Objetivo**
Listar y filtrar conciliaciones.

**Criterios de aceptación**
- [ ] Listar conciliaciones
- [ ] Filtrar por rango de fechas
- [ ] Filtrar por proyecto`,
    },
    {
        id: '038',
        milestone: 'M4 V1.1 - Conciliaciones',
        title: 'Auditoría — Fin M4 y V1.1',
        labels: ['audit', 'quality'],
        priority: 2,
        estimate: 3,
        dependencies: ['037'],
        description: `**Tipo:** Auditoría

**Checklist**
- [ ] Todos los módulos funcionan
- [ ] Build de producción sin errores
- [ ] Datos consistentes
- [ ] Performance aceptable
- [ ] Roles y permisos correctos

**Resultado esperado**
- Sistema V1.1 listo para producción`,
    },
];

// ============================================
// 🚀 MAIN FUNCTION
// ============================================

async function main() {
    console.log('🚀 Iniciando creación de backlog en Linear...\n');

    const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });

    // 1. Obtener Team
    console.log('1️⃣ Obteniendo team...');
    const teams = await client.teams();
    const team = teams.nodes.find((t) => t.name === CONFIG.teamName);
    if (!team) {
        throw new Error(`Team "${CONFIG.teamName}" no encontrado`);
    }
    console.log(`   ✅ Team: ${team.name} (${team.id})`);

    // 2. Obtener estado "Todo"
    console.log('2️⃣ Obteniendo estados de workflow...');
    const workflowStates = await team.states();
    const todoState = workflowStates.nodes.find(
        (s) => s.name === 'Todo' || s.name === 'Backlog'
    );
    if (!todoState) {
        throw new Error('Estado "Todo" o "Backlog" no encontrado');
    }
    console.log(`   ✅ Estado inicial: ${todoState.name}`);

    // 3. Crear o encontrar Project
    console.log('3️⃣ Creando proyecto...');
    const projectPayload = await client.createProject({
        name: CONFIG.projectName,
        description: CONFIG.projectDescription,
        teamIds: [team.id],
    });
    const project = await projectPayload.project;
    console.log(`   ✅ Proyecto: ${project.name} (${project.id})`);
    await delay(200);

    // 4. Crear Milestones
    console.log('4️⃣ Creando milestones...');
    const milestoneMap = {};
    for (const m of MILESTONES) {
        const payload = await client.createProjectMilestone({
            name: m.name,
            description: m.description,
            projectId: project.id,
        });
        const milestone = await payload.projectMilestone;
        milestoneMap[m.name] = milestone.id;
        console.log(`   ✅ ${m.name}`);
        await delay(100);
    }

    // 5. Obtener/Crear Labels
    console.log('5️⃣ Obteniendo labels...');
    const existingLabels = await team.labels();
    const labelMap = {};

    // Primero, mapear todos los labels existentes
    for (const existing of existingLabels.nodes) {
        labelMap[existing.name] = existing.id;
    }

    // Crear solo los que faltan
    for (const label of LABELS) {
        if (labelMap[label.name]) {
            console.log(`   ⏭️ Label "${label.name}" ya existe`);
        } else {
            try {
                const payload = await client.createIssueLabel({
                    name: label.name,
                    teamId: team.id,
                    color: label.color,
                });
                const newLabel = await payload.issueLabel;
                labelMap[label.name] = newLabel.id;
                console.log(`   ✅ Label "${label.name}" creado`);
                await delay(100);
            } catch (e) {
                console.log(`   ⚠️ Label "${label.name}" no creado: ${e.message}`);
            }
        }
    }

    // 6. Crear Issues
    console.log('6️⃣ Creando issues...');
    const issueMap = {};

    for (const issue of ISSUES) {
        const title = `[${CONFIG.issuePrefix}-${issue.id}] ${issue.title}`;
        const labelIds = issue.labels.map((l) => labelMap[l]).filter(Boolean);

        const payload = await client.createIssue({
            teamId: team.id,
            projectId: project.id,
            projectMilestoneId: milestoneMap[issue.milestone],
            title: title,
            description: issue.description,
            estimate: issue.estimate,
            priority: issue.priority,
            stateId: todoState.id,
            labelIds: labelIds,
        });

        const createdIssue = await payload.issue;
        issueMap[issue.id] = createdIssue?.id;
        console.log(`   ✅ ${title}`);
        await delay(100);
    }

    // 7. Crear Dependencies
    console.log('7️⃣ Creando dependencias...');
    let depCount = 0;
    for (const issue of ISSUES) {
        if (issue.dependencies && issue.dependencies.length > 0) {
            for (const depId of issue.dependencies) {
                const blockerId = issueMap[depId];
                const blockedId = issueMap[issue.id];

                if (blockerId && blockedId) {
                    await client.createIssueRelation({
                        issueId: blockerId,
                        relatedIssueId: blockedId,
                        type: 'blocks',
                    });
                    depCount++;
                    await delay(50);
                }
            }
        }
    }
    console.log(`   ✅ ${depCount} dependencias creadas`);

    console.log('\n🎉 ¡Backlog creado exitosamente!');
    console.log(`   📊 ${ISSUES.length} issues`);
    console.log(`   📍 ${MILESTONES.length} milestones`);
    console.log(`   🏷️ ${LABELS.length} labels`);
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(console.error);
