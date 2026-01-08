# 02 - User Personas

**Proyecto**: Arsen - Sistema de Control Presupuestal Multi-Empresa  
**Versión**: 1.0  
**Fecha**: 8 de enero de 2026

---

## Resumen de Personas

| Persona | Rol Sistema | Frecuencia de Uso | Objetivo Principal |
|---------|-------------|-------------------|-------------------|
| Ana | Admin | Diario | Gestionar sistema y usuarios |
| Carlos | Staff | Diario | Cargar datos y generar reportes |
| María | Usuario Área | Mensual/Trimestral | Subir presupuestos de su área |
| Roberto | Solo Lectura | Semanal | Consultar reportes de desempeño |

---

## Persona 1: Ana - Administradora del Sistema

### Perfil
- **Nombre**: Ana García
- **Rol**: Directora de Finanzas
- **Rol en sistema**: Admin
- **Edad**: 42 años
- **Experiencia técnica**: Media-Alta

### Contexto
Ana supervisa las finanzas de Wepark y Sigma. Es responsable del cierre mensual y de presentar resultados a los socios. Necesita tener control total sobre el sistema y poder resolver problemas rápidamente.

### Objetivos
1. Tener visibilidad completa del desempeño de todas las empresas
2. Configurar las reglas de reparto correctamente
3. Gestionar usuarios y sus permisos
4. Asegurar la integridad de los datos

### Frustraciones Actuales
- "Paso 2 días consolidando Excels cada mes"
- "Las fórmulas de reparto a veces fallan y nadie se da cuenta"
- "No puedo delegar porque el proceso es muy manual"

### Necesidades del Sistema
- Dashboard consolidado con KPIs clave
- Configuración intuitiva de fórmulas de reparto
- Gestión simple de usuarios
- Exportación rápida para presentaciones

### Escenarios de Uso Frecuente
1. Revisar el cierre mensual de ambas empresas
2. Configurar reparto de un nuevo proyecto
3. Crear usuario para un nuevo responsable de área
4. Exportar reporte para junta de socios

---

## Persona 2: Carlos - Analista de Finanzas

### Perfil
- **Nombre**: Carlos Mendoza
- **Rol**: Analista de Finanzas
- **Rol en sistema**: Staff
- **Edad**: 28 años
- **Experiencia técnica**: Alta

### Contexto
Carlos es el "power user" del sistema. Hace la carga operativa diaria, importa archivos del contador, gestiona conciliaciones y genera la mayoría de los reportes.

### Objetivos
1. Cargar datos mensuales de forma rápida y sin errores
2. Identificar discrepancias en la importación
3. Generar reportes comparativos
4. Mantener actualizados los catálogos

### Frustraciones Actuales
- "El archivo del contador cambia de formato a veces"
- "Aplicar las fórmulas de reparto es tedioso"
- "Cuando alguien pide un reporte, tardo mucho en generarlo"

### Necesidades del Sistema
- Importación inteligente que detecte problemas
- Vista previa antes de confirmar carga
- Acceso rápido a reportes frecuentes
- Capacidad de corregir datos sin perder historial

### Escenarios de Uso Frecuente
1. Importar resultados mensuales del contador
2. Resolver conceptos no reconocidos en importación
3. Generar comparativo real vs presupuesto
4. Exportar reporte por proyecto a Excel

---

## Persona 3: María - Responsable de Área

### Perfil
- **Nombre**: María López
- **Rol**: Gerente de Compras
- **Rol en sistema**: Usuario Área
- **Edad**: 35 años
- **Experiencia técnica**: Media

### Contexto
María es responsable del presupuesto de su área (Compras). Cada año captura el presupuesto y trimestralmente lo revisa. No necesita ver datos de otras áreas ni de otras empresas.

### Objetivos
1. Capturar su presupuesto anual sin complicaciones
2. Ver cómo va su área contra presupuesto
3. Ajustar presupuesto cuando sea necesario

### Frustraciones Actuales
- "Tengo que enviar mi Excel a finanzas y esperar que lo integren"
- "No sé cuánto llevamos gastado hasta que me lo dicen"

### Necesidades del Sistema
- Formulario simple para capturar presupuesto
- Vista de mi área vs presupuesto
- Notificación si algo está muy desviado

### Escenarios de Uso Frecuente
1. Capturar presupuesto anual de Compras
2. Revisar cómo va su área en el mes actual
3. Ajustar un concepto presupuestado

---

## Persona 4: Roberto - Director General

### Perfil
- **Nombre**: Roberto Sánchez
- **Rol**: Director General
- **Rol en sistema**: Solo Lectura
- **Edad**: 55 años
- **Experiencia técnica**: Baja

### Contexto
Roberto necesita información para tomar decisiones estratégicas. No opera el sistema pero lo consulta regularmente para entender el desempeño de las empresas y proyectos.

### Objetivos
1. Ver resumen ejecutivo del desempeño
2. Identificar proyectos problemáticos
3. Comparar empresas entre sí
4. Obtener datos para juntas de consejo

### Frustraciones Actuales
- "Tengo que pedirle a Ana un reporte cada vez que necesito algo"
- "Los números a veces no cuadran entre reportes"

### Necesidades del Sistema
- Dashboard ejecutivo simple
- Drill-down para investigar anomalías
- Exportación para presentaciones
- Datos siempre actualizados

### Escenarios de Uso Frecuente
1. Revisar utilidad del mes por empresa
2. Comparar proyectos más rentables
3. Verificar si hay desviaciones grandes
4. Descargar PDF para junta de consejo

---

## Matriz Persona-Funcionalidad

| Funcionalidad | Ana (Admin) | Carlos (Staff) | María (Área) | Roberto (Lectura) |
|---------------|-------------|----------------|--------------|-------------------|
| Dashboard empresas | ✅ | ✅ | - | ✅ |
| Dashboard proyectos | ✅ | ✅ | - | ✅ |
| Cargar resultados | ✅ | ✅ | - | - |
| Gestionar presupuestos | ✅ | ✅ | ✅ (su área) | - |
| Configurar reparto | ✅ | ✅ | - | - |
| Gestionar conciliaciones | ✅ | ✅ | - | - |
| Exportar reportes | ✅ | ✅ | ✅ | ✅ |
| Gestionar usuarios | ✅ | - | - | - |
| Gestionar catálogos | ✅ | ✅ | - | - |
| Configurar sistema | ✅ | - | - | - |

---

## Consideraciones de UX por Persona

### Para Admin (Ana)
- Acceso rápido a configuración de sistema
- Vista consolidada de todas las empresas
- Indicadores de estado del sistema (importaciones pendientes, etc.)

### Para Staff (Carlos)
- Flujo optimizado de importación (mínimos clics)
- Atajos de teclado para acciones frecuentes
- Filtros guardados para reportes

### Para Usuario Área (María)
- Interfaz simplificada (solo lo que necesita)
- Wizard guiado para captura de presupuesto
- Confirmaciones claras de acciones

### Para Solo Lectura (Roberto)
- Dashboards visuales, no tablas densas
- Navegación intuitiva sin curva de aprendizaje
- Exportación en 1 clic

---

*Documento generado: 8 de enero de 2026*
