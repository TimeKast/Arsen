import type { ImportRule } from '@/actions/import-rules';

// Apply rules to transform import data (client-side utility)
export function applyImportRules(
    entries: Array<{ projectName: string | null; conceptName: string; amount: number }>,
    rules: ImportRule[]
): Array<{ projectName: string | null; conceptName: string; amount: number; applied?: string }> {
    const normalizeStr = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    return entries
        .map(entry => {
            const conceptNorm = normalizeStr(entry.conceptName);
            const projectNorm = entry.projectName ? normalizeStr(entry.projectName) : null;

            for (const rule of rules) {
                if (!rule.isActive) continue;

                const ruleConceptNorm = normalizeStr(rule.sourceConceptName);
                const ruleProjectNorm = rule.sourceProjectName ? normalizeStr(rule.sourceProjectName) : null;

                // Check if concept matches
                if (!conceptNorm.includes(ruleConceptNorm) && ruleConceptNorm !== conceptNorm) {
                    continue;
                }

                // Check if project matches (null = any project)
                if (ruleProjectNorm && projectNorm !== ruleProjectNorm) {
                    continue;
                }

                // Apply rule
                if (rule.ruleType === 'EXCLUDE') {
                    return null; // Will be filtered out
                }

                if (rule.ruleType === 'REDIRECT') {
                    return {
                        ...entry,
                        projectName: rule.targetProjectName,
                        applied: `Redirigido a ${rule.targetProjectName}`,
                    };
                }
            }

            return entry;
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}
