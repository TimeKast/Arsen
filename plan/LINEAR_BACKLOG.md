# 📋 LINEAR_BACKLOG.md — Arsen

**Fuente de Verdad para Ejecución**  
**Proyecto**: 🏢 Arsen - Control Presupuestal  
**Generado**: 8 de enero de 2026

---

## 1. Resumen del Proyecto

| Campo | Valor |
|-------|-------|
| **Nombre** | 🏢 Arsen - Control Presupuestal |
| **Descripción** | Sistema de Control Presupuestal Multi-Empresa |
| **Stack** | Next.js 14 + TypeScript + Drizzle ORM + PostgreSQL (Neon) |
| **Hosting** | Vercel |
| **Team** | Jose |

### Convenciones
- **Prefijo Issues**: ARSEN-XXX
- **Numeración**: Secuencial única (desarrollo + auditoría)
- **Prioridades**: 1=Urgent, 2=High, 3=Medium, 4=Low
- **Estimaciones**: 1-8 puntos (13 = dividir)

---

## 2. Labels

| Label | Tipo | Color |
|-------|------|-------|
| `setup` | Área | #6B7280 |
| `frontend` | Área | #3B82F6 |
| `backend` | Área | #10B981 |
| `database` | Área | #8B5CF6 |
| `feature` | Tipo | #F59E0B |
| `audit` | Tipo | #EF4444 |
| `quality` | Tipo | #EC4899 |

---

## 3. Milestones

### M0: Setup & Infraestructura
**Objetivo**: Proyecto base listo para desarrollo  
**Criterio de terminado**: Auth funcional, BD conectada, catálogos CRUD

### M1: MVP - Core
**Objetivo**: Flujo completo de cierre mensual  
**Criterio de terminado**: Importar resultados, ver comparativo, dashboard básico

### M2: V1 - Reparto
**Objetivo**: Motor de reparto con 7 fórmulas  
**Criterio de terminado**: Configurar y calcular reparto correctamente

### M3: V1 - Exportaciones
**Objetivo**: Exportar a Excel y PDF  
**Criterio de terminado**: Todos los reportes exportables

### M4: V1.1 - Conciliaciones
**Objetivo**: Gestión de conciliaciones  
**Criterio de terminado**: Import masivo + captura manual funcionando

---

## 4. Backlog Completo

### ═══════════════════════════════════════════════════════════════
### MILESTONE M0: SETUP & INFRAESTRUCTURA
### ═══════════════════════════════════════════════════════════════

---

#### [ARSEN-001] Setup proyecto Next.js 14 ✅

**Tipo:** Desarrollo  
**Milestone:** M0 Setup  
**Labels:** setup, frontend  
**Priority:** 1 (Urgent)  
**Estimate:** 2  
**Dependencies:** Ninguna  
**Estado:** COMPLETADO (2026-01-08)

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Crear proyecto base Next.js 14 con App Router, TypeScript y estructura de carpetas.

**Alcance**  
Incluye:
- Inicializar proyecto con `create-next-app`
- Configurar TypeScript strict
- Estructura de carpetas según 09_ARQUITECTURA_TECNICA.md
- Configurar Tailwind CSS
- Instalar shadcn/ui
- Crear layout base (app/layout.tsx)
- Configurar .env.local

No incluye:
- Autenticación
- Conexión a BD
- Componentes funcionales

**Implementación**  
```bash
npx create-next-app@latest arsen --typescript --tailwind --app --src-dir --import-alias "@/*"
npx shadcn@latest init
```

Crear estructura:
```
app/
  (auth)/
  (dashboard)/
  api/
components/
  ui/
  layout/
lib/
  db/
  auth/
  utils/
actions/
types/
```

**Criterios de aceptación**  
- [x] `npm run dev` inicia sin errores
- [x] Tailwind funciona
- [x] shadcn/ui instalado
- [x] Estructura de carpetas creada
- [x] .env.local con variables placeholder

**Pruebas**  
- Verificar `npm run build` sin errores

---

#### [ARSEN-002] Configurar Drizzle ORM + Neon ✅

**Tipo:** Desarrollo  
**Milestone:** M0 Setup  
**Labels:** setup, database  
**Priority:** 1 (Urgent)  
**Estimate:** 3  
**Dependencies:** ARSEN-001  
**Estado:** COMPLETADO (2026-01-08)

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Conectar base de datos PostgreSQL con Drizzle ORM.

**Alcance**  
Incluye:
- Instalar drizzle-orm y @neondatabase/serverless
- Crear lib/db/index.ts (cliente)
- Crear lib/db/schema.ts (esquema completo)
- Configurar drizzle.config.ts
- Crear scripts db:generate, db:push, db:studio
- Aplicar schema inicial

No incluye:
- Seed de datos
- Migraciones avanzadas

**Implementación**  
Esquema según 10_MODELO_DATOS.md:
- users, userCompanies
- companies, projects, profitSharingRules
- areas, concepts, conceptMappings
- periods, budgets, results
- reconciliations

