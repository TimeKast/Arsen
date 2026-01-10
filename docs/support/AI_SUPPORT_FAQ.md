# AI Support FAQ - Arsen

**Propósito**: Respuestas detalladas a preguntas frecuentes  
**Actualizado**: 9 de enero de 2026

---

## Autenticación y Acceso

### ¿Cómo inicio sesión?
1. Ir a la página de login (`/login`)
2. Ingresar email y contraseña
3. Click en "Ingresar"
4. Si las credenciales son correctas, redirige al dashboard

### ¿Por qué me sale "Credenciales inválidas"?
- Email o contraseña incorrectos
- Usuario desactivado
- Mayúsculas/minúsculas importan en contraseña

### ¿Cómo recupero mi contraseña?
**No existe recuperación automática.** Pasos:
1. Contactar al administrador del sistema
2. Admin resetea contraseña desde `/users`
3. Admin proporciona nueva contraseña temporal
4. Usuario ingresa y puede cambiarla (si implementado)

### ¿Por qué mi sesión se cerró sola?
- Las sesiones expiran después de 24 horas
- Solo se permite UNA sesión activa por usuario
- Si inicias sesión en otro dispositivo, la sesión anterior se invalida

### ¿Puedo tener el sistema abierto en dos navegadores?
No. El sistema invalida sesiones anteriores al iniciar nueva sesión.

---

## Empresas y Navegación

### ¿Cómo cambio de empresa?
- Usar el selector de empresa en la parte superior derecha
- El selector muestra solo empresas asignadas a tu usuario

### ¿Por qué no veo todas las empresas?
- Solo ves empresas asignadas a tu usuario
- Si necesitas acceso a otra empresa, contacta al administrador

### ¿Qué es el "período" que selecciono?
- Es la combinación de Año + Mes para consultar datos
- Formato: "Enero 2026"
- Todos los datos se muestran para el período seleccionado

---

## Importación de Resultados

### ¿Qué formato debe tener el archivo del contador?
```
El archivo debe ser Excel (.xlsx) con estructura:
- Celda ancla: texto exacto "Concepto/Proyecto"
- Fila siguiente: nombres de proyectos en columnas
- Filas siguientes: conceptos de ingreso
- Separador: fila con texto "Costos" o similar
- Filas siguientes: conceptos de costo
```

### ¿Qué pasa si el archivo no tiene el formato correcto?
- El sistema no podrá detectar la estructura
- Mensaje de error: "No se encontró la celda Concepto/Proyecto"
- Verificar que la celda exista exactamente con ese texto

### ¿Qué son los "conceptos no reconocidos"?
- Son conceptos del archivo que no existen en el catálogo
- Opciones:
  - **Mapear a existente**: relacionar con concepto ya existente
  - **Crear nuevo**: crear concepto automáticamente
  - **Ignorar**: no importar esa línea

### ¿Qué pasa si importo el mismo mes dos veces?
- El sistema pregunta si desea sobrescribir
- Si confirma: datos anteriores se reemplazan completamente
- Si cancela: mantiene datos existentes

### ¿Por qué algunos valores no se importaron?
Causas comunes:
- Celda vacía en el archivo
- Valor no numérico (texto donde debería ser número)
- Fila ignorada por el usuario
- Concepto/proyecto no mapeado

---

## Presupuestos

### ¿Cómo capturo un presupuesto?
1. Ir a Presupuestos → Capturar
2. Seleccionar empresa, área y año
3. Ver grid de conceptos × 12 meses
4. Ingresar valores en cada celda
5. Los totales se calculan automáticamente
6. Click en "Guardar"

### ¿Puedo importar presupuesto desde Excel?
Sí:
1. Ir a Presupuestos → Importar
2. Seleccionar empresa y año
3. Subir archivo Excel con estructura esperada
4. Revisar vista previa
5. Confirmar importación

### ¿Puedo modificar un presupuesto guardado?
Sí, siempre que:
- El período NO esté cerrado
- Tengas permisos para esa área (Staff/Admin: todas, Área: solo la suya)

### ¿Por qué no puedo capturar presupuesto de otra área?
- Si eres Usuario de Área, solo puedes capturar presupuesto de TU área asignada
- Staff y Admin pueden capturar cualquier área

---

## Comparativo

### ¿Qué muestra el comparativo?
Para cada concepto:
- **Presupuesto**: valor planificado
- **Real**: valor importado del contador
- **Desviación $**: Real - Presupuesto
- **Desviación %**: ((Real - Presupuesto) / Presupuesto) × 100

