# 06 - Reglas de Negocio

**Proyecto**: Arsen - Sistema de Control Presupuestal Multi-Empresa  
**Versión**: 1.0  
**Fecha**: 8 de enero de 2026

---

## 1. Reglas de Autenticación y Autorización

### RN-001: Sesiones de usuario
- Las sesiones expiran después de 24 horas de inactividad
- Un usuario puede tener solo una sesión activa a la vez
- El logout cierra la sesión en todos los dispositivos

### RN-002: Roles y permisos
| Rol | Nivel de acceso |
|-----|-----------------|
| Admin | Todo el sistema, gestión de usuarios |
| Staff | Operación completa, sin gestión de usuarios ni config sistema |
| Usuario Área | Solo presupuestos de su área asignada + lectura general |
| Solo Lectura | Visualización sin modificación |

### RN-003: Acceso por empresa
- Los usuarios Staff y Admin tienen acceso a todas las empresas
- Los usuarios de Área y Solo Lectura ven solo empresas asignadas
- El cambio de empresa requiere recarga de contexto

---

## 2. Reglas de Empresas

### RN-010: Configuración de empresa
- Cada empresa tiene un flag `manejaReparto` (true/false)
- Si `manejaReparto = false`, no se muestran opciones de reparto
- Una empresa no puede eliminarse si tiene datos asociados

### RN-011: Empresa activa
- Siempre hay una empresa "activa" en el contexto de sesión
- Los datos mostrados corresponden a la empresa activa
- El cambio de empresa actualiza todos los componentes

---

## 3. Reglas de Períodos

### RN-020: Estructura de períodos
- Un período = mes + año (ej: "Enero 2025")
- Los períodos son únicos por empresa
- Formato interno: YYYY-MM (ej: "2025-01")

### RN-021: Período cerrado
- Un período puede marcarse como "cerrado" por Admin
- Los períodos cerrados NO permiten:
  - Importar nuevos resultados
  - Modificar resultados existentes
  - Modificar presupuesto
- Los períodos cerrados SÍ permiten:
  - Consultar datos
  - Exportar reportes

### RN-022: Período actual
- Por defecto, el sistema muestra el período más reciente con datos
- Si no hay datos, muestra el mes actual

---

## 4. Reglas de Presupuestos

### RN-030: Estructura del presupuesto
- Nivel: Empresa → Área → Concepto → Mes
- NO existe presupuesto a nivel de proyecto
- Cada celda (área + concepto + mes) tiene un valor único

### RN-031: Valores de presupuesto
- Los valores deben ser numéricos ≥ 0
- Los valores vacíos se tratan como $0
- El total anual = suma de los 12 meses (calculado)

### RN-032: Captura por área
- Un Usuario de Área solo puede capturar presupuesto de su área asignada
- Staff y Admin pueden capturar cualquier área
- La captura sobrescribe valores existentes (con confirmación)

### RN-033: Importación de presupuesto
- La importación valida la estructura del archivo
- Los conceptos deben existir en el catálogo o crearse antes
- La importación sobrescribe todo el presupuesto del área (no merge)

---

## 5. Reglas de Resultados (Datos del Contador)

### RN-040: Estructura de resultados
- Nivel: Empresa → Proyecto → Concepto → Mes
- Cada celda tiene: valor real del período
- Se calcula: ingresos totales, costos totales, utilidad bruta

### RN-041: Importación de resultados
- El archivo debe tener la celda ancla "Concepto/Proyecto"
- Los proyectos son columnas, los conceptos son filas
- La fila "Total de ingresos" marca el fin de ingresos
- La fila "Costos" marca el inicio de costos
- La fila "Total de costos" marca el fin de costos

### RN-042: Proyectos no reconocidos
- Si un proyecto del archivo no existe en catálogo:
  - Se marca en la vista previa
  - Usuario puede: mapear a existente, crear nuevo, o ignorar
- Los proyectos ignorados no se importan

### RN-043: Conceptos no reconocidos
- Si un concepto del archivo no existe en catálogo:
  - Se marca en la vista previa
  - Usuario puede: mapear a existente, crear nuevo, o asignar a "Otros"
- El mapeo se puede guardar para futuras importaciones

### RN-044: Sobrescritura de resultados
- Si ya existen resultados para el período:
  - El sistema advierte al usuario
  - Requiere confirmación explícita
  - La importación sobrescribe completamente (no merge)

### RN-045: Cálculos automáticos post-importación
- Después de guardar resultados:
  - Se calculan totales por proyecto
  - Se calcula reparto (si la empresa lo tiene activo)
  - Se actualizan dashboards

---

## 6. Reglas de Reparto (Utilidad Dividida)

### RN-050: Activación de reparto
- A nivel empresa: flag `manejaReparto`
- A nivel proyecto: flag `aplicaReparto`
- Solo se calcula reparto si ambos flags son true

### RN-051: Tipos de fórmula soportados

#### FIXED_ONLY
```
honorario_empresa = fixed_amount
```

#### PERCENT_SIMPLE
```
honorario_empresa = utilidad_bruta × (percent_1 / 100)
```

#### FIXED_PLUS_PERCENT
```
honorario_empresa = fixed_amount + (utilidad_bruta × (percent_1 / 100))
```

#### TIERED (escalonado)
```
if utilidad_bruta <= threshold_1:
    honorario_empresa = utilidad_bruta × (percent_1 / 100)
else:
    honorario_empresa = (threshold_1 × (percent_1 / 100)) + 
                        ((utilidad_bruta - threshold_1) × (percent_2 / 100))
```

