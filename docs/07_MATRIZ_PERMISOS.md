# 07 - Matriz de Permisos (RBAC)

**Proyecto**: Arsen - Sistema de Control Presupuestal Multi-Empresa  
**Versión**: 1.0  
**Fecha**: 8 de enero de 2026

---

## 1. Roles del Sistema

| Rol | Código | Descripción |
|-----|--------|-------------|
| **Administrador** | `ADMIN` | Control total del sistema, incluyendo usuarios y configuración |
| **Staff** | `STAFF` | Operación completa sin gestión de usuarios |
| **Usuario de Área** | `AREA_USER` | Gestión de presupuestos de su área + consultas |
| **Solo Lectura** | `READONLY` | Visualización sin modificación |

---

## 2. Matriz de Permisos por Módulo

### 2.1 Autenticación y Usuarios

| Acción | Admin | Staff | Área | Lectura |
|--------|-------|-------|------|---------|
| Login | ✅ | ✅ | ✅ | ✅ |
| Ver perfil propio | ✅ | ✅ | ✅ | ✅ |
| Editar perfil propio | ✅ | ✅ | ✅ | ✅ |
| Cambiar contraseña propia | ✅ | ✅ | ✅ | ✅ |
| **Listar usuarios** | ✅ | ❌ | ❌ | ❌ |
| **Crear usuario** | ✅ | ❌ | ❌ | ❌ |
| **Editar usuario** | ✅ | ❌ | ❌ | ❌ |
| **Desactivar usuario** | ✅ | ❌ | ❌ | ❌ |
| **Asignar roles** | ✅ | ❌ | ❌ | ❌ |

---

### 2.2 Empresas

| Acción | Admin | Staff | Área | Lectura |
|--------|-------|-------|------|---------|
| Ver lista de empresas | ✅ | ✅ | 🔶* | 🔶* |
| Cambiar empresa activa | ✅ | ✅ | 🔶* | 🔶* |
| **Crear empresa** | ✅ | ❌ | ❌ | ❌ |
| **Editar empresa** | ✅ | ❌ | ❌ | ❌ |
| **Activar/Desactivar empresa** | ✅ | ❌ | ❌ | ❌ |
| **Configurar reparto empresa** | ✅ | ✅ | ❌ | ❌ |

*🔶 Solo empresas asignadas*

---

### 2.3 Catálogos - Proyectos

| Acción | Admin | Staff | Área | Lectura |
|--------|-------|-------|------|---------|
| Ver proyectos | ✅ | ✅ | ✅ | ✅ |
| **Crear proyecto** | ✅ | ✅ | ❌ | ❌ |
| **Editar proyecto** | ✅ | ✅ | ❌ | ❌ |
| **Configurar reparto proyecto** | ✅ | ✅ | ❌ | ❌ |
| **Desactivar proyecto** | ✅ | ✅ | ❌ | ❌ |

---

### 2.4 Catálogos - Conceptos

| Acción | Admin | Staff | Área | Lectura |
|--------|-------|-------|------|---------|
| Ver conceptos | ✅ | ✅ | ✅ | ✅ |
| **Crear concepto** | ✅ | ✅ | ❌ | ❌ |
| **Editar concepto** | ✅ | ✅ | ❌ | ❌ |
| **Mapear concepto** | ✅ | ✅ | ❌ | ❌ |

---

### 2.5 Catálogos - Áreas

| Acción | Admin | Staff | Área | Lectura |
|--------|-------|-------|------|---------|
| Ver áreas | ✅ | ✅ | ✅ | ✅ |
| **Crear área** | ✅ | ✅ | ❌ | ❌ |
| **Editar área** | ✅ | ✅ | ❌ | ❌ |

---

### 2.6 Presupuestos

