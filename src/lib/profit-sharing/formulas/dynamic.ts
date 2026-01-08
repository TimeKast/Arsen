/**
 * DYNAMIC Formula
 * Base amount plus increments based on profit thresholds
 */

import type { FormulaStrategy, ProfitSharingInput, ProfitSharingResult, ProfitSharingBreakdown } from '../types';

export class DynamicFormula implements FormulaStrategy {
    calculate(input: ProfitSharingInput): ProfitSharingResult {
        const { projectId, projectName, netProfit, rules } = input;
        const baseAmount = rules.baseAmount || 0;
        const incrementPercent = rules.incrementPercent || 0;
        const incrementThreshold = rules.incrementThreshold || 100000;

        if (netProfit <= 0) {
            return {
                projectId,
                projectName,
                formulaType: 'DYNAMIC',
                netProfit,
                totalShare: 0,
                breakdown: [],
                calculationDetails: 'Sin utilidad',
            };
        }

        const breakdown: ProfitSharingBreakdown[] = [];

        // Base amount
        breakdown.push({
            description: 'Monto base',
            amount: baseAmount,
        });

        // Calculate increments
        const increments = Math.floor(netProfit / incrementThreshold);
        const incrementAmount = increments * (incrementPercent / 100) * netProfit;

        if (increments > 0) {
            breakdown.push({
                description: `${increments} incrementos de ${incrementPercent}%`,
                amount: incrementAmount,
                percentOfProfit: (incrementAmount / netProfit) * 100,
            });
        }

        const totalShare = baseAmount + incrementAmount;

        return {
            projectId,
            projectName,
            formulaType: 'DYNAMIC',
            netProfit,
            totalShare,
            breakdown,
            calculationDetails: `Base: $${baseAmount.toFixed(2)} + ${increments} × ${incrementPercent}% = $${totalShare.toFixed(2)}`,
        };
    }
}
