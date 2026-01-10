# AI Support Knowledge Base - Arsen

**Sistema**: Arsen - Control Presupuestal Multi-Empresa  
**Propósito**: Base de conocimiento para AI Support Agent  
**Actualizado**: 9 de enero de 2026

---

## 1. Visión General del Producto

### ¿Qué ES Arsen?
- Plataforma web para centralizar el control presupuestal y financiero de múltiples empresas
- Automatiza la conciliación de presupuestos vs resultados reales
- Calcula reparto de utilidades con 7 tipos de fórmulas configurables
- Genera reportes en Excel y PDF

### ¿Qué NO ES Arsen?
- NO es un software contable (no genera pólizas ni facturas)
- NO tiene integración directa con sistemas externos
- NO procesa pagos ni transacciones bancarias
- NO es una app móvil (es web responsive)

### Empresas Gestionadas
- **Wepark**: Empresa de estacionamientos
- **Sigma**: Empresa de seguridad
- Sistema escalable para agregar más empresas

---

## 2. Tipos de Usuario y Capacidades

### ADMIN (Administrador)
**Persona típica**: Directora de Finanzas (Ana García)
**Acceso**: Control total del sistema

| Puede | No puede |
|-------|----------|
| Gestionar usuarios | N/A - acceso total |
| Configurar reparto empresa | |
| Cerrar/reabrir períodos | |
| Ver todas las empresas | |
| Todas las operaciones de Staff | |

### STAFF (Analista)
**Persona típica**: Analista de Finanzas (Carlos Mendoza)
**Acceso**: Operación completa sin gestión de usuarios

| Puede | No puede |
|-------|----------|
| Importar resultados | Gestionar usuarios |
| Importar presupuestos | Cerrar períodos |
| Gestionar catálogos | Configurar reparto de empresa |
| Configurar reparto de proyectos | |
| Exportar reportes | |
| Gestionar conciliaciones | |

### AREA_USER (Usuario de Área)
**Persona típica**: Gerente de Compras (María López)
**Acceso**: Solo su área, solo empresas asignadas

| Puede | No puede |
|-------|----------|
| Capturar presupuesto de SU área | Importar resultados |
| Ver comparativo (lectura) | Gestionar catálogos |
| Exportar reportes | Configurar reparto |
| | Cambiar empresa no asignada |

### READONLY (Solo Lectura)
**Persona típica**: Director General (Roberto Sánchez)
**Acceso**: Solo consulta, solo empresas asignadas

| Puede | No puede |
|-------|----------|
| Ver dashboards | Cualquier escritura |
| Ver comparativos | Importar datos |
| Exportar reportes | Capturar presupuestos |

---

## 3. Módulos del Sistema

| Módulo | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| Dashboard | `/` | KPIs y resumen de empresa | Todos |
| Resultados | `/results` | Consulta de resultados reales | Todos |
| Importar Resultados | `/results/import` | Importar Excel del contador | Admin, Staff |
| Presupuestos | `/budgets` | Consulta de presupuestos | Todos |
| Capturar Presupuesto | `/budgets/capture` | Grid de captura 12 meses | Admin, Staff, Área |
| Importar Presupuesto | `/budgets/import` | Importar Excel de presupuesto | Admin, Staff |
| Comparativo | `/comparison` | Real vs Presupuesto | Todos |
| Reparto | `/profit-sharing` | Visualizar cálculo de reparto | Todos |
| Config. Reparto | `/profit-sharing/config` | Configurar fórmulas | Admin, Staff |
| Conciliaciones | `/reconciliations` | Consultar movimientos | Todos |
| Importar Conciliaciones | `/reconciliations/import` | Carga masiva | Admin, Staff |
| Catálogos | `/catalogs/*` | Empresas, proyectos, conceptos, áreas | Admin, Staff |
| Usuarios | `/users` | Gestión de usuarios | Solo Admin |

---

