# Especificación de Formatos de Archivos

Este documento describe la estructura de los archivos Excel utilizados actualmente en el proceso de control presupuestal, con el fin de definir los requisitos de importación para el sistema.

---

## 1. Archivo del Contador (Estado de Resultados Mensual)

**Ubicación actual**: Pestañas `EneR`, `FebR`, `MarR`, etc. dentro del archivo "Resultados [Empresa] [Año].xlsx"

**Propósito**: Contiene el desglose de ingresos y costos por proyecto para un mes específico, tal como lo entrega el contador.

### Estructura de la pestaña (ejemplo: EneR)

| Fila | Contenido |
|------|-----------|
| 1-4 | Encabezados (nombre empresa, título, fecha, espacios) |
| 5 | Números de columna (1, 2, 3...) - identificadores de proyecto |
| 6 | **Nombres de proyectos** (Corporativo Polanco, The ROOM, Torre Prisma, etc.) |
| 7-26 | **Conceptos de ingresos** (Tarifa horaria, Pensiones, Etiquetas, etc.) con valores por proyecto |
| "Total de ingresos" | Fila de subtotal de ingresos |
| "Costos" | Separador de sección |
| Filas siguientes | **Conceptos de costos** (Nómina operativa, Renta, Mantenimiento, etc.) con valores por proyecto |
| "Total de costos" | Fila de subtotal de costos |
| "Utilidad Bruta" | Ingresos - Costos por proyecto |
| Filas adicionales | Cálculos de reparto (Utilidad Wepark, Reembolso cliente, etc.) |

### Características clave

- **Dimensiones**: Matriz de ~80 filas × ~27 columnas
- **Orientación**: Proyectos en columnas, conceptos en filas
- **Celda identificadora**: Fila 6, columna A = "Concepto/Proyecto"
- **Columna final**: Totales por concepto

### Conceptos de Ingresos (detectados)

| Concepto | Descripción |
|----------|-------------|
| Tarifa horaria | Ingresos por servicio de estacionamiento por hora |
| Pensiones | Ingresos por estacionamientos mensuales |
| Etiquetas | Venta de etiquetas de acceso |
| Boletos sellados | Boletos validados |
| Eventos | Ingresos por eventos especiales |
| Activación tarjeta | Activación de tarjetas de acceso |
| Reposición tarjeta | Reposición de tarjetas perdidas |
| Tarifa horaria valet parking | Servicio de valet |
| Recargos | Cargos adicionales |
| Igualas | Contratos fijos |
| Bicicleta | Servicio de bicicletas |
| Venta de equipo | Venta de equipos |
| Vales magnéticos | Vales especiales |
| Facturas canceladas | Ajustes por cancelaciones |
| Sobrantes | Ajustes por sobrantes |
| Ganancia Cambiaria | Diferencias cambiarias |
| Daño a vehículos | Recuperaciones por daños |
| Telefonía | Servicios de telefonía |
| Baños | Servicios de baños |

### Conceptos de Costos (detectados)

| Concepto | Descripción |
|----------|-------------|
| Nómina operativa | Salarios de operación |
| Nómina gerencial | Salarios gerenciales |
| Asesoría contable | Servicios contables |
| Renta fija | Renta fija de locales |
| Renta variable | Renta variable por desempeño |
| Mantenimiento plaza | Mantenimiento de instalaciones |
| Luz | Servicios de electricidad |
| Teléfono | Servicios telefónicos |
| Seguridad | Servicios de vigilancia |
| Seguros y fianzas | Pólizas de seguros |
| Boletos | Compra de boletos |
| Etiquetas | Compra de etiquetas |
| Uniformes | Uniformes de personal |
| Impresiones | Servicios de impresión |
| Equipo de estacionamiento | Equipos operativos |
| Mantenimiento equipo | Mantenimiento de equipos |
| Señalizaciones | Señalética |
| Licencias | Licencias y permisos |
| Papelería y artículos de oficina | Insumos de oficina |
| Artículos de limpieza | Productos de limpieza |
| Incidentes | Gastos por incidentes |
| Viáticos | Gastos de viaje |
| Mensajería y paquetería | Servicios de envío |
| Cuotas IMSS | Cuotas patronales IMSS |
| Cuotas INFONAVIT | Cuotas INFONAVIT |
| Cuotas AFORE | Cuotas AFORE |
| Impuesto sobre nóminas | ISN estatal |
| Compensaciones | Compensaciones a empleados |
| Varios | Gastos varios |
| No deducibles | Gastos no deducibles |

