# 14 - Roadmap y Criterios de Éxito

**Proyecto**: Arsen - Sistema de Control Presupuestal Multi-Empresa  
**Versión**: 1.0  
**Fecha**: 8 de enero de 2026

---

## 1. Roadmap por Fases

### MVP (4-6 semanas)

**Objetivo**: Sistema funcional para cierre mensual básico.

| Semana | Entregable |
|--------|------------|
| 1-2 | Infraestructura: Proyecto Next.js, auth, BD, catálogos básicos |
| 3 | Presupuestos: Captura, importación |
| 4 | Resultados: Importación con vista previa y resolución de conflictos |
| 5 | Comparativo: Vista real vs presupuesto |
| 6 | Dashboard: KPIs y reportes básicos |

**Historias MVP**:
- US-001: Login
- US-002: Gestión usuarios
- US-003: Selector empresa
- US-004: Gestión proyectos
- US-005: Gestión conceptos
- US-006: Captura presupuesto
- US-008: Importación resultados ⭐
- US-009: Consulta resultados
- US-010: Comparativo
- US-018: Dashboard

---

### V1 (2-3 semanas post-MVP)

**Objetivo**: Reparto completo y exportaciones.

| Semana | Entregable |
|--------|------------|
| 7 | Reparto: 7 tipos de fórmulas, configuración, cálculo |
| 8 | Exportaciones: Excel y PDF |
| 9 | Gastos administración: Vista separada |

**Historias V1**:
- US-011: Configuración reparto ⭐
- US-012: Visualización reparto
- US-015: Exportar Excel
- US-016: Exportar PDF
- US-017: Gastos administración

---

### V1.1 (1-2 semanas post-V1)

**Objetivo**: Refinamientos y conciliaciones.

| Semana | Entregable |
|--------|------------|
| 10 | Conciliaciones: Importación y captura manual |
| 11 | Refinamientos: Bugs, UX, feedback de usuarios |

**Historias V1.1**:
- US-013: Importar conciliaciones
- US-014: Captura conciliaciones
- Refinamientos varios

---

### V2 (Futuro)

**Posibles features**:
- Umbrales de desviación configurables con alertas visuales
- Alertas por correo automáticas
- Proyecciones/forecasting básico
- Flujos de aprobación de presupuesto
- Auditoría detallada de cambios
- APP móvil (read-only)

---

## 2. Diagrama de Gantt Simplificado

```
Semana:  1   2   3   4   5   6   7   8   9  10  11
        ─────────────────────────────────────────────
MVP     ████████████████████████████████████
        │   │   │   │   │   │
        │   │   │   │   │   └── Dashboard
        │   │   │   │   └── Comparativo
        │   │   │   └── Resultados (import)
        │   │   └── Presupuestos
        │   └── Auth + Catálogos
        └── Setup proyecto

V1                                      ████████████
                                        │   │   │
                                        │   │   └── Gastos Admin
                                        │   └── Exportaciones
                                        └── Reparto

V1.1                                                ████████
                                                    │   │
                                                    │   └── Refinamientos
                                                    └── Conciliaciones
```

---

## 3. Criterios de Éxito

### Métricas Cuantitativas

| Indicador | Baseline | Meta MVP | Meta V1 |
|-----------|----------|----------|---------|
| Tiempo cierre mensual/empresa | 4-8 hrs | <1 hr | <30 min |
| Errores de cálculo | Frecuentes | <5/mes | 0 |
| Tiempo generar reporte | 1-2 hrs | <10 min | <2 min |
| Adopción del sistema | 0% | 80% usuarios | 100% usuarios |

### Indicadores Cualitativos (Señales de Éxito)

**MVP Exitoso cuando**:
- [x] El equipo de finanzas completa un cierre mensual real en el sistema
- [x] Los datos importados coinciden con el archivo original
- [x] El comparativo muestra las mismas diferencias que el Excel manual

**V1 Exitoso cuando**:
- [x] El cálculo de reparto coincide con el Excel actual
- [x] Dirección puede exportar reportes sin intermediarios
- [x] Se deja de usar el archivo Excel de Utilidades

**V1.1 Exitoso cuando**:
- [x] Todas las conciliaciones se registran en el sistema
- [x] Los usuarios no reportan bugs críticos
- [x] El sistema se considera "fuente de verdad"

---

## 4. Riesgos y Mitigaciones

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|--------------|---------|------------|
| 1 | Formato Excel cambia inesperadamente | Media | Alto | Detección robusta + resolución manual + documentar patrones |
| 2 | Fórmulas de reparto mal implementadas | Alta | Alto | Tests exhaustivos + validación con datos reales |
| 3 | Baja adopción por usuarios | Media | Alto | UI intuitiva + capacitación + rollout gradual |
| 4 | Performance con muchos datos | Baja | Medio | Paginación + índices + monitoreo |
| 5 | Errores en producción | Media | Alto | Tests E2E + rollback fácil + ambiente preview |

---

## 5. Requerimientos No Funcionales

### Performance
- Tiempo de carga de página: <2 segundos
- Importación de Excel: <30 segundos para archivo típico
- Queries de dashboard: <1 segundo

### Disponibilidad
- Uptime objetivo: 99.5%
- Ventana de mantenimiento: N/A (serverless)

### Seguridad
- HTTPS obligatorio
- Contraseñas hasheadas con bcrypt
- Sesiones JWT con expiración 24h
- Rate limiting en login

### Escalabilidad
- Hasta 10 usuarios concurrentes
- Hasta 100k registros de resultados
- Hasta 10 empresas

### Usabilidad
- Responsive (desktop + tablet)
- Accesible (WCAG 2.1 AA básico)
- Navegación por teclado

---

## 6. Supuestos del Proyecto

| # | Supuesto | Impacto si es falso |
|---|----------|---------------------|
| 1 | El cliente proporciona archivos Excel a tiempo cada mes | Retraso en testing |
| 2 | Los ~10 usuarios existentes adoptarán el sistema | Resistencia al cambio |
| 3 | El formato del contador es estable | Ajustes frecuentes al parser |
| 4 | Las fórmulas de reparto están bien documentadas | Cálculos incorrectos |
| 5 | Neon/Vercel son estables | Buscar alternativas |

---

## 7. Dependencias Externas

| Dependencia | Responsable | Estado |
|-------------|-------------|--------|
| Archivos Excel de muestra | Cliente | ✅ Disponibles |
| Credenciales Neon | Desarrollo | ✅ Configurado |
| Dominio/DNS (si aplica) | Cliente | ✅ Vercel auto |
| Usuarios de prueba | Cliente | ✅ Configurados |

---

## 8. Equipo Sugerido

| Rol | Dedicación | Responsabilidad |
|-----|------------|-----------------|
| Desarrollador Full-Stack | 100% | Implementación completa |
| QA (opcional) | 20% | Testing E2E, validación |
| Product Owner | 10% | Validación, priorización |

---

## 9. Estado Actual (Enero 2026)

1. ✅ Documentación funcional y técnica completa
2. ✅ Repositorio y proyecto Next.js 16 configurado
3. ✅ Neon y Vercel configurados
4. ✅ Auth, catálogos, presupuestos, resultados, comparativo
5. ✅ Reparto completo (7 fórmulas), exportaciones Excel/PDF
6. ✅ Conciliaciones, refinamientos M5 (Mobile/PWA), M6 (UI Polish)
7. ✅ Rate limiting y security headers implementados

---

*Documento actualizado: 9 de enero de 2026*
