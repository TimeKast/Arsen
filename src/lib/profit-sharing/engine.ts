/**
 * Profit Sharing Engine
 * Strategy Pattern implementation for 7 formula types
 */

import type { FormulaType, FormulaStrategy, ProfitSharingInput, ProfitSharingResult } from './types';
import {
    FixedOnlyFormula,
    PercentSimpleFormula,
    FixedPlusPercentFormula,
    TieredFormula,
    SpecialFormula,
    GroupedFormula,
    DynamicFormula,
} from './formulas';

// Strategy map
const strategies: Record<FormulaType, FormulaStrategy> = {
    FIXED_ONLY: new FixedOnlyFormula(),
    PERCENT_SIMPLE: new PercentSimpleFormula(),
    FIXED_PLUS_PERCENT: new FixedPlusPercentFormula(),
    TIERED: new TieredFormula(),
    SPECIAL_FORMULA: new SpecialFormula(),
    GROUPED: new GroupedFormula(),
    DYNAMIC: new DynamicFormula(),
};

/**
 * Calculate profit sharing for a single project
 */
export function calculateProfitSharing(input: ProfitSharingInput): ProfitSharingResult {
    const strategy = strategies[input.rules.formulaType];

    if (!strategy) {
        throw new Error(`Unknown formula type: ${input.rules.formulaType}`);
    }

    return strategy.calculate(input);
}

/**
 * Calculate profit sharing for multiple projects
 */
export function calculateBatchProfitSharing(inputs: ProfitSharingInput[]): ProfitSharingResult[] {
    return inputs.map(calculateProfitSharing);
}

/**
 * Get available formula types with descriptions
 */
export function getFormulaTypes(): { type: FormulaType; label: string; description: string }[] {
    return [
        {
            type: 'FIXED_ONLY',
            label: 'Monto Fijo',
            description: 'Monto fijo independiente de la utilidad',
        },
        {
            type: 'PERCENT_SIMPLE',
            label: 'Porcentaje Simple',
            description: 'Porcentaje simple de la utilidad neta',
        },
        {
            type: 'FIXED_PLUS_PERCENT',
            label: 'Fijo + Porcentaje',
            description: 'Monto fijo más porcentaje de utilidad',
        },
        {
            type: 'TIERED',
            label: 'Escalonado',
            description: 'Porcentajes escalonados según rangos de utilidad',
        },
        {
            type: 'SPECIAL_FORMULA',
            label: 'Fórmula Especial',
            description: 'Con mínimo de utilidad y tope máximo',
        },
        {
            type: 'GROUPED',
            label: 'Por Grupos',
            description: 'Distribución por grupos o categorías',
        },
        {
            type: 'DYNAMIC',
            label: 'Dinámico',
            description: 'Base más incrementos por umbrales',
        },
    ];
}

// Re-export types
export * from './types';
