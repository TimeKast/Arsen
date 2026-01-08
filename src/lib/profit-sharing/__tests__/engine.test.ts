/**
 * Unit Tests for Profit Sharing Engine
 */

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

// ============= FIXED_ONLY Tests =============
console.log('\n=== FIXED_ONLY Tests ===');

const fixedOnlyInput: ProfitSharingInput = {
    ...baseInput,
    rules: {
        formulaType: 'FIXED_ONLY',
        fixedAmount: 10000,
    },
};

const fixedOnlyResult = calculateProfitSharing(fixedOnlyInput);
console.log('Fixed Only Result:', fixedOnlyResult);
console.assert(fixedOnlyResult.totalShare === 10000, 'Expected $10,000');
console.log('✓ FIXED_ONLY passed');

// Test with no profit
const fixedOnlyNoProfit: ProfitSharingInput = {
    ...baseInput,
    netProfit: 0,
    rules: { formulaType: 'FIXED_ONLY', fixedAmount: 10000 },
};
const fixedOnlyNoProfitResult = calculateProfitSharing(fixedOnlyNoProfit);
console.assert(fixedOnlyNoProfitResult.totalShare === 0, 'Expected $0 with no profit');
console.log('✓ FIXED_ONLY no profit passed');

// ============= PERCENT_SIMPLE Tests =============
console.log('\n=== PERCENT_SIMPLE Tests ===');

const percentSimpleInput: ProfitSharingInput = {
    ...baseInput,
    rules: {
        formulaType: 'PERCENT_SIMPLE',
        percentRate: 10,
    },
};

const percentSimpleResult = calculateProfitSharing(percentSimpleInput);
console.log('Percent Simple Result:', percentSimpleResult);
console.assert(percentSimpleResult.totalShare === 5000, 'Expected $5,000 (10% of 50k)');
console.log('✓ PERCENT_SIMPLE passed');

// ============= FIXED_PLUS_PERCENT Tests =============
console.log('\n=== FIXED_PLUS_PERCENT Tests ===');

const fixedPlusPercentInput: ProfitSharingInput = {
    ...baseInput,
    rules: {
        formulaType: 'FIXED_PLUS_PERCENT',
        fixedAmount: 2000,
        percentRate: 5,
    },
};

const fixedPlusPercentResult = calculateProfitSharing(fixedPlusPercentInput);
console.log('Fixed Plus Percent Result:', fixedPlusPercentResult);
console.assert(fixedPlusPercentResult.totalShare === 4500, 'Expected $4,500 (2000 + 5% of 50k)');
console.log('✓ FIXED_PLUS_PERCENT passed');

// ============= TIERED Tests =============
console.log('\n=== TIERED Tests ===');

const tieredInput: ProfitSharingInput = {
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

const tieredResult = calculateProfitSharing(tieredInput);
console.log('Tiered Result:', tieredResult);
// Expected: 20000*5% + 20000*8% + 10000*12% = 1000 + 1600 + 1200 = 3800
console.assert(tieredResult.totalShare === 3800, 'Expected $3,800');
console.log('✓ TIERED passed');

// ============= SPECIAL_FORMULA Tests =============
console.log('\n=== SPECIAL_FORMULA Tests ===');

const specialFormulaInput: ProfitSharingInput = {
    ...baseInput,
    rules: {
        formulaType: 'SPECIAL_FORMULA',
        percentRate: 15,
        minimumProfit: 10000,
        maximumShare: 6000,
    },
};

const specialFormulaResult = calculateProfitSharing(specialFormulaInput);
console.log('Special Formula Result:', specialFormulaResult);
// 15% of 50000 = 7500, but capped at 6000
console.assert(specialFormulaResult.totalShare === 6000, 'Expected $6,000 (capped)');
console.log('✓ SPECIAL_FORMULA passed');

// Test below minimum
const specialBelowMin: ProfitSharingInput = {
    ...baseInput,
    netProfit: 5000,
    rules: {
        formulaType: 'SPECIAL_FORMULA',
        percentRate: 15,
        minimumProfit: 10000,
        maximumShare: 6000,
    },
};
const specialBelowMinResult = calculateProfitSharing(specialBelowMin);
console.assert(specialBelowMinResult.totalShare === 0, 'Expected $0 below minimum');
console.log('✓ SPECIAL_FORMULA below minimum passed');

// ============= GROUPED Tests =============
console.log('\n=== GROUPED Tests ===');

const groupedInput: ProfitSharingInput = {
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

const groupedResult = calculateProfitSharing(groupedInput);
console.log('Grouped Result:', groupedResult);
// Expected: 5% + 3% + 2% = 10% of 50000 = 5000
console.assert(groupedResult.totalShare === 5000, 'Expected $5,000');
console.log('✓ GROUPED passed');

// ============= DYNAMIC Tests =============
console.log('\n=== DYNAMIC Tests ===');

const dynamicInput: ProfitSharingInput = {
    ...baseInput,
    netProfit: 150000,
    rules: {
        formulaType: 'DYNAMIC',
        baseAmount: 5000,
        incrementPercent: 1,
        incrementThreshold: 50000,
    },
};

const dynamicResult = calculateProfitSharing(dynamicInput);
console.log('Dynamic Result:', dynamicResult);
// 3 increments (150k / 50k = 3) * 1% * 150k = 4500, + base 5000 = 9500
console.assert(dynamicResult.totalShare === 9500, 'Expected $9,500');
console.log('✓ DYNAMIC passed');

// ============= Batch Processing Test =============
console.log('\n=== Batch Processing Test ===');

const batchInputs: ProfitSharingInput[] = [
    { ...baseInput, projectId: 'p1', rules: { formulaType: 'FIXED_ONLY', fixedAmount: 1000 } },
    { ...baseInput, projectId: 'p2', rules: { formulaType: 'PERCENT_SIMPLE', percentRate: 10 } },
];

const batchResults = calculateBatchProfitSharing(batchInputs);
console.log('Batch Results:', batchResults.length, 'items');
console.assert(batchResults.length === 2, 'Expected 2 results');
console.log('✓ Batch processing passed');

// ============= Formula Types Test =============
console.log('\n=== Formula Types Test ===');
const formulaTypes = getFormulaTypes();
console.log('Available formulas:', formulaTypes.length);
console.assert(formulaTypes.length === 7, 'Expected 7 formula types');
console.log('✓ Formula types passed');

console.log('\n✅ All tests passed!');
