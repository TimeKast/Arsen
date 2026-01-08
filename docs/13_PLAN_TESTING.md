# 13 - Plan de Testing y QA

**Proyecto**: Arsen - Sistema de Control Presupuestal Multi-Empresa  
**Versión**: 1.0  
**Fecha**: 8 de enero de 2026

---

## 1. Estrategia de Testing

### Pirámide de Tests

```
            ┌─────────┐
            │   E2E   │  ← Pocos (rutas críticas)
           ─┼─────────┼─
          / │ Integra-│ \  ← Algunos (API + DB)
         /  │  ción   │  \
        ────┼─────────┼────
       /    │ Unitarios│    \  ← Muchos (lógica pura)
      ──────┴─────────┴──────
```

### Herramientas

| Tipo | Herramienta | Propósito |
|------|-------------|-----------|
| Unit | Vitest | Funciones puras, utilidades |
| Integration | Vitest + Drizzle | Server actions, queries |
| E2E | Playwright | Flujos completos de usuario |
| Mocking | MSW | Mock de APIs externas |

---

## 2. Tests Unitarios

### Qué probar
- Funciones de cálculo de reparto
- Validadores Zod
- Utilidades de formato
- Helpers de Excel parsing

### Ejemplo: Motor de Reparto

```typescript
// lib/profit-sharing/__tests__/engine.test.ts
import { describe, it, expect } from 'vitest';
import { calculateProfitSharing } from '../engine';

describe('calculateProfitSharing', () => {
  describe('FIXED_ONLY', () => {
    it('returns fixed amount regardless of profit', () => {
      const result = calculateProfitSharing(100000, {
        formulaType: 'FIXED_ONLY',
        fixedAmount: 12000,
      });
      
      expect(result.companyFee).toBe(12000);
      expect(result.clientProfit).toBe(88000);
    });
  });

  describe('TIERED', () => {
    it('applies first tier only when under threshold', () => {
      const result = calculateProfitSharing(500000, {
        formulaType: 'TIERED',
        percent1: 30,
        threshold1: 1000000,
        percent2: 25,
      });
      
      expect(result.companyFee).toBe(150000); // 30% of 500k
    });

    it('applies both tiers when over threshold', () => {
      const result = calculateProfitSharing(1500000, {
        formulaType: 'TIERED',
        percent1: 30,
        threshold1: 1000000,
        percent2: 25,
      });
      
      // 30% of 1M = 300k + 25% of 500k = 125k = 425k
      expect(result.companyFee).toBe(425000);
    });
  });

  describe('SPECIAL_FORMULA', () => {
    it('calculates Monte Pelvoux style correctly', () => {
      const result = calculateProfitSharing(35000, {
        formulaType: 'SPECIAL_FORMULA',
        fixedAmount: 6063.75,
        percent1: 30,
      });
      
      // (35000 - 6063.75) * 0.30 + 6063.75 = 8744.63 + 6063.75 = 14808.38
      expect(result.companyFee).toBeCloseTo(14808.38, 2);
    });
  });
});
```

### Ejemplo: Validadores

```typescript
// lib/validators/__tests__/budget.test.ts
import { describe, it, expect } from 'vitest';
import { budgetSchema } from '../budget';

describe('budgetSchema', () => {
  it('accepts valid budget data', () => {
    const result = budgetSchema.safeParse({
      companyId: 'uuid',
      areaId: 'uuid',
      year: 2025,
      items: [
        { conceptId: 'uuid', values: { 1: 1000, 2: 0 } }
      ]
    });
    
    expect(result.success).toBe(true);
  });

  it('rejects negative amounts', () => {
    const result = budgetSchema.safeParse({
      companyId: 'uuid',
      areaId: 'uuid',
      year: 2025,
      items: [
        { conceptId: 'uuid', values: { 1: -100 } }
      ]
    });
    
    expect(result.success).toBe(false);
  });
});
```

---

