# 05 - User Stories

**Proyecto**: Arsen - Sistema de Control Presupuestal Multi-Empresa  
**Versión**: 1.0  
**Fecha**: 8 de enero de 2026

---

## Formato

Cada historia sigue el formato:
- **Como** [rol] **quiero** [acción] **para** [beneficio]
- **Criterios de aceptación** en formato Given/When/Then

---

## Épica 1: Autenticación y Usuarios

### US-001: Login de usuario
**Como** usuario del sistema  
**Quiero** iniciar sesión con mi email y contraseña  
**Para** acceder a las funcionalidades según mi rol

**Criterios de aceptación:**
```gherkin
Given que estoy en la página de login
When ingreso email y contraseña válidos
Then soy redirigido al dashboard
And veo solo las opciones permitidas para mi rol

Given que estoy en la página de login
When ingreso credenciales inválidas
Then veo un mensaje de error "Credenciales inválidas"
And permanezco en la página de login
```

**Prioridad**: Alta  
**Estimación**: 3 puntos

---

### US-002: Gestión de usuarios (Admin)
**Como** administrador  
**Quiero** crear, editar y desactivar usuarios  
**Para** controlar quién tiene acceso al sistema

**Criterios de aceptación:**
```gherkin
Given que soy Admin y estoy en la lista de usuarios
When hago clic en "Nuevo Usuario"
Then veo un formulario con: nombre, email, contraseña, rol, empresas asignadas

Given que completo el formulario con datos válidos
When hago clic en "Guardar"
Then el usuario es creado

Given que selecciono un usuario existente
When cambio su rol o empresas asignadas
Then los cambios se aplican inmediatamente
And el usuario ve los cambios en su próximo login
```

**Prioridad**: Alta  
**Estimación**: 5 puntos

---

## Épica 2: Gestión de Empresas y Catálogos

### US-003: Selector de empresa
**Como** usuario con acceso a múltiples empresas  
**Quiero** cambiar fácilmente entre empresas  
**Para** ver datos de la empresa que me interesa

**Criterios de aceptación:**
```gherkin
Given que tengo acceso a Wepark y Sigma
When hago clic en el selector de empresa
Then veo ambas empresas en la lista

Given que selecciono "Sigma"
When la página se actualiza
Then todos los datos mostrados corresponden a Sigma
And el selector muestra "Sigma" como empresa activa
```

**Prioridad**: Alta  
**Estimación**: 2 puntos

---

### US-004: Gestión de proyectos
**Como** Staff  
**Quiero** crear y editar proyectos  
**Para** mantener actualizado el catálogo de proyectos

**Criterios de aceptación:**
```gherkin
Given que estoy en la lista de proyectos
When creo un nuevo proyecto con nombre y código
Then el proyecto aparece en la lista
And está disponible para importación de resultados

Given que un proyecto tiene datos asociados
When intento eliminarlo
Then el sistema muestra advertencia
And ofrece "desactivar" en lugar de eliminar
```

**Prioridad**: Media  
**Estimación**: 3 puntos

---

### US-005: Gestión de conceptos
**Como** Staff  
**Quiero** gestionar el catálogo de conceptos (ingresos y costos)  
**Para** mapear correctamente los datos del contador

**Criterios de aceptación:**
```gherkin
Given que estoy en el catálogo de conceptos
When creo un concepto con nombre y tipo (ingreso/costo)
Then el concepto está disponible para importación

Given que un concepto del contador no existe
When lo mapeo a un concepto existente
Then el mapeo se guarda para futuras importaciones
```

**Prioridad**: Media  
**Estimación**: 3 puntos

---

## Épica 3: Presupuestos

### US-006: Captura de presupuesto
**Como** Usuario de Área  
**Quiero** capturar el presupuesto de mi área  
**Para** definir las metas anuales de gasto

**Criterios de aceptación:**
```gherkin
Given que soy responsable del área "Compras"
When accedo a captura de presupuesto
Then solo veo conceptos de mi área
And puedo ingresar valores para cada mes

Given que capturo valores para todos los meses
When hago clic en "Guardar"
Then el presupuesto se guarda
And veo un mensaje de confirmación

Given que ya existe presupuesto para el período
When intento capturar de nuevo
Then veo los valores existentes
And puedo editarlos
```

