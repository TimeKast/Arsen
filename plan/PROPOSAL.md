# Documento de Propuesta: Sistema de Control Presupuestal Multi-Empresa

**Versión**: 1.1  
**Fecha**: 8 de enero de 2026  
**Estado**: Actualizado con análisis de archivos de muestra

---

## 1. Resumen Ejecutivo

### Qué problema se va a resolver
Actualmente, el cliente gestiona el control presupuestal y de resultados de múltiples empresas (actualmente **Wepark** y **Sigma**, con posibilidad de crecer) mediante hojas de cálculo dispersas. Cada mes, el equipo invierte horas cruzando información entre archivos de presupuesto, datos del contador y conciliaciones. Cuando hay proyectos con reglas especiales de reparto de ingresos o utilidad (como en Wepark), el proceso se vuelve aún más lento y propenso a errores.

### Qué resultado se busca
Una única plataforma donde el cliente pueda:
- Visualizar en minutos el desempeño real vs presupuestado de cada empresa **y de cada proyecto**
- Calcular automáticamente la utilidad considerando reglas de reparto por proyecto (configurable por empresa)
- Eliminar el trabajo manual de consolidación y aplicación de fórmulas
- Analizar resultados por múltiples dimensiones: empresa, proyecto, área, mes, concepto

### Por qué esta solución tiene sentido para el negocio
- **Ahorro de tiempo**: el cierre mensual pasaría de horas a minutos
- **Reducción de errores**: desaparecen las fórmulas manuales y el cruce de archivos
- **Mejor visibilidad**: una sola fuente de verdad para todas las empresas y proyectos
- **Decisiones más rápidas**: claridad inmediata sobre desviaciones y rentabilidad
- **Escalabilidad**: preparado para agregar más empresas en el futuro

---

## 2. Objetivos del Cliente (Interpretados)

| # | Objetivo |
|---|----------|
| 1 | Centralizar el control de presupuesto vs resultados reales para varias empresas en un solo lugar |
| 2 | Cargar presupuestos anuales desglosados por empresa, área, mes y concepto |
| 3 | Importar resultados mensuales desde archivos Excel del contador (formato matriz proyecto × concepto) |
| 4 | Mantener un historial de conciliaciones (importadas y capturadas internamente) |
| 5 | Generar automáticamente el comparativo mensual presupuesto vs real |
| 6 | **Configurar por empresa** si aplica reparto de utilidad/ingresos, y configurar las reglas por proyecto |
| 7 | Identificar desviaciones y su impacto por empresa, **proyecto**, área y concepto |
| 8 | Comparar desempeño entre empresas y **entre proyectos** de forma sencilla |

---

## 3. Propuesta de Solución

### Qué acciones principales permitirá

1. **Gestión de presupuestos**
   - Capturar o importar el presupuesto anual por empresa, área, mes y concepto
   - Estructura actual: un archivo por área (Compras, RH, Operación, etc.) o un consolidado
   - Ajustar presupuestos cuando sea necesario

2. **Carga de resultados mensuales (datos del contador)**
   - Subir pestaña mensual (EneR, FebR, etc.) con la matriz de proyecto × concepto
   - El sistema reconoce automáticamente:
     - Lista de proyectos (columnas)
     - Conceptos de ingresos y costos (filas)
     - Totales y utilidad bruta
   - Vista previa antes de confirmar para validar el mapeo

3. **Conciliación**
   - Importar conciliaciones históricas (archivo con fecha, proveedor, proyecto, cuenta, monto)
   - Capturar y gestionar conciliaciones futuras directamente en el sistema

4. **Visualización de desempeño**
   - Ver el comparativo real vs presupuesto por empresa, área, mes y concepto
   - **Vista por proyecto**: análisis detallado del desempeño de cada proyecto
   - Identificar desviaciones con indicadores visuales claros
   - Drill-down: Empresa → Proyecto → Concepto

5. **Cálculo de reparto por proyecto (configurable por empresa)**
   - A nivel empresa: indicar si maneja reparto (sí/no)
   - Si maneja reparto, a nivel proyecto:
     - Indicar si el proyecto aplica reparto (sí/no)
     - Tipo de reparto: sobre **ingresos** o sobre **utilidad** (ingresos - costos)
     - Porcentajes o fórmulas de distribución
   - El sistema calcula automáticamente la utilidad neta de la empresa vs cliente

### Qué procesos simplificará o automatizará
- Consolidación mensual de datos de múltiples fuentes
- Aplicación de fórmulas de reparto por proyecto
- Generación de reportes comparativos
- Detección de desviaciones significativas
- Cálculo de totales por proyecto y por concepto

