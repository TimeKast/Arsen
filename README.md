# Arsen - Sistema de Control Presupuestal Multi-Empresa

Sistema web para centralizar el control presupuestal y financiero de múltiples empresas, automatizando la conciliación de presupuestos vs resultados reales y el cálculo de reparto de utilidades.

## 🚀 Características Principales

- **Multi-Empresa**: Gestión centralizada de múltiples empresas (Wepark, Sigma, etc.)
- **Presupuestos**: Captura y consulta de presupuestos por área y concepto
- **Resultados**: Importación automática desde Excel del contador
- **Comparativo**: Análisis de desviaciones real vs presupuesto
- **Reparto de Utilidades**: Motor con 7 tipos de fórmulas configurables
- **Conciliaciones**: Registro de movimientos bancarios históricos
- **Exportación**: Reportes en Excel y PDF

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Base de Datos**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **Auth**: NextAuth.js v5
- **Validación**: Zod
- **Estado**: Zustand

## 📋 Requisitos

- Node.js 20+
- Cuenta en [Neon](https://neon.tech) para PostgreSQL

## ⚙️ Configuración

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/TimeKast/Arsen.git
cd Arsen
npm install
```

### 2. Variables de entorno

Crear archivo `.env.local` con:

```env
# Base de datos (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/arsen?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="tu-secreto-seguro-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Rate Limiting (Upstash Redis - opcional)
# Si no se configuran, el rate limiting se desactiva
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="tu-token-de-upstash"
```

### 3. Inicializar base de datos

```bash
# Aplicar esquema a la base de datos
npm run db:push

# (Opcional) Cargar datos de prueba
npm run db:seed
```

### 4. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## 📦 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar build de producción |
| `npm run lint` | Ejecutar ESLint |
| `npm run db:generate` | Generar migraciones Drizzle |
| `npm run db:push` | Aplicar esquema a BD |
| `npm run db:studio` | Abrir Drizzle Studio |
| `npm run db:seed` | Cargar datos iniciales |
| `npm test` | Ejecutar tests |

## 👥 Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| **ADMIN** | Control total del sistema |
| **STAFF** | Operación completa sin gestión de usuarios |
| **AREA_USER** | Gestión de presupuestos de su área |
| **READONLY** | Solo visualización |

## 📁 Estructura del Proyecto

```
src/
├── actions/          # Server Actions
├── app/              # App Router (pages, layouts)
│   ├── (auth)/       # Páginas de autenticación
│   ├── (dashboard)/  # Páginas del dashboard
│   └── api/          # API Routes
├── components/       # Componentes React
├── lib/              # Utilidades y configuración
│   ├── auth/         # Configuración NextAuth
│   ├── db/           # Drizzle schema y cliente
│   ├── excel/        # Parsers de Excel
│   ├── export/       # Generadores de exportación
│   └── profit-sharing/ # Motor de reparto
├── stores/           # Zustand stores
└── types/            # TypeScript types
```

## 📚 Documentación

La documentación completa del proyecto está en `/docs`:

- [Análisis Funcional](./docs/03_ANALISIS_FUNCIONAL.md)
- [User Stories](./docs/05_USER_STORIES.md)
- [Reglas de Negocio](./docs/06_REGLAS_NEGOCIO.md)
- [Arquitectura Técnica](./docs/09_ARQUITECTURA_TECNICA.md)
- [Modelo de Datos](./docs/10_MODELO_DATOS.md)

## 🚢 Despliegue

Ver [Guía de Despliegue](./docs/12_DESPLIEGUE.md) para instrucciones detalladas de Vercel.

---

*Desarrollado por TimeKast © 2026*
