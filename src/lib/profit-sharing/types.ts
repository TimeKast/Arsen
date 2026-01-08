/**
 * Profit Sharing Engine Types
 * Based on 00_FASE0_SUPUESTOS.md section 2.5
 */

// Formula types available
export type FormulaType =
    | 'FIXED_ONLY'        // Solo monto fijo
    | 'PERCENT_SIMPLE'    // Porcentaje simple de utilidad
    | 'FIXED_PLUS_PERCENT'// Monto fijo + porcentaje de utilidad
    | 'TIERED'            // Escalonado por rangos de utilidad
    | 'SPECIAL_FORMULA'   // Fórmula especial con tope
    | 'GROUPED'           // Agrupado por categorías
    | 'DYNAMIC'           // Dinámico con incrementos

// Input for profit sharing calculation
export interface ProfitSharingInput {
    projectId: string;
    projectName: string;
    totalIncome: number;
    totalCost: number;
    netProfit: number;
    rules: ProfitSharingRules;
}

// Configuration rules for profit sharing
export interface ProfitSharingRules {
    formulaType: FormulaType;

    // FIXED_ONLY params
    fixedAmount?: number;

    // PERCENT_SIMPLE params
    percentRate?: number;

    // FIXED_PLUS_PERCENT params
    // Uses fixedAmount + percentRate

    // TIERED params
    tiers?: TierConfig[];

    // SPECIAL_FORMULA params
    minimumProfit?: number;
    maximumShare?: number;

    // GROUPED params
    groups?: GroupConfig[];

    // DYNAMIC params
    baseAmount?: number;
    incrementPercent?: number;
    incrementThreshold?: number;
}

export interface TierConfig {
    minProfit: number;
    maxProfit?: number; // Undefined means unlimited
    percentRate: number;
}

export interface GroupConfig {
    groupName: string;
    percentRate: number;
    members: string[]; // Area IDs or concept IDs
}

// Result from profit sharing calculation
export interface ProfitSharingResult {
    projectId: string;
    projectName: string;
    formulaType: FormulaType;
    netProfit: number;
    totalShare: number;
    breakdown: ProfitSharingBreakdown[];
    calculationDetails: string;
}

export interface ProfitSharingBreakdown {
    description: string;
    amount: number;
    percentOfProfit?: number;
}

// Formula strategy interface
export interface FormulaStrategy {
    calculate(input: ProfitSharingInput): ProfitSharingResult;
}
