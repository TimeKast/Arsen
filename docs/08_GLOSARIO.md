# 08 - Glosario de Términos

**Proyecto**: Arsen - Sistema de Control Presupuestal Multi-Empresa  
**Versión**: 1.0  
**Fecha**: 8 de enero de 2026

---

## Términos de Negocio

### Área
División organizacional de una empresa que agrupa conceptos de presupuesto relacionados. Ejemplos: Compras, RH, Operación, Comercial, Finanzas. Las áreas determinan **quién** puede capturar **qué** presupuesto, pero no afectan las consultas de resultados.

### Cierre Mensual
Proceso que se ejecuta cada mes para registrar los resultados reales en el sistema. Incluye: importación del archivo del contador, cálculo de reparto (si aplica), y generación de comparativos.

### Comparativo
Reporte que muestra la diferencia entre los valores presupuestados y los valores reales para un período determinado. Incluye desviación absoluta y porcentual.

### Concepto
Categoría de ingreso o costo utilizada para clasificar las transacciones financieras. Ejemplos de ingresos: Tarifa horaria, Pensiones, Eventos. Ejemplos de costos: Nómina operativa, Renta, Mantenimiento.

### Conciliación
Proceso de verificar y clasificar los movimientos bancarios contra los registros contables. Cada movimiento incluye: fecha, proveedor, proyecto, concepto y monto.

### Contador (Archivo del)
Archivo Excel que el contador externo proporciona mensualmente con el desglose de ingresos y costos por proyecto. Tiene formato de matriz con proyectos en columnas y conceptos en filas.

### Desviación
Diferencia entre el valor real y el valor presupuestado. Puede expresarse en valor absoluto ($) o porcentaje (%).

### Empresa
Entidad legal separada que se gestiona en el sistema. Ejemplos: Wepark, Sigma. Cada empresa tiene sus propios proyectos, presupuestos y reglas de reparto.

### Gastos de Administración
Costos generales de la empresa que no están asignados a ningún proyecto específico. Ejemplos: renta de oficina corporativa, nómina administrativa, servicios legales. NO participan en reparto.

### Honorario
Monto que corresponde a la empresa por la gestión de un proyecto, calculado según las reglas de reparto configuradas.

### Período
Combinación de mes y año que identifica un ciclo de operación. Formato: "Enero 2025". Los períodos pueden estar abiertos (editables) o cerrados (solo consulta).

### Período Cerrado
Estado de un período que impide modificaciones. Solo permite consultas y exportaciones. El Admin puede cerrar o reabrir períodos.

### Presupuesto
Plan financiero anual que define los montos esperados de ingresos y gastos por área, concepto y mes. Se captura a nivel de área (no de proyecto).

### Proyecto
Unidad de negocio o cliente al que se asignan ingresos y costos. Ejemplos en Wepark: Corporativo Polanco, Torre Prisma, Summit. Los proyectos son específicos de cada empresa.

### Reparto (o Utilidad Dividida)
Proceso de calcular cómo se divide la utilidad bruta de un proyecto entre la empresa y el cliente, según las reglas configuradas para ese proyecto.

### Resultados
Datos reales de ingresos y costos de un período, importados desde el archivo del contador. Se registran a nivel de proyecto y concepto.

### Utilidad Bruta
Diferencia entre ingresos totales y costos totales de un proyecto o empresa en un período.
```
Utilidad Bruta = Ingresos - Costos
```

### Utilidad Cliente
Parte de la utilidad bruta que corresponde al cliente después de aplicar el reparto.
```
Utilidad Cliente = Utilidad Bruta - Honorario Empresa
```

### Utilidad Empresa
Parte de la utilidad bruta que corresponde a la empresa operadora. Equivalente al "honorario" calculado por las reglas de reparto.

---

## Términos de Fórmulas de Reparto

### FIXED_ONLY
Tipo de fórmula donde el honorario es un monto fijo mensual, independiente de la utilidad.

### PERCENT_SIMPLE
Tipo de fórmula donde el honorario es un porcentaje fijo de la utilidad bruta.