**Criterios de aceptación**  
- [x] Conexión a Neon exitosa
- [x] `npm run db:push` aplica schema
- [x] `npm run db:studio` muestra tablas
- [x] Todas las tablas de 10_MODELO_DATOS.md creadas

**Pruebas**  
- Verificar esquema en Drizzle Studio

---

#### [ARSEN-003] Implementar NextAuth.js con 4 roles ✅

**Tipo:** Desarrollo  
**Milestone:** M0 Setup  
**Labels:** setup, backend, frontend  
**Priority:** 1 (Urgent)  
**Estimate:** 5  
**Dependencies:** ARSEN-002  
**Estado:** COMPLETADO (2026-01-08)

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Configurar autenticación con NextAuth.js v5 y RBAC según 07_MATRIZ_PERMISOS.md.

**Alcance**  
Incluye:
- Instalar next-auth y bcryptjs
- Configurar Credentials Provider
- JWT con role y companyIds
- Middleware de protección de rutas
- Página de login (/login)
- Logout

No incluye:
- CRUD de usuarios (issue separado)
- Recuperación de contraseña

**Implementación**  
Según 09_ARQUITECTURA_TECNICA.md sección 6:
- lib/auth/config.ts
- app/api/auth/[...nextauth]/route.ts
- middleware.ts
- app/(auth)/login/page.tsx

Roles: ADMIN, STAFF, AREA_USER, READONLY

**Criterios de aceptación**  
- [x] Login con email/password funciona
- [x] JWT contiene role y companyIds
- [x] Rutas protegidas redirigen a /login
- [x] Logout limpia sesión
- [x] Rutas /users y /settings solo para ADMIN

**Pruebas**  
- Login con credenciales válidas → dashboard
- Login con credenciales inválidas → error
- Acceso sin sesión → redirect a login

---

#### [ARSEN-004] Crear layout dashboard con sidebar ✅

**Tipo:** Desarrollo  
**Milestone:** M0 Setup  
**Labels:** frontend  
**Priority:** 2 (High)  
**Estimate:** 3  
**Dependencies:** ARSEN-003  
**Estado:** COMPLETADO (2026-01-08)

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Crear layout principal con sidebar de navegación según rol.

**Alcance**  
Incluye:
- app/(dashboard)/layout.tsx
- components/layout/sidebar.tsx
- components/layout/header.tsx
- Selector de empresa en header
- Navegación según rol (ocultar secciones no permitidas)
- Responsive (sidebar colapsable)

No incluye:
- Lógica de cambio de empresa
- Componentes de páginas

**Implementación**  
Navegación según 04_FLUJOS_FUNCIONALES.md sección 7:
- Dashboard, Resultados, Presupuestos, Reparto
- Conciliaciones, Reportes, Catálogos
- Usuarios (solo Admin), Configuración (solo Admin)

**Criterios de aceptación**  
- [x] Sidebar muestra navegación
- [x] Items se ocultan según rol
- [x] Header muestra usuario y empresa
- [x] Layout responsive
- [x] Logout funciona desde header

**Pruebas**  
- Admin ve todos los items
- READONLY no ve Usuarios ni Configuración

---

#### [ARSEN-005] Auditoría — Post Setup M0 ✅

**Tipo:** Auditoría  
**Milestone:** M0 Setup  
**Labels:** audit, quality  
**Priority:** 2 (High)  
**Estimate:** 2  
**Dependencies:** ARSEN-004  
**Estado:** COMPLETADO (2026-01-08)

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Verificar que el trabajo de setup sigue alineado con la documentación.

**Alcance de la auditoría**  
Issues revisados: ARSEN-001 a ARSEN-004

Documentos a contrastar:
- LINEAR_BACKLOG.md
- 09_ARQUITECTURA_TECNICA.md
- 10_MODELO_DATOS.md
- 07_MATRIZ_PERMISOS.md

**Checklist de auditoría**  
- [x] Estructura de carpetas coincide con arquitectura
- [x] Schema de BD coincide con modelo de datos
- [x] Roles implementados coinciden con matriz de permisos
- [x] No hay código duplicado o huérfano
- [x] Build y lint pasan sin errores

**Resultado esperado**  
- Lista de hallazgos (si existen)
- Acciones correctivas propuestas
- Decisión: continuar / pausar / ajustar backlog

**Resultado de Auditoría:**
- Hallazgos menores: warning de import no usado (corregido)
- Acciones correctivas: Removido import JWT no usado
- Decisión: **CONTINUAR**

---

#### [ARSEN-006] CRUD de empresas ✅

**Tipo:** Desarrollo  
**Milestone:** M0 Setup  
**Labels:** backend, frontend, feature  
**Priority:** 2 (High)  
**Estimate:** 3  
**Dependencies:** ARSEN-005  
**Estado:** COMPLETADO (2026-01-08)

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Implementar gestión de empresas (catálogo base).