**Prioridad**: Alta  
**Estimación**: 5 puntos

---

### US-007: Importación de presupuesto
**Como** Staff  
**Quiero** importar presupuestos desde Excel  
**Para** cargar datos más rápido

**Criterios de aceptación:**
```gherkin
Given que tengo un archivo Excel con formato correcto
When lo subo al sistema
Then veo una vista previa de los datos

Given que la vista previa es correcta
When confirmo la importación
Then los datos se guardan
And sobrescriben valores anteriores (con confirmación)
```

**Prioridad**: Media  
**Estimación**: 5 puntos

---

## Épica 4: Resultados (Datos del Contador)

### US-008: Importación de resultados mensuales
**Como** Staff  
**Quiero** importar el archivo del contador  
**Para** registrar los resultados reales del mes

**Criterios de aceptación:**
```gherkin
Given que selecciono empresa Wepark y mes Enero 2025
When subo el archivo del contador
Then el sistema detecta la estructura automáticamente
And muestra vista previa con proyectos y conceptos

Given que hay proyectos no reconocidos
When el sistema los marca en amarillo
Then puedo: mapear a existente, crear nuevo, o ignorar

Given que hay conceptos no reconocidos
When los resuelvo todos
Then puedo continuar con la importación

Given que confirmo la importación
When se guardan los datos
Then el sistema calcula el reparto automáticamente (si aplica)
And actualiza el dashboard
```

**Prioridad**: Crítica  
**Estimación**: 13 puntos

---

### US-009: Consulta de resultados
**Como** usuario  
**Quiero** consultar los resultados de un mes  
**Para** ver el desempeño de la empresa

**Criterios de aceptación:**
```gherkin
Given que hay resultados cargados para Enero 2025
When selecciono ese período
Then veo tabla con: proyectos, ingresos, costos, utilidad

Given que hago clic en un proyecto
When se expande el detalle
Then veo los conceptos que lo componen
```

**Prioridad**: Alta  
**Estimación**: 5 puntos

---

## Épica 5: Comparativo

### US-010: Comparativo real vs presupuesto
**Como** usuario  
**Quiero** ver el comparativo real vs presupuesto  
**Para** identificar desviaciones

**Criterios de aceptación:**
```gherkin
Given que hay presupuesto y resultados para el mismo período
When accedo al comparativo
Then veo tabla con: concepto, presupuesto, real, diferencia, %

Given que una diferencia es significativa
When el sistema la detecta
Then la marca con color (rojo si negativa, verde si positiva)

Given que hago clic en un concepto
When se expande
Then veo el detalle mensual de ese concepto
```

**Prioridad**: Alta  
**Estimación**: 5 puntos

---

## Épica 6: Reparto

### US-011: Configuración de reparto por proyecto
**Como** Admin  
**Quiero** configurar las reglas de reparto de cada proyecto  
**Para** calcular correctamente la utilidad empresa/cliente

**Criterios de aceptación:**
```gherkin
Given que la empresa tiene reparto activado
When accedo a configuración de un proyecto
Then veo lista de tipos de fórmula disponibles

Given que selecciono FIXED_PLUS_PERCENT
When ingreso $21,676 fijo y 6% adicional
Then el sistema valida los valores
And guarda la configuración

Given que selecciono TIERED
When ingreso 30% primer millón y 25% resto
Then el sistema entiende la fórmula escalonada

Given que selecciono GROUPED
When asocio proyecto "The Room" con "Corporativo Polanco"
Then el sistema suma utilidades antes de calcular reparto
```

**Prioridad**: Crítica  
**Estimación**: 13 puntos

---

### US-012: Visualización de reparto calculado
**Como** usuario  
**Quiero** ver el resultado del cálculo de reparto  
**Para** verificar que es correcto

**Criterios de aceptación:**
```gherkin
Given que hay resultados con reparto calculado
When accedo al reporte de reparto
Then veo por proyecto: utilidad bruta, honorario empresa, utilidad cliente

Given que hago clic en un proyecto
When veo el detalle
Then muestra la fórmula aplicada y el cálculo paso a paso
```

**Prioridad**: Alta  
**Estimación**: 5 puntos

---

## Épica 7: Conciliaciones

