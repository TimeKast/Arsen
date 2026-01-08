# 03 - Análisis Funcional

**Proyecto**: Arsen - Sistema de Control Presupuestal Multi-Empresa  
**Versión**: 1.0  
**Fecha**: 8 de enero de 2026

---

## 1. Módulos del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         ARSEN                                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │Dashboard │  │Presupues-│  │Resultados│  │ Reportes │        │
│  │          │  │   tos    │  │          │  │          │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │Concilia- │  │ Reparto  │  │Catálogos │  │  Admin   │        │
│  │ ciones   │  │          │  │          │  │          │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Descripción de Módulos

### 2.1 Dashboard

**Propósito**: Proporcionar visibilidad inmediata del desempeño financiero.

| Vista | Descripción | Usuarios |
|-------|-------------|----------|
| Dashboard Empresa | KPIs consolidados de la empresa seleccionada | Todos |
| Dashboard Proyectos | Comparativo de proyectos dentro de una empresa | Todos |
| Dashboard Administración | Gastos generales de empresa (no asignados a proyecto) | Todos |

**Componentes del Dashboard Empresa**:
- Selector de empresa y período (mes/año)
- Cards de resumen: Ingresos, Costos, Utilidad, Desviación
- Gráfica de tendencia (últimos 6-12 meses)
- Tabla de proyectos con indicadores
- Acceso rápido a drill-down

**Componentes del Dashboard Proyectos**:
- Lista de proyectos con: Ingresos, Costos, Utilidad Bruta, Utilidad Empresa (si aplica reparto)
- Ordenamiento por desempeño
- Filtro por estado (activo/inactivo)
- Click para ver detalle

---

### 2.2 Presupuestos

**Propósito**: Gestionar el presupuesto anual por área y concepto.

| Funcionalidad | Descripción |
|---------------|-------------|
| Captura manual | Formulario por empresa/área/año con grid de conceptos × meses |
| Importación | Subir archivo Excel con estructura conocida |
| Edición | Modificar presupuesto existente |
| Consulta | Ver presupuesto por empresa/área/año |

**Estructura del presupuesto**:
- Nivel: Empresa → Área → Concepto → Mes
- NO hay presupuesto por proyecto (confirmado)
- Las áreas definen quién captura qué

**Áreas identificadas**:
- Compras
- Comercial
- RH (Recursos Humanos)
- Operación
- Licencias
- Finanzas y Otros

---

### 2.3 Resultados (Datos del Contador)

**Propósito**: Importar y gestionar los resultados mensuales reales.

| Funcionalidad | Descripción |
|---------------|-------------|
| Importación | Subir archivo del contador (matriz proyecto × concepto) |
| Vista previa | Validar datos antes de confirmar |
| Resolución | Mapear conceptos/proyectos nuevos |
| Edición | Ajustar valores después de importar |
| Consulta | Ver resultados por empresa/mes/proyecto |

**Flujo de importación**:
1. Seleccionar empresa y período
2. Subir archivo Excel (pestaña EneR, FebR, etc.)
3. Sistema detecta estructura automáticamente
4. Vista previa con marcadores de problemas
5. Resolver conceptos/proyectos no reconocidos
6. Confirmar importación
7. Cálculo automático de reparto (si aplica)

**Estructura detectada del archivo**:
- Fila ancla: "Concepto/Proyecto"
- Columnas: Proyectos
- Filas: Conceptos (ingresos arriba, costos abajo)
- Totales calculados: "Total de ingresos", "Total de costos", "Utilidad Bruta"

---

### 2.4 Comparativo

**Propósito**: Visualizar desviaciones entre presupuesto y real.

| Vista | Descripción |
|-------|-------------|
| Por concepto | Comparar real vs presupuesto por concepto |
| Por mes | Evolución mensual con tendencia |
| Por proyecto | Utilidad por proyecto vs histórico |

**Indicadores visuales**:
- 🟢 Dentro de presupuesto
- 🟡 Desviación menor (pendiente: definir umbral)
- 🔴 Desviación mayor (pendiente: definir umbral)

**Cálculo de desviación**:
```
Desviación absoluta = Real - Presupuesto
Desviación % = ((Real - Presupuesto) / Presupuesto) × 100
```

---

### 2.5 Conciliaciones

**Propósito**: Mantener historial de movimientos bancarios clasificados.

| Funcionalidad | Descripción |
|---------------|-------------|
| Importación histórica | Carga masiva inicial de archivos existentes |
| Captura manual | Registro individual de nuevas conciliaciones |
| Consulta | Búsqueda y filtrado de movimientos |

**Campos de una conciliación**:
- Fecha
- Referencia (TEF, SPEI, etc.)
- Factura
- Póliza
- Cheque
- Proveedor
- Proyecto (o "Administración")
- Concepto/Cuenta
- Subtotal, IVA, Total

