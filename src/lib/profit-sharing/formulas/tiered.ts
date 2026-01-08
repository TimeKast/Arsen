/**
 * TIERED Formula
 * Tiered percentages based on profit ranges
 */

import type { FormulaStrategy, ProfitSharingInput, ProfitSharingResult, ProfitSharingBreakdown } from '../types';

export class TieredFormula implements FormulaStrategy {
    calculate(input: ProfitSharingInput): ProfitSharingResult {
        const { projectId, projectName, netProfit, rules } = input;
        const tiers = rules.tiers || [];

        if (netProfit <= 0 || tiers.length === 0) {
            return {
                projectId,
                projectName,
                formulaType: 'TIERED',
                netProfit,
                totalShare: 0,
                breakdown: [],
                calculationDetails: 'Sin utilidad o sin tiers configurados',
            };
        }

        // Sort tiers by minProfit
        const sortedTiers = [...tiers].sort((a, b) => a.minProfit - b.minProfit);

        const breakdown: ProfitSharingBreakdown[] = [];
        let totalShare = 0;
        let remainingProfit = netProfit;
        let details: string[] = [];

        for (const tier of sortedTiers) {
            const tierMax = tier.maxProfit ?? Infinity;

            if (remainingProfit <= 0) break;
            if (netProfit < tier.minProfit) continue;

            // Calculate applicable amount in this tier
            const tierFloor = tier.minProfit;
            const tierCeiling = tierMax;

            // How much of profit falls in this tier?
            const lowerBound = Math.max(0, tierFloor);
            const upperBound = Math.min(netProfit, tierCeiling);
            const applicableAmount = Math.max(0, upperBound - lowerBound);

            if (applicableAmount > 0) {
                const tierShare = applicableAmount * (tier.percentRate / 100);
                totalShare += tierShare;

                breakdown.push({
                    description: `${tier.percentRate}% de $${lowerBound.toFixed(0)} - $${tierMax === Infinity ? '∞' : tierMax.toFixed(0)}`,
                    amount: tierShare,
                    percentOfProfit: (tierShare / netProfit) * 100,
                });

                details.push(`$${applicableAmount.toFixed(2)} × ${tier.percentRate}%`);
            }
        }

        return {
            projectId,
            projectName,
            formulaType: 'TIERED',
            netProfit,
            totalShare,
            breakdown,
            calculationDetails: `Escalonado: ${details.join(' + ')} = $${totalShare.toFixed(2)}`,
        };
    }
}