---

## 2. Archivo de Conciliación Bancaria

**Ubicación actual**: Archivo "Conciliación [Empresa] [Año].xlsx", pestaña "2025"

**Propósito**: Registro de movimientos bancarios con clasificación por proyecto y concepto.

### Estructura

| Columna | Nombre | Descripción |
|---------|--------|-------------|
| A | Fecha | Fecha del movimiento |
| B | Referencia | Tipo de transacción (TEF, SPEI, SERV, etc.) |
| C | Factura | Número de factura relacionada |
| D | Póliza | Número de póliza contable |
| E | Cheque | Número de cheque (si aplica) |
| F | Proveedor | Nombre del proveedor o beneficiario |
| G | U. Negocio | Proyecto o unidad de negocio |
| H | Cuenta | Concepto contable (Teléfono, Publicidad, etc.) |
| I | Cancelados | Monto de cancelaciones |
| J | Transito | Movimientos en tránsito |
| K-N | Montos | Subtotal, IVA, Total, Saldo |

### Características
- Movimientos ordenados cronológicamente
- Incluye comisiones bancarias e IVA por separado
- Permite identificar gastos por proyecto y concepto

---

## 3. Archivo de Presupuesto por Área

**Ubicación actual**: Archivos individuales "Presupuesto [Empresa] - [Área] [Año].xlsx"

**Áreas identificadas**: Compras, Comercial, RH, Operación, Licencias, Finanzas y Otros

### Estructura (pestaña "Presupuesto")

| Columna | Contenido |
|---------|-----------|
| A | Área (código y nombre) |
| B | Proyecto |
| C | Cuenta (categoría) |
| D | Descripción (concepto específico) |
| E | Ene P (Presupuesto enero) |
| F | Feb P |
| ... | ... |
| P | Dic P |
| Q | Anual P (Total anual) |

### Características
- Un archivo por área permite captura distribuida
- Cada fila es un concepto específico con su monto mensual
- Los valores NaN/vacíos indican que no hay presupuesto para ese mes

---

## 4. Archivo de Presupuesto Consolidado

**Ubicación actual**: "Presupuesto [Empresa] [Año].xlsx"

**Propósito**: Consolida todos los presupuestos por área en un solo archivo con múltiples pestañas.

### Pestañas principales

| Pestaña | Propósito |
|---------|-----------|
| Acumulado | Vista consolidada año a fecha |
| Mensual | Vista por mes seleccionado |
| xProyecto | Vista por proyecto |
| Mes vs Mes | Comparativo entre meses |
| Comparativo Anual | Real vs presupuesto anual |
| Consolidado | Resumen ejecutivo |
| [Área] Import | Datos importados por área (Compras, Comercial, RH, etc.) |

---

## 5. Archivo de Resultados (Consolidado)

**Ubicación actual**: "Resultados [Empresa] [Año].xlsx"

**Propósito**: Archivo maestro que integra datos del contador con vistas analíticas.

### Pestañas - Wepark (con reparto)

| Pestaña | Propósito |
|---------|-----------|
| `EneR` a `DicR` | Datos mensuales del contador (copy/paste) |
| `OtrosR` | Otros ingresos/gastos no clasificados |
| Mensual | Vista del mes seleccionado vs presupuesto |
| xProyecto | Análisis por proyecto |
| Mes vs Mes | Comparativo entre dos meses |
| **Utilidades** | **Cálculo de reparto de utilidad por proyecto** |
| Gastos Admin | Gastos administrativos |
| Fijos y Variables | Clasificación de gastos |
| Config | Configuración de rangos y conexiones |
| Menus | Listas desplegables |