## 4. Flujos Principales (Happy Paths)

### Flujo 1: Cierre Mensual (más importante)
**Actor**: Staff (Carlos)
**Frecuencia**: Mensual

1. Seleccionar empresa y período (mes/año)
2. Subir archivo Excel del contador
3. Sistema detecta estructura automáticamente
4. Revisar vista previa con marcadores de problemas
5. Resolver conceptos/proyectos no reconocidos
6. Confirmar importación
7. Sistema calcula reparto automáticamente
8. Revisar dashboard actualizado
9. Exportar reportes necesarios

**Tiempo esperado**: < 30 minutos

### Flujo 2: Captura de Presupuesto
**Actor**: Usuario de Área (María)
**Frecuencia**: Anual/Trimestral

1. Seleccionar empresa, área y año
2. Ver grid de conceptos × 12 meses
3. Capturar valores por mes
4. Ver totales calculados automáticamente
5. Guardar presupuesto

### Flujo 3: Consulta de Comparativo
**Actor**: Cualquiera
**Frecuencia**: Diaria/Semanal

1. Seleccionar empresa y período
2. Ver tabla con: Concepto, Presupuesto, Real, Desviación $, Desviación %
3. Expandir filas para ver detalle por proyecto
4. Exportar a Excel/PDF si necesario

### Flujo 4: Configuración de Reparto
**Actor**: Admin/Staff
**Frecuencia**: Al crear nuevo proyecto

1. Ir a Catálogos → Proyectos
2. Seleccionar proyecto
3. Activar "Aplica reparto"
4. Elegir tipo de fórmula (7 opciones)
5. Configurar parámetros según fórmula
6. Guardar

---

## 5. Flujos de Error Comunes

### Error: "Concepto no reconocido" en importación
**Causa**: El archivo Excel contiene un concepto que no existe en el catálogo
**Solución**: 
1. El sistema muestra lista de conceptos no reconocidos
2. Usuario elige: Mapear a existente / Crear nuevo / Ignorar
3. Para mapear: seleccionar concepto del dropdown
4. Para crear: el sistema lo crea automáticamente

### Error: "Proyecto no encontrado" en importación
**Causa**: Nombre de proyecto en Excel no coincide con catálogo
**Solución**: 
1. Revisar nombre exacto en Catálogos → Proyectos
2. Crear mapeo en Catálogos → Project Mappings
3. Reintentar importación

### Error: "No autorizado"
**Causa**: Usuario sin permisos para la acción
**Verificar**:
- ¿Tiene el rol correcto?
- ¿Tiene la empresa asignada?
- ¿Es Usuario de Área intentando acceder a otra área?

### Error: "Período cerrado"
**Causa**: Intentando modificar datos de un período cerrado
**Solución**: 
- Solo Admin puede reabrir períodos
- Contactar administrador si es necesario modificar

---

## 6. Preguntas Frecuentes (FAQ)

### Acceso y Login

**P: Olvidé mi contraseña**
R: Contactar al administrador del sistema para resetear contraseña. NO hay flujo de recuperación automático.

**P: Me sale "sesión expirada"**
R: Las sesiones duran 24 horas. Si cierra sesión desde otro dispositivo, la sesión activa se invalida. Iniciar sesión nuevamente.

**P: No veo todas las empresas**
R: Solo ves empresas asignadas a tu usuario. Contactar administrador para agregar acceso.

### Importación

**P: ¿Qué formato debe tener el archivo del contador?**
R: Excel (.xlsx) con estructura:
- Celda ancla: "Concepto/Proyecto"
- Fila siguiente: nombres de proyectos
- Filas siguientes: conceptos con valores por proyecto
- Separador entre ingresos y costos

**P: La importación no detecta la estructura**
R: Verificar que exista la celda exacta "Concepto/Proyecto" en el archivo.

**P: ¿Qué pasa si importo dos veces el mismo mes?**
R: El sistema pregunta si desea sobrescribir. Los datos anteriores se reemplazan.

