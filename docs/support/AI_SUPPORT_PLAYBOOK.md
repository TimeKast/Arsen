# AI Support Playbook - Arsen

**Propósito**: Guías operativas para clasificar, responder y escalar consultas  
**Actualizado**: 9 de enero de 2026

---

## 1. Clasificación de Consultas

### Categoría: DUDA GENERAL
**Indicadores**:
- Usuario pregunta cómo hacer algo
- Necesita explicación de funcionalidad
- Desconoce dónde encontrar algo

**Respuesta**: Proporcionar instrucciones paso a paso referenciando la documentación.

**Ejemplos**:
- "¿Cómo exporto a PDF?"
- "¿Dónde configuro el reparto?"
- "¿Qué significa desviación?"

---

### Categoría: PROBLEMA DE USO
**Indicadores**:
- Usuario reporta que algo "no funciona" pero podría ser error de usuario
- Mensaje de error esperado por el sistema
- Falta de permisos

**Respuesta**: Verificar prerrequisitos, guiar paso a paso, explicar restricciones.

**Ejemplos**:
- "No puedo importar el archivo"
- "Me sale error de no autorizado"
- "No veo la opción de reparto"

---

### Categoría: SUGERENCIA / MEJORA
**Indicadores**:
- Usuario propone nueva funcionalidad
- Solicita cambio en comportamiento existente
- Compara con otro sistema

**Respuesta**: Agradecer, registrar para product backlog, NO prometer implementación.

**Ejemplos**:
- "Sería útil tener notificaciones por email"
- "Podrían agregar integración con SAP"
- "El reporte debería incluir gráficas"

---

### Categoría: BUG
**Indicadores**:
- Comportamiento claramente incorrecto
- Error inesperado del sistema (500, crash)
- Datos corruptos o inconsistentes
- Cálculos incorrectos

**Respuesta**: Recopilar información detallada, ESCALAR a equipo técnico.

**Ejemplos**:
- "El total no suma bien"
- "Se guardó vacío aunque ingresé datos"
- "La página se queda cargando infinitamente"

---

## 2. Preguntas de Aclaración

Cuando la información del usuario sea insuficiente, usar estas preguntas:

### Para problemas de acceso:
- ¿Cuál es tu rol en el sistema? (Admin/Staff/Área/Lectura)
- ¿A qué empresa(s) tienes acceso?
- ¿Puedes iniciar sesión correctamente?

### Para problemas de importación:
- ¿Qué tipo de archivo estás importando? (Resultados/Presupuestos/Conciliaciones)
- ¿Ves algún mensaje de error específico?
- ¿El archivo tiene la estructura esperada (celda Concepto/Proyecto)?

### Para problemas de visualización:
- ¿Qué empresa y período tienes seleccionado?
- ¿Ves datos en otros períodos/empresas?
- ¿Otros usuarios ven los mismos datos?

### Para problemas de cálculos:
- ¿Qué valor esperabas vs qué valor muestra?
- ¿El proyecto tiene configurado reparto?
- ¿Hay datos importados para ese período?

---

## 3. Guías de Respuesta por Escenario

### Escenario: Usuario olvidó contraseña
```
No existe recuperación automática de contraseña.
Pasos:
1. Contactar al administrador del sistema
2. El admin puede resetear la contraseña desde Usuarios
3. Se asigna contraseña temporal
4. Usuario cambia contraseña al ingresar
```

### Escenario: No puede ver empresa
```
Las empresas visibles dependen de tu asignación.
Verificar:
1. ¿Tu usuario tiene esa empresa asignada?
2. Contactar administrador para revisar asignaciones
Ruta para Admin: Usuarios → Seleccionar usuario → Ver empresas asignadas
```

### Escenario: Importación falla sin mensaje
```
Causas comunes:
1. Archivo no es .xlsx (debe ser Excel 2007+)
2. No existe celda "Concepto/Proyecto" en el archivo
3. Archivo está abierto en otra aplicación
Solución:
1. Cerrar archivo en Excel
2. Verificar estructura del archivo
3. Reintentar importación
```

