# 12 - Despliegue y Variables de Entorno

**Proyecto**: Arsen - Sistema de Control Presupuestal Multi-Empresa  
**Versión**: 1.0  
**Fecha**: 8 de enero de 2026

---

## 1. Ambientes

| Ambiente | URL | Propósito |
|----------|-----|-----------|
| Local | http://localhost:3000 | Desarrollo |
| Preview | https://arsen-*.vercel.app | PRs y testing |
| Production | https://arsen.vercel.app | Producción |

---

## 2. Variables de Entorno

### Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión PostgreSQL (Neon) | `postgresql://user:pass@host/db?sslmode=require` |
| `NEXTAUTH_URL` | URL base de la aplicación | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret para JWT (min 32 chars) | `your-super-secret-key-min-32-chars` |

### Opcionales

| Variable | Descripción | Default |
|----------|-------------|---------|
| `UPSTASH_REDIS_REST_URL` | URL de Redis para rate limiting | (deshabilitado) |
| `UPSTASH_REDIS_REST_TOKEN` | Token de Upstash Redis | (deshabilitado) |
| `NEXT_PUBLIC_APP_NAME` | Nombre de la app | `Arsen` |
| `LOG_LEVEL` | Nivel de logs | `info` |

### Archivo `.env.local` (desarrollo)

```bash
# Base de datos
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/arsen?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-key-min-32-characters"

# Rate Limiting (opcional)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="tu-token-de-upstash"

# App
NEXT_PUBLIC_APP_NAME="Arsen"
```

### Generar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## 3. Configuración de Neon

### Crear proyecto
1. Ir a https://console.neon.tech
2. Crear nuevo proyecto "arsen"
3. Seleccionar región "US East (Virginia)"
4. Copiar connection string

### Conexión pooling
Para mejor rendimiento en serverless:

```
postgresql://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/arsen?sslmode=require
```
(Nota: usar `-pooler` en el host)

---

## 4. Configuración de Vercel

### 4.1 Conectar repositorio
```bash
vercel link
```

### 4.2 Variables de entorno en Vercel

```bash
# Agregar variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
```

O desde el dashboard: Project Settings → Environment Variables

### 4.3 next.config.ts (Security Headers)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## 5. Scripts de Deployment

### package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx scripts/seed.ts"
  }
}
```

---

## 6. Base de Datos - Migraciones

### Primera vez (desarrollo)
```bash
# Generar schema
npm run db:generate

# Aplicar a BD
npm run db:push
```

### Producción
```bash
# Generar migración
npm run db:generate

# Revisar migración en drizzle/migrations/

# Aplicar (automático en deploy)
npm run db:migrate
```

### Seed inicial

```typescript
// scripts/seed.ts
import { db } from '@/lib/db';
import { companies, users, areas, concepts } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';

async function seed() {
  // Crear empresas
  const [wepark, sigma] = await db.insert(companies).values([
    { name: 'Wepark', code: 'WPK', handlesProfitSharing: true },
    { name: 'Sigma', code: 'SGM', handlesProfitSharing: false },
  ]).returning();

  // Crear admin
  const passwordHash = await bcrypt.hash('admin123', 10);
  await db.insert(users).values({
    email: 'admin@arsen.com',
    name: 'Administrador',
    passwordHash,
    role: 'ADMIN',
  });

  // Crear áreas
  const areasData = ['Compras', 'Comercial', 'RH', 'Operación', 'Finanzas'];
  for (const company of [wepark, sigma]) {
    for (const name of areasData) {
      await db.insert(areas).values({ companyId: company.id, name });
    }
  }

  console.log('Seed completed!');
}

seed();
```

---

## 7. CI/CD Pipeline

### GitHub Actions (opcional)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linter
        run: npm run lint
        
      - name: Run tests
        run: npm test
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 8. Comandos de Deploy

### Desarrollo local
```bash
npm run dev
```

### Preview (automático con PR)
```bash
vercel
```

### Producción
```bash
vercel --prod
```

### Rollback
```bash
vercel rollback
```

---

## 9. Monitoreo

### Vercel Analytics
- Habilitado automáticamente
- Ver en Vercel Dashboard → Analytics

### Logs
```bash
vercel logs --follow
```

### Errores
- Vercel Dashboard → Logs → Errors

---

## 10. Backups

### Base de datos (Neon)
- Neon tiene backups automáticos (7 días)
- Para backup manual:
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restore
```bash
psql $DATABASE_URL < backup.sql
```

---

## 11. Checklist Pre-Deploy

- [ ] Variables de entorno configuradas en Vercel
- [ ] Migraciones de BD aplicadas
- [ ] Seed inicial ejecutado (si es primera vez)
- [ ] Tests pasando
- [ ] Build local exitoso (`npm run build`)
- [ ] NEXTAUTH_SECRET diferente entre ambientes

---

*Documento actualizado: 9 de enero de 2026*
