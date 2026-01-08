# 11 - Especificación de API

**Proyecto**: Arsen - Sistema de Control Presupuestal Multi-Empresa  
**Versión**: 1.0  
**Fecha**: 8 de enero de 2026

---

## 1. Convenciones Generales

### Base URL
```
Desarrollo: http://localhost:3000/api
Producción: https://arsen.vercel.app/api
```

### Formato de Respuestas

**Éxito:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo 'amount' es requerido",
    "details": { ... }
  }
}
```

### Headers Requeridos
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### Códigos HTTP
| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validación) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 2. Autenticación

### POST /api/auth/login
Login con credenciales.

**Request:**
```json
{
  "email": "usuario@empresa.com",
  "password": "contraseña123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@empresa.com",
      "name": "Ana García",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /api/auth/logout
Cerrar sesión.

### GET /api/auth/me
Obtener usuario actual.

---

## 3. Usuarios

### GET /api/users
Lista de usuarios. **Solo ADMIN.**

**Query params:**
- `page` (default: 1)
- `limit` (default: 20)
- `role` (opcional)
- `isActive` (opcional)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "usuario@empresa.com",
      "name": "Ana García",
      "role": "ADMIN",
      "isActive": true,
      "companies": ["uuid1", "uuid2"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10
  }
}
```

### POST /api/users
Crear usuario. **Solo ADMIN.**

**Request:**
```json
{
  "email": "nuevo@empresa.com",
  "name": "Carlos López",
  "password": "temporal123",
  "role": "STAFF",
  "companyIds": ["uuid1"],
  "areaId": null
}
```

### PUT /api/users/:id
Actualizar usuario. **Solo ADMIN.**

### DELETE /api/users/:id
Desactivar usuario (soft delete). **Solo ADMIN.**

---

## 4. Empresas

### GET /api/companies
Lista de empresas accesibles para el usuario.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Wepark",
      "code": "WPK",
      "handlesProfitSharing": true,
      "isActive": true
    }
  ]
}
```

### POST /api/companies
Crear empresa. **Solo ADMIN.**

### PUT /api/companies/:id
Actualizar empresa. **Solo ADMIN.**

### PUT /api/companies/:id/profit-sharing
Activar/desactivar reparto. **Solo ADMIN.**

```json
{
  "handlesProfitSharing": true
}
```

---

## 5. Proyectos

### GET /api/companies/:companyId/projects
Lista de proyectos de una empresa.

**Query params:**
- `isActive` (opcional)
- `appliesProfitSharing` (opcional)

### POST /api/companies/:companyId/projects
Crear proyecto. **ADMIN, STAFF.**

```json
{
  "name": "Torre Prisma",
  "code": "TP",
  "appliesProfitSharing": true
}
```

### PUT /api/projects/:id
Actualizar proyecto.

### PUT /api/projects/:id/profit-sharing-rule
Configurar regla de reparto. **ADMIN, STAFF.**

```json
{
  "formulaType": "TIERED",
  "percent1": 30,
  "threshold1": 1000000,
  "percent2": 25,
  "notes": "30% primer millón, 25% resto"
}
```

---

## 6. Conceptos

### GET /api/concepts
Lista de conceptos.

**Query params:**
- `type` (INCOME | COST)
- `areaId` (opcional)
- `isActive` (opcional)

### POST /api/concepts
Crear concepto. **ADMIN, STAFF.**

```json
{
  "name": "Tarifa horaria",
  "type": "INCOME",
  "areaId": "uuid"
}
```

### PUT /api/concepts/:id
Actualizar concepto.

---

## 7. Áreas

### GET /api/companies/:companyId/areas
Lista de áreas de una empresa.

### POST /api/companies/:companyId/areas
Crear área. **ADMIN, STAFF.**

```json
{
  "name": "Compras"
}
```

---

## 8. Presupuestos

### GET /api/companies/:companyId/budgets
Obtener presupuestos.

