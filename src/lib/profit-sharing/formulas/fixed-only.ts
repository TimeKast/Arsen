/**
 * FIXED_ONLY Formula
 * Returns a fixed amount regardless of profit
 */

import type { FormulaStrategy, ProfitSharingInput, ProfitSharingResult } from '../types';

export class FixedOnlyFormula implements FormulaStrategy {
    calculate(input: ProfitSharingInput): ProfitSharingResult {
        const { projectId, projectName, netProfit, rules } = input;
        const fixedAmount = rules.fixedAmount || 0;

        // Only apply if there's profit
        const totalShare = netProfit > 0 ? fixedAmount : 0;
        const percentOfProfit = netProfit > 0 ? (totalShare / netProfit) * 100 : 0;

        return {
            projectId,
            projectName,
            formulaType: 'FIXED_ONLY',
            netProfit,
            totalShare,
            breakdown: [
                {
                    description: 'Monto fijo',
                    amount: totalShare,
                    percentOfProfit,
                },
            ],
            calculationDetails: `Monto fijo: $${fixedAmount.toFixed(2)}${netProfit <= 0 ? ' (No aplica sin utilidad)' : ''}`,
        };
    }
}
