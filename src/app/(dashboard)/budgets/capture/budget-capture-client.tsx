'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import {
    getAreasForBudget,
    getConceptsForArea,
    getBudgetData,
    saveBudget,
    type BudgetEntry,
} from '@/actions/budgets';

interface Company {
    id: string;
    name: string;
}

interface Area {
    id: string;
    name: string;
}

interface Concept {
    id: string;
    name: string;
    type: 'INCOME' | 'COST';
}

interface BudgetRow {
    concept: Concept;
    values: Record<number, string>; // month -> amount
}

interface BudgetCaptureClientProps {
    companies: Company[];
    initialYear: number;
}

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function BudgetCaptureClient({ companies, initialYear }: BudgetCaptureClientProps) {
    const router = useRouter();
    const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || '');
    const [selectedAreaId, setSelectedAreaId] = useState('');
    const [selectedYear, setSelectedYear] = useState(initialYear);
    const [areas, setAreas] = useState<Area[]>([]);
    const [budgetRows, setBudgetRows] = useState<BudgetRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Load areas when company changes
    const loadAreas = useCallback(async (companyId: string) => {
        if (!companyId) return;
        setLoading(true);
        try {
            const areasData = await getAreasForBudget(companyId);
            setAreas(areasData);
            if (areasData.length > 0 && !areasData.find(a => a.id === selectedAreaId)) {
                setSelectedAreaId(areasData[0].id);
            }
        } finally {
            setLoading(false);
        }
    }, [selectedAreaId]);

    useEffect(() => {
        if (selectedCompanyId) {
            loadAreas(selectedCompanyId);
        }
    }, [selectedCompanyId, loadAreas]);

    // Load budget data when area/year changes
    const loadBudget = useCallback(async () => {
        if (!selectedCompanyId || !selectedAreaId) return;
        setLoading(true);
        try {
            const [concepts, existingBudget] = await Promise.all([
                getConceptsForArea(selectedAreaId),
                getBudgetData(selectedCompanyId, selectedAreaId, selectedYear),
            ]);

            // Build rows
            const rows: BudgetRow[] = concepts.map(concept => {
                const values: Record<number, string> = {};
                for (let m = 1; m <= 12; m++) {
                    const entry = existingBudget.find(
                        b => b.conceptId === concept.id && b.month === m
                    );
                    values[m] = entry ? entry.amount : '0';
                }
                return { concept, values };
            });

            setBudgetRows(rows);
            setHasChanges(false);
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId, selectedAreaId, selectedYear]);

    useEffect(() => {
        if (selectedAreaId) {
            loadBudget();
        }
    }, [selectedAreaId, selectedYear, loadBudget]);

    const handleValueChange = (conceptId: string, month: number, value: string) => {
        // Only allow numbers and decimals
        if (!/^\d*\.?\d{0,2}$/.test(value) && value !== '') return;

        setBudgetRows(prev => prev.map(row => {
            if (row.concept.id === conceptId) {
                return {
                    ...row,
                    values: { ...row.values, [month]: value },
                };
            }
            return row;
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!selectedCompanyId || !selectedAreaId) return;
        setSaving(true);
        try {
            const entries: BudgetEntry[] = [];
            for (const row of budgetRows) {
                for (let m = 1; m <= 12; m++) {
                    const value = row.values[m] || '0';
                    if (parseFloat(value) >= 0) {
                        entries.push({
                            conceptId: row.concept.id,
                            month: m,
                            amount: value || '0',
                        });
                    }
                }
            }

            await saveBudget({
                companyId: selectedCompanyId,
                areaId: selectedAreaId,
                year: selectedYear,
                entries,
            });

            setHasChanges(false);
            alert('Presupuesto guardado exitosamente');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const years = [initialYear - 1, initialYear, initialYear + 1];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/budgets')}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold dark:text-white">Captura de Presupuesto</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                    <Save size={20} />
                    {saving ? 'Guardando...' : 'Guardar'}
                </button>
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
                            Area
                        </label>
                        <select
                            value={selectedAreaId}
                            onChange={(e) => setSelectedAreaId(e.target.value)}
                            className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            disabled={areas.length === 0}
                        >
                            {areas.map((area) => (
                                <option key={area.id} value={area.id}>
                                    {area.name}
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
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Budget Grid */}
            {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : budgetRows.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    {selectedAreaId ? 'No hay conceptos para esta area' : 'Selecciona un area'}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase sticky left-0 bg-gray-50 dark:bg-gray-700 min-w-[200px]">
                                    Concepto
                                </th>
                                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                    Tipo
                                </th>
                                {months.map((month, idx) => (
                                    <th key={idx} className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase min-w-[80px]">
                                        {month}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {budgetRows.map((row) => {
                                const rowTotal = Object.values(row.values).reduce(
                                    (sum, val) => sum + (parseFloat(val) || 0), 0
                                );
                                return (
                                    <tr key={row.concept.id}>
                                        <td className="px-4 py-2 dark:text-white sticky left-0 bg-white dark:bg-gray-800 font-medium">
                                            {row.concept.name}
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs ${row.concept.type === 'INCOME'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {row.concept.type === 'INCOME' ? 'Ingreso' : 'Costo'}
                                            </span>
                                        </td>
                                        {months.map((_, idx) => (
                                            <td key={idx} className="px-1 py-1">
                                                <input
                                                    type="text"
                                                    value={row.values[idx + 1] || ''}
                                                    onChange={(e) => handleValueChange(row.concept.id, idx + 1, e.target.value)}
                                                    className="w-full px-2 py-1 text-right border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    placeholder="0"
                                                />
                                            </td>
                                        ))}
                                        <td className="px-4 py-2 text-right font-medium dark:text-white">
                                            {rowTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-gray-700 font-medium">
                            <tr>
                                <td colSpan={2} className="px-4 py-3 text-right dark:text-white">
                                    Totales
                                </td>
                                {months.map((_, idx) => {
                                    const monthTotal = budgetRows.reduce(
                                        (sum, row) => sum + (parseFloat(row.values[idx + 1]) || 0), 0
                                    );
                                    return (
                                        <td key={idx} className="px-2 py-3 text-right dark:text-white">
                                            {monthTotal.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                                        </td>
                                    );
                                })}
                                <td className="px-4 py-3 text-right dark:text-white">
                                    {budgetRows.reduce((total, row) =>
                                        total + Object.values(row.values).reduce(
                                            (sum, val) => sum + (parseFloat(val) || 0), 0
                                        ), 0
                                    ).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