**Alcance**  
Incluye:
- app/(dashboard)/catalogs/companies/page.tsx
- Server actions: createCompany, updateCompany, toggleCompanyActive
- Tabla de empresas con acciones
- Modal de crear/editar
- Toggle handlesProfitSharing

No incluye:
- Eliminación física (solo desactivar)

**Implementación**  
- actions/companies.ts
- components/forms/company-form.tsx
- Validación Zod

**Criterios de aceptación**  
- [x] Listar empresas
- [x] Crear empresa con nombre, código
- [x] Editar empresa
- [x] Activar/desactivar handlesProfitSharing
- [x] Solo Admin puede crear/editar

**Pruebas**  
- Crear "Wepark" y "Sigma"
- Activar reparto solo en Wepark

---

#### [ARSEN-007] CRUD de áreas ✅

**Tipo:** Desarrollo  
**Milestone:** M0 Setup  
**Labels:** backend, frontend, feature  
**Priority:** 2 (High)  
**Estimate:** 2  
**Dependencies:** ARSEN-006  
**Estado:** COMPLETADO (2026-01-08)

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Implementar gestión de áreas por empresa.

**Alcance**  
Incluye:
- app/(dashboard)/catalogs/areas/page.tsx
- Server actions: createArea, updateArea
- Filtro por empresa seleccionada
- Modal crear/editar

No incluye:
- Asignación de usuarios a áreas (issue separado)

**Criterios de aceptación**  
- [x] Listar áreas de empresa seleccionada
- [x] Crear área con nombre
- [x] Editar área
- [x] Áreas separadas por empresa

**Pruebas**  
- Crear áreas: Compras, RH, Operación, Finanzas para Wepark

---

#### [ARSEN-008] CRUD de conceptos ✅

**Tipo:** Desarrollo  
**Milestone:** M0 Setup  
**Labels:** backend, frontend, feature  
**Priority:** 2 (High)  
**Estimate:** 3  
**Dependencies:** ARSEN-007  
**Estado:** COMPLETADO (2026-01-08)

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Implementar gestión de conceptos de ingreso/costo.

**Alcance**  
Incluye:
- app/(dashboard)/catalogs/concepts/page.tsx
- Server actions: createConcept, updateConcept
- Tipo: INCOME o COST
- Asociación opcional a área
- Filtros por tipo

No incluye:
- Mapeos de importación (issue separado)

**Criterios de aceptación**  
- [x] Listar conceptos con tipo y área
- [x] Crear concepto con nombre, tipo, área
- [x] Editar concepto
- [x] Filtrar por tipo (ingreso/costo)

**Pruebas**  
- Crear conceptos de ingreso: Tarifa horaria, Pensiones
- Crear conceptos de costo: Nómina, Renta

---

#### [ARSEN-009] CRUD de proyectos ✅

**Tipo:** Desarrollo  
**Milestone:** M0 Setup  
**Labels:** backend, frontend, feature  
**Priority:** 2 (High)  
**Estimate:** 3  
**Dependencies:** ARSEN-008  
**Estado:** COMPLETADO (2026-01-08)

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Implementar gestión de proyectos por empresa.

**Alcance**  
Incluye:
- app/(dashboard)/catalogs/projects/page.tsx
- Server actions: createProject, updateProject, toggleProjectActive
- Toggle appliesProfitSharing
- Filtro por empresa

No incluye:
- Configuración de fórmula de reparto (M2)

**Criterios de aceptación**  
- [x] Listar proyectos de empresa
- [x] Crear proyecto con nombre, código
- [x] Editar proyecto
- [x] Toggle appliesProfitSharing
- [x] Activar/desactivar proyecto

**Pruebas**  
- Crear proyectos Wepark según FILE_FORMATS.md

---

#### [ARSEN-010] CRUD de usuarios (Admin) ✅

**Tipo:** Desarrollo  
**Milestone:** M0 Setup  
**Labels:** backend, frontend, feature  
**Priority:** 2 (High)  
**Estimate:** 5  
**Dependencies:** ARSEN-009  
**Estado:** COMPLETADO (2026-01-08)

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Implementar gestión completa de usuarios para Admin.

**Alcance**  
Incluye:
- app/(dashboard)/users/page.tsx
- Server actions: createUser, updateUser, toggleUserActive
- Asignar rol, empresas, área (si aplica)
- Hash de contraseña con bcryptjs
- Solo accesible por ADMIN

No incluye:
- Cambio de contraseña propia
- Recuperación de contraseña

**Criterios de aceptación**  
- [x] Listar usuarios con rol y empresas
- [x] Crear usuario con email, nombre, contraseña, rol
- [x] Asignar múltiples empresas
- [x] Asignar área (para AREA_USER)
- [x] Activar/desactivar usuario
- [x] Solo ADMIN accede

