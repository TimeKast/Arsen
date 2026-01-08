# 📚 Mapeo de Documentación por Issue

**Proyecto**: Arsen - Control Presupuestal  
**Propósito**: Guía rápida de qué secciones de documentación consultar antes de cada issue

---

## Convención de Documentos

| Prefijo | Documento | Ruta |
|---------|-----------|------|
| `ARCH` | 09_ARQUITECTURA_TECNICA.md | `docs/09_ARQUITECTURA_TECNICA.md` |
| `DATA` | 10_MODELO_DATOS.md | `docs/10_MODELO_DATOS.md` |
| `PERM` | 07_MATRIZ_PERMISOS.md | `docs/07_MATRIZ_PERMISOS.md` |
| `FLOW` | 04_FLUJOS_FUNCIONALES.md | `docs/04_FLUJOS_FUNCIONALES.md` |
| `RULES` | 06_REGLAS_NEGOCIO.md | `docs/06_REGLAS_NEGOCIO.md` |
| `US` | 05_USER_STORIES.md | `docs/05_USER_STORIES.md` |
| `API` | 11_ESPECIFICACION_API.md | `docs/11_ESPECIFICACION_API.md` |
| `DEPLOY` | 12_DESPLIEGUE.md | `docs/12_DESPLIEGUE.md` |
| `FORMATS` | FILE_FORMATS.md | `plan/FILE_FORMATS.md` |
| `SUPUESTOS` | 00_FASE0_SUPUESTOS.md | `docs/00_FASE0_SUPUESTOS.md` |

---

## M0: Setup & Infraestructura

| Issue | Título | Documentos a Consultar |
|-------|--------|------------------------|
| ARSEN-001 | Setup proyecto Next.js 14 | `ARCH` §2 (Estructura de Proyecto), §3 (Arquitectura de Capas) |
| ARSEN-002 | Configurar Drizzle ORM + Neon | `DATA` §2 (Esquema Drizzle ORM), §3 (Índices), `DEPLOY` §3 (Neon) |
| ARSEN-003 | Implementar NextAuth.js con 4 roles | `ARCH` §6 (Autenticación), `PERM` §1 (Roles), §2-3 (Matriz completa) |
| ARSEN-004 | Crear layout dashboard con sidebar | `FLOW` §7 (Navegación Global), `PERM` §2 (Permisos por módulo) |
| ARSEN-005 | Auditoría — Post Setup M0 | `ARCH`, `DATA`, `PERM` (comparar implementación vs documentos) |
| ARSEN-006 | CRUD de empresas | `DATA` §2 (tabla companies), `RULES` §2 (Reglas de Empresas), `API` §4 |
| ARSEN-007 | CRUD de áreas | `DATA` §2 (tabla areas), `RULES` §4 (RN-030), `API` §7 |
| ARSEN-008 | CRUD de conceptos | `DATA` §2 (tabla concepts), `RULES` §11 (RN-102), `API` §6 |
| ARSEN-009 | CRUD de proyectos | `DATA` §2 (tabla projects), `RULES` §11 (RN-101), `API` §5 |
| ARSEN-010 | CRUD de usuarios (Admin) | `DATA` §2 (tabla users), `PERM` §2.1 (Permisos usuarios), `API` §3 |
| ARSEN-011 | Selector de empresa funcional | `RULES` §2 (RN-011 Empresa activa), `PERM` §3 (Restricciones empresa) |
| ARSEN-012 | Seed de datos iniciales | `FORMATS` (conceptos y proyectos de muestra), `DATA` (estructura) |
| ARSEN-013 | Auditoría — Fin M0 | Todos los documentos de M0 comparados |

---

## M1: MVP - Core

