# 📖 Guía de Linear - Estructura y API

Guía para trabajar con Linear, crear Projects, Milestones e Issues.

---

## ⚙️ CONFIGURACIÓN PERSONALIZABLE

> **Edita estos valores antes de usar la guía o los scripts**

```javascript
// ============================================
// 🔧 CONFIGURACIÓN - EDITAR AQUÍ
// ============================================

// Tu API Key de Linear (obtener en https://linear.app/settings/api)

// Nombre del Team donde se crearán los proyectos
const TEAM_NAME = 'Jose'

// URL del repositorio de GitHub (opcional, para links en issues)
const GITHUB_REPO_URL = 'https://github.com/TimeKast/Arsen'

// ============================================
```

### Obtener nueva API Key

1. Ve a: https://linear.app/settings/api
2. Click "Personal API keys"
3. Click "Create key"
4. Nombrar según tu proyecto
5. Copiar el key (empieza con `lin_api_...`)

⚠️ **Importante**: No compartir esta key públicamente.

---

## 🏗️ Estructura Jerárquica

```
Team (Jose)
└── Project (Mi App)
    ├── Milestone 1.0 (MVP)
    │   ├── Issue: [APP-001] Setup inicial
    │   ├── Issue: [APP-002] Crear componentes
    │   └── Issue: [APP-003] Integrar API
    ├── Milestone 1.1 (Features)
    │   ├── Issue: [APP-004] Login
    │   └── Issue: [APP-005] Dashboard
    └── Milestone 1.2 (Polish)
        └── Issues...
```

### Elementos Clave

| Elemento      | Descripción                 | Ejemplo                      |
| ------------- | --------------------------- | ---------------------------- |
| **Team**      | Tu espacio de trabajo       | "Jose"                       |
| **Project**   | Una aplicación/producto     | "Cotizador ACFIN"            |
| **Milestone** | Fase o versión del proyecto | "1.0 MVP", "1.1 Features"    |
| **Issue**     | Tarea individual            | "[UI-001] Crear header"      |
| **Labels**    | Etiquetas para categorizar  | "frontend", "bug", "backend" |

### Filosofía

- **1 App = 1 Project**
- **1 Fase/Versión = 1 Milestone**
- **1 Tarea = 1 Issue**

---

## 🛠️ Usando la API de Linear

### Instalación

```bash
npm install @linear/sdk dotenv
```

### Setup Básico

```javascript
require('dotenv').config()
const { LinearClient } = require('@linear/sdk')

const client = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY,
})
```

### Operaciones Comunes

#### 1. Obtener Team

```javascript
const teams = await client.teams()
const team = teams.nodes.find(t => t.name === process.env.TEAM_NAME)
// o directamente: t.name === 'Jose'
const teamId = team.id
```

#### 2. Crear Project

```javascript
const projectPayload = await client.createProject({
  name: 'Mi Nueva App',
  description: 'Descripción del proyecto',
  teamIds: [teamId],
})
const project = await projectPayload.project
const projectId = project.id
```

#### 3. Crear Milestone

```javascript
const milestonePayload = await client.createProjectMilestone({
  name: '1.0 MVP',
  description: 'Primera versión funcional',
  projectId: projectId,
})
const milestone = await milestonePayload.projectMilestone
const milestoneId = milestone.id
```

#### 4. Crear Issue

```javascript
const issuePayload = await client.createIssue({
  teamId: teamId,
  projectId: projectId,
  projectMilestoneId: milestoneId,
  title: '[APP-001] Setup inicial del proyecto',
  description: 'Configurar el proyecto base...',
  estimate: 2, // Story points
  priority: 2, // 1=Urgent, 2=High, 3=Medium, 4=Low
  stateId: todoStateId, // ID del estado "Todo"
  labelIds: [labelId], // Array de IDs de labels
})

const issue = await issuePayload.issue
const issueId = issue?.id

// Pausa entre requests para evitar rate limits
await new Promise(resolve => setTimeout(resolve, 100))
```

#### 5. Crear Label

```javascript
const labelPayload = await client.createIssueLabel({
  name: 'frontend',
  teamId: teamId,
  color: '#025596', // Color hex opcional
})
const label = await labelPayload.issueLabel
const labelId = label.id
```

#### 6. Crear Dependency entre Issues

```javascript
// Si APP-002 depende de APP-001, entonces APP-001 BLOQUEA a APP-002
await client.createIssueRelation({
  issueId: app001Id, // El que debe hacerse PRIMERO
  relatedIssueId: app002Id, // El que depende
  type: 'blocks',
})
```

#### 7. Obtener Estados del Workflow

```javascript
const workflowStates = await team.states()
const todoState = workflowStates.nodes.find(s => s.name === 'Todo' || s.name === 'Backlog')
const todoStateId = todoState.id
```

---

## 🎯 Workflow para Crear Backlog

### Ejemplo Completo

