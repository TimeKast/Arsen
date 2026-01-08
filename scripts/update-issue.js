/**
 * update-issue.js
 * Script para actualizar estado de un issue en Linear y agregar comentario
 * 
 * Uso: node update-issue.js ARSEN-001 "Comentario del cierre"
 * 
 * Usa fetch directo con timeout para mejor manejo de conectividad
 */

require('dotenv').config();

const CONFIG = {
    teamName: 'Jose',
    projectName: 'Arsen - Control Presupuestal',
    issuePrefix: 'ARSEN',
    apiUrl: 'https://api.linear.app/graphql',
    timeout: 10000, // 10 segundos por request
};

async function linearQuery(query, variables = {}) {
    const apiKey = process.env.LINEAR_API_KEY;
    if (!apiKey) {
        throw new Error('LINEAR_API_KEY no encontrada en .env');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey,
            },
            body: JSON.stringify({ query, variables }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.errors) {
            throw new Error(data.errors.map(e => e.message).join(', '));
        }

        return data.data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error(`Timeout despues de ${CONFIG.timeout / 1000}s - verifica tu conexion a internet`);
        }
        throw error;
    }
}

async function main() {
    const issueNumber = process.argv[2];
    const comment = process.argv[3];

    if (!issueNumber) {
        console.error('Uso: node update-issue.js ARSEN-XXX "Comentario"');
        process.exit(1);
    }

    console.log(`\n🔍 Actualizando issue ${issueNumber}...`);
    console.log(`   API Key: ${process.env.LINEAR_API_KEY?.substring(0, 15) || 'NO ENCONTRADA'}...`);

    try {
        // 1. Obtener Team y estados
        console.log('\n1️⃣ Obteniendo team y estados...');
        const teamData = await linearQuery(`
            query {
                teams {
                    nodes {
                        id
                        name
                        states {
                            nodes {
                                id
                                name
                            }
                        }
                    }
                }
            }
        `);

        const team = teamData.teams.nodes.find(t => t.name === CONFIG.teamName);
        if (!team) {
            throw new Error(`Team "${CONFIG.teamName}" no encontrado`);
        }
        console.log(`   ✅ Team: ${team.name}`);

        const doneState = team.states.nodes.find(s => s.name === 'Done' || s.name === 'Completado');
        if (!doneState) {
            console.log('   Estados disponibles:', team.states.nodes.map(s => s.name).join(', '));
            throw new Error('Estado "Done" no encontrado');
        }
        console.log(`   ✅ Estado Done: ${doneState.name}`);

        // 2. Buscar issue
        console.log(`\n2️⃣ Buscando issue [${issueNumber}]...`);
        const searchTerm = `[${issueNumber}]`;

        const issuesData = await linearQuery(`
            query($teamId: String!) {
                team(id: $teamId) {
                    issues(first: 100) {
                        nodes {
                            id
                            title
                        }
                    }
                }
            }
        `, { teamId: team.id });

        const issue = issuesData.team.issues.nodes.find(i => i.title.includes(searchTerm));

        if (!issue) {
            console.error(`   ❌ Issue ${issueNumber} no encontrado`);
            console.log('   Primeros 5 issues:', issuesData.team.issues.nodes.slice(0, 5).map(i => i.title).join('\n   - '));
            process.exit(1);
        }
        console.log(`   ✅ Encontrado: ${issue.title}`);

        // 3. Actualizar estado
        console.log(`\n3️⃣ Actualizando estado a "${doneState.name}"...`);
        await linearQuery(`
            mutation($issueId: String!, $stateId: String!) {
                issueUpdate(id: $issueId, input: { stateId: $stateId }) {
                    success
                }
            }
        `, { issueId: issue.id, stateId: doneState.id });
        console.log('   ✅ Estado actualizado');

        // 4. Agregar comentario
        if (comment) {
            console.log('\n4️⃣ Agregando comentario...');
            await linearQuery(`
                mutation($issueId: String!, $body: String!) {
                    commentCreate(input: { issueId: $issueId, body: $body }) {
                        success
                    }
                }
            `, { issueId: issue.id, body: comment });
            console.log('   ✅ Comentario agregado');
        }

        console.log('\n🎉 Issue actualizado exitosamente!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