## 3. Tests de Integración

### Qué probar
- Server Actions con base de datos
- Queries complejas
- Transacciones

### Setup

```typescript
// tests/setup.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema';

// Usar BD de test
const testDb = drizzle(
  postgres(process.env.TEST_DATABASE_URL!),
  { schema }
);

export { testDb };
```

### Ejemplo: Importación de Resultados

```typescript
// actions/__tests__/results.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { testDb } from '@/tests/setup';
import { importResults, confirmImport } from '../results';

describe('importResults', () => {
  beforeEach(async () => {
    // Limpiar y sembrar datos de test
    await testDb.delete(results);
    await seedTestData();
  });

  it('parses Excel file and returns preview', async () => {
    const file = readTestFile('resultados-enero.xlsx');
    
    const preview = await importResults('company-id', file);
    
    expect(preview.projects).toContain('Torre Prisma');
    expect(preview.errors).toHaveLength(0);
  });

  it('detects unrecognized projects', async () => {
    const file = readTestFile('resultados-proyecto-nuevo.xlsx');
    
    const preview = await importResults('company-id', file);
    
    expect(preview.warnings).toContainEqual(
      expect.objectContaining({ type: 'NEW_PROJECT' })
    );
  });
});
```

---

## 4. Tests E2E

### Flujos Críticos a Probar

| # | Flujo | Prioridad |
|---|-------|-----------|
| 1 | Login y acceso a dashboard | Alta |
| 2 | Importación de resultados completa | Alta |
| 3 | Captura de presupuesto | Alta |
| 4 | Consulta de comparativo | Media |
| 5 | Configuración de reparto | Media |
| 6 | Exportación a Excel/PDF | Media |

### Ejemplo: Flujo de Login

```typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'admin@arsen.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'wrong@email.com');
    await page.fill('[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('[role="alert"]')).toContainText(
      'Credenciales inválidas'
    );
  });
});
```

### Ejemplo: Flujo de Importación

```typescript
// tests/e2e/import-results.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Import Results', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
  });

  test('should import results successfully', async ({ page }) => {
    await page.goto('/results/import');
    
    // Seleccionar empresa y período
    await page.selectOption('[name="company"]', 'Wepark');
    await page.selectOption('[name="year"]', '2025');
    await page.selectOption('[name="month"]', '1');
    
    // Subir archivo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/resultados-enero.xlsx');
    
    // Esperar vista previa
    await expect(page.locator('.preview-table')).toBeVisible();
    await expect(page.locator('.project-row')).toHaveCount(5);
    
    // Confirmar importación
    await page.click('button:has-text("Confirmar")');
    
    // Verificar éxito
    await expect(page.locator('[role="alert"]')).toContainText(
      'Resultados importados exitosamente'
    );
  });
});
```

---

## 5. Configuración

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', 'tests'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 6. Comandos

```bash
# Unit + Integration tests
npm test

# Con coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# E2E tests
npm run test:e2e

# E2E con UI
npm run test:e2e -- --ui
```

---

## 7. Definition of Ready (DoR)

Una historia está **lista para desarrollo** cuando:

- [ ] Tiene criterios de aceptación claros (Given/When/Then)
- [ ] El diseño de UI está definido (si aplica)
- [ ] Las dependencias están identificadas
- [ ] Los datos de ejemplo están disponibles
- [ ] El equipo entiende el alcance

---

## 8. Definition of Done (DoD)

Una historia está **completada** cuando:

- [ ] El código pasa el linter (`npm run lint`)
- [ ] Tiene tests unitarios para lógica nueva
- [ ] Tiene test E2E para flujos críticos
- [ ] La funcionalidad está documentada
- [ ] El PR fue revisado y aprobado
- [ ] Funciona en el ambiente de preview
- [ ] No hay errores en consola
- [ ] Es accesible (navegación por teclado, contraste)

---

*Documento generado: 8 de enero de 2026*