### FIXED_PLUS_PERCENT
Tipo de fórmula que combina un monto fijo más un porcentaje de la utilidad bruta.

### TIERED (Escalonado)
Tipo de fórmula con diferentes porcentajes según rangos de utilidad. Ejemplo: 30% del primer millón + 25% del excedente.

### SPECIAL_FORMULA
Tipo de fórmula personalizada. Ejemplo Monte Pelvoux: el fijo se resta de la utilidad, se calcula el porcentaje, y se suma de nuevo el fijo.

### GROUPED (Agrupado)
Configuración donde varios proyectos suman sus utilidades antes de calcular el reparto. Ejemplo: Corporativo Polanco + The Room.

### DYNAMIC (Dinámico)
Tipo de fórmula donde parte del honorario depende de una variable operativa. Ejemplo: incremento por cada valet parking en plantilla.

---

## Términos Técnicos

### App Router
Sistema de enrutamiento de Next.js 14 que usa carpetas para definir rutas y soporta Server Components.

### Catálogo
Tabla de datos maestros que se usa como referencia en el sistema. Ejemplos: catálogo de empresas, proyectos, conceptos, áreas.

### CRUD
Acrónimo de Create, Read, Update, Delete. Las cuatro operaciones básicas sobre datos.

### Drill-down
Capacidad de navegar desde un dato agregado hacia su detalle. Ejemplo: click en total empresa → ver proyectos → ver conceptos.

### Drizzle ORM
Object-Relational Mapping para TypeScript que permite definir esquemas de base de datos con tipos seguros.

### JWT
JSON Web Token. Formato de token para autenticación que contiene información del usuario en forma encriptada.

### Mapeo
Proceso de relacionar un valor del archivo de importación con una entidad del catálogo del sistema.

### MVP
Minimum Viable Product. Primera versión del sistema con funcionalidades esenciales.

### Neon
Proveedor de base de datos PostgreSQL serverless optimizado para aplicaciones modernas.

### NextAuth.js
Librería de autenticación para Next.js que maneja login, sesiones y autorización.

### Parsing
Proceso de analizar y estructurar los datos de un archivo (como Excel) para poder procesarlos.

### RBAC
Role-Based Access Control. Sistema de permisos basado en roles asignados a usuarios.

### Server Component
Componente de React que se renderiza en el servidor, ideal para data fetching.

### Server Actions
Funciones de Next.js que se ejecutan en el servidor y pueden ser llamadas desde componentes cliente.

### Soft Delete
Patrón de eliminación donde los registros no se borran físicamente, sino que se marcan como eliminados.

### Vercel
Plataforma de hosting optimizada para aplicaciones Next.js.

---

## Términos del Dominio de Estacionamientos (Wepark)

### Etiqueta
Tipo de ingreso por venta de etiquetas de acceso vehicular.

### Pensión
Tipo de ingreso por contratos de estacionamiento mensual/fijo.

### Tarifa Horaria
Tipo de ingreso por uso de estacionamiento por hora.

### Valet Parking
Servicio de estacionamiento donde un empleado estaciona el vehículo del cliente.

---

## Términos del Dominio de Seguridad (Sigma)

### Monitoreo
Servicio de vigilancia remota a través de cámaras y sistemas de alarma.

### Seguridad
Servicio principal de vigilancia física en instalaciones.

---

## Abreviaturas

| Abreviatura | Significado |
|-------------|-------------|
| Admin | Administrador |
| BD | Base de Datos |
| CRUD | Create, Read, Update, Delete |
| DB | Database |
| ISN | Impuesto Sobre Nómina |
| IVA | Impuesto al Valor Agregado |
| JWT | JSON Web Token |
| MVP | Minimum Viable Product |
| ORM | Object-Relational Mapping |
| PDF | Portable Document Format |
| RBAC | Role-Based Access Control |
| RH | Recursos Humanos |
| RSC | React Server Components |
| SSO | Single Sign-On |
| UI | User Interface |
| UX | User Experience |

---

*Documento generado: 8 de enero de 2026*
