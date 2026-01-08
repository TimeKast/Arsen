# 10 - Modelo de Datos

**Proyecto**: Arsen - Sistema de Control Presupuestal Multi-Empresa  
**Versión**: 1.0  
**Fecha**: 8 de enero de 2026

---

## 1. Diagrama Entidad-Relación

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │  companies  │       │   periods   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │◄──────│ companyId   │
│ email       │       │ name        │       │ year        │
│ name        │       │ code        │       │ month       │
│ passwordHash│       │ handlesProfitSharing│ isClosed   │
│ role        │       │ isActive    │       │ createdAt   │
│ areaId?     │       │ createdAt   │       └─────────────┘
│ isActive    │       └─────────────┘
└─────────────┘             │
      │                     │ 1:N
      │                     ▼
      │             ┌─────────────┐       ┌─────────────────────┐
      │             │  projects   │       │  profitSharingRules │
      │             ├─────────────┤       ├─────────────────────┤
      │             │ id          │◄──────│ projectId           │
      │             │ companyId   │       │ formulaType         │
      │             │ name        │       │ fixedAmount         │
      │             │ code        │       │ percent1            │
      │             │ appliesProfitSharing│ percent2            │
      │             │ isActive    │       │ threshold1          │
      │             └─────────────┘       │ groupedWith[]       │
      │                     │             │ dynamicField        │
      │                     │             │ dynamicIncrement    │
      │                     │             │ notes               │
      │                     │             └─────────────────────┘
      │                     │
      │                     │ 1:N
      │                     ▼
      │             ┌─────────────┐
      │             │   results   │
      │             ├─────────────┤
      │             │ id          │
      │             │ companyId   │
      │             │ projectId?  │  (null = Administración)
      │             │ conceptId   │
      │             │ period      │
      │             │ amount      │
      │             │ createdAt   │
      │             └─────────────┘
      │                     ▲
      │                     │
┌─────────────┐     ┌─────────────┐
│    areas    │     │  concepts   │
├─────────────┤     ├─────────────┤
│ id          │◄────│ areaId?     │
│ companyId   │     │ id          │
│ name        │     │ name        │
│ isActive    │     │ type        │ (INCOME/COST)
└─────────────┘     │ isActive    │
      ▲             └─────────────┘
      │                     ▲
      │                     │
      │             ┌─────────────┐
      │             │   budgets   │
      │             ├─────────────┤
      │             │ id          │
      │             │ companyId   │
      │             │ areaId      │
      │             │ conceptId   │
      │             │ period      │
      │             │ amount      │
      │             │ createdAt   │
      │             └─────────────┘

┌─────────────────┐
│ reconciliations │
├─────────────────┤
│ id              │
│ companyId       │
│ projectId?      │
│ conceptId?      │
│ date            │
│ reference       │
│ invoice         │
│ policy          │
│ checkNumber     │
│ supplier        │
│ subtotal        │
│ tax             │
│ total           │
│ createdAt       │
└─────────────────┘

┌─────────────────┐
│ conceptMappings │
├─────────────────┤
│ id              │
│ companyId       │
│ externalName    │
│ conceptId       │
│ createdAt       │
└─────────────────┘

┌─────────────────┐
│  userCompanies  │  (tabla pivote)
├─────────────────┤
│ userId          │
│ companyId       │
└─────────────────┘
```

---

## 2. Esquema Drizzle ORM

```typescript
// lib/db/schema.ts
import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  boolean, 
  timestamp, 
  integer, 
  decimal,
  pgEnum 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==================== ENUMS ====================

export const userRoleEnum = pgEnum('user_role', [
  'ADMIN', 
  'STAFF', 
  'AREA_USER', 
  'READONLY'
]);

export const conceptTypeEnum = pgEnum('concept_type', [
  'INCOME', 
  'COST'
]);

export const formulaTypeEnum = pgEnum('formula_type', [
  'FIXED_ONLY',
  'PERCENT_SIMPLE',
  'FIXED_PLUS_PERCENT',
  'TIERED',
  'SPECIAL_FORMULA',
  'GROUPED',
  'DYNAMIC'
]);

// ==================== TABLES ====================

// --- Users ---
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('READONLY'),
  areaId: uuid('area_id').references(() => areas.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// --- User-Company (pivot) ---
export const userCompanies = pgTable('user_companies', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.companyId] }),
}));

