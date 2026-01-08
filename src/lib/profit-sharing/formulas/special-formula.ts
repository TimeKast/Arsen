/**
 * SPECIAL_FORMULA Formula
 * Percentage with minimum profit threshold and maximum cap
 */

import type { FormulaStrategy, ProfitSharingInput, ProfitSharingResult } from '../types';

export class SpecialFormula implements FormulaStrategy {
    calculate(input: ProfitSharingInput): ProfitSharingResult {
        const { projectId, projectName, netProfit, rules } = input;
        const percentRate = rules.percentRate || 0;
        const minimumProfit = rules.minimumProfit || 0;
        const maximumShare = rules.maximumShare || Infinity;

        // Check if profit meets minimum threshold
        if (netProfit < minimumProfit) {
            return {
                projectId,
                projectName,
                formulaType: 'SPECIAL_FORMULA',
                netProfit,
                totalShare: 0,
                breakdown: [
                    {
                        description: `Utilidad menor al mínimo ($${minimumProfit.toFixed(2)})`,
                        amount: 0,
                    },
                ],
                calculationDetails: `Utilidad $${netProfit.toFixed(2)} < mínimo $${minimumProfit.toFixed(2)}, no aplica reparto`,
            };
        }

        // Calculate share
        let totalShare = netProfit * (percentRate / 100);
        let capped = false;

        // Apply maximum cap
        if (totalShare > maximumShare) {
            totalShare = maximumShare;
            capped = true;
        }

        return {
            projectId,
            projectName,
            formulaType: 'SPECIAL_FORMULA',
            netProfit,
            totalShare,
            breakdown: [
                {
                    description: `${percentRate}% de utilidad${capped ? ' (con tope)' : ''}`,
                    amount: totalShare,
                    percentOfProfit: (totalShare / netProfit) * 100,
                },
            ],
            calculationDetails: `${percentRate}% de $${netProfit.toFixed(2)} = $${totalShare.toFixed(2)}${capped ? ` (tope: $${maximumShare.toFixed(2)})` : ''}`,
        };
    }
}
