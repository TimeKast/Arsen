# 01 - Resumen Ejecutivo

**Proyecto**: Arsen - Sistema de Control Presupuestal Multi-Empresa  
**Versión**: 1.0  
**Fecha**: 8 de enero de 2026

---

## Visión del Producto

Arsen es una plataforma web que centraliza el control presupuestal y de resultados financieros para múltiples empresas, eliminando el trabajo manual de consolidación en hojas de cálculo y proporcionando visibilidad inmediata del desempeño por empresa, proyecto y concepto.

---

## Problema que Resuelve

### Situación Actual
- El equipo de finanzas gestiona 2+ empresas (Wepark, Sigma) mediante archivos Excel dispersos
- Cada cierre mensual requiere 4-8 horas por empresa para cruzar información
- Los archivos del contador, presupuestos y conciliaciones se procesan manualmente
- Las fórmulas de reparto de utilidad por proyecto se aplican con riesgo de errores
- No existe una fuente única de verdad para consultas rápidas

### Impacto del Problema
- Pérdida de tiempo en tareas repetitivas
- Errores de cálculo que afectan decisiones
- Demoras en la generación de reportes para dirección
- Dificultad para comparar desempeño entre proyectos

---

## Solución Propuesta

### Funcionalidades Clave

| Módulo | Descripción |
|--------|-------------|
| **Multi-empresa** | Gestión centralizada con separación por empresa |
| **Presupuestos** | Captura e importación por área/concepto/mes |
| **Resultados** | Importación automática del archivo del contador |
| **Comparativo** | Real vs presupuesto con indicadores visuales |
| **Reparto** | Motor de cálculo con 7 tipos de fórmulas configurables |
| **Reportes** | Exportación a Excel y PDF |

### Beneficios Esperados

| Métrica | Antes | Después |
|---------|-------|---------|
| Tiempo de cierre mensual | 4-8 horas/empresa | <30 minutos/empresa |
| Errores de cálculo | Frecuentes | Cercanos a cero |
| Tiempo para generar reporte | 1-2 horas | <2 minutos |

---

## Alcance MVP

### ✅ Incluido
- Gestión multi-empresa (escalable)
- Catálogos: empresas, proyectos, conceptos, áreas
- Presupuestos por área/concepto/mes
- Importación de resultados del contador
- Comparativo real vs presupuesto
- Gastos de administración (empresa general)
- Configuración de reglas de reparto por proyecto
- Vista por mes y por proyecto
- Exportación a Excel y PDF
- 4 roles de usuario

### ❌ No Incluido (Fase Posterior)
- Flujos de aprobación
- Integración con sistemas contables
- Proyecciones/forecasting
- Alertas automáticas por correo
- Umbrales de desviación configurables
- App móvil

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Next.js API Routes / Server Actions |
| ORM | Drizzle ORM |
| Base de datos | PostgreSQL (Neon) |
| Autenticación | NextAuth.js v5 |
| Hosting | Vercel |

---

## Usuarios del Sistema

| Rol | Cantidad | Función Principal |
|-----|----------|-------------------|
| Admin | 1-2 | Gestión total, usuarios, configuración |
| Staff | 2-3 | Operación diaria, carga de datos |
| Usuario Área | 4-5 | Subir presupuestos de su área |
| Solo Lectura | 2-3 | Consulta de reportes |

**Total estimado**: ~10 usuarios  
**Concurrencia esperada**: 1-2 usuarios

---

## Cronograma Estimado

| Fase | Entregables | Duración Estimada |
|------|-------------|-------------------|
| **MVP** | Core funcional: empresas, presupuestos, resultados, comparativo básico | 4-6 semanas |
| **V1** | Reparto completo, exportaciones, todos los reportes | 2-3 semanas |
| **V1.1** | Refinamientos basados en uso real | 1-2 semanas |

---

## Criterios de Éxito

1. El cierre mensual se completa en menos de 30 minutos por empresa
2. Los usuarios dejan de usar hojas de cálculo paralelas
3. Dirección puede consultar reportes sin intermediarios
4. El cálculo de reparto es confiable y auditable
5. Se puede agregar una nueva empresa sin cambios al sistema

---

## Documentos Relacionados

| Documento | Descripción |
|-----------|-------------|
| [00_FASE0_SUPUESTOS.md](./00_FASE0_SUPUESTOS.md) | Supuestos y decisiones técnicas |
| [02_USER_PERSONAS.md](./02_USER_PERSONAS.md) | Perfiles de usuario |
| [03_ANALISIS_FUNCIONAL.md](./03_ANALISIS_FUNCIONAL.md) | Análisis funcional detallado |
| [04_FLUJOS_FUNCIONALES.md](./04_FLUJOS_FUNCIONALES.md) | Flujos de usuario |
| [05_USER_STORIES.md](./05_USER_STORIES.md) | Historias de usuario |
| [06_REGLAS_NEGOCIO.md](./06_REGLAS_NEGOCIO.md) | Reglas de negocio |

---

*Documento generado: 8 de enero de 2026*
