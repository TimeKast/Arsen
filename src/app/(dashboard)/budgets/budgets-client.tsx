'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Upload, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { getBudgetsByProject, type ProjectBudget } from '@/actions/budgets';
import { useCompanyStore } from '@/stores/company-store';
import { usePeriodStore } from '@/stores/period-store';
import { MultiProjectSelector } from '@/components/ui/multi-project-selector';

interface Company {
    id: string;
    name: string;
}

interface Area {
    id: string;
    name: string;
    companyId: string;
}

interface BudgetsClientProps {
    companies: Company[];
    areas: Area[];
    projects: Project[];
    initialYear: number;
    userRole: string;
}

interface Project {
    id: string;
    name: string;
    companyId: string;
}

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
const months = [
    { value: 0, label: 'Todos los meses' },
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
];

export function BudgetsClient({ companies, areas, projects, initialYear, userRole }: BudgetsClientProps) {
    const { selectedCompanyId: globalCompanyId } = useCompanyStore();
    const { selectedYear, selectedMonth } = usePeriodStore();
    const selectedCompanyId = globalCompanyId || companies[0]?.id || '';

    const [selectedAreaId, setSelectedAreaId] = useState<string>('');
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]); // empty = all projects
    const [projectBudgets, setProjectBudgets] = useState<ProjectBudget[]>([]);
    const [adminBudget, setAdminBudget] = useState<ProjectBudget | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

    const canImport = userRole === 'ADMIN' || userRole === 'STAFF';

    // Filter areas and projects by company
    const companyAreas = areas.filter(a => a.companyId === selectedCompanyId);
    const companyProjects = projects.filter(p => p.companyId === selectedCompanyId);

    // Load budget data
    const loadData = useCallback(async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const data = await getBudgetsByProject(
                selectedCompanyId,
                selectedYear,
                selectedAreaId || undefined,
                selectedMonth || undefined // 0 means all months
            );

            // Filter by selected projects if any
            let projects = data.filter(d => d.projectId !== null);
            if (selectedProjectIds.length > 0) {
                projects = projects.filter(p => p.projectId && selectedProjectIds.includes(p.projectId));
            }
            const admin = data.find(d => d.projectId === null) || null;

            setProjectBudgets(projects);
            setAdminBudget(admin);
        } catch (error) {
            console.error('Error loading budgets:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId, selectedYear, selectedAreaId, selectedMonth, selectedProjectIds]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const toggleProject = (projectId: string) => {
        const newExpanded = new Set(expandedProjects);
        if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId);
        } else {
            newExpanded.add(projectId);
        }
        setExpandedProjects(newExpanded);
    };

    // Calculate totals
    const totalIncome = projectBudgets.reduce((sum, p) => sum + p.totalIncome, 0) + (adminBudget?.totalIncome || 0);
    const totalCost = projectBudgets.reduce((sum, p) => sum + p.totalCost, 0) + (adminBudget?.totalCost || 0);
    const totalNet = totalIncome - totalCost;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
                <h1 className="text-xl md:text-2xl font-bold dark:text-white">Presupuestos</h1>
                {canImport && (
                    <Link
                        href="/budgets/import"
                        className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base"
                    >
                        <Upload size={18} />
                        Importar
                    </Link>
                )}
            </div>

            {/* Filters - Area and Project (Year and Month are controlled by global header) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 mb-4 md:mb-6">
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                        <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Área
                        </label>
                        <select
                            value={selectedAreaId}
                            onChange={(e) => setSelectedAreaId(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        >
                            <option value="">Todas las áreas</option>
                            {companyAreas.map((a) => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-0">
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
            ) : projectBudgets.length === 0 && !adminBudget ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500">
                    <p>No hay presupuestos para este año.</p>
                    {canImport && (
                        <p className="text-sm mt-2">
                            Usa el botón "Importar" para cargar datos.
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-4 md:space-y-6">
                    {/* Totals Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
                        <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
                            <div>
                                <p className="text-xs md:text-sm text-gray-500">Ingresos Totales</p>
                                <p className="text-sm md:text-xl font-bold text-green-600">
                                    ${totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs md:text-sm text-gray-500">Costos Totales</p>
                                <p className="text-sm md:text-xl font-bold text-red-600">
                                    ${totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs md:text-sm text-gray-500">Utilidad Neta</p>
                                <p className={`text-sm md:text-xl font-bold ${totalNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${totalNet.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Projects - Mobile Cards View */}
                    <div className="md:hidden space-y-2">
                        <div className="text-xs text-gray-500 font-medium mb-2">Presupuesto por Proyecto</div>
                        {projectBudgets.map((project) => {
                            const isExpanded = expandedProjects.has(project.projectId || 'admin');
                            return (
                                <div key={project.projectId} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                                    <div
                                        onClick={() => toggleProject(project.projectId || 'admin')}
                                        className="p-3 cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                <span className="font-medium dark:text-white truncate">{project.projectName}</span>
                                            </div>
                                            <span className={`text-sm font-bold ${project.netBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                ${project.netBudget.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between mt-1 text-xs">
                                            <span className="text-green-600">+${project.totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                            <span className="text-red-600">-${project.totalCost.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="border-t dark:border-gray-700 px-3 py-2 space-y-1 bg-gray-50 dark:bg-gray-900">
                                            {project.concepts.map((concept) => (
                                                <div key={`${project.projectId}-${concept.conceptId}`} className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-1 min-w-0">
                                                        <span className={`px-1 py-0.5 rounded ${concept.conceptType === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {concept.conceptType === 'INCOME' ? 'I' : 'C'}
                                                        </span>
                                                        <span className="truncate text-gray-600 dark:text-gray-400">{concept.conceptName}</span>
                                                    </div>
                                                    <span className={concept.conceptType === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                                                        ${concept.amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Projects - Desktop Table View */}
                    <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                            <h3 className="font-medium dark:text-white">Presupuesto por Proyecto</h3>
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
                                {projectBudgets.map((project) => {
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
                                                <td className={`px-4 py-3 text-right font-medium ${project.netBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    ${project.netBudget.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
                                                    <td className={`px-4 py-2 text-right ${concept.conceptType === 'INCOME' ? 'text-green-600' : ''}`}>
                                                        {concept.conceptType === 'INCOME' ? `$${concept.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : ''}
                                                    </td>
                                                    <td className={`px-4 py-2 text-right ${concept.conceptType === 'COST' ? 'text-red-600' : ''}`}>
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

                    {/* Admin Expenses */}
                    {adminBudget && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/30 border-b dark:border-gray-600 flex items-center gap-2">
                                <Building2 size={18} className="text-amber-600" />
                                <h3 className="font-medium text-amber-800 dark:text-amber-200">Gastos de Administración</h3>
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
                                    {adminBudget.concepts.map((concept) => (
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
                                        <td className="px-4 py-3 dark:text-white">Total Administración</td>
                                        <td className={`px-4 py-3 text-right ${adminBudget.netBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ${adminBudget.netBudget.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