| Issue | Título | Documentos a Consultar |
|-------|--------|------------------------|
| ARSEN-014 | Selector de período (año/mes) | `RULES` §3 (Reglas de Períodos), `FLOW` §1 (Cierre Mensual) |
| ARSEN-015 | Captura de presupuesto | `US` §US-006, `RULES` §4 (RN-030 a RN-033), `FLOW` §3 |
| ARSEN-016 | Consulta de presupuesto | `API` §8 (GET budgets), `RULES` §4 |
| ARSEN-017 | Auditoría — Post Presupuestos | `US` §US-006, `RULES` §4 |
| ARSEN-018 | Parser de Excel del contador | `FORMATS` §1 (Formato Contador), `FLOW` §2 (Detección estructura), `ARCH` §8 |
| ARSEN-019 | Vista previa de importación | `FLOW` §2 (Estados importación), `US` §US-008 |
| ARSEN-020 | Resolución de conflictos | `FLOW` §2 (Tipos de confictos), `RULES` §5 (RN-042, RN-043) |
| ARSEN-021 | Confirmar y guardar resultados | `RULES` §5 (RN-044, RN-045), `API` §9 |
| ARSEN-022 | Consulta de resultados | `US` §US-009, `RULES` §7 (Gastos Admin), `API` §9 |
| ARSEN-023 | Auditoría — Post Importación | `FORMATS`, `US` §US-008, §US-009 |
| ARSEN-024 | Comparativo real vs presupuesto | `US` §US-010, `RULES` §8 (RN-070, RN-071), `API` §10 |
| ARSEN-025 | Dashboard ejecutivo | `US` §US-018, `FLOW` §5 (Consulta reportes) |
| ARSEN-026 | Auditoría — Fin M1 MVP | Todos los documentos de M1 |

---

## M2: V1 - Reparto

| Issue | Título | Documentos a Consultar |
|-------|--------|------------------------|
| ARSEN-027 | Motor de cálculo de reparto (7 fórmulas) | `SUPUESTOS` §2.5 (7 tipos de fórmulas), `RULES` §6 (RN-051), `ARCH` §7 |
| ARSEN-028 | Configuración de reparto por proyecto | `US` §US-011, `FLOW` §4 (Formularios por tipo), `API` §5 (profit-sharing-rule) |
| ARSEN-029 | Cálculo automático post-importación | `RULES` §6 (RN-050, RN-053), integrar con ARSEN-021 |
| ARSEN-030 | Vista de reparto calculado | `US` §US-012, `API` §11 |
| ARSEN-031 | Auditoría — Fin M2 Reparto | `SUPUESTOS` §2.5, validar con imagen de fórmulas (`docs/assets/reparto_formulas.png`) |

---

## M3: V1 - Exportaciones

| Issue | Título | Documentos a Consultar |
|-------|--------|------------------------|
| ARSEN-032 | Exportar a Excel | `US` §US-015, `RULES` §10 (RN-090, RN-091), `API` §13 |
| ARSEN-033 | Exportar a PDF | `US` §US-016, `RULES` §10, `API` §13 |
| ARSEN-034 | Auditoría — Fin M3 | `US` §US-015, §US-016 |

---

## M4: V1.1 - Conciliaciones

| Issue | Título | Documentos a Consultar |
|-------|--------|------------------------|
| ARSEN-035 | Importación masiva de conciliaciones | `US` §US-013, `FORMATS` §3 (Formato Conciliación), `RULES` §9 (RN-080, RN-082) |
| ARSEN-036 | Captura manual de conciliaciones | `US` §US-014, `RULES` §9 (RN-081), `API` §12 |
| ARSEN-037 | Consulta de conciliaciones | `API` §12 (GET reconciliations) |
| ARSEN-038 | Auditoría — Fin M4 y V1.1 | Todos los documentos, prueba integral del sistema |

---

## Instrucciones para AI Developer

Antes de trabajar en cualquier issue:

1. **Leer LINEAR_BACKLOG.md** → Sección del issue específico
2. **Consultar esta tabla** → Identificar documentos relevantes
3. **Leer secciones indicadas** → Entender contexto y reglas de negocio
4. **Verificar dependencias** → Asegurar que issues previos estén completados
5. **Ejecutar auditorías** → No saltar issues de tipo Auditoría

---

*Generado: 8 de enero de 2026*