**Query params:**
- `year` (requerido)
- `month` (opcional, si no se pasa devuelve todo el año)
- `areaId` (opcional)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "areaId": "uuid",
      "areaName": "Compras",
      "conceptId": "uuid",
      "conceptName": "Papelería",
      "year": 2025,
      "month": 1,
      "amount": 3800.00
    }
  ]
}
```

### POST /api/companies/:companyId/budgets
Guardar/actualizar presupuestos (batch).

```json
{
  "year": 2025,
  "areaId": "uuid",
  "items": [
    {
      "conceptId": "uuid",
      "values": {
        "1": 3800,
        "2": 0,
        "3": 0,
        ...
        "12": 3800
      }
    }
  ]
}
```

### POST /api/companies/:companyId/budgets/import
Importar presupuesto desde Excel.

**Request:** `multipart/form-data`
- `file`: Archivo Excel
- `areaId`: ID del área

---

## 9. Resultados

### GET /api/companies/:companyId/results
Obtener resultados.

**Query params:**
- `year` (requerido)
- `month` (requerido)
- `projectId` (opcional)

**Response:**
```json
{
  "data": {
    "period": "2025-01",
    "projects": [
      {
        "id": "uuid",
        "name": "Torre Prisma",
        "totalIncome": 150000,
        "totalCost": 80000,
        "grossProfit": 70000,
        "concepts": [
          {
            "id": "uuid",
            "name": "Tarifa horaria",
            "type": "INCOME",
            "amount": 100000
          }
        ]
      }
    ],
    "administration": {
      "totalCost": 25000,
      "concepts": [...]
    },
    "totals": {
      "income": 500000,
      "cost": 350000,
      "grossProfit": 150000
    }
  }
}
```

### POST /api/companies/:companyId/results/import
Importar resultados desde Excel.

**Request:** `multipart/form-data`
- `file`: Archivo Excel
- `year`: Año
- `month`: Mes (1-12)

**Response:**
```json
{
  "data": {
    "preview": {
      "projects": ["Torre Prisma", "Summit", "NEW: Plaza Norte"],
      "concepts": [...],
      "warnings": [
        {
          "type": "NEW_PROJECT",
          "value": "Plaza Norte",
          "row": 6
        }
      ],
      "errors": []
    },
    "importId": "temp-uuid"
  }
}
```

### POST /api/companies/:companyId/results/import/:importId/confirm
Confirmar importación después de resolver conflictos.

```json
{
  "resolutions": {
    "projects": {
      "Plaza Norte": { "action": "CREATE", "name": "Plaza Norte" }
    },
    "concepts": {
      "Serv. Especiales": { "action": "MAP", "conceptId": "uuid" }
    }
  }
}
```

---

## 10. Comparativo

### GET /api/companies/:companyId/comparison
Obtener comparativo real vs presupuesto.

**Query params:**
- `year` (requerido)
- `month` (requerido)

**Response:**
```json
{
  "data": {
    "period": "2025-01",
    "items": [
      {
        "conceptId": "uuid",
        "conceptName": "Tarifa horaria",
        "type": "INCOME",
        "budget": 100000,
        "actual": 95000,
        "variance": -5000,
        "variancePercent": -5
      }
    ],
    "totals": {
      "budgetIncome": 500000,
      "actualIncome": 480000,
      "budgetCost": 300000,
      "actualCost": 290000
    }
  }
}
```

---

## 11. Reparto (Profit Sharing)

### GET /api/companies/:companyId/profit-sharing
Obtener resultados de reparto.

**Query params:**
- `year` (requerido)
- `month` (requerido)

**Response:**
```json
{
  "data": {
    "period": "2025-01",
    "projects": [
      {
        "id": "uuid",
        "name": "Torre Prisma",
        "grossProfit": 70000,
        "companyFee": 21000,
        "clientProfit": 49000,
        "formula": "30% utilidad",
        "breakdown": {
          "percent1": 30,
          "calculatedFee": 21000
        }
      }
    ],
    "totals": {
      "grossProfit": 150000,
      "companyFee": 45000,
      "clientProfit": 105000
    }
  }
}
```

---

## 12. Conciliaciones

### GET /api/companies/:companyId/reconciliations
Listar conciliaciones.

**Query params:**
- `startDate` (opcional)
- `endDate` (opcional)
- `projectId` (opcional)
- `page`, `limit`

### POST /api/companies/:companyId/reconciliations
Crear conciliación manual.

```json
{
  "date": "2025-01-15",
  "reference": "TEF",
  "supplier": "Proveedor XYZ",
  "projectId": "uuid",
  "conceptId": "uuid",
  "subtotal": 10000,
  "tax": 1600,
  "total": 11600
}
```

### POST /api/companies/:companyId/reconciliations/import
Importar conciliaciones desde Excel.

---

## 13. Exportación

### GET /api/export/excel
Exportar a Excel.

**Query params:**
- `report`: tipo de reporte (results | comparison | profit-sharing | budget)
- `companyId`
- `year`
- `month`
- `projectId` (opcional)

**Response:** Archivo .xlsx

### GET /api/export/pdf
Exportar a PDF.

**Query params:** (mismos que Excel)

**Response:** Archivo .pdf

---

## 14. Períodos

### GET /api/companies/:companyId/periods
Listar períodos.

**Query params:**
- `year` (opcional)

### PUT /api/companies/:companyId/periods/:periodId/close
Cerrar período. **Solo ADMIN.**

### PUT /api/companies/:companyId/periods/:periodId/reopen
Reabrir período. **Solo ADMIN.**

---

## 15. Server Actions (Alternativa)

La mayoría de operaciones se implementarán como **Server Actions** en lugar de API Routes para mejor integración con React Server Components.

```typescript
// actions/results.ts
'use server';

export async function importResults(
  companyId: string,
  formData: FormData
): Promise<ImportPreview> {
  // ...
}

export async function confirmImport(
  companyId: string,
  importId: string,
  resolutions: Resolutions
): Promise<ImportResult> {
  // ...
}
```

---

*Documento generado: 8 de enero de 2026*
