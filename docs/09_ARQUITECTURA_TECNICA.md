# 09 - Arquitectura Técnica

**Proyecto**: Arsen - Sistema de Control Presupuestal Multi-Empresa  
**Versión**: 1.0  
**Fecha**: 8 de enero de 2026

---

## 1. Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|------------|---------|-----------|
| Framework | Next.js | 16.x | App Router, Server Components, React Compiler |
| Lenguaje | TypeScript | 5.x | Tipado estático |
| ORM | Drizzle ORM | 0.45+ | Acceso a BD type-safe |
| Base de datos | PostgreSQL | 15.x | Almacenamiento relacional |
| DB Hosting | Neon | - | PostgreSQL serverless |
| Autenticación | NextAuth.js | 5.x | Auth.js con Credentials |
| Validación | Zod | 4.x | Validación de esquemas |
| UI | shadcn/ui | Latest | Componentes accesibles |
| Estilos | Tailwind CSS | 4.x | Utility-first CSS |
| Excel | SheetJS (xlsx) | Latest | Parsing/exportación Excel |
| PDF | jsPDF + jspdf-autotable | Latest | Generación de PDF con tablas |
| Estado | Zustand | Latest | Estado global mínimo |
| Rate Limiting | @upstash/ratelimit | Latest | Protección contra brute force |
| Hosting | Vercel | - | Deploy y CDN |

---

## 2. Estructura de Proyecto

```
arsen/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rutas de autenticación
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/              # Rutas protegidas
│   │   ├── layout.tsx            # Layout con sidebar
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── budgets/              # Presupuestos
│   │   ├── results/              # Resultados
│   │   ├── comparison/           # Comparativo
│   │   ├── profit-sharing/       # Reparto
│   │   ├── reconciliations/      # Conciliaciones
│   │   ├── reports/              # Reportes
│   │   ├── catalogs/             # Catálogos
│   │   │   ├── companies/
│   │   │   ├── projects/
│   │   │   ├── concepts/
│   │   │   └── areas/
│   │   ├── users/                # Gestión usuarios (Admin)
│   │   └── settings/             # Configuración (Admin)
│   ├── api/                      # API Routes
│   │   ├── auth/[...nextauth]/
│   │   ├── budgets/
│   │   ├── results/
│   │   ├── profit-sharing/
│   │   └── export/
│   ├── layout.tsx                # Root layout
│   └── globals.css
├── components/                   # Componentes React
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Formularios
│   ├── tables/                   # Tablas de datos
│   ├── charts/                   # Gráficas
│   ├── layout/                   # Sidebar, Header
│   └── shared/                   # Componentes compartidos
├── lib/                          # Utilidades
│   ├── db/                       # Drizzle
│   │   ├── schema.ts             # Esquema de BD
│   │   ├── index.ts              # Cliente de BD
│   │   └── migrations/           # Migraciones
│   ├── auth/                     # Configuración Auth
│   ├── validators/               # Esquemas Zod
│   ├── utils/                    # Helpers
│   ├── excel/                    # Parsing Excel
│   ├── pdf/                      # Generación PDF
│   └── profit-sharing/           # Motor de cálculo
│       ├── engine.ts
│       ├── formulas/
│       │   ├── fixed-only.ts
│       │   ├── percent-simple.ts
│       │   ├── fixed-plus-percent.ts
│       │   ├── tiered.ts
│       │   ├── special-formula.ts
│       │   ├── grouped.ts
│       │   └── dynamic.ts
│       └── types.ts
├── actions/                      # Server Actions
│   ├── budgets.ts
│   ├── results.ts
│   ├── profit-sharing.ts
│   └── users.ts
├── hooks/                        # Custom hooks
├── stores/                       # Zustand stores
├── types/                        # TypeScript types
├── drizzle.config.ts
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## 3. Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    UI LAYER                               │   │
│  │  React Server Components + Client Components              │   │
│  │  shadcn/ui + Tailwind CSS                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  APPLICATION LAYER                        │   │
│  │  Server Actions + API Routes + Route Handlers            │   │
│  │  Zod Validation + Error Handling                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   DOMAIN LAYER                            │   │
│  │  Business Logic + Profit Sharing Engine                  │   │
│  │  Excel Parser + PDF Generator                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    DATA LAYER                             │   │
│  │  Drizzle ORM + PostgreSQL (Neon)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Server Components vs Client Components

### Server Components (default)
Usar para:
- Data fetching
- Acceso a BD
- Código que no necesita interactividad
- SEO (aunque no es crítico en este proyecto)

```tsx
// app/(dashboard)/results/page.tsx
export default async function ResultsPage() {
  const results = await getResults(); // Ejecuta en servidor
  return <ResultsTable data={results} />;
}
```

### Client Components
Usar para:
- Interactividad (clicks, inputs)
- Hooks de React (useState, useEffect)
- Event handlers
- Librerías que usan browser APIs

```tsx
// components/tables/results-table.tsx
'use client';

