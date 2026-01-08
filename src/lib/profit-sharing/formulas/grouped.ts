/**
 * GROUPED Formula
 * Distributes profit share among defined groups
 */

import type { FormulaStrategy, ProfitSharingInput, ProfitSharingResult, ProfitSharingBreakdown } from '../types';

export class GroupedFormula implements FormulaStrategy {
    calculate(input: ProfitSharingInput): ProfitSharingResult {
        const { projectId, projectName, netProfit, rules } = input;
        const groups = rules.groups || [];

        if (netProfit <= 0 || groups.length === 0) {
            return {
                projectId,
                projectName,
                formulaType: 'GROUPED',
                netProfit,
                totalShare: 0,
                breakdown: [],
                calculationDetails: 'Sin utilidad o sin grupos configurados',
            };
        }

        const breakdown: ProfitSharingBreakdown[] = [];
        let totalShare = 0;
        const details: string[] = [];

        for (const group of groups) {
            const groupShare = netProfit * (group.percentRate / 100);
            totalShare += groupShare;

            breakdown.push({
                description: `${group.groupName}: ${group.percentRate}%`,
                amount: groupShare,
                percentOfProfit: group.percentRate,
            });

            details.push(`${group.groupName}: $${groupShare.toFixed(2)}`);
        }

        return {
            projectId,
            projectName,
            formulaType: 'GROUPED',
            netProfit,
            totalShare,
            breakdown,
            calculationDetails: `Grupos: ${details.join(', ')}. Total: $${totalShare.toFixed(2)}`,
        };
    }
}