**Pruebas**  
- Crear usuario Staff con acceso a ambas empresas
- Crear usuario Área asignado a "Compras"

---

#### [ARSEN-011] Selector de empresa funcional ✅

**Tipo:** Desarrollo  
**Milestone:** M0 Setup  
**Labels:** frontend, backend  
**Priority:** 2 (High)  
**Estimate:** 2  
**Dependencies:** ARSEN-010  
**Estado:** COMPLETADO (2026-01-08)

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Implementar cambio de empresa activa en contexto.

**Alcance**  
Incluye:
- Store Zustand para empresa activa
- Selector en header
- Persistencia en sessionStorage
- Filtrar empresas según permisos del usuario

No incluye:
- Selector de período (issue separado)

**Criterios de aceptación**  
- [x] Selector muestra solo empresas asignadas
- [x] Cambio de empresa recarga datos
- [x] Persiste entre navegaciones
- [x] Admin/Staff ven todas las empresas

**Pruebas**  
- Usuario Área solo ve su empresa asignada

---

#### [ARSEN-012] Seed de datos iniciales ✅

**Tipo:** Desarrollo  
**Milestone:** M0 Setup  
**Labels:** database, setup  
**Priority:** 3 (Medium)  
**Estimate:** 2  
**Dependencies:** ARSEN-011  
**Estado:** COMPLETADO (2026-01-08)

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Crear script de seed con datos base para desarrollo.

**Alcance**  
Incluye:
- scripts/seed.ts
- Empresas: Wepark (con reparto), Sigma (sin reparto)
- Usuario admin por defecto
- Áreas básicas
- Conceptos según FILE_FORMATS.md
- Proyectos principales

**Criterios de aceptación**  
- [x] `npm run db:seed` ejecuta sin errores
- [x] Datos mínimos para desarrollo disponibles
- [x] Usuario admin puede hacer login

**Pruebas**  
- Ejecutar seed y verificar datos en Studio

---

#### [ARSEN-013] Auditoría — Fin M0 ✅

**Tipo:** Auditoría  
**Milestone:** M0 Setup  
**Labels:** audit, quality  
**Priority:** 2 (High)  
**Estimate:** 2  
**Dependencies:** ARSEN-012  
**Estado:** COMPLETADO (2026-01-08)

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Verificar que M0 está completo y listo para M1.

**Alcance de la auditoría**  
Issues revisados: ARSEN-005 a ARSEN-012

Documentos a contrastar:
- LINEAR_BACKLOG.md
- 07_MATRIZ_PERMISOS.md
- 10_MODELO_DATOS.md

**Checklist de auditoría**  
- [x] Todos los catálogos funcionan (empresas, áreas, conceptos, proyectos)
- [x] CRUD de usuarios solo para Admin
- [x] Selector de empresa filtra correctamente
- [x] Seed crea datos útiles
- [x] No hay errores en consola
- [x] Build pasa sin warnings

**Hallazgos:**
- Middleware deprecation warning (no crítico, Next.js 16 change)
- Todos los issues M0 completados exitosamente

**Resultado:**  
- ✅ Milestone M0 COMPLETADO
- Decisión: **CONTINUAR A M1**

---

### ═══════════════════════════════════════════════════════════════
### MILESTONE M1: MVP - CORE
### ═══════════════════════════════════════════════════════════════

---

#### [ARSEN-014] Selector de período (año/mes)

**Tipo:** Desarrollo  
**Milestone:** M1 MVP  
**Labels:** frontend, backend  
**Priority:** 2 (High)  
**Estimate:** 2  
**Dependencies:** ARSEN-013

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Implementar selector de período para filtrar datos.

**Alcance**  
Incluye:
- Selector año/mes en header
- Store para período activo
- API para obtener períodos disponibles
- Indicador de período cerrado

No incluye:
- Cerrar/reabrir período (Admin)

**Criterios de aceptación**  
- [ ] Selector en header junto a empresa
- [ ] Cambio de período recarga datos
- [ ] Mostrar badge si período está cerrado

**Pruebas**  
- Cambiar período y verificar que datos cambian

---

#### [ARSEN-015] Captura de presupuesto

**Tipo:** Desarrollo  
**Milestone:** M1 MVP  
**Labels:** frontend, backend, feature  
**Priority:** 2 (High)  
**Estimate:** 5  
**Dependencies:** ARSEN-014

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Implementar captura de presupuesto por área (US-006).

**Alcance**  
Incluye:
- app/(dashboard)/budgets/page.tsx
- app/(dashboard)/budgets/capture/page.tsx
- Grid: conceptos × meses
- Validación valores ≥ 0
- Guardar batch
- Usuario Área solo ve su área

No incluye:
- Importación desde Excel (issue separado)

**Criterios de aceptación**  
- [ ] Seleccionar empresa, área, año
- [ ] Grid con todos los conceptos del área
- [ ] Editar valores por mes
- [ ] Guardar guarda todos los valores
- [ ] AREA_USER solo ve su área asignada

