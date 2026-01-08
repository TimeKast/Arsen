'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Eye } from 'lucide-react';
import {
    getAreasForBudget,
    getBudgetData,
    getConceptsForArea,
} from '@/actions/budgets';

interface Company {
    id: string;
    name: string;
}

interface Area {
    id: string;
    name: string;
}

interface BudgetSummary {
    areaId: string;
    areaName: string;
    totalIncome: number;
    totalCost: number;
    monthlyTotals: Record<number, { income: number; cost: number }>;
}

interface BudgetsClientProps {
    companies: Company[];
    initialYear: number;
    userRole: string;
}

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function BudgetsClient({ companies, initialYear, userRole }: BudgetsClientProps) {
    const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || '');
    const [selectedYear, setSelectedYear] = useState(initialYear);
    const [areas, setAreas] = useState<Area[]>([]);
    const [summaries, setSummaries] = useState<BudgetSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
    const [detailData, setDetailData] = useState<{
        concepts: Array<{ id: string; name: string; type: string }>;
        values: Record<string, Record<number, string>>;
    } | null>(null);

    const canEdit = userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'AREA_USER';

    // Load areas and budget summary
    const loadData = useCallback(async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const areasData = await getAreasForBudget(selectedCompanyId);
            setAreas(areasData);

            // Get budget data for each area
            const summaryPromises = areasData.map(async (area) => {
                const [budgetData, concepts] = await Promise.all([
                    getBudgetData(selectedCompanyId, area.id, selectedYear),
                    getConceptsForArea(area.id),
                ]);

                const monthlyTotals: Record<number, { income: number; cost: number }> = {};
                for (let m = 1; m <= 12; m++) {
                    monthlyTotals[m] = { income: 0, cost: 0 };
                }

                let totalIncome = 0;
                let totalCost = 0;

                for (const entry of budgetData) {
                    const concept = concepts.find(c => c.id === entry.conceptId);
                    const amount = parseFloat(entry.amount) || 0;

                    if (concept?.type === 'INCOME') {
                        monthlyTotals[entry.month].income += amount;
                        totalIncome += amount;
                    } else {
                        monthlyTotals[entry.month].cost += amount;
                        totalCost += amount;
                    }
                }

                return {
                    areaId: area.id,
                    areaName: area.name,
                    totalIncome,
                    totalCost,
                    monthlyTotals,
                };
            });

            const allSummaries = await Promise.all(summaryPromises);
            setSummaries(allSummaries);
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId, selectedYear]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Load detail for selected area
    const loadDetail = useCallback(async (areaId: string) => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const [budgetData, concepts] = await Promise.all([
                getBudgetData(selectedCompanyId, areaId, selectedYear),
                getConceptsForArea(areaId),
            ]);

            const values: Record<string, Record<number, string>> = {};
            for (const concept of concepts) {
                values[concept.id] = {};
                for (let m = 1; m <= 12; m++) {
                    const entry = budgetData.find(b => b.conceptId === concept.id && b.month === m);
                    values[concept.id][m] = entry?.amount || '0';
                }
            }

            setDetailData({ concepts, values });
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId, selectedYear]);

    const handleViewDetail = (areaId: string) => {
        setSelectedAreaId(areaId);
        loadDetail(areaId);
    };

    const years = [initialYear - 1, initialYear, initialYear + 1];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Presupuestos</h1>
                {canEdit && (
                    <Link
                        href="/budgets/capture"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={20} />
                        Capturar
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Empresa
                        </label>
                        <select
                            value={selectedCompanyId}
                            onChange={(e) => {
                                setSelectedCompanyId(e.target.value);
                                setSelectedAreaId(null);
                                setDetailData(null);
                            }}
                            className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Ano
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => {
                                setSelectedYear(Number(e.target.value));
                                setSelectedAreaId(null);
                                setDetailData(null);
                            }}
                            className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : selectedAreaId && detailData ? (
                /* Detail View */
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-semibold dark:text-white">
                            Detalle: {areas.find(a => a.id === selectedAreaId)?.name}
                        </h2>
                        <button
                            onClick={() => {
                                setSelectedAreaId(null);
                                setDetailData(null);
                            }}
                            className="text-blue-600 hover:underline text-sm"
                        >
                            Volver al resumen
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[180px]">
                                        Concepto
                                    </th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                        Tipo
                                    </th>
                                    {months.map((m, idx) => (
                                        <th key={idx} className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[70px]">
                                            {m}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {detailData.concepts.map((concept) => {
                                    const rowTotal = Object.values(detailData.values[concept.id] || {}).reduce(
                                        (sum, val) => sum + (parseFloat(val) || 0), 0
                                    );
                                    return (
                                        <tr key={concept.id}>
                                            <td className="px-4 py-2 dark:text-white font-medium">{concept.name}</td>
                                            <td className="px-2 py-2 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs ${concept.type === 'INCOME'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {concept.type === 'INCOME' ? 'I' : 'C'}
                                                </span>
                                            </td>
                                            {months.map((_, idx) => (
                                                <td key={idx} className="px-2 py-2 text-right dark:text-white">
                                                    {parseFloat(detailData.values[concept.id]?.[idx + 1] || '0').toLocaleString('es-MX')}
                                                </td>
                                            ))}
                                            <td className="px-4 py-2 text-right font-medium dark:text-white">
                                                {rowTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Summary View */
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                    Area
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                    Ingresos
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                    Costos
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                    Neto
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {summaries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        No hay datos de presupuesto
                                    </td>
                                </tr>
                            ) : (
                                summaries.map((summary) => (
                                    <tr key={summary.areaId}>
                                        <td className="px-4 py-3 dark:text-white font-medium">{summary.areaName}</td>
                                        <td className="px-4 py-3 text-right text-green-600">
                                            ${summary.totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-right text-red-600">
                                            ${summary.totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-medium ${(summary.totalIncome - summary.totalCost) >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            ${(summary.totalIncome - summary.totalCost).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleViewDetail(summary.areaId)}
                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                                title="Ver detalle"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {summaries.length > 0 && (
                            <tfoot className="bg-gray-50 dark:bg-gray-700 font-medium">
                                <tr>
                                    <td className="px-4 py-3 dark:text-white">Total General</td>
                                    <td className="px-4 py-3 text-right text-green-600">
                                        ${summaries.reduce((sum, s) => sum + s.totalIncome, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-right text-red-600">
                                        ${summaries.reduce((sum, s) => sum + s.totalCost, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className={`px-4 py-3 text-right ${summaries.reduce((sum, s) => sum + (s.totalIncome - s.totalCost), 0) >= 0
                                            ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        ${summaries.reduce((sum, s) => sum + (s.totalIncome - s.totalCost), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            )}
        </div>
    );
}
