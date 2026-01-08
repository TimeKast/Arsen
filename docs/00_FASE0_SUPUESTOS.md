# Fase 0: Supuestos y Decisiones Tomadas

**Proyecto**: Sistema de Control Presupuestal Multi-Empresa (Arsen)  
**Fecha**: 8 de enero de 2026  
**Propósito**: Identificar qué está claramente definido, qué debe inferirse, y qué decisiones técnicas se asumen antes de generar la documentación completa.

---

## 1. Lo que está claramente definido ✅

### 1.1 Contexto de negocio
- **Empresas actuales**: Wepark y Sigma (escalable a más)
- **Problema central**: Cruce manual de Excel consume 4-8 horas por empresa/mes
- **Meta principal**: Reducir cierre mensual a <30 minutos

### 1.2 Funcionalidades confirmadas
| Módulo | Definición |
|--------|------------|
| Multi-empresa | Separación por empresa en todas las vistas; selector de empresa |
| Catálogos | Áreas, conceptos (ingreso/costo), proyectos por empresa |
| Presupuestos | Captura/importación por empresa, área, mes, concepto |
| Resultados mensuales | Importación de archivo del contador (matriz proyecto × concepto) |
| Comparativo | Real vs presupuesto con indicadores de desviación |
| Vista por proyecto | Análisis de desempeño por proyecto |
| Conciliaciones | Importación histórica + captura manual |
| Reparto | Configurable por empresa/proyecto (% sobre ingresos o utilidad) |
| Tablero | Vista consolidada con drill-down |

### 1.3 Estructura de datos conocida
- Archivo del contador: Matriz ~80 filas × ~27 columnas (proyectos en columnas, conceptos en filas)
- Conciliación: Fecha, Referencia, Proveedor, Proyecto, Cuenta, Montos
- Presupuesto: Área, Proyecto, Cuenta, Descripción, 12 columnas mensuales
- ~19 conceptos de ingreso, ~30 conceptos de costo identificados
- Wepark: ~15 proyectos, Sigma: ~10 proyectos con códigos

### 1.4 Roles identificados (CORREGIDO ✅)
- **Admin**: Acceso total, gestión de usuarios y configuraciones
- **Staff**: Casi todo menos funciones de admin (crear usuarios, config sistema)
- **Usuario de Área**: Sube presupuestos de su área asignada
- **Solo Lectura**: Ve todo pero no puede modificar nada

### 1.5 Alcance excluido (confirmado)
- Flujos de aprobación de presupuestos
- Integración directa con sistemas contables
- Proyecciones/forecasting
- Alertas automáticas por correo
- App móvil
- Auditoría detallada

---

## 2. Lo que debe inferirse / Decisiones técnicas asumidas 🔧

### 2.1 Autenticación y autorización

| Decisión | Justificación |
|----------|---------------|
| **NextAuth.js con Credentials Provider** | Usuarios internos, sin necesidad de SSO externo por ahora |
| **Sessions con JWT** | Stateless, compatible con serverless (Vercel) |
| **RBAC simple** | 4 roles fijos, permisos por empresa |
| **Sin multi-tenant aislado** | Una sola base de datos con filtro por empresa |

> **Supuesto**: No se requiere SSO corporativo ni integración con Active Directory en MVP.

### 2.2 Modelo de permisos (CORREGIDO ✅)

| Rol | Usuarios | Empresas | Presupuestos | Resultados | Conciliaciones | Reportes | Config reparto | Catálogos |
|-----|----------|----------|--------------|------------|----------------|----------|----------------|------------|
| **Admin** | CRUD | CRUD | CRUD | CRUD | CRUD | Ver/Exportar | CRUD | CRUD |
| **Staff** | Ver | Ver | CRUD | CRUD | CRUD | Ver/Exportar | CRUD | CRUD |
| **Usuario Área** | - | Ver asignadas | CRUD (su área) | Ver | Ver | Ver/Exportar | - | - |
| **Solo Lectura** | - | Ver asignadas | Ver | Ver | Ver | Ver/Exportar | Ver | Ver |

> **Confirmado**: ~10 usuarios totales, 1-2 concurrentes. Sin restricciones por proyecto individual.

### 2.3 Arquitectura de datos

| Decisión | Detalle |
|----------|---------|
| **PostgreSQL** | DB relacional, hosted en **Neon** (confirmado) |
| **Drizzle ORM** | Type-safe, soporte PostgreSQL nativo |
| **Soft delete** | Registros contables no se eliminan físicamente |
| **Periodos cerrados** | Flag `isClosed` en periods, impide modificaciones |

### 2.4 Procesamiento de Excel

| Decisión | Detalle |
|----------|---------|
| **Librería**: `xlsx` (SheetJS) | Parsing client-side + validación server-side |
| **Flujo**: Upload → Parse → Preview → Confirm | Usuario valida antes de guardar |
| **Detección automática** | Buscar celda "Concepto/Proyecto" como ancla |
| **Mapeo de conceptos** | Fuzzy matching contra catálogo + resolución manual |