### ¿Por qué un concepto aparece en 0?
- No hay presupuesto capturado para ese concepto
- No hay resultados importados para ese concepto
- Los datos pueden estar en otro período

### ¿Puedo ver el detalle por proyecto?
Sí, haciendo click en la fila del concepto se expande para mostrar desglose por proyecto.

---

## Reparto de Utilidades

### ¿Qué es el reparto?
Es el cálculo de cómo se divide la utilidad bruta entre:
- **Honorario Empresa**: parte para la empresa operadora
- **Utilidad Cliente**: parte para el cliente/dueño del proyecto

### ¿Cuándo se calcula el reparto?
Automáticamente después de cada importación de resultados.

### ¿Por qué un proyecto no tiene reparto?
Verificar en este orden:
1. Empresa → "Maneja Reparto" = Sí
2. Proyecto → "Aplica Reparto" = Sí
3. Proyecto → Fórmula configurada

### ¿Cuáles son los tipos de fórmula?
| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| FIXED_ONLY | Monto fijo mensual | $12,000/mes |
| PERCENT_SIMPLE | % de utilidad | 15% |
| FIXED_PLUS_PERCENT | Fijo + % | $21,676 + 6% |
| TIERED | % escalonado | 30% primer millón + 25% resto |
| SPECIAL_FORMULA | Fórmula especial | (Util - Fijo) × 30% + Fijo |
| GROUPED | Agrupa proyectos | Suma P1 + P2, luego calcula |
| DYNAMIC | Variable operativa | +$2,750 por valet |

### ¿Cómo configuro el reparto de un proyecto?
1. Ir a Reparto → Configuración
2. Seleccionar empresa
3. Seleccionar proyecto
4. Elegir tipo de fórmula
5. Configurar parámetros (montos, porcentajes, etc.)
6. Guardar

---

## Conciliaciones

### ¿Qué son las conciliaciones?
Registro de movimientos bancarios clasificados por proyecto y concepto.

### ¿Cómo importo conciliaciones?
1. Ir a Conciliaciones → Importar
2. Subir archivo Excel con estructura esperada
3. Revisar vista previa
4. Confirmar importación

### ¿Qué campos tiene una conciliación?
- Fecha
- Referencia (TEF, SPEI, etc.)
- Factura
- Póliza
- Cheque
- Proveedor
- Proyecto
- Concepto
- Subtotal, IVA, Total

---

## Exportación

### ¿Qué formatos de exportación hay?
- **Excel (.xlsx)**: tablas completas, ideal para análisis
- **PDF**: formato para impresión/presentación

### ¿Qué reportes puedo exportar?
- Comparativo (real vs presupuesto)
- Reparto (detalle de utilidades)
- Resultados (por proyecto/concepto)
- Presupuestos

### ¿Por qué el PDF sale cortado?
- Los PDFs están optimizados para formato carta
- Tablas muy anchas pueden cortarse
- Para tablas grandes, usar exportación Excel

---

## Catálogos

### ¿Qué catálogos hay?
- **Empresas**: entidades legales gestionadas
- **Proyectos**: unidades de negocio/clientes
- **Conceptos**: categorías de ingreso/costo
- **Áreas**: divisiones organizacionales
- **Mapeos**: relaciones para importación

### ¿Cómo creo un nuevo proyecto?
1. Ir a Catálogos → Proyectos
2. Click en "Nuevo Proyecto"
3. Seleccionar empresa
4. Ingresar nombre y código
5. Indicar si aplica reparto
6. Guardar

### ¿Puedo eliminar un concepto?
Solo si no tiene datos asociados (presupuestos, resultados, conciliaciones).
Si tiene datos, se puede desactivar pero no eliminar.

---

## Usuarios (Solo Admin)

### ¿Cómo creo un usuario?
1. Ir a Usuarios (solo visible para Admin)
2. Click en "Nuevo Usuario"
3. Ingresar: nombre, email, contraseña
4. Seleccionar rol
5. Asignar empresas
6. Asignar área (si es Usuario de Área)
7. Guardar

### ¿Cuáles son los roles?
| Rol | Descripción |
|-----|-------------|
| ADMIN | Control total |
| STAFF | Operación sin gestión de usuarios |
| AREA_USER | Solo su área y empresas asignadas |
| READONLY | Solo consulta |

### ¿Cómo desactivo un usuario?
1. Ir a Usuarios
2. Buscar el usuario
3. Click en toggle de estado
4. El usuario ya no podrá iniciar sesión

---

*FAQ generado: 9 de enero de 2026*