| Acción | Admin | Staff | Área | Lectura |
|--------|-------|-------|------|---------|
| Ver presupuestos (todos) | ✅ | ✅ | ❌ | ✅ |
| Ver presupuestos (su área) | ✅ | ✅ | ✅ | 🔶* |
| **Capturar presupuesto (cualquier área)** | ✅ | ✅ | ❌ | ❌ |
| **Capturar presupuesto (su área)** | ✅ | ✅ | ✅ | ❌ |
| **Importar presupuesto** | ✅ | ✅ | ❌ | ❌ |
| **Editar presupuesto** | ✅ | ✅ | 🔶** | ❌ |

*🔶 Solo si pertenece a empresas asignadas*  
*🔶** Solo su área asignada*

---

### 2.7 Resultados (Datos del Contador)

| Acción | Admin | Staff | Área | Lectura |
|--------|-------|-------|------|---------|
| Ver resultados | ✅ | ✅ | ✅ | ✅ |
| Ver detalle por proyecto | ✅ | ✅ | ✅ | ✅ |
| Ver detalle por concepto | ✅ | ✅ | ✅ | ✅ |
| **Importar resultados** | ✅ | ✅ | ❌ | ❌ |
| **Resolver conflictos importación** | ✅ | ✅ | ❌ | ❌ |
| **Editar resultados** | ✅ | ✅ | ❌ | ❌ |

---

### 2.8 Comparativo

| Acción | Admin | Staff | Área | Lectura |
|--------|-------|-------|------|---------|
| Ver comparativo | ✅ | ✅ | ✅ | ✅ |
| Aplicar filtros | ✅ | ✅ | ✅ | ✅ |
| Drill-down detalle | ✅ | ✅ | ✅ | ✅ |

---

### 2.9 Reparto

| Acción | Admin | Staff | Área | Lectura |
|--------|-------|-------|------|---------|
| Ver configuración reparto | ✅ | ✅ | ✅ | ✅ |
| Ver cálculo reparto | ✅ | ✅ | ✅ | ✅ |
| **Configurar fórmulas reparto** | ✅ | ✅ | ❌ | ❌ |
| **Activar/Desactivar reparto empresa** | ✅ | ❌ | ❌ | ❌ |

---

### 2.10 Conciliaciones

| Acción | Admin | Staff | Área | Lectura |
|--------|-------|-------|------|---------|
| Ver conciliaciones | ✅ | ✅ | ✅ | ✅ |
| Buscar/Filtrar | ✅ | ✅ | ✅ | ✅ |
| **Importar conciliaciones** | ✅ | ✅ | ❌ | ❌ |
| **Capturar conciliación** | ✅ | ✅ | ❌ | ❌ |
| **Editar conciliación** | ✅ | ✅ | ❌ | ❌ |

---

### 2.11 Reportes y Exportación

| Acción | Admin | Staff | Área | Lectura |
|--------|-------|-------|------|---------|
| Ver dashboards | ✅ | ✅ | ✅ | ✅ |
| Ver reportes | ✅ | ✅ | ✅ | ✅ |
| Exportar Excel | ✅ | ✅ | ✅ | ✅ |
| Exportar PDF | ✅ | ✅ | ✅ | ✅ |

---

### 2.12 Períodos

| Acción | Admin | Staff | Área | Lectura |
|--------|-------|-------|------|---------|
| Ver períodos | ✅ | ✅ | ✅ | ✅ |
| **Cerrar período** | ✅ | ❌ | ❌ | ❌ |
| **Reabrir período** | ✅ | ❌ | ❌ | ❌ |

---

### 2.13 Configuración del Sistema

| Acción | Admin | Staff | Área | Lectura |
|--------|-------|-------|------|---------|
| **Ver configuración sistema** | ✅ | ❌ | ❌ | ❌ |
| **Editar configuración sistema** | ✅ | ❌ | ❌ | ❌ |

---

## 3. Restricciones por Empresa

### Usuarios con acceso limitado por empresa

| Rol | Acceso a empresas |
|-----|-------------------|
| Admin | Todas |
| Staff | Todas |
| Área | Solo asignadas |
| Lectura | Solo asignadas |