**Pruebas**  
- Capturar presupuesto de Compras 2025
- AREA_USER no puede ver otras áreas

---

#### [ARSEN-016] Consulta de presupuesto

**Tipo:** Desarrollo  
**Milestone:** M1 MVP  
**Labels:** frontend, backend  
**Priority:** 3 (Medium)  
**Estimate:** 2  
**Dependencies:** ARSEN-015

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Visualizar presupuestos capturados.

**Alcance**  
Incluye:
- Vista resumen por área
- Vista detalle por concepto
- Totales calculados

**Criterios de aceptación**  
- [ ] Ver presupuesto por área/año
- [ ] Ver totales mensuales y anuales
- [ ] Navegación entre áreas

**Pruebas**  
- Verificar que totales coinciden

---

#### [ARSEN-017] Auditoría — Post Presupuestos

**Tipo:** Auditoría  
**Milestone:** M1 MVP  
**Labels:** audit, quality  
**Priority:** 2 (High)  
**Estimate:** 2  
**Dependencies:** ARSEN-016

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Verificar módulo de presupuestos antes de continuar.

**Alcance de la auditoría**  
Issues revisados: ARSEN-014 a ARSEN-016

**Checklist de auditoría**  
- [ ] Captura funciona para todos los roles permitidos
- [ ] Datos se guardan correctamente en BD
- [ ] Restricción por área funciona
- [ ] No hay errores de validación

**Resultado esperado**  
- Decisión: continuar / ajustar

---

#### [ARSEN-018] Parser de Excel del contador

**Tipo:** Desarrollo  
**Milestone:** M1 MVP  
**Labels:** backend  
**Priority:** 1 (Urgent)  
**Estimate:** 5  
**Dependencies:** ARSEN-017

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Implementar parser para archivo del contador según FILE_FORMATS.md.

**Alcance**  
Incluye:
- lib/excel/results-parser.ts
- Detectar celda ancla "Concepto/Proyecto"
- Extraer proyectos de columnas
- Extraer conceptos de filas
- Separar ingresos de costos
- Retornar estructura parseada + warnings

No incluye:
- UI de importación
- Guardado en BD

**Criterios de aceptación**  
- [ ] Detecta estructura del archivo
- [ ] Extrae proyectos correctamente
- [ ] Extrae conceptos separados por tipo
- [ ] Marca proyectos/conceptos no reconocidos
- [ ] Maneja errores de formato

**Pruebas**  
- Parsear archivo de muestra de Wepark
- Parsear archivo con proyecto nuevo

---

#### [ARSEN-019] Vista previa de importación

**Tipo:** Desarrollo  
**Milestone:** M1 MVP  
**Labels:** frontend, backend  
**Priority:** 1 (Urgent)  
**Estimate:** 5  
**Dependencies:** ARSEN-018

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
UI para subir archivo y ver preview antes de confirmar.

**Alcance**  
Incluye:
- app/(dashboard)/results/import/page.tsx
- Upload de archivo
- Mostrar preview con datos parseados
- Marcar warnings (amarillo) y errores (rojo)
- Estado temporal en memoria/session

No incluye:
- Resolución de conflictos (issue separado)
- Guardado final

**Criterios de aceptación**  
- [ ] Subir archivo arrastrando o seleccionando
- [ ] Ver preview con proyectos y conceptos
- [ ] Indicadores visuales de warnings
- [ ] Botón "Cancelar" descarta datos

**Pruebas**  
- Subir archivo y ver preview completo

---

#### [ARSEN-020] Resolución de conflictos en importación

**Tipo:** Desarrollo  
**Milestone:** M1 MVP  
**Labels:** frontend, backend  
**Priority:** 1 (Urgent)  
**Estimate:** 5  
**Dependencies:** ARSEN-019

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Permitir resolver proyectos/conceptos no reconocidos.

**Alcance**  
Incluye:
- Modal/panel para resolver cada conflicto
- Opciones: Mapear a existente, Crear nuevo, Ignorar
- Guardar mapeos para futuro (conceptMappings)
- Validar que todos estén resueltos antes de confirmar

**Criterios de aceptación**  
- [ ] Listar todos los conflictos
- [ ] Resolver cada uno con acción
- [ ] No permitir confirmar con conflictos pendientes
- [ ] Mapeos guardados para futuras importaciones

**Pruebas**  
- Importar archivo con concepto nuevo y mapearlo

---

#### [ARSEN-021] Confirmar y guardar resultados

**Tipo:** Desarrollo  
**Milestone:** M1 MVP  
**Labels:** backend, database  
**Priority:** 1 (Urgent)  
**Estimate:** 3  
**Dependencies:** ARSEN-020

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Guardar resultados confirmados en base de datos.

**Alcance**  
Incluye:
- Server action: confirmResultsImport
- Transacción para guardar todos los registros
- Crear proyectos/conceptos nuevos si se eligió
- Advertencia si ya existen datos (sobrescribir)
- Limpiar estado temporal