### Presupuestos

**P: ¿Puedo editar un presupuesto ya guardado?**
R: Sí, mientras el período no esté cerrado.

**P: ¿Por qué no puedo capturar presupuesto de otra área?**
R: Usuario de Área solo puede capturar presupuesto de su área asignada. Staff/Admin pueden capturar cualquier área.

### Reparto

**P: ¿Cuándo se calcula el reparto?**
R: Automáticamente después de cada importación de resultados.

**P: ¿Por qué un proyecto no muestra reparto?**
R: Verificar:
1. La empresa tiene "Maneja Reparto" activado
2. El proyecto tiene "Aplica Reparto" activado
3. El proyecto tiene una fórmula configurada

**P: ¿Cómo sé qué fórmula tiene un proyecto?**
R: Ir a Catálogos → Proyectos → Ver detalle del proyecto

### Exportación

**P: ¿En qué formatos puedo exportar?**
R: Excel (.xlsx) y PDF

**P: El PDF sale cortado o mal formateado**
R: Los PDFs están optimizados para formato carta. Para tablas grandes, usar exportación Excel.

---

## 7. Comportamientos que NO son Bugs

| Comportamiento | Explicación |
|----------------|-------------|
| Valores en 0 no aparecen en reportes | Por diseño, para simplificar vistas |
| Gastos de Administración sin proyecto | Es correcto, son gastos generales de empresa |
| Sólo puedo ver algunas empresas | Depende de las empresas asignadas al usuario |
| El reparto no se muestra en todos los proyectos | Solo proyectos con "Aplica Reparto" activado |
| Sesión cerrada al abrir en otro dispositivo | Una sola sesión activa por usuario |

---

## 8. Limitaciones Conocidas

| Limitación | Workaround |
|------------|------------|
| No hay recuperación de contraseña automática | Administrador resetea manualmente |
| No hay notificaciones por email | Consultar sistema directamente |
| No hay app móvil nativa | Usar navegador móvil (responsive) |
| No hay flujos de aprobación | Coordinación manual |
| No hay integración con software contable | Importación manual de Excel |
| Máximo ~10 usuarios concurrentes | Diseñado para equipos pequeños |

---

## 9. Referencias Cruzadas a Documentación

| Tema | Documento | Sección |
|------|-----------|---------|
| Roles y permisos detallados | `07_MATRIZ_PERMISOS.md` | Secciones 2-5 |
| User Stories completas | `05_USER_STORIES.md` | Todo |
| Reglas de negocio | `06_REGLAS_NEGOCIO.md` | Todo |
| Flujos con diagramas | `04_FLUJOS_FUNCIONALES.md` | Secciones 1-7 |
| Glosario completo | `08_GLOSARIO.md` | Todo |
| Arquitectura técnica | `09_ARQUITECTURA_TECNICA.md` | Todo |
| Modelo de datos | `10_MODELO_DATOS.md` | Todo |

---

## 10. Glosario Esencial para Soporte

| Término | Definición Rápida |
|---------|-------------------|
| Empresa | Entidad legal gestionada (Wepark, Sigma) |
| Proyecto | Cliente o unidad de negocio |
| Concepto | Categoría de ingreso o costo |
| Área | División organizacional para presupuestos |
| Período | Mes + Año (ej: Enero 2026) |
| Reparto | División de utilidad entre empresa y cliente |
| Utilidad Bruta | Ingresos - Costos |
| Honorario | Parte de utilidad para la empresa |
| Comparativo | Reporte de Real vs Presupuesto |
| Cierre Mensual | Proceso de importar resultados del mes |
| Archivo del Contador | Excel mensual con resultados reales |
| Mapeo | Relacionar nombre externo con catálogo |
| Soft Delete | Eliminación lógica (registro marcado, no borrado) |

---

*Base de conocimiento generada: 9 de enero de 2026*