### Qué decisiones ayudará a tomar
- ¿Qué áreas o **proyectos** están excediendo el presupuesto?
- ¿Cuál es la utilidad real por empresa y **por proyecto**?
- ¿Qué proyectos están afectando negativamente el resultado?
- ¿Cómo se compara el desempeño entre empresas y entre proyectos?
- ¿Cuánto corresponde a la empresa vs al cliente en proyectos con reparto?

### Qué cosas hará "por defecto" para ahorrar tiempo
- Reconocer automáticamente la estructura del archivo del contador (matriz proyecto × concepto)
- Aplicar las reglas de reparto configuradas sin intervención manual
- Destacar desviaciones que superen umbrales predefinidos
- Mantener el catálogo de conceptos sincronizado entre presupuesto y resultados
- Mostrar por defecto el mes más reciente con datos

---

## 4. Usuarios y Roles (A Alto Nivel)

| Rol | Qué puede hacer |
|-----|-----------------|
| **Responsable de área** | Consultar y capturar presupuestos de su área; revisar desempeño de su área |
| **Finanzas / Contabilidad** | Cargar resultados mensuales; gestionar conciliaciones; revisar todas las empresas |
| **Dirección** | Consultar reportes consolidados; analizar desviaciones y utilidad por empresa/proyecto |
| **Responsable de proyecto** | Consultar el desempeño y rentabilidad de sus proyectos específicos |

> **Confirmado**: Ambas empresas (Wepark y Sigma) manejan múltiples proyectos y el análisis por proyecto es importante para ambas.

---

## 5. Flujos Clave Propuestos

### Flujo principal: Cierre mensual

```
1. Usuario Finanzas selecciona la empresa y el período (mes/año)
2. Carga el archivo del contador (pestaña EneR, FebR, etc.)
3. El sistema detecta automáticamente:
   - Lista de proyectos en columnas
   - Conceptos de ingresos y costos en filas
   - Totales y utilidad bruta
4. Usuario valida la vista previa y confirma
5. El sistema guarda los resultados y calcula automáticamente:
   - Comparativo real vs presupuesto por proyecto y concepto
   - Reparto por proyecto (si la empresa lo tiene configurado)
   - Desviaciones
6. Usuario revisa el tablero de desempeño mensual
7. ✅ Proceso completado: el mes queda cerrado y disponible para consulta
```

### Flujos secundarios

**Carga de presupuesto anual**
1. Usuario selecciona empresa y año
2. Importa archivos de presupuesto por área o captura directamente
3. El sistema consolida por empresa/área/mes/concepto
4. Confirma y guarda
5. El presupuesto queda disponible para comparación

**Gestión de conciliaciones**
1. Usuario importa archivo de conciliaciones históricas (una sola vez para backlog)
2. El sistema mapea: fecha, proveedor, proyecto, cuenta, monto
3. A partir de cierto punto, captura conciliaciones directamente en el sistema
4. El historial queda disponible para consulta y reportes

**Configuración de reglas de reparto**
1. Administrador accede a configuración de la empresa
2. Indica si la empresa maneja reparto de proyectos (sí/no)
3. Si sí, por cada proyecto configura:
   - ¿Aplica reparto? (sí/no)
   - Tipo: sobre ingresos o sobre utilidad
   - Porcentajes (% empresa, % cliente)
4. Las reglas se aplican automáticamente al calcular resultados

### ¿Qué se considera "proceso completado"?
- **Cierre mensual**: cuando los resultados del mes están cargados, comparados contra presupuesto y los cálculos de reparto están aplicados
- **Carga de presupuesto**: cuando el presupuesto anual completo está guardado y validado
- **Conciliación**: cuando la partida está registrada y visible en el historial

---

## 6. Alcance Inicial (Primera Versión)

### ✅ Incluye

| Módulo | Funcionalidades |
|--------|-----------------|
| **Multi-empresa** | Separación por empresa en todas las vistas (Wepark, Sigma, + futuras); selector de empresa |
| **Catálogo base** | Gestión de áreas, conceptos y **proyectos por empresa** |
| **Presupuestos** | Captura e importación de presupuesto anual por empresa/área/mes/concepto |
| **Resultados mensuales** | Importación del archivo del contador (formato matriz proyecto × concepto) |
| **Comparativo** | Vista mensual de real vs presupuesto con indicadores de desviación |
| **Vista por proyecto** | Análisis de desempeño, ingresos, costos y utilidad por proyecto |
| **Conciliaciones** | Importación de históricos + captura manual de nuevas conciliaciones |
| **Reparto configurable** | Configuración por empresa y por proyecto; cálculo automático |
| **Tablero de desempeño** | Vista consolidada por empresa con drill-down a proyecto y concepto |

