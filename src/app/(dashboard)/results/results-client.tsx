'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Upload, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { getResultsForPeriod, getAvailableResultPeriods, type ProjectResult } from '@/actions/results-view';

interface Company {
    id: string;
    name: string;
}

interface ResultsClientProps {
    companies: Company[];
    initialYear: number;
    userRole: string;
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function ResultsClient({ companies, initialYear, userRole }: ResultsClientProps) {
    const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || '');
    const [selectedYear, setSelectedYear] = useState(initialYear);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [availablePeriods, setAvailablePeriods] = useState<{ year: number; month: number }[]>([]);
    const [projectResults, setProjectResults] = useState<ProjectResult[]>([]);
    const [adminResults, setAdminResults] = useState<ProjectResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

    const canImport = userRole === 'ADMIN' || userRole === 'STAFF';

    // Load available periods
    useEffect(() => {
        async function loadPeriods() {
            if (!selectedCompanyId) return;
            try {
                const periods = await getAvailableResultPeriods(selectedCompanyId);
                setAvailablePeriods(periods);
                // Select first available period if current is not available
                if (periods.length > 0) {
                    const current = periods.find(p => p.year === selectedYear && p.month === selectedMonth);
                    if (!current) {
                        setSelectedYear(periods[0].year);
                        setSelectedMonth(periods[0].month);
                    }
                }
            } catch (error) {
                console.error('Error loading periods:', error);
            }
        }
        loadPeriods();
    }, [selectedCompanyId]);

    // Load results for selected period
    const loadResults = useCallback(async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const { projectResults: pr, adminResults: ar } = await getResultsForPeriod(
                selectedCompanyId,
                selectedYear,
                selectedMonth
            );
            setProjectResults(pr);
            setAdminResults(ar);
        } catch (error) {
            console.error('Error loading results:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId, selectedYear, selectedMonth]);

    useEffect(() => {
        loadResults();
    }, [loadResults]);

    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) {
                next.delete(projectId);
            } else {
                next.add(projectId);
            }
            return next;
        });
    };

    // Calculate totals
    const totalIncome = projectResults.reduce((sum, p) => sum + p.totalIncome, 0) + (adminResults?.totalIncome || 0);
    const totalCost = projectResults.reduce((sum, p) => sum + p.totalCost, 0) + (adminResults?.totalCost || 0);
    const totalNet = totalIncome - totalCost;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Resultados</h1>
                {canImport && (
                    <Link
                        href="/results/import"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Upload size={20} />
                        Importar
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
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
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
                            Periodo
                        </label>
                        <select
                            value={`${selectedYear}-${selectedMonth}`}
                            onChange={(e) => {
                                const [y, m] = e.target.value.split('-').map(Number);
                                setSelectedYear(y);
                                setSelectedMonth(m);
                            }}
                            className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {availablePeriods.length === 0 ? (
                                <option value="">Sin datos</option>
                            ) : (
                                availablePeriods.map((p) => (
                                    <option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>
                                        {MONTH_NAMES[p.month - 1]} {p.year}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : projectResults.length === 0 && !adminResults ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500">
                    <p>No hay resultados para este periodo.</p>
                    {canImport && (
                        <p className="text-sm mt-2">
                            Usa el boton "Importar" para cargar datos.
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Totals Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-green-600">
                                    ${totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-sm text-gray-500">Ingresos</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-600">
                                    ${totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-sm text-gray-500">Costos</p>
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${totalNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${totalNet.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-sm text-gray-500">Utilidad</p>
                            </div>
                        </div>
                    </div>

                    {/* Projects Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                            <h3 className="font-medium dark:text-white">Resultados por Proyecto</h3>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                        Proyecto
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                        Ingresos
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                        Costos
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                        Utilidad
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {projectResults.map((project) => {
                                    const isExpanded = expandedProjects.has(project.projectId || 'admin');
                                    return (
                                        <>
                                            <tr
                                                key={project.projectId}
                                                onClick={() => toggleProject(project.projectId || 'admin')}
                                                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <td className="px-4 py-3 dark:text-white">
                                                    <div className="flex items-center gap-2">
                                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                        {project.projectName}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right text-green-600">
                                                    ${project.totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-right text-red-600">
                                                    ${project.totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className={`px-4 py-3 text-right font-medium ${project.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    ${project.netResult.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                            {isExpanded && project.concepts.map((concept) => (
                                                <tr key={`${project.projectId}-${concept.conceptId}`} className="bg-gray-50 dark:bg-gray-900">
                                                    <td className="px-4 py-2 pl-12 text-gray-600 dark:text-gray-400">
                                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs mr-2 ${concept.conceptType === 'INCOME'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {concept.conceptType === 'INCOME' ? 'I' : 'C'}
                                                        </span>
                                                        {concept.conceptName}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                                                        {concept.conceptType === 'INCOME' ? `$${concept.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : ''}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                                                        {concept.conceptType === 'COST' ? `$${concept.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : ''}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            ))}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Admin Section */}
                    {adminResults && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/30 border-b dark:border-gray-600 flex items-center gap-2">
                                <Building2 size={18} className="text-amber-600" />
                                <h3 className="font-medium text-amber-800 dark:text-amber-200">Gastos de Administracion</h3>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                            Concepto
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                            Monto
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {adminResults.concepts.map((concept) => (
                                        <tr key={concept.conceptId}>
                                            <td className="px-4 py-2 dark:text-white">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs mr-2 ${concept.conceptType === 'INCOME'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {concept.conceptType === 'INCOME' ? 'I' : 'C'}
                                                </span>
                                                {concept.conceptName}
                                            </td>
                                            <td className={`px-4 py-2 text-right ${concept.conceptType === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                                ${concept.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 dark:bg-gray-700 font-medium">
                                    <tr>
                                        <td className="px-4 py-3 dark:text-white">Total Administracion</td>
                                        <td className={`px-4 py-3 text-right ${adminResults.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ${adminResults.netResult.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
