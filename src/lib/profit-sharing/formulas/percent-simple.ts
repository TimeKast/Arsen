/**
 * PERCENT_SIMPLE Formula
 * Simple percentage of net profit
 */

import type { FormulaStrategy, ProfitSharingInput, ProfitSharingResult } from '../types';

export class PercentSimpleFormula implements FormulaStrategy {
    calculate(input: ProfitSharingInput): ProfitSharingResult {
        const { projectId, projectName, netProfit, rules } = input;
        const percentRate = rules.percentRate || 0;

        // Only apply if there's profit
        const totalShare = netProfit > 0 ? netProfit * (percentRate / 100) : 0;

        return {
            projectId,
            projectName,
            formulaType: 'PERCENT_SIMPLE',
            netProfit,
            totalShare,
            breakdown: [
                {
                    description: `${percentRate}% de utilidad`,
                    amount: totalShare,
                    percentOfProfit: percentRate,
                },
            ],
            calculationDetails: `${percentRate}% de $${netProfit.toFixed(2)} = $${totalShare.toFixed(2)}`,
        };
    }
}