### Implementación
```typescript
// Middleware de autorización
if (user.role === 'ADMIN' || user.role === 'STAFF') {
  // Acceso a todas las empresas
  allowedCompanies = allCompanies;
} else {
  // Acceso solo a empresas asignadas
  allowedCompanies = user.assignedCompanies;
}

// Verificar en cada query
if (!allowedCompanies.includes(requestedCompanyId)) {
  throw new ForbiddenError('No tiene acceso a esta empresa');
}
```

---

## 4. Restricciones por Área

### Usuario de Área

| Recurso | Restricción |
|---------|-------------|
| Presupuesto - Captura | Solo su área asignada |
| Presupuesto - Consulta | Todos (solo lectura) |
| Resultados | Solo lectura (todos) |
| Comparativo | Solo lectura (todos) |

### Implementación
```typescript
// Verificar área en operaciones de escritura
if (user.role === 'AREA_USER') {
  if (operation === 'CREATE' || operation === 'UPDATE') {
    if (resource === 'budget') {
      if (!user.assignedAreas.includes(targetAreaId)) {
        throw new ForbiddenError('No tiene permisos para esta área');
      }
    }
  }
}
```

---

## 5. Permisos en API Routes

### Formato de decorador/middleware

```typescript
// Ejemplo de protección de rutas
export const routePermissions = {
  // Usuarios
  'GET /api/users': ['ADMIN'],
  'POST /api/users': ['ADMIN'],
  'PUT /api/users/:id': ['ADMIN'],
  'DELETE /api/users/:id': ['ADMIN'],
  
  // Empresas
  'GET /api/companies': ['ADMIN', 'STAFF', 'AREA_USER', 'READONLY'],
  'POST /api/companies': ['ADMIN'],
  'PUT /api/companies/:id': ['ADMIN'],
  
  // Presupuestos
  'GET /api/budgets': ['ADMIN', 'STAFF', 'AREA_USER', 'READONLY'],
  'POST /api/budgets': ['ADMIN', 'STAFF', 'AREA_USER'],
  'PUT /api/budgets/:id': ['ADMIN', 'STAFF', 'AREA_USER'],
  
  // Resultados
  'GET /api/results': ['ADMIN', 'STAFF', 'AREA_USER', 'READONLY'],
  'POST /api/results/import': ['ADMIN', 'STAFF'],
  'PUT /api/results/:id': ['ADMIN', 'STAFF'],
  
  // Reparto
  'GET /api/profit-sharing': ['ADMIN', 'STAFF', 'AREA_USER', 'READONLY'],
  'PUT /api/profit-sharing/:projectId': ['ADMIN', 'STAFF'],
  
  // Exportación
  'GET /api/export/excel': ['ADMIN', 'STAFF', 'AREA_USER', 'READONLY'],
  'GET /api/export/pdf': ['ADMIN', 'STAFF', 'AREA_USER', 'READONLY'],
};
```

---

## 6. Resumen Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                       STAFF                                │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │               AREA_USER                              │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │              READONLY                          │  │  │  │
│  │  │  │                                                │  │  │  │
│  │  │  │  • Ver dashboards                              │  │  │  │
│  │  │  │  • Ver reportes                                │  │  │  │
│  │  │  │  • Exportar                                    │  │  │  │
│  │  │  └────────────────────────────────────────────────┘  │  │  │
│  │  │  + Capturar presupuesto (su área)                    │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │  + Importar resultados                                      │  │
│  │  + Gestionar catálogos                                      │  │
│  │  + Configurar reparto proyectos                             │  │
│  │  + Gestionar conciliaciones                                 │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  + Gestión de usuarios                                            │
│  + Configuración del sistema                                      │
│  + Cerrar/Reabrir períodos                                        │
│  + Activar/Desactivar reparto empresa                             │
└───────────────────────────────────────────────────────────────────┘
```

---

*Documento generado: 8 de enero de 2026*