**Criterios de aceptación**  
- [ ] Guardar todos los resultados en BD
- [ ] Crear entidades nuevas si aplica
- [ ] Advertir y confirmar sobrescritura
- [ ] Redirigir a consulta de resultados

**Pruebas**  
- Importar mes completo
- Reimportar y confirmar sobrescritura

---

#### [ARSEN-022] Consulta de resultados

**Tipo:** Desarrollo  
**Milestone:** M1 MVP  
**Labels:** frontend, backend  
**Priority:** 2 (High)  
**Estimate:** 3  
**Dependencies:** ARSEN-021

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Visualizar resultados importados (US-009).

**Alcance**  
Incluye:
- app/(dashboard)/results/page.tsx
- Tabla por proyecto con ingresos, costos, utilidad
- Expansión para ver conceptos
- Sección separada para Gastos Administración

**Criterios de aceptación**  
- [ ] Ver resultados del período seleccionado
- [ ] Totales por proyecto
- [ ] Drill-down a conceptos
- [ ] Sección "Administración" separada

**Pruebas**  
- Ver resultados importados

---

#### [ARSEN-023] Auditoría — Post Importación

**Tipo:** Auditoría  
**Milestone:** M1 MVP  
**Labels:** audit, quality  
**Priority:** 2 (High)  
**Estimate:** 2  
**Dependencies:** ARSEN-022

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Verificar que importación funciona correctamente.

**Alcance de la auditoría**  
Issues revisados: ARSEN-018 a ARSEN-022

**Checklist de auditoría**  
- [ ] Parser detecta estructura correctamente
- [ ] Conflictos se resuelven bien
- [ ] Datos en BD coinciden con archivo
- [ ] Gastos Admin se muestran separados
- [ ] No hay pérdida de datos

**Resultado esperado**  
- Validar con archivo real del cliente
- Decisión: continuar / ajustar

---

#### [ARSEN-024] Comparativo real vs presupuesto

**Tipo:** Desarrollo  
**Milestone:** M1 MVP  
**Labels:** frontend, backend, feature  
**Priority:** 2 (High)  
**Estimate:** 5  
**Dependencies:** ARSEN-023

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Implementar vista comparativa (US-010).

**Alcance**  
Incluye:
- app/(dashboard)/comparison/page.tsx
- Query que une presupuesto + resultados
- Tabla: concepto, presupuesto, real, diferencia, %
- Indicadores de color (rojo/verde)
- Totales

**Criterios de aceptación**  
- [ ] Ver comparativo por período
- [ ] Cálculo de desviación correcto
- [ ] Colores según desviación
- [ ] Totales de ingresos y costos

**Pruebas**  
- Comparar con datos de prueba

---

#### [ARSEN-025] Dashboard ejecutivo

**Tipo:** Desarrollo  
**Milestone:** M1 MVP  
**Labels:** frontend, backend, feature  
**Priority:** 2 (High)  
**Estimate:** 5  
**Dependencies:** ARSEN-024

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Implementar dashboard principal (US-018).

**Alcance**  
Incluye:
- app/(dashboard)/page.tsx
- Cards: Ingresos, Costos, Utilidad, Desviación
- Tabla top proyectos
- Gráfica de tendencia (últimos 6 meses)

**Criterios de aceptación**  
- [ ] KPIs visibles al entrar
- [ ] Datos del período activo
- [ ] Top 5 proyectos por utilidad
- [ ] Gráfica de tendencia (si hay datos)

**Pruebas**  
- Verificar que KPIs coinciden con datos

---

#### [ARSEN-026] Auditoría — Fin M1 MVP

**Tipo:** Auditoría  
**Milestone:** M1 MVP  
**Labels:** audit, quality  
**Priority:** 2 (High)  
**Estimate:** 3  
**Dependencies:** ARSEN-025

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Validar que MVP cumple criterios de éxito.

**Alcance de la auditoría**  
Issues revisados: ARSEN-014 a ARSEN-025

Verificar:
- Flujo completo de cierre mensual funcional
- Presupuestos, Resultados, Comparativo, Dashboard
- Roles y permisos correctos

**Checklist de auditoría**  
- [ ] Cierre mensual toma <30 min
- [ ] Datos consistentes entre módulos
- [ ] Sin errores de consola
- [ ] Build de producción funciona

**Resultado esperado**  
- Milestone M1 marcado como completado
- Ready para M2

---

### ═══════════════════════════════════════════════════════════════
### MILESTONE M2: V1 - REPARTO
### ═══════════════════════════════════════════════════════════════

---

#### [ARSEN-027] Motor de cálculo de reparto (7 fórmulas)

**Tipo:** Desarrollo  
**Milestone:** M2 Reparto  
**Labels:** backend  
**Priority:** 1 (Urgent)  
**Estimate:** 8  
**Dependencies:** ARSEN-026

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Implementar motor con Strategy Pattern para 7 fórmulas.

