# AI Support Index - Arsen

**Propósito**: Índice y mapa de navegación para AI Support Agent  
**Actualizado**: 9 de enero de 2026

---

## Archivos de Soporte

| Archivo | Propósito | Cuándo usar |
|---------|-----------|-------------|
| `AI_SUPPORT_KNOWLEDGE.md` | Base de conocimiento principal | Siempre como contexto base |
| `AI_SUPPORT_PLAYBOOK.md` | Guías operativas de clasificación | Para clasificar y escalar |
| `AI_SUPPORT_FAQ.md` | Respuestas detalladas por tema | Consulta específica |

---

## Mapa de Documentación Completa (/docs)

### Documentación Funcional
| Archivo | Contenido | Usar para |
|---------|-----------|-----------|
| `01_RESUMEN_EJECUTIVO.md` | Visión, stack, alcance | Contexto general |
| `02_USER_PERSONAS.md` | Perfiles de usuario | Entender tipos de usuario |
| `03_ANALISIS_FUNCIONAL.md` | Módulos del sistema | Funcionalidades por módulo |
| `04_FLUJOS_FUNCIONALES.md` | Diagramas de flujos | Entender procesos |
| `05_USER_STORIES.md` | 18 historias de usuario | Comportamiento esperado |
| `06_REGLAS_NEGOCIO.md` | 100+ reglas de validación | Verificar comportamiento correcto |
| `07_MATRIZ_PERMISOS.md` | RBAC detallado | Verificar permisos por rol |
| `08_GLOSARIO.md` | Términos de negocio y técnicos | Aclarar terminología |

### Documentación Técnica
| Archivo | Contenido | Usar para |
|---------|-----------|-----------|
| `09_ARQUITECTURA_TECNICA.md` | Stack, patrones, código | Contexto técnico |
| `10_MODELO_DATOS.md` | Esquema de BD | Entender relaciones de datos |
| `11_ESPECIFICACION_API.md` | Endpoints y ejemplos | Referencia técnica |
| `12_DESPLIEGUE.md` | Variables, deploy, CI/CD | Problemas de infraestructura |
| `13_PLAN_TESTING.md` | Estrategia de testing | Cobertura de tests |
| `14_ROADMAP.md` | Estado del proyecto | Qué está implementado |

---

## Árbol de Decisión de Soporte

```
¿El usuario puede iniciar sesión?
├── NO → Ver FAQ: Autenticación y Acceso
│   ├── ¿Credenciales incorrectas? → Contactar Admin
│   ├── ¿Usuario desactivado? → Contactar Admin
│   └── ¿Sesión expirada? → Reiniciar sesión
│
└── SÍ → ¿Qué intenta hacer?
    │
    ├── IMPORTAR DATOS
    │   ├── ¿Resultados? → FAQ: Importación de Resultados
    │   ├── ¿Presupuestos? → FAQ: Presupuestos
    │   └── ¿Conciliaciones? → FAQ: Conciliaciones
    │
    ├── CONSULTAR INFORMACIÓN
    │   ├── ¿Dashboard? → KNOWLEDGE: Módulos
    │   ├── ¿Comparativo? → FAQ: Comparativo
    │   └── ¿Reparto? → FAQ: Reparto de Utilidades
    │
    ├── CONFIGURAR
    │   ├── ¿Reparto? → FAQ: Reparto → Configuración
    │   ├── ¿Usuarios? → FAQ: Usuarios (Solo Admin)
    │   └── ¿Catálogos? → FAQ: Catálogos
    │
    ├── EXPORTAR
    │   └── FAQ: Exportación
    │
    └── ERROR/PROBLEMA
        └── PLAYBOOK: Clasificación de Consultas
```

---

## Reglas de Negocio Críticas

Estas son las reglas más importantes a verificar:

| ID | Regla | Referencia |
|----|-------|------------|
| RN-001 | Sesiones expiran en 24h, una sola activa por usuario | `06_REGLAS_NEGOCIO.md` |
| RN-010 | Solo empresas con "Maneja Reparto" calculan reparto | `06_REGLAS_NEGOCIO.md` |
| RN-051-057 | 7 tipos de fórmulas de reparto | `06_REGLAS_NEGOCIO.md` |
| RN-121 | Soft delete en datos contables | `06_REGLAS_NEGOCIO.md` |
| RN-122 | Auditoría con createdBy | `06_REGLAS_NEGOCIO.md` |

---

## Usuarios de Referencia

Para testing y ejemplos:

| Nombre | Email | Rol | Empresas |
|--------|-------|-----|----------|
| Ana García | admin@arsen.com | ADMIN | Todas |
| Carlos Mendoza | carlos@arsen.com | STAFF | Todas |
| María López | maria@arsen.com | AREA_USER | Wepark |
| Roberto Sánchez | roberto@arsen.com | READONLY | Todas |

---

## Supuestos No Documentados

Estas son asunciones del sistema que no están explícitamente documentadas:

| Supuesto | Implicación |
|----------|-------------|
| Solo un admin activo inicialmente | Si se desactiva, nadie puede crear usuarios |
| No hay validación de email | Cualquier formato se acepta |
| No hay límite de empresas | Sistema diseñado para ~10 |
| Año mínimo: 2020, máximo: 2100 | Validación en formularios |
| Concurrencia máxima: ~10 usuarios | No load balancing |

---

## Canales de Escalamiento

| Nivel | Tipo de Issue | Canal |
|-------|---------------|-------|
| L1 | Dudas / Uso | AI Support (este sistema) |
| L2 | Bugs confirmados | Ticket a desarrollo |
| L3 | Infraestructura / Seguridad | Alerta inmediata a DevOps |

---

*Índice generado: 9 de enero de 2026*
