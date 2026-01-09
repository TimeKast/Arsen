'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react';
import { getDashboardKPIs, getTopProjects, getTrendData, type DashboardKPIs, type TopProject, type TrendDataPoint } from '@/actions/dashboard';
import { usePeriodStore } from '@/stores/period-store';

interface Company {
    id: string;
    name: string;
}

interface Project {
    id: string;
    name: string;
    companyId: string;
}

interface DashboardClientProps {
    companies: Company[];
    projects: Project[];
    initialYear: number;
    userName: string;
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function DashboardClient({ companies, projects, initialYear, userName }: DashboardClientProps) {
    const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || '');
    const [selectedCompany, setSelectedCompany] = useState(companies[0]?.name || '');
    const { selectedYear, selectedMonth } = usePeriodStore();
    const [selectedProjectId, setSelectedProjectId] = useState<string>(''); // empty = all projects
    const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
    const [topProjects, setTopProjects] = useState<TopProject[]>([]);
    const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
    const [loading, setLoading] = useState(false);

    // Filter projects by company
    const companyProjects = projects.filter(p => p.companyId === selectedCompanyId);

    // Update selected company name when ID changes
    useEffect(() => {
        const company = companies.find(c => c.id === selectedCompanyId);
        if (company) setSelectedCompany(company.name);
    }, [selectedCompanyId, companies]);

    // Load dashboard data
    const loadData = useCallback(async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const projectFilter = selectedProjectId || undefined;
            const [kpiData, topData, trend] = await Promise.all([
                getDashboardKPIs(selectedCompanyId, selectedYear, selectedMonth, projectFilter),
                getTopProjects(selectedCompanyId, selectedYear, selectedMonth, projectFilter),
                getTrendData(selectedCompanyId, selectedYear, selectedMonth, projectFilter),
            ]);
            setKpis(kpiData);
            setTopProjects(topData);
            setTrendData(trend);
        } catch (error) {
            console.error('Error loading dashboard:', error);
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

    // Get max value for chart scaling
    const maxChartValue = Math.max(...trendData.map(d => Math.max(d.income, d.cost, Math.abs(d.profit))), 1);

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Bienvenido, {userName}</h1>
                <p className="text-gray-500">
                    {selectedCompany} - {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </p>
            </div>

            {/* Filters - Company and Project only (Period is in global header) */}
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
            ) : !kpis ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500">
                    <p>No hay datos disponibles para este periodo.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <DollarSign className="text-green-600" size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Ingresos</p>
                                    <p className="text-xl font-bold text-green-600">{formatCurrency(kpis.totalIncome)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                    <TrendingDown className="text-red-600" size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Costos</p>
                                    <p className="text-xl font-bold text-red-600">{formatCurrency(kpis.totalCost)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${kpis.netProfit >= 0 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-amber-100 dark:bg-amber-900'}`}>
                                    <TrendingUp className={kpis.netProfit >= 0 ? 'text-blue-600' : 'text-amber-600'} size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Utilidad</p>
                                    <p className={`text-xl font-bold ${kpis.netProfit >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                                        {formatCurrency(kpis.netProfit)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${kpis.budgetDeviation >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                                    <Target className={kpis.budgetDeviation >= 0 ? 'text-green-600' : 'text-red-600'} size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">vs Presupuesto</p>
                                    <p className={`text-xl font-bold ${kpis.budgetDeviation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatPercent(kpis.budgetDeviationPercent)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Projects */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                            <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center gap-2">
                                <BarChart3 size={18} className="text-blue-600" />
                                <h3 className="font-medium dark:text-white">Top 5 Proyectos por Utilidad</h3>
                            </div>
                            {topProjects.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">Sin datos de proyectos</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Proyecto</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Utilidad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {topProjects.map((project, idx) => (
                                            <tr key={project.projectId}>
                                                <td className="px-4 py-2 dark:text-white">
                                                    <span className="text-gray-400 mr-2">{idx + 1}.</span>
                                                    {project.projectName}
                                                </td>
                                                <td className={`px-4 py-2 text-right font-medium ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(project.profit)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Trend Chart */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                            <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center gap-2">
                                <TrendingUp size={18} className="text-blue-600" />
                                <h3 className="font-medium dark:text-white">Tendencia (6 meses)</h3>
                            </div>
                            {trendData.every(d => d.income === 0 && d.cost === 0) ? (
                                <div className="p-4 text-center text-gray-500">Sin datos historicos</div>
                            ) : (
                                <div className="p-4">
                                    <div className="flex items-end justify-between gap-2 h-40">
                                        {trendData.map((point) => (
                                            <div key={`${point.year}-${point.month}`} className="flex-1 flex flex-col items-center gap-1">
                                                <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '120px' }}>
                                                    <div
                                                        className="w-3 bg-green-500 rounded-t"
                                                        style={{ height: `${(point.income / maxChartValue) * 100}%` }}
                                                        title={`Ingresos: ${formatCurrency(point.income)}`}
                                                    />
                                                    <div
                                                        className="w-3 bg-red-500 rounded-b"
                                                        style={{ height: `${(point.cost / maxChartValue) * 100}%` }}
                                                        title={`Costos: ${formatCurrency(point.cost)}`}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500">{point.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-center gap-4 mt-4 text-xs">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-green-500 rounded" />
                                            <span className="text-gray-500">Ingresos</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-red-500 rounded" />
                                            <span className="text-gray-500">Costos</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