**Alcance**  
Incluye:
- lib/profit-sharing/engine.ts
- lib/profit-sharing/formulas/*.ts (7 archivos)
- Tipos según 00_FASE0_SUPUESTOS.md sección 2.5
- Tests unitarios exhaustivos

Fórmulas: FIXED_ONLY, PERCENT_SIMPLE, FIXED_PLUS_PERCENT, TIERED, SPECIAL_FORMULA, GROUPED, DYNAMIC

**Criterios de aceptación**  
- [ ] 7 fórmulas implementadas
- [ ] Tests para cada fórmula
- [ ] Cálculos coinciden con ejemplos del cliente
- [ ] Retorna breakdown detallado

**Pruebas**  
- Test con datos reales de imagen de fórmulas

---

#### [ARSEN-028] Configuración de reparto por proyecto

**Tipo:** Desarrollo  
**Milestone:** M2 Reparto  
**Labels:** frontend, backend, feature  
**Priority:** 2 (High)  
**Estimate:** 5  
**Dependencies:** ARSEN-027

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
UI para configurar fórmula de cada proyecto (US-011).

**Alcance**  
Incluye:
- app/(dashboard)/profit-sharing/config/page.tsx
- Formulario dinámico según tipo de fórmula
- Guardar profitSharingRules
- Validación de parámetros

**Criterios de aceptación**  
- [ ] Seleccionar proyecto y tipo de fórmula
- [ ] Formulario muestra campos requeridos
- [ ] Validación de valores
- [ ] Guardar configuración

**Pruebas**  
- Configurar Torre Prisma como TIERED

---

#### [ARSEN-029] Cálculo automático post-importación

**Tipo:** Desarrollo  
**Milestone:** M2 Reparto  
**Labels:** backend  
**Priority:** 2 (High)  
**Estimate:** 3  
**Dependencies:** ARSEN-028

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Calcular reparto automáticamente al importar resultados.

**Alcance**  
Incluye:
- Hook en confirmResultsImport
- Calcular para cada proyecto con regla configurada
- Almacenar resultado (o calcular on-demand)

**Criterios de aceptación**  
- [ ] Reparto se calcula al confirmar importación
- [ ] Solo proyectos con appliesProfitSharing
- [ ] Solo empresas con handlesProfitSharing

**Pruebas**  
- Importar resultados y verificar cálculo

---

#### [ARSEN-030] Vista de reparto calculado

**Tipo:** Desarrollo  
**Milestone:** M2 Reparto  
**Labels:** frontend, backend  
**Priority:** 2 (High)  
**Estimate:** 3  
**Dependencies:** ARSEN-029

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Mostrar resultados de reparto (US-012).

**Alcance**  
Incluye:
- app/(dashboard)/profit-sharing/page.tsx
- Tabla: proyecto, utilidad bruta, honorario, cliente
- Detalle con breakdown de fórmula

**Criterios de aceptación**  
- [ ] Ver reparto por período
- [ ] Totales correctos
- [ ] Click para ver detalle de cálculo

**Pruebas**  
- Verificar que coincide con Excel actual

---

#### [ARSEN-031] Auditoría — Fin M2 Reparto

**Tipo:** Auditoría  
**Milestone:** M2 Reparto  
**Labels:** audit, quality  
**Priority:** 2 (High)  
**Estimate:** 3  
**Dependencies:** ARSEN-030

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Validar motor de reparto con datos reales.

**Checklist de auditoría**  
- [ ] 7 fórmulas funcionan correctamente
- [ ] Cálculos coinciden con Excel del cliente
- [ ] Configuración se guarda y aplica
- [ ] Vista muestra datos correctos

**Resultado esperado**  
- Validar con datos de Wepark reales
- Milestone M2 completado

---

### ═══════════════════════════════════════════════════════════════
### MILESTONE M3: V1 - EXPORTACIONES
### ═══════════════════════════════════════════════════════════════

---

#### [ARSEN-032] Exportar a Excel

**Tipo:** Desarrollo  
**Milestone:** M3 Exportaciones  
**Labels:** backend, feature  
**Priority:** 2 (High)  
**Estimate:** 5  
**Dependencies:** ARSEN-031

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Implementar exportación a Excel (US-015).

**Alcance**  
Incluye:
- lib/export/excel.ts
- API route /api/export/excel
- Reportes: resultados, comparativo, reparto, presupuestos
- Botón en cada página de reporte

**Criterios de aceptación**  
- [ ] Exportar cualquier reporte a .xlsx
- [ ] Datos coinciden con vista
- [ ] Formato profesional

**Pruebas**  
- Exportar comparativo y verificar

---

#### [ARSEN-033] Exportar a PDF

**Tipo:** Desarrollo  
**Milestone:** M3 Exportaciones  
**Labels:** backend, feature  
**Priority:** 2 (High)  
**Estimate:** 5  
**Dependencies:** ARSEN-032

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Implementar exportación a PDF (US-016).

**Alcance**  
Incluye:
- lib/export/pdf.ts
- API route /api/export/pdf
- Encabezado con empresa, período, fecha
- Formato presentación

**Criterios de aceptación**  
- [ ] Exportar cualquier reporte a PDF
- [ ] Encabezado profesional
- [ ] Formato legible

**Pruebas**  
- Exportar dashboard a PDF

---

#### [ARSEN-034] Auditoría — Fin M3

**Tipo:** Auditoría  
**Milestone:** M3 Exportaciones  
**Labels:** audit, quality  
**Priority:** 2 (High)  
**Estimate:** 2  
**Dependencies:** ARSEN-033

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Verificar que exportaciones funcionan.

**Checklist de auditoría**  
- [ ] Excel se genera correctamente
- [ ] PDF se genera correctamente
- [ ] Datos coinciden con vista
- [ ] Todos los roles pueden exportar

**Resultado esperado**  
- Milestone M3 completado

---

### ═══════════════════════════════════════════════════════════════
### MILESTONE M4: V1.1 - CONCILIACIONES
### ═══════════════════════════════════════════════════════════════

---

#### [ARSEN-035] Importación masiva de conciliaciones

**Tipo:** Desarrollo  
**Milestone:** M4 Conciliaciones  
**Labels:** backend, frontend, feature  
**Priority:** 3 (Medium)  
**Estimate:** 5  
**Dependencies:** ARSEN-034

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Importar histórico de conciliaciones (US-013).

**Alcance**  
Incluye:
- Parser para archivo de conciliación
- Vista previa y resolución
- Guardado masivo

**Criterios de aceptación**  
- [ ] Subir archivo y ver preview
- [ ] Resolver conflictos
- [ ] Guardar todas las conciliaciones

**Pruebas**  
- Importar archivo de muestra

---

#### [ARSEN-036] Captura manual de conciliaciones

**Tipo:** Desarrollo  
**Milestone:** M4 Conciliaciones  
**Labels:** frontend, backend  
**Priority:** 4 (Low)  
**Estimate:** 3  
**Dependencies:** ARSEN-035

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Formulario para captura individual (US-014).

**Alcance**  
Incluye:
- app/(dashboard)/reconciliations/new/page.tsx
- Formulario con todos los campos
- Guardar y redirigir a lista

**Criterios de aceptación**  
- [ ] Formulario con campos requeridos
- [ ] Validación
- [ ] Guardar y confirmar

**Pruebas**  
- Capturar conciliación manual

---

#### [ARSEN-037] Consulta de conciliaciones

**Tipo:** Desarrollo  
**Milestone:** M4 Conciliaciones  
**Labels:** frontend, backend  
**Priority:** 3 (Medium)  
**Estimate:** 3  
**Dependencies:** ARSEN-036

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Listar y filtrar conciliaciones.

**Alcance**  
Incluye:
- app/(dashboard)/reconciliations/page.tsx
- Filtros: fecha, proyecto, proveedor
- Paginación

**Criterios de aceptación**  
- [ ] Listar conciliaciones
- [ ] Filtrar por rango de fechas
- [ ] Filtrar por proyecto

**Pruebas**  
- Buscar por proveedor

---

#### [ARSEN-038] Auditoría — Fin M4 y V1.1

**Tipo:** Auditoría  
**Milestone:** M4 Conciliaciones  
**Labels:** audit, quality  
**Priority:** 2 (High)  
**Estimate:** 3  
**Dependencies:** ARSEN-037

**📚 Docs:** Consultar [ISSUE_DOCS_MAP.md](./ISSUE_DOCS_MAP.md) para secciones de documentación

**Objetivo**  
Validación final del sistema completo.

**Checklist de auditoría**  
- [ ] Todos los módulos funcionan
- [ ] Build de producción sin errores
- [ ] Datos consistentes
- [ ] Performance aceptable
- [ ] Roles y permisos correctos

**Resultado esperado**  
- Sistema V1.1 listo para producción
- Entrega final

---

## 5. Resumen de Issues

| Milestone | Desarrollo | Auditoría | Total |
|-----------|------------|-----------|-------|
| M0 Setup | 12 | 2 | 14 |
| M1 MVP | 12 | 4 | 16 |
| M2 Reparto | 4 | 1 | 5 |
| M3 Exportaciones | 2 | 1 | 3 |
| M4 Conciliaciones | 3 | 1 | 4 |
| **TOTAL** | **33** | **9** | **42** |

---

## 6. Reglas de Ejecución

1. **NO** ejecutar issue sin que auditoría previa esté cerrada
2. **NO** saltar issues de auditoría
3. **NO** modificar backlog sin auditoría
4. LINEAR_BACKLOG.md es la fuente de verdad
5. Linear solo refleja el estado

---

*Generado: 8 de enero de 2026*