#### SPECIAL_FORMULA (Monte Pelvoux)
```
honorario_empresa = fixed_amount + ((utilidad_bruta - fixed_amount) × (percent_1 / 100))
```
*Nota: Si utilidad_bruta < fixed_amount, honorario = fixed_amount*

#### GROUPED (proyectos agrupados)
```
utilidad_combinada = SUM(utilidad_bruta de proyectos en grupo)
aplicar fórmula del proyecto principal sobre utilidad_combinada
```

#### DYNAMIC (variable por operación)
```
honorario_empresa = fixed_amount + (variable_count × increment_per_unit)
```
*variable_count se ingresa manualmente o viene de datos externos*

### RN-052: Cálculo de utilidad cliente
```
utilidad_cliente = utilidad_bruta - honorario_empresa
```

### RN-053: Reparto mensual
- El reparto se calcula por cada mes de forma independiente
- El acumulado anual = suma de repartos mensuales
- No hay ajustes automáticos de fin de año

### RN-054: Proyectos sin reparto
- Proyectos con `aplicaReparto = false`: honorario = 0, todo es utilidad de empresa
- Gastos de Administración: nunca tienen reparto

---

## 7. Reglas de Gastos de Administración

### RN-060: Definición
- Son gastos que no están asignados a ningún proyecto
- Representan costos generales de operación de la empresa
- Ejemplos: renta oficina, nómina administrativa, legales

### RN-061: Registro
- Se identifican en el archivo del contador como proyecto vacío o "Administración"
- Se registran con el mismo nivel de detalle que gastos de proyectos
- Pueden venir de la conciliación bancaria

### RN-062: Tratamiento financiero
- NO participan en el cálculo de reparto
- Son 100% costo de la empresa
- Se incluyen en el cálculo de utilidad total de la empresa

### RN-063: Reportes
- Se muestran en una sección separada de los proyectos
- Tienen su propio reporte de detalle
- Se incluyen en el resumen mensual de la empresa

---

## 8. Reglas de Comparativo

### RN-070: Cálculo de desviación
```
desviacion_absoluta = valor_real - valor_presupuesto
desviacion_porcentual = ((valor_real - valor_presupuesto) / valor_presupuesto) × 100
```

### RN-071: Niveles de comparación
- Comparativo se hace a nivel de concepto
- Presupuesto consolidado = suma de todos los proyectos por concepto
- Real consolidado = suma de todos los proyectos por concepto

### RN-072: Indicadores visuales (fase posterior)
- Por ahora: mostrar diferencia numérica
- Fase 2: colores basados en umbrales configurables

---

## 9. Reglas de Conciliaciones

### RN-080: Estructura de conciliación
- Campos obligatorios: fecha, monto
- Campos opcionales: referencia, factura, póliza, cheque, proveedor, proyecto, cuenta

### RN-081: Proyecto en conciliación
- Si proyecto está vacío = Gasto de Administración
- El proyecto debe existir en el catálogo

### RN-082: Importación histórica
- Es una carga única inicial
- Puede ejecutarse múltiples veces (acumula)
- Detecta duplicados por: fecha + monto + proveedor

---

## 10. Reglas de Exportación

### RN-090: Formatos soportados
- Excel (.xlsx): tablas con datos completos
- PDF: formato presentación con encabezado y pie

### RN-091: Contenido de exportación
- Incluye los filtros aplicados en la vista
- Incluye fecha de generación
- Incluye nombre de empresa y período

### RN-092: Acceso a exportación
- Todos los roles pueden exportar
- Solo pueden exportar datos que pueden ver

---

## 11. Reglas de Catálogos

### RN-100: Empresas
- Nombre único
- No se puede eliminar si tiene datos
- Se puede desactivar (ocultará de selectores)

### RN-101: Proyectos
- Nombre único por empresa
- Código opcional (para Sigma que usa códigos como "(01)")
- No se puede eliminar si tiene resultados
- Se puede desactivar

### RN-102: Conceptos
- Nombre único
- Tipo: INGRESO o COSTO
- Área relacionada (para organizar quién captura presupuesto)
- No se puede eliminar si está en uso

### RN-103: Áreas
- Nombre único por empresa
- Se usa para organizar presupuestos
- Cada Usuario de Área tiene áreas asignadas

---

## 12. Reglas de Validación de Datos

### RN-110: Valores numéricos
- Deben ser números válidos (enteros o decimales)
- No se permiten valores negativos en ingresos ni costos
- Precisión: 2 decimales

### RN-111: Fechas
- Formato interno: ISO 8601 (YYYY-MM-DD)
- Zona horaria: UTC en BD, local en UI
- No se permiten fechas futuras para resultados

### RN-112: Textos
- Nombres: máximo 100 caracteres
- Descripciones: máximo 500 caracteres
- Sin caracteres especiales que rompan exportación

---

## 13. Reglas de Integridad

### RN-120: Eliminación en cascada
- NO se permite eliminación en cascada
- Entidades con dependencias no pueden eliminarse
- Se ofrece desactivación como alternativa

### RN-121: Soft delete
- Los registros contables nunca se eliminan físicamente
- Se marcan con `deletedAt` timestamp
- Los filtros por defecto excluyen registros eliminados

### RN-122: Auditoría básica
- Todos los registros tienen: createdAt, updatedAt, createdBy
- No se mantiene historial de cambios (fase posterior)

---

*Documento generado: 8 de enero de 2026*
