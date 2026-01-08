# Documentación del Sistema Arsen

**Sistema de Control Presupuestal Multi-Empresa**

---

## Índice de Documentos

### Fase 0 - Supuestos
| # | Documento | Descripción |
|---|-----------|-------------|
| 00 | [FASE0_SUPUESTOS](./00_FASE0_SUPUESTOS.md) | Supuestos y decisiones técnicas validadas |

### Fase 1 - Documentación Funcional
| # | Documento | Descripción |
|---|-----------|-------------|
| 01 | [RESUMEN_EJECUTIVO](./01_RESUMEN_EJECUTIVO.md) | Visión, problema, solución, stack |
| 02 | [USER_PERSONAS](./02_USER_PERSONAS.md) | Perfiles de usuario con escenarios |
| 03 | [ANALISIS_FUNCIONAL](./03_ANALISIS_FUNCIONAL.md) | Módulos y estructura de datos |
| 04 | [FLUJOS_FUNCIONALES](./04_FLUJOS_FUNCIONALES.md) | Diagramas de flujos clave |
| 05 | [USER_STORIES](./05_USER_STORIES.md) | 18 historias con Given/When/Then |
| 06 | [REGLAS_NEGOCIO](./06_REGLAS_NEGOCIO.md) | 100+ reglas de validación |
| 07 | [MATRIZ_PERMISOS](./07_MATRIZ_PERMISOS.md) | RBAC por módulo y acción |
| 08 | [GLOSARIO](./08_GLOSARIO.md) | Términos de negocio y técnicos |

### Fase 2 - Documentación Técnica
| # | Documento | Descripción |
|---|-----------|-------------|
| 09 | [ARQUITECTURA_TECNICA](./09_ARQUITECTURA_TECNICA.md) | Estructura, capas, patrones |
| 10 | [MODELO_DATOS](./10_MODELO_DATOS.md) | Esquema Drizzle ORM completo |
| 11 | [ESPECIFICACION_API](./11_ESPECIFICACION_API.md) | Endpoints REST con ejemplos |
| 12 | [DESPLIEGUE](./12_DESPLIEGUE.md) | Vercel, Neon, variables de entorno |

### Fase 3 - Calidad y Operación
| # | Documento | Descripción |
|---|-----------|-------------|
| 13 | [PLAN_TESTING](./13_PLAN_TESTING.md) | Unit, integration, E2E, DoR/DoD |
| 14 | [ROADMAP](./14_ROADMAP.md) | Fases, métricas, riesgos |

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Server Actions + API Routes |
| ORM | Drizzle ORM |
| Base de datos | PostgreSQL (Neon) |
| Autenticación | NextAuth.js v5 |
| Hosting | Vercel |

---

## Características Principales

- ✅ Multi-empresa escalable (Wepark, Sigma, + futuras)
- ✅ Importación automática de archivos del contador
- ✅ 7 tipos de fórmulas de reparto de utilidad
- ✅ Comparativo real vs presupuesto
- ✅ Exportación a Excel y PDF
- ✅ 4 roles de usuario con RBAC

---

## Cronograma Estimado

| Fase | Duración | Entregables |
|------|----------|-------------|
| MVP | 4-6 semanas | Auth, catálogos, presupuestos, resultados, comparativo, dashboard |
| V1 | 2-3 semanas | Reparto completo, exportaciones |
| V1.1 | 1-2 semanas | Conciliaciones, refinamientos |

---

*Documentación generada: 8 de enero de 2026*
