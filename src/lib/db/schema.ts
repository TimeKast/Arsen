import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    integer,
    decimal,
    pgEnum,
    primaryKey,
    unique
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

export const importRuleTypeEnum = pgEnum('import_rule_type', [
    'REDIRECT',  // Move values to different project
    'EXCLUDE'    // Don't import these values
]);

// ==================== TABLES ======================================

// --- Companies (defined first for references) ---
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

// --- User Sessions (for single session enforcement) ---
export const userSessions = pgTable('user_sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    lastActiveAt: timestamp('last_active_at').notNull().defaultNow(),
    userAgent: varchar('user_agent', { length: 500 }),
    ipAddress: varchar('ip_address', { length: 45 }),
});

// --- User-Company (pivot) ---
export const userCompanies = pgTable('user_companies', {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.userId, table.companyId] }),
}));

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
    projectId: uuid('project_id').references(() => projects.id), // nullable for admin expenses
    conceptId: uuid('concept_id').notNull().references(() => concepts.id),
    year: integer('year').notNull(),
    month: integer('month').notNull(), // 1-12
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull().default('0'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
    deletedAt: timestamp('deleted_at'), // Soft delete
}, (table) => ({
    uniqueBudget: unique().on(table.companyId, table.areaId, table.projectId, table.conceptId, table.year, table.month),
}));

// --- Results ---
export const results = pgTable('results', {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').notNull().references(() => companies.id),
    projectId: uuid('project_id').references(() => projects.id), // NULL = Administracion
    conceptId: uuid('concept_id').notNull().references(() => concepts.id),
    year: integer('year').notNull(),
    month: integer('month').notNull(), // 1-12
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull().default('0'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    importedBy: uuid('imported_by').references(() => users.id),
    deletedAt: timestamp('deleted_at'), // Soft delete
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
    businessUnit: varchar('business_unit', { length: 255 }),
    account: varchar('account', { length: 255 }),
    cancelled: decimal('cancelled', { precision: 15, scale: 2 }),
    inTransit: decimal('in_transit', { precision: 15, scale: 2 }),
    entries: decimal('entries', { precision: 15, scale: 2 }),
    subtotal: decimal('subtotal', { precision: 15, scale: 2 }),
    tax: decimal('tax', { precision: 15, scale: 2 }),
    withdrawals: decimal('withdrawals', { precision: 15, scale: 2 }),
    balance: decimal('balance', { precision: 15, scale: 2 }),
    observations: text('observations'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
});

// --- Import Rules ---
export const importRules = pgTable('import_rules', {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').notNull().references(() => companies.id),
    ruleType: importRuleTypeEnum('rule_type').notNull(),
    sourceProjectName: varchar('source_project_name', { length: 255 }), // NULL = any project
    sourceConceptName: varchar('source_concept_name', { length: 255 }).notNull(),
    targetProjectName: varchar('target_project_name', { length: 255 }), // For REDIRECT rules
    isActive: boolean('is_active').notNull().default(true),
    description: text('description'), // Optional note explaining the rule
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
});

// --- Valid Sheet Names (for Excel import) ---
export const validSheetNames = pgTable('valid_sheet_names', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ==================== RELATIONS ====================

export const usersRelations = relations(users, ({ one, many }) => ({
    area: one(areas, { fields: [users.areaId], references: [areas.id] }),
    companies: many(userCompanies),
    sessions: many(userSessions),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
    user: one(users, { fields: [userSessions.userId], references: [users.id] }),
}));

export const userCompaniesRelations = relations(userCompanies, ({ one }) => ({
    user: one(users, { fields: [userCompanies.userId], references: [users.id] }),
    company: one(companies, { fields: [userCompanies.companyId], references: [companies.id] }),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
    projects: many(projects),
    areas: many(areas),
    users: many(userCompanies),
    periods: many(periods),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
    company: one(companies, { fields: [projects.companyId], references: [companies.id] }),
    profitSharingRule: one(profitSharingRules, {
        fields: [projects.id],
        references: [profitSharingRules.projectId]
    }),
}));

export const profitSharingRulesRelations = relations(profitSharingRules, ({ one }) => ({
    project: one(projects, { fields: [profitSharingRules.projectId], references: [projects.id] }),
}));

export const areasRelations = relations(areas, ({ one, many }) => ({
    company: one(companies, { fields: [areas.companyId], references: [companies.id] }),
    concepts: many(concepts),
    budgets: many(budgets),
    users: many(users),
}));

export const conceptsRelations = relations(concepts, ({ one, many }) => ({
    area: one(areas, { fields: [concepts.areaId], references: [areas.id] }),
    budgets: many(budgets),
    results: many(results),
    mappings: many(conceptMappings),
}));

export const conceptMappingsRelations = relations(conceptMappings, ({ one }) => ({
    company: one(companies, { fields: [conceptMappings.companyId], references: [companies.id] }),
    concept: one(concepts, { fields: [conceptMappings.conceptId], references: [concepts.id] }),
}));

export const periodsRelations = relations(periods, ({ one }) => ({
    company: one(companies, { fields: [periods.companyId], references: [companies.id] }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
    company: one(companies, { fields: [budgets.companyId], references: [companies.id] }),
    area: one(areas, { fields: [budgets.areaId], references: [areas.id] }),
    concept: one(concepts, { fields: [budgets.conceptId], references: [concepts.id] }),
    createdByUser: one(users, { fields: [budgets.createdBy], references: [users.id] }),
}));

export const resultsRelations = relations(results, ({ one }) => ({
    company: one(companies, { fields: [results.companyId], references: [companies.id] }),
    project: one(projects, { fields: [results.projectId], references: [projects.id] }),
    concept: one(concepts, { fields: [results.conceptId], references: [concepts.id] }),
    importedByUser: one(users, { fields: [results.importedBy], references: [users.id] }),
}));

export const reconciliationsRelations = relations(reconciliations, ({ one }) => ({
    company: one(companies, { fields: [reconciliations.companyId], references: [companies.id] }),
    project: one(projects, { fields: [reconciliations.projectId], references: [projects.id] }),
    concept: one(concepts, { fields: [reconciliations.conceptId], references: [concepts.id] }),
    createdByUser: one(users, { fields: [reconciliations.createdBy], references: [users.id] }),
}));