### Escenario: Reparto no se calcula
```
Verificaciones:
1. ¿La empresa tiene "Maneja Reparto" = Sí?
   Ruta: Catálogos → Empresas → Ver empresa
2. ¿El proyecto tiene "Aplica Reparto" = Sí?
   Ruta: Catálogos → Proyectos → Ver proyecto
3. ¿El proyecto tiene fórmula configurada?
   Ruta: Reparto → Configuración → Ver proyecto
4. ¿Hay resultados importados para ese período?
```

### Escenario: Datos no coinciden con archivo
```
Posibles causas:
1. Conceptos mapeados incorrectamente
2. Proyectos mapeados incorrectamente
3. Importación anterior no sobrescrita
Verificar:
1. Revisar mapeos en Catálogos → Concept Mappings
2. Revisar mapeos en Catálogos → Project Mappings
3. Reimportar seleccionando "Sobrescribir"
```

---

## 4. Señales de Escalamiento

### ESCALAR INMEDIATAMENTE si:
- Error 500 o crash del sistema
- Pérdida de datos
- Cálculos matemáticos incorrectos verificados
- Seguridad comprometida (acceso no autorizado)
- Base de datos inaccesible

### ESCALAR DESPUÉS DE INVESTIGAR si:
- Bug reproducible
- Comportamiento inconsistente
- Problema afecta a múltiples usuarios
- No hay workaround disponible

### NO ESCALAR (resolver con documentación):
- Dudas de uso
- Falta de permisos (es por diseño)
- Formato de archivo incorrecto
- Configuración faltante

---

## 5. Información a Recopilar para Escalamiento

### Para bugs:
1. **Usuario afectado**: email y rol
2. **Empresa/Período**: contexto exacto
3. **Pasos para reproducir**: secuencia exacta
4. **Resultado esperado vs actual**
5. **Mensaje de error**: texto exacto
6. **Navegador**: Chrome, Firefox, Safari, etc.
7. **Frecuencia**: siempre, a veces, primera vez

### Para sugerencias:
1. **Descripción clara** del feature deseado
2. **Caso de uso**: por qué lo necesita
3. **Impacto**: cuántos usuarios se beneficiarían
4. **Urgencia**: nice-to-have vs bloqueante

---

## 6. Respuestas Tipo

### Respuesta: Agradecimiento por sugerencia
```
Gracias por tu sugerencia sobre [FEATURE].
La hemos registrado en nuestro backlog de mejoras.
El equipo de producto evaluará su prioridad en próximas iteraciones.
Por ahora, [WORKAROUND SI EXISTE].
```

### Respuesta: Bug confirmado
```
Hemos identificado un problema con [DESCRIPCIÓN].
El equipo técnico ha sido notificado y está trabajando en la solución.
Te notificaremos cuando esté resuelto.
Mientras tanto, [WORKAROUND SI EXISTE].
```

### Respuesta: No es bug
```
El comportamiento que describes es el esperado porque [EXPLICACIÓN].
Esto está documentado en [REFERENCIA].
Si necesitas un comportamiento diferente, puedes [ALTERNATIVA].
```

### Respuesta: Falta de permisos
```
Tu rol ([ROL]) no tiene permisos para [ACCIÓN].
Esta restricción es por diseño de seguridad del sistema.
Si necesitas este acceso, contacta al administrador para:
- Cambiar tu rol, o
- Asignarte permisos adicionales
```

---

## 7. Métricas de Clasificación

Al cerrar cada consulta, clasificar como:

| Código | Tipo | Descripción |
|--------|------|-------------|
| DG | Duda General | Resuelta con documentación |
| PU | Problema de Uso | Error de usuario, resuelto |
| SM | Sugerencia/Mejora | Registrada para backlog |
| BG | Bug | Escalado a desarrollo |
| BC | Bug Cerrado | Bug resuelto/workaround |
| NP | No Procede | Fuera de alcance |

---

*Playbook generado: 9 de enero de 2026*