export function ResultsTable({ data }) {
  const [selectedRow, setSelectedRow] = useState(null);
  // ...
}
```

### Patrón Recomendado
```
Server Component (page.tsx)
    └── Fetch data
    └── Pass to Client Component
            └── Handle interactivity
```

---

## 5. Data Fetching

### Estrategia Principal: Server Actions

```typescript
// actions/results.ts
'use server';

import { db } from '@/lib/db';
import { results } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function getResults(companyId: string, period: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  
  // Verificar acceso a empresa
  await checkCompanyAccess(session.user, companyId);
  
  return db
    .select()
    .from(results)
    .where(
      and(
        eq(results.companyId, companyId),
        eq(results.period, period)
      )
    );
}
```

### API Routes (cuando se necesite)
Usar para:
- Endpoints que se consumen externamente
- Webhooks
- Exportaciones de archivos

```typescript
// app/api/export/excel/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  
  const data = await getResults(companyId);
  const excel = generateExcel(data);
  
  return new Response(excel, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="report.xlsx"',
    },
  });
}
```

---

## 6. Autenticación y Autorización

### Configuración NextAuth.js v5

```typescript
// lib/auth/config.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });
        
        if (!user) return null;
        
        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        
        if (!valid) return null;
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyIds: user.companyIds,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.companyIds = user.companyIds;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role;
      session.user.companyIds = token.companyIds;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
});
```

### Middleware de Autorización

```typescript
// middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const publicRoutes = ['/login'];
const adminRoutes = ['/users', '/settings'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  
  // Rutas públicas
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Usuario no autenticado
  if (!req.auth) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Rutas de admin
  if (adminRoutes.some(r => pathname.startsWith(r))) {
    if (req.auth.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 7. Motor de Cálculo de Reparto

### Patrón Strategy

```typescript
// lib/profit-sharing/types.ts
export type FormulaType = 
  | 'FIXED_ONLY'
  | 'PERCENT_SIMPLE'
  | 'FIXED_PLUS_PERCENT'
  | 'TIERED'
  | 'SPECIAL_FORMULA'
  | 'GROUPED'
  | 'DYNAMIC';

export interface ProfitSharingConfig {
  formulaType: FormulaType;
  fixedAmount?: number;
  percent1?: number;
  percent2?: number;
  threshold1?: number;
  groupedWith?: string[];
  dynamicField?: string;
  dynamicIncrement?: number;
}

export interface ProfitSharingResult {
  grossProfit: number;
  companyFee: number;
  clientProfit: number;
  formula: string; // Descripción legible
  breakdown: Record<string, number>; // Detalle del cálculo
}
```

```typescript
// lib/profit-sharing/engine.ts
import { FormulaType, ProfitSharingConfig, ProfitSharingResult } from './types';
import * as formulas from './formulas';

export function calculateProfitSharing(
  grossProfit: number,
  config: ProfitSharingConfig,
  context?: Record<string, number>
): ProfitSharingResult {
  const calculator = getCalculator(config.formulaType);
  return calculator(grossProfit, config, context);
}

function getCalculator(type: FormulaType) {
  const calculators = {
    FIXED_ONLY: formulas.calculateFixedOnly,
    PERCENT_SIMPLE: formulas.calculatePercentSimple,
    FIXED_PLUS_PERCENT: formulas.calculateFixedPlusPercent,
    TIERED: formulas.calculateTiered,
    SPECIAL_FORMULA: formulas.calculateSpecialFormula,
    GROUPED: formulas.calculateGrouped,
    DYNAMIC: formulas.calculateDynamic,
  };
  
  return calculators[type];
}
```

```typescript
// lib/profit-sharing/formulas/tiered.ts
export function calculateTiered(
  grossProfit: number,
  config: ProfitSharingConfig
): ProfitSharingResult {
  const { percent1 = 0, threshold1 = 0, percent2 = 0 } = config;
  
  let companyFee: number;
  let breakdown: Record<string, number>;
  
  if (grossProfit <= threshold1) {
    companyFee = grossProfit * (percent1 / 100);
    breakdown = {
      tier1Profit: grossProfit,
      tier1Rate: percent1,
      tier1Fee: companyFee,
    };
  } else {
    const tier1Fee = threshold1 * (percent1 / 100);
    const tier2Fee = (grossProfit - threshold1) * (percent2 / 100);
    companyFee = tier1Fee + tier2Fee;
    breakdown = {
      tier1Profit: threshold1,
      tier1Rate: percent1,
      tier1Fee,
      tier2Profit: grossProfit - threshold1,
      tier2Rate: percent2,
      tier2Fee,
    };
  }
  
  return {
    grossProfit,
    companyFee,
    clientProfit: grossProfit - companyFee,
    formula: `${percent1}% hasta $${threshold1.toLocaleString()} + ${percent2}% resto`,
    breakdown,
  };
}
```

---

## 8. Parsing de Excel

### Flujo de Importación

```typescript
// lib/excel/results-parser.ts
import * as XLSX from 'xlsx';

export interface ParsedResults {
  projects: string[];
  concepts: ConceptRow[];
  errors: ParseError[];
  warnings: ParseWarning[];
}

export function parseResultsExcel(buffer: ArrayBuffer): ParsedResults {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // Encontrar celda ancla "Concepto/Proyecto"
  const anchorCell = findAnchorCell(sheet);
  if (!anchorCell) {
    throw new Error('No se encontró la celda "Concepto/Proyecto"');
  }
  
  // Extraer proyectos (fila siguiente al ancla)
  const projects = extractProjects(sheet, anchorCell);
  
  // Extraer conceptos y valores
  const concepts = extractConcepts(sheet, anchorCell, projects.length);
  
  // Validar estructura
  const { errors, warnings } = validateStructure(projects, concepts);
  
  return { projects, concepts, errors, warnings };
}

function findAnchorCell(sheet: XLSX.WorkSheet): XLSX.CellAddress | null {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');
  
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell?.v === 'Concepto/Proyecto') {
        return { r: row, c: col };
      }
    }
  }
  
  return null;
}
```

---

## 9. Manejo de Errores

### Estructura de Errores

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} no encontrado`, 'NOT_FOUND', 404);
  }
}
```

### Error Boundary

```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-bold">Algo salió mal</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="mt-4 btn btn-primary">
        Intentar de nuevo
      </button>
    </div>
  );
}
```

---

## 10. Variables de Entorno

```bash
# .env.local

# Base de datos
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Rate Limiting (Upstash Redis - opcional)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="tu-token-de-upstash"

# Configuración de la app
NEXT_PUBLIC_APP_NAME="Arsen"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Validación de ENV

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
```

---

## 11. Caching y Performance

### Revalidación de Datos

```typescript
// Para datos que cambian poco (catálogos)
export const revalidate = 3600; // 1 hora

// Para datos dinámicos (resultados)
export const dynamic = 'force-dynamic';
```

### Optimistic Updates

```typescript
// Para mejor UX en formularios
'use client';

import { useOptimistic } from 'react';

function BudgetForm({ budget }) {
  const [optimisticBudget, setOptimisticBudget] = useOptimistic(
    budget,
    (current, update) => ({ ...current, ...update })
  );
  
  async function handleSubmit(formData) {
    setOptimisticBudget(formData); // Actualiza UI inmediatamente
    await saveBudget(formData);    // Guarda en servidor
  }
  
  return <form action={handleSubmit}>...</form>;
}
```

---

## 12. Despliegue

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": "@database-url",
    "NEXTAUTH_SECRET": "@nextauth-secret"
  }
}
```

### Build y Deploy

```bash
# Local
npm run dev          # Desarrollo
npm run build        # Build producción
npm run start        # Servidor producción

# Deploy
vercel               # Preview
vercel --prod        # Producción
```

---

*Documento actualizado: 9 de enero de 2026*