> **Supuesto**: El archivo del contador siempre tendrá la celda "Concepto/Proyecto" como identificador.

### 2.5 Cálculo de reparto (ACTUALIZADO ⚠️)

Según documentación del cliente, existen **7 tipos de fórmulas de reparto** que deben soportarse:

| Tipo | Descripción | Ejemplo | Proyectos |
|------|-------------|---------|-----------|
| **FIXED_ONLY** | Solo monto fijo mensual | $12,000/mes | Quadrata, Xochimilco, Reforma 115, Londres, Neza |
| **PERCENT_SIMPLE** | % simple sobre utilidad bruta | 15% utilidad bruta | Santa Fe 230, Puerto Paraíso (8.5%), Insurgentes (20%), Plaza Polanco (9%) |
| **FIXED_PLUS_PERCENT** | Fijo + % sobre utilidad | $21,676.34 + 6% utilidad | Leibnitz, Panorama ($16,275 + 5%), Las Armas ($16,800 + 7%) |
| **TIERED** | % escalonado por rangos | 30% primer millón + 25% restante | Corporativo Polanco, The ROOM, Summit |
| **SPECIAL_FORMULA** | Fórmula personalizada | (Utilidad - Fijo) × 30% + Fijo | Monte Pelvoux |
| **GROUPED** | Agrupa utilidad de varios proyectos | Suma utilidad de The Room | Corporativo Polanco + The Room |
| **DYNAMIC** | Variable basada en operación | +$2,750 por cada valet parking | Sonora |

#### Motor de cálculo requerido

```
Para FIXED_ONLY:
  honorario = fixed_amount

Para PERCENT_SIMPLE:
  honorario = utilidad_bruta × percent_1

Para FIXED_PLUS_PERCENT:
  honorario = fixed_amount + (utilidad_bruta × percent_1)

Para TIERED:
  if utilidad_bruta <= threshold_1:
    honorario = utilidad_bruta × percent_1
  else:
    honorario = (threshold_1 × percent_1) + ((utilidad_bruta - threshold_1) × percent_2)

Para SPECIAL_FORMULA:
  honorario = fixed_amount + ((utilidad_bruta - fixed_amount) × percent_1)

Para GROUPED:
  utilidad_combinada = SUM(utilidad de proyectos agrupados)
  aplicar fórmula del proyecto principal sobre utilidad_combinada

Para DYNAMIC:
  honorario = fixed_amount + (variable_count × increment_per_unit)
```

#### Modelo de datos propuesto para reglas de reparto

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `formula_type` | enum | FIXED_ONLY, PERCENT_SIMPLE, FIXED_PLUS_PERCENT, TIERED, SPECIAL_FORMULA, GROUPED, DYNAMIC |
| `fixed_amount` | decimal | Monto fijo mensual (si aplica) |
| `percent_1` | decimal | Primer porcentaje (0-100) |
| `percent_2` | decimal | Segundo porcentaje para escalonados |
| `threshold_1` | decimal | Umbral para fórmulas escalonadas (ej: 1,000,000) |
| `grouped_with` | array | IDs de proyectos a agrupar |
| `dynamic_field` | string | Campo para fórmulas dinámicas (ej: "valet_parking_count") |
| `dynamic_increment` | decimal | Incremento por unidad dinámica |
| `notes` | text | Observaciones/documentación de la fórmula |

> **IMPORTANTE**: Este nivel de complejidad requiere un **motor de cálculo robusto** y una **UI de configuración flexible** para definir las reglas por proyecto.

### 2.6 Estructura de UI/UX

| Área | Decisión |
|------|----------|
| **Layout** | Sidebar con navegación, header con selector de empresa/período |
| **Dashboard** | Cards de resumen + tabla comparativa + gráfica de desviaciones |
| **Drill-down** | Empresa → Proyecto → Concepto (3 niveles) |
| **Responsive** | Desktop-first, responsive para tablets |
| **Tema** | Light/Dark mode con sistema de diseño propio |

### 2.7 Estrategia de Server Components

| Componente | Tipo | Razón |
|------------|------|-------|
| Dashboard/reportes | Server Component | Data fetching en servidor, SEO no requerido pero mejor performance |
| Tablas de datos | Server Component | RSC streaming para carga progresiva |
| Formularios | Client Component | Interactividad requerida |
| Modals/Dialogs | Client Component | Estado local |
| Upload Excel | Client Component | Parsing en browser + preview |

---

## 3. Ambigüedades y resolución propuesta ⚠️

### 3.1 ¿Cómo se vinculan presupuesto y resultados?

**Problema**: El presupuesto tiene Área + Cuenta + Descripción, pero los resultados tienen Concepto directamente.

**Resolución asumida**:
- Crear catálogo maestro de conceptos
- Mapeo manual inicial: Concepto → Área (para organizar quién sube qué)
- El sistema permite ajustar mapeos cuando hay discrepancias

