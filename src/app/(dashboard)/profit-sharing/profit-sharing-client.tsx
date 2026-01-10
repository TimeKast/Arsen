'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, ChevronDown, ChevronUp, Calculator, X } from 'lucide-react';
import { getProfitSharingResults, type CalculatedProfitSharing } from '@/actions/profit-sharing-calc';
import { usePeriodStore } from '@/stores/period-store';
import { useCompanyStore } from '@/stores/company-store';

interface Company {
    id: string;
    name: string;
}

interface ProfitSharingViewClientProps {
    companies: Company[];
    initialYear: number;
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function ProfitSharingViewClient({ companies, initialYear }: ProfitSharingViewClientProps) {
    const { selectedCompanyId: globalCompanyId } = useCompanyStore();
    const selectedCompanyId = globalCompanyId || companies[0]?.id || '';
    const { selectedYear, selectedMonth } = usePeriodStore();
    const [data, setData] = useState<CalculatedProfitSharing[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedProject, setSelectedProject] = useState<CalculatedProfitSharing | null>(null);

    const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Load profit sharing data
    const loadData = useCallback(async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const results = await getProfitSharingResults(selectedCompanyId, selectedYear, selectedMonth);
            setData(results);
        } catch (error) {
            console.error('Error loading profit sharing:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId, selectedYear, selectedMonth]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const formatCurrency = (value: number) => {
        return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    };

    // Calculate totals
    const totalProfit = data.reduce((sum, d) => sum + d.netProfit, 0);
    const totalShare = data.reduce((sum, d) => sum + d.totalShare, 0);
    const clientShare = totalProfit - totalShare;

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <Calculator className="text-blue-600" size={24} />
                <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Reparto de Utilidades</h1>
            </div>

            {/* No local filters needed - Company and Period are controlled by global header */}

            {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : data.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500">
                    <p>No hay datos de reparto para este periodo.</p>
                    <p className="text-sm mt-2">Verifica que los proyectos tengan reparto configurado y que se hayan importado resultados.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <DollarSign className="text-blue-600" size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Utilidad</p>
                                    <p className="text-sm sm:text-xl font-bold text-blue-600">{formatCurrency(totalProfit)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                                    <Calculator className="text-amber-600" size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Honorario</p>
                                    <p className="text-sm sm:text-xl font-bold text-amber-600">{formatCurrency(totalShare)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <DollarSign className="text-green-600" size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Cliente</p>
                                    <p className="text-sm sm:text-xl font-bold text-green-600">{formatCurrency(clientShare)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="md:hidden space-y-2">
                        {data.map((row) => (
                            <div key={row.projectId} className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="font-medium dark:text-white truncate">{row.projectName}</span>
                                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded">{row.formulaType}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <p className="text-gray-500">Utilidad</p>
                                        <p className="text-blue-600 font-medium">{formatCurrency(row.netProfit)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Honorario</p>
                                        <p className="text-amber-600 font-medium">{formatCurrency(row.totalShare)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Cliente</p>
                                        <p className="text-green-600 font-medium">{formatCurrency(row.netProfit - row.totalShare)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedProject(row)}
                                    className="mt-2 text-blue-600 text-xs underline"
                                >
                                    Ver detalle
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Proyecto</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Formula</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Utilidad Bruta</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Honorario</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cliente</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Detalle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {data.map((row) => (
                                    <tr key={row.projectId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-3 font-medium dark:text-white">{row.projectName}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-600">
                                                {row.formulaType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(row.netProfit)}</td>
                                        <td className="px-4 py-3 text-right text-amber-600 font-medium">{formatCurrency(row.totalShare)}</td>
                                        <td className="px-4 py-3 text-right text-green-600">{formatCurrency(row.netProfit - row.totalShare)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => setSelectedProject(row)}
                                                className="text-blue-600 hover:text-blue-800 underline text-sm"
                                            >
                                                Ver
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-100 dark:bg-gray-700 font-medium">
                                <tr>
                                    <td className="px-4 py-3 dark:text-white">TOTAL</td>
                                    <td></td>
                                    <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(totalProfit)}</td>
                                    <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(totalShare)}</td>
                                    <td className="px-4 py-3 text-right text-green-600">{formatCurrency(clientShare)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedProject && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full mx-4 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold dark:text-white">
                                Detalle: {selectedProject.projectName}
                            </h2>
                            <button
                                onClick={() => setSelectedProject(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Formula</p>
                                    <p className="font-medium dark:text-white">{selectedProject.formulaType}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Utilidad Bruta</p>
                                    <p className="font-medium text-blue-600">{formatCurrency(selectedProject.netProfit)}</p>
                                </div>
                            </div>

                            <div className="border-t dark:border-gray-700 pt-4">
                                <h3 className="font-medium mb-2 dark:text-white">Desglose del Calculo</h3>
                                <div className="space-y-2">
                                    {selectedProject.breakdown.map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">{item.description}</span>
                                            <span className="font-medium">{formatCurrency(item.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t dark:border-gray-700 pt-4 flex justify-between">
                                <span className="font-medium dark:text-white">Total Honorario</span>
                                <span className="font-bold text-amber-600">{formatCurrency(selectedProject.totalShare)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedProject(null)}
                            className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