### ❌ No incluye (por ahora)

| Funcionalidad | Razón para postergar |
|---------------|---------------------|
| Flujos de aprobación de presupuestos | Complejidad adicional; primero validar el modelo base |
| Integración directa con sistemas contables | El cliente proporcionará archivos Excel |
| Proyecciones o forecasting | Fuera del alcance inicial; posible fase 2 |
| Alertas automáticas por correo | Puede agregarse después de validar el uso real |
| App móvil | Primero consolidar la versión web |
| Histórico de cambios detallado (auditoría) | No es prioridad inmediata |

---

## 7. Supuestos y Decisiones Tomadas

### Supuestos (confirmados o actualizados)

| # | Supuesto | Estado |
|---|----------|--------|
| 1 | El archivo del contador tiene estructura de matriz proyecto × concepto | ✅ Confirmado por análisis |
| 2 | Los conceptos pueden variar ligeramente pero son mapeables | ✅ Catálogo identificado |
| 3 | El número de empresas a gestionar iniciará con 2 y puede crecer | ✅ Confirmado por cliente |
| 4 | Cada empresa puede o no manejar reparto (configurable) | ✅ Confirmado por cliente |
| 5 | El análisis por proyecto es importante para ambas empresas | ✅ Confirmado por cliente |

### Decisiones de diseño funcional

| # | Decisión |
|---|----------|
| 1 | La conciliación tendrá dos vías: importación masiva para históricos y captura individual para nuevas partidas |
| 2 | El reparto se configura en dos niveles: primero a nivel empresa, luego a nivel proyecto |
| 3 | El sistema detectará automáticamente la estructura del archivo del contador basándose en patrones conocidos |
| 4 | Los reportes mostrarán por defecto el mes actual o el último mes con datos |
| 5 | El catálogo de proyectos será independiente por empresa |

### Riesgos detectados (a nivel negocio)

| # | Riesgo | Mitigación propuesta |
|---|--------|---------------------|
| 1 | Variabilidad en formatos Excel | El sistema se basará en el patrón "Concepto/Proyecto" para detectar estructura |
| 2 | Reglas de reparto muy complejas | Empezar con porcentajes fijos; evaluar fórmulas avanzadas en fase 2 |
| 3 | Datos históricos incompletos | Permitir importar lo que exista y marcar períodos sin datos |

---

## 8. Criterios de Éxito

### Métricas cuantitativas

| Indicador | Situación actual (estimada) | Meta |
|-----------|----------------------------|------|
| Tiempo de cierre mensual | 4-8 horas por empresa | < 30 minutos por empresa |
| Errores de cálculo manual | Frecuentes | Cercanos a cero |
| Tiempo para generar un reporte por proyecto | 1-2 horas | < 2 minutos |

### Señales cualitativas de éxito

- El equipo de finanzas deja de usar hojas de cálculo paralelas para el control presupuestal
- Dirección puede consultar el desempeño **por proyecto** sin pedir reportes al equipo
- Cada mes, los responsables saben cómo están contra presupuesto sin preguntar a contabilidad
- El cálculo de utilidad por proyecto con reparto es confiable y se usa para tomar decisiones
- Se puede agregar una nueva empresa sin modificar la estructura del sistema

---

## 9. Próximos Pasos

| Paso | Descripción | Estado |
|------|-------------|--------|
| 1 | ~~Validación del documento inicial~~ | ✅ Completado |
| 2 | ~~Compartir archivos de muestra~~ | ✅ Archivos analizados |
| 3 | **Validación de esta versión actualizada** | 🔄 Pendiente |
| 4 | Documentación funcional detallada | Siguiente paso |
| 5 | Generación del backlog de desarrollo | - |
| 6 | Inicio de desarrollo | - |

---

## 10. Documentación de Referencia

Se ha generado documentación adicional basada en el análisis de los archivos de muestra:

| Documento | Descripción |
|-----------|-------------|
| [FILE_FORMATS.md](./FILE_FORMATS.md) | Especificación detallada de la estructura de cada archivo Excel (contador, presupuesto, conciliación) |

---

## Notas Finales

Este documento ha sido actualizado con base en:
1. El cuestionario inicial del cliente
2. Las aclaraciones adicionales (multi-empresa escalable, reparto configurable por empresa)
3. El análisis de los archivos de muestra proporcionados

Una vez validado, servirá como base para la documentación funcional detallada y la planificación del proyecto.

---

*Versión 1.0: 8 de enero de 2026*  
*Versión 1.1: 8 de enero de 2026 - Actualizado con análisis de archivos*
