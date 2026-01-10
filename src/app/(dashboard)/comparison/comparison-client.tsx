'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getComparisonData, type ComparisonData, type ComparisonRow } from '@/actions/comparison';
import { usePeriodStore } from '@/stores/period-store';
import { useCompanyStore } from '@/stores/company-store';
import { MultiProjectSelector } from '@/components/ui/multi-project-selector';

interface Company {
    id: string;
    name: string;
}

interface Project {
    id: string;
    name: string;
    companyId: string;
}

interface ComparisonClientProps {
    companies: Company[];
    projects: Project[];
    initialYear: number;
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function ComparisonClient({ companies, projects, initialYear }: ComparisonClientProps) {
    const { selectedCompanyId: globalCompanyId } = useCompanyStore();
    const selectedCompanyId = globalCompanyId || companies[0]?.id || '';
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
    const { selectedYear, selectedMonth } = usePeriodStore();
    const [data, setData] = useState<ComparisonData | null>(null);
    const [loading, setLoading] = useState(false);

    // Filter projects by selected company
    const companyProjects = useMemo(() =>
        projects.filter(p => p.companyId === selectedCompanyId),
        [projects, selectedCompanyId]
    );

    // Reset project selection when company changes
    useEffect(() => {
        setSelectedProjectIds([]);
    }, [selectedCompanyId]);

    // Load comparison data
    const loadData = useCallback(async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            // Use first selected project or undefined for all
            const projectFilter = selectedProjectIds.length === 1 ? selectedProjectIds[0] : undefined;
            const compData = await getComparisonData(selectedCompanyId, selectedYear, selectedMonth, projectFilter);
            setData(compData);
        } catch (error) {
            console.error('Error loading comparison:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId, selectedYear, selectedMonth, selectedProjectIds]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const formatCurrency = (value: number) => {
        return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    };

    const formatPercent = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    const getDeviationColor = (row: ComparisonRow) => {
        // difference = budget - actual
        // For INCOME: actual > budget (diff < 0) is GOOD (green), actual < budget (diff > 0) is BAD (red)
        // For COST: actual < budget (diff > 0) is GOOD (green), actual > budget (diff < 0) is BAD (red)
        if (row.conceptType === 'INCOME') {
            // For income: negative diff = actual > budget = good = green
            return row.difference <= 0 ? 'text-green-600' : 'text-red-600';
        } else {
            // For cost: positive diff = actual < budget = good = green  
            return row.difference >= 0 ? 'text-green-600' : 'text-red-600';
        }
    };

    const getDeviationIcon = (row: ComparisonRow) => {
        // difference = budget - actual
        // For INCOME: negative diff (actual > budget) = TrendingUp green
        // For COST: positive diff (actual < budget) = TrendingDown green (we saved money)
        if (row.conceptType === 'INCOME') {
            if (row.difference < 0) return <TrendingUp size={14} className="text-green-600" />;
            if (row.difference > 0) return <TrendingDown size={14} className="text-red-600" />;
        } else {
            if (row.difference > 0) return <TrendingDown size={14} className="text-green-600" />;
            if (row.difference < 0) return <TrendingUp size={14} className="text-red-600" />;
        }
        return <Minus size={14} className="text-gray-400" />;
    };

    return (
        <div>
            <h1 className="text-xl md:text-2xl font-bold dark:text-white mb-4 md:mb-6">Comparativo Real vs Presupuesto</h1>

            {/* Filters - Project (Company and Period are in global header) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 mb-4 md:mb-6">
                <div className="flex flex-wrap gap-3 md:gap-4">
                    <div className="flex-1 min-w-0 max-w-sm">
                        <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Proyectos
                        </label>
                        <MultiProjectSelector
                            projects={companyProjects}
                            selectedIds={selectedProjectIds}
                            onChange={setSelectedProjectIds}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : !data || (data.incomeRows.length === 0 && data.costRows.length === 0) ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500">
                    <p>No hay datos para comparar en este periodo.</p>
                </div>
            ) : (
                <div className="space-y-4 md:space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
                            <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-2">Ingresos</h3>
                            <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                                <div>
                                    <p className="text-gray-400">Presupuesto</p>
                                    <p className="text-base md:text-lg font-bold truncate">{formatCurrency(data.totals.budgetIncome)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Real</p>
                                    <p className={`text-base md:text-lg font-bold truncate ${data.totals.actualIncome >= data.totals.budgetIncome ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(data.totals.actualIncome)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
                            <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-2">Costos</h3>
                            <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                                <div>
                                    <p className="text-gray-400">Presupuesto</p>
                                    <p className="text-base md:text-lg font-bold truncate">{formatCurrency(data.totals.budgetCost)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Real</p>
                                    <p className={`text-base md:text-lg font-bold truncate ${data.totals.actualCost <= data.totals.budgetCost ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(data.totals.actualCost)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
                            <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-2">Utilidad Neta</h3>
                            <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                                <div>
                                    <p className="text-gray-400">Presupuesto</p>
                                    <p className="text-base md:text-lg font-bold truncate">{formatCurrency(data.totals.budgetNet)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Real</p>
                                    <p className={`text-base md:text-lg font-bold truncate ${data.totals.actualNet >= data.totals.budgetNet ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(data.totals.actualNet)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Income Section */}
                    {data.incomeRows.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                            <div className="px-3 md:px-4 py-2 md:py-3 bg-green-50 dark:bg-green-900/30 border-b dark:border-gray-600">
                                <h3 className="text-sm md:text-base font-medium text-green-800 dark:text-green-200">Ingresos</h3>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                                {data.incomeRows.map((row) => (
                                    <div key={row.conceptId} className="p-3">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="font-medium dark:text-white text-sm truncate">{row.conceptName}</span>
                                            <span className={`flex items-center gap-1 text-xs font-medium ${getDeviationColor(row)}`}>
                                                {getDeviationIcon(row)}
                                                {formatPercent(row.percentDeviation)}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 text-xs">
                                            <div>
                                                <p className="text-gray-400">Presup.</p>
                                                <p className="font-medium">${(row.budget / 1000).toFixed(0)}k</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Real</p>
                                                <p className="font-medium">${(row.actual / 1000).toFixed(0)}k</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Dif.</p>
                                                <p className={`font-medium ${getDeviationColor(row)}`}>
                                                    {row.difference >= 0 ? '+' : '-'}${(Math.abs(row.difference) / 1000).toFixed(0)}k
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/* Mobile Total */}
                                <div className="p-3 bg-gray-50 dark:bg-gray-700">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="font-bold dark:text-white text-sm">Total Ingresos</span>
                                        <span className={`text-xs font-bold ${data.totals.actualIncome >= data.totals.budgetIncome ? 'text-green-600' : 'text-red-600'}`}>
                                            {data.totals.budgetIncome !== 0
                                                ? formatPercent(((data.totals.actualIncome - data.totals.budgetIncome) / data.totals.budgetIncome) * 100)
                                                : '-'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 text-xs">
                                        <div>
                                            <p className="text-gray-400">Presup.</p>
                                            <p className="font-bold">${(data.totals.budgetIncome / 1000).toFixed(0)}k</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Real</p>
                                            <p className="font-bold">${(data.totals.actualIncome / 1000).toFixed(0)}k</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Dif.</p>
                                            <p className={`font-bold ${data.totals.actualIncome >= data.totals.budgetIncome ? 'text-green-600' : 'text-red-600'}`}>
                                                ${((data.totals.actualIncome - data.totals.budgetIncome) / 1000).toFixed(0)}k
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Table */}
                            <table className="hidden md:table w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Concepto</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Presupuesto</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Real</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Diferencia</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {data.incomeRows.map((row) => (
                                        <tr key={row.conceptId}>
                                            <td className="px-4 py-2 dark:text-white">{row.conceptName}</td>
                                            <td className="px-4 py-2 text-right">{formatCurrency(row.budget)}</td>
                                            <td className="px-4 py-2 text-right">{formatCurrency(row.actual)}</td>
                                            <td className={`px-4 py-2 text-right ${getDeviationColor(row)}`}>
                                                <span className="flex items-center justify-end gap-1">
                                                    {getDeviationIcon(row)}
                                                    {formatCurrency(Math.abs(row.difference))}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-2 text-right ${getDeviationColor(row)}`}>
                                                {formatPercent(row.percentDeviation)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 dark:bg-gray-700 font-medium">
                                    <tr>
                                        <td className="px-4 py-3 dark:text-white">Total Ingresos</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(data.totals.budgetIncome)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(data.totals.actualIncome)}</td>
                                        <td className={`px-4 py-3 text-right ${data.totals.actualIncome >= data.totals.budgetIncome ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(data.totals.actualIncome - data.totals.budgetIncome)}
                                        </td>
                                        <td className={`px-4 py-3 text-right ${data.totals.actualIncome >= data.totals.budgetIncome ? 'text-green-600' : 'text-red-600'}`}>
                                            {data.totals.budgetIncome !== 0
                                                ? formatPercent(((data.totals.actualIncome - data.totals.budgetIncome) / data.totals.budgetIncome) * 100)
                                                : '-'}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* Cost Section */}
                    {data.costRows.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                            <div className="px-3 md:px-4 py-2 md:py-3 bg-red-50 dark:bg-red-900/30 border-b dark:border-gray-600">
                                <h3 className="text-sm md:text-base font-medium text-red-800 dark:text-red-200">Costos</h3>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                                {data.costRows.map((row) => (
                                    <div key={row.conceptId} className="p-3">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="font-medium dark:text-white text-sm truncate">{row.conceptName}</span>
                                            <span className={`flex items-center gap-1 text-xs font-medium ${getDeviationColor(row)}`}>
                                                {getDeviationIcon(row)}
                                                {formatPercent(row.percentDeviation)}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 text-xs">
                                            <div>
                                                <p className="text-gray-400">Presup.</p>
                                                <p className="font-medium">${(row.budget / 1000).toFixed(0)}k</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Real</p>
                                                <p className="font-medium">${(row.actual / 1000).toFixed(0)}k</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Dif.</p>
                                                <p className={`font-medium ${getDeviationColor(row)}`}>
                                                    {row.difference >= 0 ? '+' : '-'}${(Math.abs(row.difference) / 1000).toFixed(0)}k
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/* Mobile Total */}
                                <div className="p-3 bg-gray-50 dark:bg-gray-700">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="font-bold dark:text-white text-sm">Total Costos</span>
                                        <span className={`text-xs font-bold ${data.totals.actualCost <= data.totals.budgetCost ? 'text-green-600' : 'text-red-600'}`}>
                                            {data.totals.budgetCost !== 0
                                                ? formatPercent(((data.totals.budgetCost - data.totals.actualCost) / data.totals.budgetCost) * 100)
                                                : '-'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 text-xs">
                                        <div>
                                            <p className="text-gray-400">Presup.</p>
                                            <p className="font-bold">${(data.totals.budgetCost / 1000).toFixed(0)}k</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Real</p>
                                            <p className="font-bold">${(data.totals.actualCost / 1000).toFixed(0)}k</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Dif.</p>
                                            <p className={`font-bold ${data.totals.actualCost <= data.totals.budgetCost ? 'text-green-600' : 'text-red-600'}`}>
                                                ${((data.totals.budgetCost - data.totals.actualCost) / 1000).toFixed(0)}k
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Table */}
                            <table className="hidden md:table w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Concepto</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Presupuesto</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Real</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Diferencia</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {data.costRows.map((row) => (
                                        <tr key={row.conceptId}>
                                            <td className="px-4 py-2 dark:text-white">{row.conceptName}</td>
                                            <td className="px-4 py-2 text-right">{formatCurrency(row.budget)}</td>
                                            <td className="px-4 py-2 text-right">{formatCurrency(row.actual)}</td>
                                            <td className={`px-4 py-2 text-right ${getDeviationColor(row)}`}>
                                                <span className="flex items-center justify-end gap-1">
                                                    {getDeviationIcon(row)}
                                                    {formatCurrency(Math.abs(row.difference))}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-2 text-right ${getDeviationColor(row)}`}>
                                                {formatPercent(row.percentDeviation)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 dark:bg-gray-700 font-medium">
                                    <tr>
                                        <td className="px-4 py-3 dark:text-white">Total Costos</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(data.totals.budgetCost)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(data.totals.actualCost)}</td>
                                        <td className={`px-4 py-3 text-right ${data.totals.actualCost <= data.totals.budgetCost ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(data.totals.budgetCost - data.totals.actualCost)}
                                        </td>
                                        <td className={`px-4 py-3 text-right ${data.totals.actualCost <= data.totals.budgetCost ? 'text-green-600' : 'text-red-600'}`}>
                                            {data.totals.budgetCost !== 0
                                                ? formatPercent(((data.totals.budgetCost - data.totals.actualCost) / data.totals.budgetCost) * 100)
                                                : '-'}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* Otros Section */}
                    {data.otrosRows && data.otrosRows.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                            <div className="px-3 md:px-4 py-2 md:py-3 bg-purple-50 dark:bg-purple-900/30 border-b dark:border-gray-600">
                                <h3 className="text-sm md:text-base font-medium text-purple-800 dark:text-purple-200">Otros</h3>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                                {data.otrosRows.map((row, idx) => (
                                    <div key={`${row.conceptId}-${idx}`} className="p-3">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-1 min-w-0">
                                                <span className={`px-1 py-0.5 rounded text-xs ${row.conceptType === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {row.conceptType === 'INCOME' ? 'I' : 'C'}
                                                </span>
                                                <span className="font-medium dark:text-white text-sm truncate">{row.conceptName}</span>
                                            </div>
                                            <span className={`flex items-center gap-1 text-xs font-medium ${getDeviationColor(row)}`}>
                                                {getDeviationIcon(row)}
                                                {formatPercent(row.percentDeviation)}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 text-xs">
                                            <div>
                                                <p className="text-gray-400">Presup.</p>
                                                <p className="font-medium">${(row.budget / 1000).toFixed(0)}k</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Real</p>
                                                <p className="font-medium">${(row.actual / 1000).toFixed(0)}k</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Dif.</p>
                                                <p className={`font-medium ${getDeviationColor(row)}`}>
                                                    {row.difference >= 0 ? '+' : '-'}${(Math.abs(row.difference) / 1000).toFixed(0)}k
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table */}
                            <table className="hidden md:table w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Concepto</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tipo</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Presupuesto</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Real</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Diferencia</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {data.otrosRows.map((row, idx) => (
                                        <tr key={`${row.conceptId}-${idx}`}>
                                            <td className="px-4 py-2 dark:text-white">{row.conceptName}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-0.5 rounded text-xs ${row.conceptType === 'INCOME' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                                    {row.conceptType === 'INCOME' ? 'I' : 'C'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right">{formatCurrency(row.budget)}</td>
                                            <td className="px-4 py-2 text-right">{formatCurrency(row.actual)}</td>
                                            <td className={`px-4 py-2 text-right ${getDeviationColor(row)}`}>
                                                <span className="flex items-center justify-end gap-1">
                                                    {getDeviationIcon(row)}
                                                    {formatCurrency(Math.abs(row.difference))}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-2 text-right ${getDeviationColor(row)}`}>
                                                {formatPercent(row.percentDeviation)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
