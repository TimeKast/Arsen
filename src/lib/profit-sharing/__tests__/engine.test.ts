/**
 * Unit Tests for Profit Sharing Engine
 * Using Vitest test framework
 */

import { describe, it, expect } from 'vitest';
import {
    calculateProfitSharing,
    calculateBatchProfitSharing,
    getFormulaTypes,
    type ProfitSharingInput,
} from '../engine';

// Test data
const baseInput = {
    projectId: 'test-project',
    projectName: 'Torre Prisma',
    totalIncome: 200000,
    totalCost: 150000,
    netProfit: 50000,
};

describe('Profit Sharing Engine', () => {
    describe('FIXED_ONLY', () => {
        it('should return fixed amount for positive profit', () => {
            const input: ProfitSharingInput = {
                ...baseInput,
                rules: {
                    formulaType: 'FIXED_ONLY',
                    fixedAmount: 10000,
                },
            };

            const result = calculateProfitSharing(input);
            expect(result.totalShare).toBe(10000);
            expect(result.formulaType).toBe('FIXED_ONLY');
        });

        it('should return 0 for zero profit', () => {
            const input: ProfitSharingInput = {
                ...baseInput,
                netProfit: 0,
                rules: { formulaType: 'FIXED_ONLY', fixedAmount: 10000 },
            };

            const result = calculateProfitSharing(input);
            expect(result.totalShare).toBe(0);
        });
    });

    describe('PERCENT_SIMPLE', () => {
        it('should calculate correct percentage of profit', () => {
            const input: ProfitSharingInput = {
                ...baseInput,
                rules: {
                    formulaType: 'PERCENT_SIMPLE',
                    percentRate: 10,
                },
            };

            const result = calculateProfitSharing(input);
            expect(result.totalShare).toBe(5000); // 10% of 50k
        });
    });

    describe('FIXED_PLUS_PERCENT', () => {
        it('should calculate fixed + percentage correctly', () => {
            const input: ProfitSharingInput = {
                ...baseInput,
                rules: {
                    formulaType: 'FIXED_PLUS_PERCENT',
                    fixedAmount: 2000,
                    percentRate: 5,
                },
            };

            const result = calculateProfitSharing(input);
            expect(result.totalShare).toBe(4500); // 2000 + 5% of 50k
        });
    });

    describe('TIERED', () => {
        it('should apply tiered percentages correctly', () => {
            const input: ProfitSharingInput = {
                ...baseInput,
                rules: {
                    formulaType: 'TIERED',
                    tiers: [
                        { minProfit: 0, maxProfit: 20000, percentRate: 5 },
                        { minProfit: 20000, maxProfit: 40000, percentRate: 8 },
                        { minProfit: 40000, percentRate: 12 },
                    ],
                },
            };

            const result = calculateProfitSharing(input);
            // Expected: 20000*5% + 20000*8% + 10000*12% = 1000 + 1600 + 1200 = 3800
            expect(result.totalShare).toBe(3800);
        });
    });

    describe('SPECIAL_FORMULA', () => {
        it('should apply maximum cap', () => {
            const input: ProfitSharingInput = {
                ...baseInput,
                rules: {
                    formulaType: 'SPECIAL_FORMULA',
                    percentRate: 15,
                    minimumProfit: 10000,
                    maximumShare: 6000,
                },
            };

            const result = calculateProfitSharing(input);
            // 15% of 50000 = 7500, but capped at 6000
            expect(result.totalShare).toBe(6000);
        });

        it('should return 0 below minimum profit', () => {
            const input: ProfitSharingInput = {
                ...baseInput,
                netProfit: 5000,
                rules: {
                    formulaType: 'SPECIAL_FORMULA',
                    percentRate: 15,
                    minimumProfit: 10000,
                    maximumShare: 6000,
                },
            };

            const result = calculateProfitSharing(input);
            expect(result.totalShare).toBe(0);
        });
    });

    describe('GROUPED', () => {
        it('should sum group percentages', () => {
            const input: ProfitSharingInput = {
                ...baseInput,
                rules: {
                    formulaType: 'GROUPED',
                    groups: [
                        { groupName: 'Operadores', percentRate: 5, members: [] },
                        { groupName: 'Supervisores', percentRate: 3, members: [] },
                        { groupName: 'Gerentes', percentRate: 2, members: [] },
                    ],
                },
            };

            const result = calculateProfitSharing(input);
            // Expected: 5% + 3% + 2% = 10% of 50000 = 5000
            expect(result.totalShare).toBe(5000);
        });
    });

    describe('DYNAMIC', () => {
        it('should calculate base + increments', () => {
            const input: ProfitSharingInput = {
                ...baseInput,
                netProfit: 150000,
                rules: {
                    formulaType: 'DYNAMIC',
                    baseAmount: 5000,
                    incrementPercent: 1,
                    incrementThreshold: 50000,
                },
            };

            const result = calculateProfitSharing(input);
            // 3 increments (150k / 50k = 3) * 1% * 150k = 4500, + base 5000 = 9500
            expect(result.totalShare).toBe(9500);
        });
    });

    describe('Batch Processing', () => {
        it('should process multiple projects', () => {
            const inputs: ProfitSharingInput[] = [
                { ...baseInput, projectId: 'p1', rules: { formulaType: 'FIXED_ONLY', fixedAmount: 1000 } },
                { ...baseInput, projectId: 'p2', rules: { formulaType: 'PERCENT_SIMPLE', percentRate: 10 } },
            ];

            const results = calculateBatchProfitSharing(inputs);
            expect(results.length).toBe(2);
        });
    });

    describe('Formula Types', () => {
        it('should return all 7 formula types', () => {
            const types = getFormulaTypes();
            expect(types.length).toBe(7);
        });
    });
});