### US-013: Importación de conciliaciones históricas
**Como** Staff  
**Quiero** importar el archivo de conciliaciones existente  
**Para** tener el histórico en el sistema

**Criterios de aceptación:**
```gherkin
Given que tengo archivo de conciliación en formato conocido
When lo subo al sistema
Then detecta columnas: fecha, proveedor, proyecto, cuenta, montos

Given que hay proyectos/conceptos no reconocidos
When los resuelvo
Then la importación se completa
And los movimientos quedan disponibles para consulta
```

**Prioridad**: Media  
**Estimación**: 8 puntos

---

### US-014: Captura manual de conciliaciones
**Como** Staff  
**Quiero** registrar conciliaciones manualmente  
**Para** mantener el histórico actualizado

**Criterios de aceptación:**
```gherkin
Given que estoy en el módulo de conciliaciones
When lleno el formulario con: fecha, proveedor, proyecto, cuenta, monto
Then el movimiento se registra
And aparece en la lista de conciliaciones
```

**Prioridad**: Baja  
**Estimación**: 3 puntos

---

## Épica 8: Reportes y Exportación

### US-015: Exportación a Excel
**Como** usuario  
**Quiero** exportar cualquier reporte a Excel  
**Para** trabajar con los datos externamente

**Criterios de aceptación:**
```gherkin
Given que estoy viendo cualquier reporte
When hago clic en "Exportar Excel"
Then se descarga un archivo .xlsx
And contiene los mismos datos y filtros aplicados
```

**Prioridad**: Alta  
**Estimación**: 5 puntos

---

### US-016: Exportación a PDF
**Como** usuario  
**Quiero** exportar reportes a PDF  
**Para** presentaciones y archivos

**Criterios de aceptación:**
```gherkin
Given que estoy viendo un reporte
When hago clic en "Exportar PDF"
Then se genera un PDF con formato profesional
And incluye encabezado con empresa, período y fecha de generación
```

**Prioridad**: Alta  
**Estimación**: 5 puntos

---

## Épica 9: Gastos de Administración

### US-017: Vista de gastos de administración
**Como** usuario  
**Quiero** ver el detalle de gastos generales de la empresa  
**Para** entender los costos no asignados a proyectos

**Criterios de aceptación:**
```gherkin
Given que hay gastos sin proyecto asignado
When accedo a "Gastos Administración"
Then veo tabla con: concepto, monto, proveedor (si aplica)

Given que exporto este reporte
When se genera el archivo
Then incluye el detalle completo de gastos administrativos
```

**Prioridad**: Media  
**Estimación**: 3 puntos

---

## Épica 10: Dashboard

### US-018: Dashboard ejecutivo
**Como** usuario  
**Quiero** ver un dashboard con KPIs principales  
**Para** entender rápidamente el estado de la empresa

**Criterios de aceptación:**
```gherkin
Given que hay datos cargados para el período actual
When accedo al dashboard
Then veo cards con: Ingresos totales, Costos totales, Utilidad, Desviación vs presupuesto

Given que hago clic en una card
When se expande
Then veo detalle por proyecto o por concepto

Given que hay tendencia histórica
When veo la gráfica
Then muestra evolución de los últimos 6-12 meses
```

**Prioridad**: Alta  
**Estimación**: 8 puntos

---

## Resumen de Prioridades

| Prioridad | User Stories |
|-----------|--------------|
| Crítica | US-008, US-011 |
| Alta | US-001, US-002, US-003, US-006, US-009, US-010, US-012, US-015, US-016, US-018 |
| Media | US-004, US-005, US-007, US-013, US-017 |
| Baja | US-014 |

---

## Backlog Ordenado (MVP)

1. US-001: Login de usuario
2. US-002: Gestión de usuarios
3. US-003: Selector de empresa
4. US-004: Gestión de proyectos
5. US-005: Gestión de conceptos
6. US-006: Captura de presupuesto
7. US-008: Importación de resultados mensuales ⭐
8. US-009: Consulta de resultados
9. US-010: Comparativo real vs presupuesto
10. US-011: Configuración de reparto ⭐
11. US-012: Visualización de reparto
12. US-017: Vista gastos administración
13. US-018: Dashboard ejecutivo
14. US-015: Exportación a Excel
15. US-016: Exportación a PDF

---

*Documento generado: 8 de enero de 2026*