```javascript
require('dotenv').config()
const { LinearClient } = require('@linear/sdk')

async function crearBacklog() {
  const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })

  // 1. Obtener Team
  const teams = await client.teams()
  const team = teams.nodes.find(t => t.name === process.env.TEAM_NAME)

  // 2. Obtener estado "Todo"
  const workflowStates = await team.states()
  const todoState = workflowStates.nodes.find(s => s.name === 'Todo')

  // 3. Crear Project
  const projectPayload = await client.createProject({
    name: '🚀 Mi Nueva App',
    description: 'Descripción de la app',
    teamIds: [team.id],
  })
  const project = await projectPayload.project

  // 4. Crear Milestone
  const milestonePayload = await client.createProjectMilestone({
    name: '1.0 MVP',
    description: 'Primera versión',
    projectId: project.id,
  })
  const milestone = await milestonePayload.projectMilestone

  // 5. Crear Issues
  const issues = [
    { id: 'APP-001', title: 'Setup inicial', estimate: 1 },
    { id: 'APP-002', title: 'Crear componentes base', estimate: 2 },
    { id: 'APP-003', title: 'Integrar API', estimate: 3 },
  ]

  const issueMap = {}

  for (const data of issues) {
    const payload = await client.createIssue({
      teamId: team.id,
      projectId: project.id,
      projectMilestoneId: milestone.id,
      title: `[${data.id}] ${data.title}`,
      estimate: data.estimate,
      priority: 2,
      stateId: todoState.id,
    })

    const issue = await payload.issue
    issueMap[data.id] = issue.id

    console.log(`✅ Creado: ${data.id}`)
    await new Promise(r => setTimeout(r, 100))
  }

  console.log('🎉 Backlog creado!')
}

crearBacklog()
```

---

## 🔄 Promesas y Async/Await

### Resolver Promesas Correctamente

```javascript
// ❌ INCORRECTO - puede dar undefined
const issue = await client.createIssue({...});
const issueId = issue.issue.id;

// ✅ CORRECTO
const issuePayload = await client.createIssue({...});
const issue = await issuePayload.issue;
const issueId = issue?.id;

if (!issueId) {
  throw new Error('No se pudo crear el issue');
}
```

### Pausas Recomendadas

```javascript
// Entre creación de issues
await new Promise(resolve => setTimeout(resolve, 100))
```

---

## 📊 Prioridades

| Valor | Nivel         | Uso                  |
| ----- | ------------- | -------------------- |
| `0`   | Sin prioridad | -                    |
| `1`   | Urgent 🔥     | Bloqueadores         |
| `2`   | High ⬆️       | Features principales |
| `3`   | Medium ➡️     | Features secundarias |
| `4`   | Low ⬇️        | Nice to have         |

---

## 🏷️ Sistema de Labels Recomendado

### Por Tipo

- `feature` - Nueva funcionalidad
- `bug` - Error a corregir
- `improvement` - Mejora de algo existente
- `docs` - Documentación

### Por Área

- `frontend` - UI/UX
- `backend` - API/Servidor
- `database` - Base de datos
- `devops` - Infraestructura

### Por Fase

- `fase-1` - MVP
- `fase-2` - Features adicionales
- `fase-3` - Polish y optimización

---

## 🔗 Dependencies (Relaciones)

### Tipos

| Tipo        | Descripción                |
| ----------- | -------------------------- |
| `blocks`    | Este issue bloquea al otro |
| `related`   | Issues relacionados        |
| `duplicate` | Issues duplicados          |

### Crear Dependency

```javascript
// Si B depende de A → A bloquea a B
await client.createIssueRelation({
  issueId: issueA_Id, // El que va primero
  relatedIssueId: issueB_Id, // El que depende
  type: 'blocks',
})
```

---

## 🧹 Limpieza de Team

```javascript
// Borrar todos los issues
const issues = await team.issues()
for (const issue of issues.nodes) {
  await client.deleteIssue(issue.id)
  await new Promise(r => setTimeout(r, 50))
}

// Borrar projects
const projects = await team.projects()
for (const project of projects.nodes) {
  await client.deleteProject(project.id)
}

// Borrar labels
const labels = await team.labels()
for (const label of labels.nodes) {
  await client.deleteIssueLabel(label.id)
}
```

---

## 📝 Formato de Issues Recomendado

### Título

```
[ID] Título descriptivo
```

Ejemplo: `[APP-001] Configurar proyecto Next.js`

### Descripción

```markdown
Descripción clara de qué hay que hacer.

**Archivos a Crear/Modificar:**

- `src/components/Header.tsx`
- `src/styles/globals.css`

**Criterios de Aceptación:**

- [ ] El header se muestra correctamente
- [ ] Es responsive
- [ ] Tiene los colores de la marca
```

---

## 💡 Tips

### Naming Conventions

- **Projects**: Usar emojis → 🚀 Mi App, 📱 Mobile App
- **Milestones**: Usar versiones → "1.0 MVP", "1.1 Auth"
- **Issues**: Usar prefijos → [APP-001], [BUG-001]

### Estimaciones

| Points | Tiempo aproximado              |
| ------ | ------------------------------ |
| 1      | ~1 hora                        |
| 2      | ~2-3 horas                     |
| 3      | ~4-6 horas                     |
| 5      | ~1 día                         |
| 8      | ~2 días                        |
| 13     | Dividir en issues más pequeños |

### Estados del Workflow

- **Backlog**: Por hacer eventualmente
- **Todo**: Por hacer pronto
- **In Progress**: En desarrollo
- **In Review**: En revisión
- **Done**: Completado

---

## 🚀 Scripts Disponibles

### Copiar Labels entre Teams

```bash
cd scripts
node copy-labels-to-team.js --source "TeamOrigen" --target "TeamDestino"
```

### Crear Backlog

```bash
cd scripts
node create-linear-backlog.js
```

### Limpiar Team

```bash
cd scripts
node clean-linear-team.js
```

---

## 🔗 URLs Útiles

| Recurso      | URL                                |
| ------------ | ---------------------------------- |
| Linear App   | https://linear.app                 |
| API Settings | https://linear.app/settings/api    |
| API Docs     | https://developers.linear.app/docs |
| SDK GitHub   | https://github.com/linear/linear   |

---

## 📞 Soporte

- **Linear Support**: support@linear.app
- **Community**: https://linear.app/community
- **Status**: https://status.linear.app

---

**Última Actualización**: 3 de Diciembre, 2025  
**Versión**: 2.0