// --- Companies ---
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  handlesProfitSharing: boolean('handles_profit_sharing').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// --- Areas ---
export const areas = pgTable('areas', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// --- Projects ---
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  appliesProfitSharing: boolean('applies_profit_sharing').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// --- Profit Sharing Rules ---
export const profitSharingRules = pgTable('profit_sharing_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id).unique(),
  formulaType: formulaTypeEnum('formula_type').notNull(),
  fixedAmount: decimal('fixed_amount', { precision: 15, scale: 2 }),
  percent1: decimal('percent_1', { precision: 5, scale: 2 }),
  percent2: decimal('percent_2', { precision: 5, scale: 2 }),
  threshold1: decimal('threshold_1', { precision: 15, scale: 2 }),
  groupedWith: uuid('grouped_with').array(),
  dynamicField: varchar('dynamic_field', { length: 100 }),
  dynamicIncrement: decimal('dynamic_increment', { precision: 15, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// --- Concepts ---
export const concepts = pgTable('concepts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: conceptTypeEnum('type').notNull(),
  areaId: uuid('area_id').references(() => areas.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// --- Concept Mappings (for import) ---
export const conceptMappings = pgTable('concept_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  externalName: varchar('external_name', { length: 255 }).notNull(),
  conceptId: uuid('concept_id').notNull().references(() => concepts.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// --- Periods ---
export const periods = pgTable('periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  year: integer('year').notNull(),
  month: integer('month').notNull(), // 1-12
  isClosed: boolean('is_closed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  closedAt: timestamp('closed_at'),
}, (table) => ({
  uniquePeriod: unique().on(table.companyId, table.year, table.month),
}));

// --- Budgets ---
export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  areaId: uuid('area_id').notNull().references(() => areas.id),
  conceptId: uuid('concept_id').notNull().references(() => concepts.id),
  year: integer('year').notNull(),
  month: integer('month').notNull(), // 1-12
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  uniqueBudget: unique().on(table.companyId, table.areaId, table.conceptId, table.year, table.month),
}));

// --- Results ---
export const results = pgTable('results', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  projectId: uuid('project_id').references(() => projects.id), // NULL = Administración
  conceptId: uuid('concept_id').notNull().references(() => concepts.id),
  year: integer('year').notNull(),
  month: integer('month').notNull(), // 1-12
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  importedBy: uuid('imported_by').references(() => users.id),
}, (table) => ({
  uniqueResult: unique().on(table.companyId, table.projectId, table.conceptId, table.year, table.month),
}));

// --- Reconciliations ---
export const reconciliations = pgTable('reconciliations', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  projectId: uuid('project_id').references(() => projects.id),
  conceptId: uuid('concept_id').references(() => concepts.id),
  date: timestamp('date').notNull(),
  reference: varchar('reference', { length: 100 }),
  invoice: varchar('invoice', { length: 100 }),
  policy: varchar('policy', { length: 100 }),
  checkNumber: varchar('check_number', { length: 100 }),
  supplier: varchar('supplier', { length: 255 }),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }),
  tax: decimal('tax', { precision: 15, scale: 2 }),
  total: decimal('total', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
});

// ==================== RELATIONS ====================

export const usersRelations = relations(users, ({ one, many }) => ({
  area: one(areas, { fields: [users.areaId], references: [areas.id] }),
  companies: many(userCompanies),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  projects: many(projects),
  areas: many(areas),
  users: many(userCompanies),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  company: one(companies, { fields: [projects.companyId], references: [companies.id] }),
  profitSharingRule: one(profitSharingRules, { 
    fields: [projects.id], 
    references: [profitSharingRules.projectId] 
  }),
}));

export const areasRelations = relations(areas, ({ one, many }) => ({
  company: one(companies, { fields: [areas.companyId], references: [companies.id] }),
  concepts: many(concepts),
  budgets: many(budgets),
}));

export const conceptsRelations = relations(concepts, ({ one }) => ({
  area: one(areas, { fields: [concepts.areaId], references: [areas.id] }),
}));
```

---

## 3. Índices Recomendados

```sql
-- Índices para queries frecuentes

-- Resultados por empresa y período
CREATE INDEX idx_results_company_period ON results(company_id, year, month);

-- Resultados por proyecto
CREATE INDEX idx_results_project ON results(project_id);

-- Presupuestos por empresa y período
CREATE INDEX idx_budgets_company_period ON budgets(company_id, year, month);

-- Conciliaciones por fecha
CREATE INDEX idx_reconciliations_date ON reconciliations(company_id, date);

-- Usuarios por email
CREATE INDEX idx_users_email ON users(email);
```

---

## 4. Queries Comunes

### Resultados por proyecto en un período

```typescript
const results = await db
  .select({
    projectId: results.projectId,
    projectName: projects.name,
    totalIncome: sql<number>`sum(case when ${concepts.type} = 'INCOME' then ${results.amount} else 0 end)`,
    totalCost: sql<number>`sum(case when ${concepts.type} = 'COST' then ${results.amount} else 0 end)`,
  })
  .from(results)
  .leftJoin(projects, eq(results.projectId, projects.id))
  .leftJoin(concepts, eq(results.conceptId, concepts.id))
  .where(and(
    eq(results.companyId, companyId),
    eq(results.year, year),
    eq(results.month, month)
  ))
  .groupBy(results.projectId, projects.name);
```

### Comparativo real vs presupuesto

```typescript
const comparison = await db
  .select({
    conceptId: concepts.id,
    conceptName: concepts.name,
    budgetAmount: sql<number>`coalesce(sum(${budgets.amount}), 0)`,
    actualAmount: sql<number>`coalesce(sum(${results.amount}), 0)`,
  })
  .from(concepts)
  .leftJoin(budgets, and(
    eq(budgets.conceptId, concepts.id),
    eq(budgets.companyId, companyId),
    eq(budgets.year, year),
    eq(budgets.month, month)
  ))
  .leftJoin(results, and(
    eq(results.conceptId, concepts.id),
    eq(results.companyId, companyId),
    eq(results.year, year),
    eq(results.month, month)
  ))
  .groupBy(concepts.id, concepts.name);
```

---

## 5. Migraciones

```bash
# Generar migración
npx drizzle-kit generate:pg

# Aplicar migraciones
npx drizzle-kit push:pg

# Ver estado
npx drizzle-kit studio
```

---

*Documento generado: 8 de enero de 2026*
