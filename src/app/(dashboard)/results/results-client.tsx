'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Upload, ChevronDown, ChevronRight, Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { getResultsForPeriod, type ProjectResult } from '@/actions/results-view';
import { createResult, updateResult, deleteResult } from '@/actions/results';
import { useCompanyStore } from '@/stores/company-store';
import { usePeriodStore } from '@/stores/period-store';
import { MultiProjectSelector, ADMIN_PROJECT_ID } from '@/components/ui/multi-project-selector';
import { ResultForm } from '@/components/forms/result-form';

interface Company {
    id: string;
    name: string;
}

interface Project {
    id: string;
    name: string;
    companyId: string;
}

interface Concept {
    id: string;
    name: string;
    type: 'INCOME' | 'COST';
}

interface ResultsClientProps {
    companies: Company[];
    projects: Project[];
    concepts: Concept[];
    initialYear: number;
    userRole: string;
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function ResultsClient({ companies, projects, concepts, initialYear, userRole }: ResultsClientProps) {
    // Use global company store from header instead of local state
    const { selectedCompanyId: globalCompanyId, companies: storeCompanies } = useCompanyStore();
    const { selectedYear, selectedMonth } = usePeriodStore();
    const selectedCompanyId = globalCompanyId || companies[0]?.id || '';
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]); // empty = all
    const [projectResults, setProjectResults] = useState<ProjectResult[]>([]);
    const [adminResults, setAdminResults] = useState<ProjectResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingResult, setEditingResult] = useState<{ id: string; projectId: string | null; conceptId: string; amount: number } | null>(null);

    const canEdit = userRole === 'ADMIN' || userRole === 'STAFF';
    const companyProjects = projects.filter(p => p.companyId === selectedCompanyId);
    const monthDisplay = selectedMonth === 0 ? 'Todo el año' : MONTH_NAMES[selectedMonth - 1];

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

            // Check if admin is selected
            const adminSelected = selectedProjectIds.includes(ADMIN_PROJECT_ID);
            // Get real project IDs (excluding admin)
            const realProjectIds = selectedProjectIds.filter(id => id !== ADMIN_PROJECT_ID);

            // Filter by selected projects if any
            let filteredProjects = pr;
            if (realProjectIds.length > 0) {
                filteredProjects = pr.filter(p => p.projectId && realProjectIds.includes(p.projectId));
            } else if (adminSelected && selectedProjectIds.length === 1) {
                // Only admin is selected, show no projects
                filteredProjects = [];
            }

            // Show admin results if: no filter, admin selected, or nothing selected
            const adminData = (selectedProjectIds.length === 0 || adminSelected) ? ar : null;

            setProjectResults(filteredProjects);
            setAdminResults(adminData);
        } catch (error) {
            console.error('Error loading results:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId, selectedYear, selectedMonth, selectedProjectIds]);

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
                <h1 className="text-xl md:text-2xl font-bold dark:text-white">Resultados</h1>
                {canEdit && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setEditingResult(null); setShowForm(true); }}
                            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm md:text-base"
                        >
                            <Plus size={18} />
                            Agregar
                        </button>
                        <Link
                            href="/results/import"
                            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base"
                        >
                            <Upload size={18} />
                            Importar
                        </Link>
                    </div>
                )}
            </div>

            {/* Filters - Project (Period is in global header) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 mb-4 md:mb-6">
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-start sm:items-end">
                    <div className="flex-1 min-w-0">
                        <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Proyectos
                        </label>
                        <MultiProjectSelector
                            projects={companyProjects}
                            selectedIds={selectedProjectIds}
                            onChange={setSelectedProjectIds}
                            showAdminOption
                        />
                    </div>
                    <div className="text-xs md:text-sm text-gray-500">
                        Mostrando resultados para {monthDisplay} {selectedYear}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : projectResults.length === 0 && !adminResults ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500">
                    <p>No hay resultados para este periodo.</p>
                    {canEdit && (
                        <p className="text-sm mt-2">
                            Usa el boton "Importar" para cargar datos.
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-4 md:space-y-6">
                    {/* Totals Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
                        <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
                            <div>
                                <p className="text-sm md:text-2xl font-bold text-green-600">
                                    ${totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs md:text-sm text-gray-500">Ingresos</p>
                            </div>
                            <div>
                                <p className="text-sm md:text-2xl font-bold text-red-600">
                                    ${totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs md:text-sm text-gray-500">Costos</p>
                            </div>
                            <div>
                                <p className={`text-sm md:text-2xl font-bold ${totalNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${totalNet.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs md:text-sm text-gray-500">Utilidad</p>
                            </div>
                        </div>
                    </div>

                    {/* Projects - Mobile Cards View */}
                    <div className="md:hidden space-y-2">
                        <div className="text-xs text-gray-500 font-medium mb-2">Resultados por Proyecto</div>
                        {projectResults.map((project) => {
                            const isExpanded = expandedProjects.has(project.projectId || 'admin');
                            return (
                                <div key={project.projectId || project.projectName} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                                    <div
                                        onClick={() => toggleProject(project.projectId || 'admin')}
                                        className="p-3 cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                <span className="font-medium dark:text-white truncate">{project.projectName}</span>
                                            </div>
                                            <span className={`text-sm font-bold ${project.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                ${project.netResult.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between mt-1 text-xs">
                                            <span className="text-green-600">+${project.totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                            <span className="text-red-600">-${project.totalCost.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="border-t dark:border-gray-700 px-3 py-2 space-y-1 bg-gray-50 dark:bg-gray-900">
                                            {project.concepts.map((concept, idx) => (
                                                <div key={`${project.projectId}-${concept.conceptId}-${idx}`} className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-1 min-w-0">
                                                        <span className={`px-1 py-0.5 rounded text-xs ${concept.source === 'O' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                                                            {concept.source || 'M'}
                                                        </span>
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
                                        <React.Fragment key={project.projectId || project.projectName}>
                                            <tr
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
                                            {isExpanded && project.concepts.map((concept, idx) => (
                                                <tr key={`${project.projectId}-${concept.conceptId}-${idx}`} className="bg-gray-50 dark:bg-gray-900">
                                                    <td className="px-4 py-2 pl-12 text-gray-600 dark:text-gray-400">
                                                        <span className={`inline-flex px-1 py-0.5 rounded text-xs mr-1 ${concept.source === 'O'
                                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                            }`}>
                                                            {concept.source || 'M'}
                                                        </span>
                                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs mr-2 ${concept.source === 'O'
                                                            ? (concept.conceptType === 'INCOME'
                                                                ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
                                                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200')
                                                            : (concept.conceptType === 'INCOME'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800')
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
                                        </React.Fragment>
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
                                    {adminResults.concepts.map((concept, idx) => (
                                        <tr key={`${concept.conceptId}-${idx}`}>
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

            {/* Result Form Modal */}
            {showForm && (
                <ResultForm
                    projects={projects}
                    concepts={concepts}
                    initialData={editingResult || undefined}
                    onClose={() => { setShowForm(false); setEditingResult(null); }}
                    onSubmit={async (data) => {
                        if (editingResult?.id) {
                            await updateResult(editingResult.id, data);
                        } else {
                            await createResult({
                                companyId: selectedCompanyId,
                                year: selectedYear,
                                month: selectedMonth,
                                ...data,
                            });
                        }
                        loadResults();
                    }}
                />
            )}
        </div>
    );
}