### Pestañas - Sigma (sin reparto)

| Pestaña | Propósito |
|---------|-----------|
| `EneR` a `DicR` | Datos mensuales del contador |
| Acumulado | Acumulado año a fecha |
| Mensual | Vista mensual |
| xProyecto | Análisis por proyecto |
| Mes vs Mes | Comparativo |
| Gastos Admin | Gastos administrativos |
| Config | Configuración |

---

## 6. Pestaña de Utilidades (Solo Wepark)

**Propósito**: Define cómo se reparte la utilidad bruta entre Wepark y el cliente por proyecto.

### Estructura

| Columna | Contenido |
|---------|-----------|
| A | Concepto (Proyecto o categoría de reparto) |
| B | Totales anuales |
| C-E | Mes 1: Bruta, Wepark, Cliente |
| F-H | Mes 2: Bruta, Wepark, Cliente |
| ... | Continúa por mes |

### Reglas de reparto detectadas

- **Administración**: 100% para Wepark (no se reparte)
- **Proyectos específicos**: Tienen reglas configuradas (porcentajes o montos fijos)
- **Tipo de reparto**: Puede ser sobre ingresos o sobre utilidad (ingresos - costos)

---

## 7. Proyectos Identificados

### Wepark

| # | Proyecto |
|---|----------|
| 1 | Corporativo Polanco |
| 2 | The ROOM |
| 3 | Torre Prisma |
| 4 | BETEL |
| 5 | Interlomas |
| 6 | Santa Fe |
| 7 | Leibnitz |
| 8 | Cuadrata |
| 9 | Puerto Paraíso |
| 10 | Summit |
| 11 | Monte Pelvoux |
| ... | (más proyectos) |

### Sigma

| Código | Proyecto |
|--------|----------|
| (01) | C. Polanco |
| (02) | Wepark |
| (34) | Radiatas |
| (40) | Aliah |
| (03) | Lagrange |
| (42) | Palmas |
| (56) | Sonda Bodega AP |
| (04) | T. Prisma |
| (35) | Plaza Polanco |
| ... | (más proyectos) |

---

## 8. Consideraciones para Importación

### Archivo del contador (EneR, FebR, etc.)

1. **Detección de inicio de datos**: Buscar fila con "Concepto/Proyecto"
2. **Proyectos**: Leer nombres de la fila siguiente a "Concepto/Proyecto"
3. **Conceptos de ingresos**: Desde "Tarifa horaria" hasta "Total de ingresos"
4. **Conceptos de costos**: Desde "Costos" hasta "Total de costos"
5. **Ignorar**: Filas vacías, encabezados, filas de cálculo de reparto (se calculan en el sistema)

### Archivo de conciliación

1. **Encabezados**: Primera fila contiene los nombres de columnas
2. **Filtrar**: Excluir filas de comisiones e IVA (se detectan por proveedor)
3. **Campos clave**: Fecha, Proveedor, U. Negocio (proyecto), Cuenta (concepto), Monto

### Archivo de presupuesto

1. **Estructura fija**: Área, Proyecto, Cuenta, Descripción, 12 meses
2. **Valores vacíos**: Tratar como $0
3. **Consolidación**: Agrupar por Área + Concepto + Mes

---

## 9. Catálogos a Crear en el Sistema

| Catálogo | Fuente | Notas |
|----------|--------|-------|
| Empresas | Manual | Wepark, Sigma (escalable) |
| Proyectos | Extraer de EneR | Diferentes por empresa |
| Conceptos de ingreso | Extraer de EneR | Catálogo unificado |
| Conceptos de costo | Extraer de EneR | Catálogo unificado |
| Áreas | Nombres de archivos de presupuesto | Compras, RH, etc. |
| Cuentas contables | Columna "Cuenta" de conciliación | Teléfono, Publicidad, etc. |

---

*Documento generado: 8 de enero de 2026*
*Basado en análisis de archivos de muestra proporcionados por el cliente*
