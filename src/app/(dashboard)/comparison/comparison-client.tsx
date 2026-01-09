'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getComparisonData, type ComparisonData, type ComparisonRow } from '@/actions/comparison';
import { usePeriodStore } from '@/stores/period-store';
import { useCompanyStore } from '@/stores/company-store';

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
    const [selectedProjectId, setSelectedProjectId] = useState('');
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
        setSelectedProjectId('');
    }, [selectedCompanyId]);

    // Load comparison data
    const loadData = useCallback(async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const compData = await getComparisonData(selectedCompanyId, selectedYear, selectedMonth, selectedProjectId || undefined);
            setData(compData);
        } catch (error) {
            console.error('Error loading comparison:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId, selectedYear, selectedMonth, selectedProjectId]);

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
            <h1 className="text-2xl font-bold dark:text-white mb-6">Comparativo Real vs Presupuesto</h1>

            {/* Filters - Project only (Company and Period are in global header) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Proyecto
                        </label>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">Todos los proyectos</option>
                            {companyProjects.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
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
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Ingresos</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-gray-400">Presupuesto</p>
                                    <p className="text-lg font-bold">{formatCurrency(data.totals.budgetIncome)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Real</p>
                                    <p className={`text-lg font-bold ${data.totals.actualIncome >= data.totals.budgetIncome ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(data.totals.actualIncome)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Costos</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-gray-400">Presupuesto</p>
                                    <p className="text-lg font-bold">{formatCurrency(data.totals.budgetCost)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Real</p>
                                    <p className={`text-lg font-bold ${data.totals.actualCost <= data.totals.budgetCost ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(data.totals.actualCost)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Utilidad Neta</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-gray-400">Presupuesto</p>
                                    <p className="text-lg font-bold">{formatCurrency(data.totals.budgetNet)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Real</p>
                                    <p className={`text-lg font-bold ${data.totals.actualNet >= data.totals.budgetNet ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(data.totals.actualNet)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Income Table */}
                    {data.incomeRows.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                            <div className="px-4 py-3 bg-green-50 dark:bg-green-900/30 border-b dark:border-gray-600">
                                <h3 className="font-medium text-green-800 dark:text-green-200">Ingresos</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
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
                        </div>
                    )}

                    {/* Cost Table */}
                    {data.costRows.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/30 border-b dark:border-gray-600">
                                <h3 className="font-medium text-red-800 dark:text-red-200">Costos</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
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
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