---

### 2.6 Reparto (Configuración)

**Propósito**: Definir y aplicar reglas de reparto de utilidad por proyecto.

| Nivel | Configuración |
|-------|---------------|
| Empresa | ¿Maneja reparto? (Sí/No) |
| Proyecto | Tipo de fórmula + parámetros |

**Tipos de fórmula soportados**:

| Tipo | Parámetros | Ejemplo |
|------|------------|---------|
| FIXED_ONLY | fixed_amount | $12,000/mes |
| PERCENT_SIMPLE | percent_1 | 15% utilidad |
| FIXED_PLUS_PERCENT | fixed_amount, percent_1 | $21,676 + 6% |
| TIERED | percent_1, threshold_1, percent_2 | 30% primer millón + 25% resto |
| SPECIAL_FORMULA | fixed_amount, percent_1 | (Utilidad - Fijo) × 30% + Fijo |
| GROUPED | grouped_with | Suma proyectos X + Y |
| DYNAMIC | fixed_amount, dynamic_field, dynamic_increment | +$2,750 por valet parking |

**Resultados del cálculo**:
- Utilidad Bruta (Ingresos - Costos)
- Honorario Empresa (según fórmula)
- Utilidad Cliente (Bruta - Honorario)

---

### 2.7 Reportes y Exportación

**Propósito**: Generar y exportar información para análisis y presentaciones.

| Reporte | Contenido | Formatos |
|---------|-----------|----------|
| Resumen mensual | KPIs por empresa/mes | Excel, PDF |
| Comparativo | Real vs Presupuesto | Excel, PDF |
| Por proyecto | Detalle de cada proyecto | Excel, PDF |
| Reparto | Desglose de utilidad empresa/cliente | Excel, PDF |
| Gastos administración | Detalle de gastos generales | Excel, PDF |

---

### 2.8 Catálogos

**Propósito**: Gestionar datos maestros del sistema.

| Catálogo | Campos principales |
|----------|-------------------|
| Empresas | Nombre, ¿maneja reparto?, estado |
| Proyectos | Empresa, nombre, código, ¿aplica reparto?, configuración reparto |
| Áreas | Nombre, empresa |
| Conceptos | Nombre, tipo (ingreso/costo), área relacionada |

---

### 2.9 Administración

**Propósito**: Configuración del sistema y gestión de usuarios.

| Funcionalidad | Descripción |
|---------------|-------------|
| Usuarios | CRUD de usuarios, asignación de rol y empresas |
| Períodos | Gestión de meses/años, cerrar período |
| Configuración | Parámetros generales del sistema |

---

## 3. Modelo de Datos Conceptual

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Empresa   │───────│  Proyecto   │───────│   Regla     │
│             │ 1   n │             │ 1   1 │   Reparto   │
└─────────────┘       └─────────────┘       └─────────────┘
      │                     │
      │ 1                   │ n
      │ n                   │
┌─────────────┐       ┌─────────────┐
│    Área     │       │  Resultado  │
│             │       │  (mensual)  │
└─────────────┘       └─────────────┘
      │                     │
      │ 1                   │ 1
      │ n                   │ n
┌─────────────┐       ┌─────────────┐
│ Presupuesto │       │  Concepto   │
│  (mensual)  │───────│             │
└─────────────┘   n 1 └─────────────┘
                            │
                            │ n
                            │ 1
                      ┌─────────────┐
                      │Conciliación │
                      └─────────────┘
```

---

## 4. Gastos de Administración

**Concepto especial**: Los gastos que no están asignados a ningún proyecto se consideran "Gastos de Administración" o "Gastos Generales de Empresa".

**Características**:
- NO tienen proyecto asignado
- NO participan en reparto (100% empresa)
- Se muestran en una sección separada en reportes
- Se registran con detalle completo (concepto, proveedor, etc.)

**Ejemplos típicos**:
- Renta de oficina corporativa
- Nómina administrativa
- Servicios corporativos (contabilidad, legal)
- Publicidad institucional

---

## 5. Consultas Principales

Las consultas se hacen principalmente por:

| Dimensión | Uso |
|-----------|-----|
| **Mes** | Vista mensual de resultados |
| **Proyecto** | Análisis de rentabilidad por proyecto |
| **Concepto** | Comparativo real vs presupuesto |

**NO** por área (las áreas solo determinan quién sube presupuestos).

---

## 6. Integraciones

### Entrada de datos
- Archivos Excel del contador (manual)
- Archivos Excel de presupuesto (manual)
- Archivos Excel de conciliación (manual)

### Salida de datos
- Exportación a Excel
- Exportación a PDF

### Integraciones futuras (no MVP)
- Conexión directa con software contable
- Envío automático de reportes por email

---

*Documento generado: 8 de enero de 2026*
