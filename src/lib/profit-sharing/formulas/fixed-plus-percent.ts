/**
 * FIXED_PLUS_PERCENT Formula
 * Fixed amount plus percentage of net profit
 */

import type { FormulaStrategy, ProfitSharingInput, ProfitSharingResult } from '../types';

export class FixedPlusPercentFormula implements FormulaStrategy {
    calculate(input: ProfitSharingInput): ProfitSharingResult {
        const { projectId, projectName, netProfit, rules } = input;
        const fixedAmount = rules.fixedAmount || 0;
        const percentRate = rules.percentRate || 0;

        // Calculate components
        const fixedPart = netProfit > 0 ? fixedAmount : 0;
        const percentPart = netProfit > 0 ? netProfit * (percentRate / 100) : 0;
        const totalShare = fixedPart + percentPart;
        const totalPercent = netProfit > 0 ? (totalShare / netProfit) * 100 : 0;

        return {
            projectId,
            projectName,
            formulaType: 'FIXED_PLUS_PERCENT',
            netProfit,
            totalShare,
            breakdown: [
                {
                    description: 'Monto fijo',
                    amount: fixedPart,
                },
                {
                    description: `${percentRate}% de utilidad`,
                    amount: percentPart,
                    percentOfProfit: percentRate,
                },
            ],
            calculationDetails: `Fijo: $${fixedAmount.toFixed(2)} + ${percentRate}% de $${netProfit.toFixed(2)} = $${totalShare.toFixed(2)} (${totalPercent.toFixed(1)}% total)`,
        };
    }
}