### 3.2 ¿Qué pasa si un proyecto nuevo aparece en el archivo del contador?

**Resolución asumida**:
- El sistema detecta proyectos no registrados en catálogo
- Usuario puede crear el proyecto on-the-fly durante importación
- El nuevo proyecto hereda configuración por defecto de la empresa (reparto sí/no)

### 3.3 ¿Cómo manejar conceptos que no existen en el catálogo?

**Resolución asumida**:
- El sistema marca los conceptos no reconocidos
- Usuario puede:
  a) Mapear a concepto existente
  b) Crear nuevo concepto
  c) Ignorar (se agrupa en "Otros")

### 3.4 ¿Qué granularidad tiene el presupuesto vs los resultados? (CORREGIDO ✅)

**Confirmado por cliente**:
- **Presupuesto**: Nivel **empresa + área + concepto + mes** (NO por proyecto)
- **Resultados**: Nivel **empresa + proyecto + concepto + mes**
- **Consultas principales**: Por **mes** o por **proyecto** (no por área)
- Las áreas solo sirven para organizar **quién sube qué presupuesto**, no para consultas

> El comparativo real vs presupuesto se hace a nivel de concepto, consolidando todos los proyectos.

### 3.5 ¿Qué ocurre con "Gastos Admin" que no tienen proyecto asignado? (CORREGIDO ✅)

**Confirmado por cliente**:
- Son **gastos generales de la empresa**, no de un proyecto específico
- Se registran como "Administración" o un concepto similar (no como proyecto ficticio)
- Es importante tener el **detalle completo** de estos gastos
- NO participan en reparto (son 100% de la empresa)
- En reportes, se muestran como una sección separada de los proyectos

### 3.6 ¿El reparto es mensual o acumulado anual? (CONFIRMADO ✅)

**Confirmado por cliente**:
- El reparto se calcula **mensualmente**, como todo lo demás
- El acumulado anual es suma de los repartos mensuales
- No hay "true-up" o ajuste anual automático


---

## 4. Decisiones de stack técnico 🛠️

| Capa | Tecnología | Versión |
|------|------------|---------|
| **Framework** | Next.js (App Router) | 14.x |
| **Lenguaje** | TypeScript | 5.x |
| **ORM** | Drizzle ORM | Latest |
| **Base de datos** | PostgreSQL | 15.x |
| **Autenticación** | NextAuth.js v5 | 5.x (Auth.js) |
| **Validación** | Zod | Latest |
| **UI Components** | shadcn/ui | Latest |
| **Estilos** | Tailwind CSS | 3.x |
| **Tablas** | TanStack Table | v8 |
| **Gráficas** | Recharts | Latest |
| **Excel parsing/export** | SheetJS (xlsx) | Latest |
| **PDF export** | @react-pdf/renderer o jsPDF | Latest |
| **Estado global** | Zustand (mínimo) | Latest |
| **Hosting** | Vercel | ✅ Confirmado |
| **DB Hosting** | Neon | ✅ Confirmado |

---

## 5. Riesgos técnicos identificados 🚨

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|--------------|---------|------------|
| 1 | Variabilidad extrema en formato Excel | Media | Alto | Patrón de detección robusto + resolución manual |
| 2 | Performance con muchos proyectos/conceptos | Baja | Medio | Paginación server-side, índices en DB |
| 3 | **Motor de reparto con 7 tipos de fórmulas** | Alta | Alto | Diseño modular con Strategy Pattern; pruebas exhaustivas; validación con datos reales |
| 4 | Mapeo concepto↔área inconsistente | Alta | Medio | UI clara para resolución de conflictos |
| 5 | Volumen de datos históricos grande | Media | Medio | Importación batch, progress indicators |
| 6 | **Fórmulas GROUPED y DYNAMIC** | Media | Alto | Modelado cuidadoso de dependencias entre proyectos; campos dinámicos bien definidos |

---

## 6. Preguntas respondidas ✅

| Pregunta | Respuesta |
|----------|-----------|
| ¿El presupuesto se captura por proyecto o solo por área? | **Solo por área** |
| ¿Hay umbrales específicos para alertas de desviación? | **No en MVP, fase posterior** |
| ¿Se requiere exportar reportes a PDF/Excel? | **Sí, ambos formatos** |
| ¿Cuántos usuarios concurrentes se esperan? | **1-2 concurrentes, ~10 usuarios totales** |
| ¿Hay preferencia por hosting de DB? | **Neon (confirmado), deploy en Vercel** |


---

## 7. Siguiente paso

Con los supuestos y decisiones documentados, procederé a generar la **Fase 1: Documentación Funcional y de Producto**, que incluirá:

1. Resumen Ejecutivo
2. User Personas
3. Análisis Funcional
4. Flujos Funcionales
5. User Stories con criterios de aceptación
6. Reglas de Negocio
7. Matriz de Permisos (RBAC)
8. Glosario

---

*Documento generado: 8 de enero de 2026*
