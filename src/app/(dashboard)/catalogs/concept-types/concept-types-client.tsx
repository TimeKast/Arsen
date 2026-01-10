'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, Edit2, Check, X, ToggleLeft, ToggleRight, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import {
    getConceptTypeOverrides,
    createConceptTypeOverride,
    updateConceptTypeOverride,
    toggleConceptTypeOverride,
    deleteConceptTypeOverride,
    type ConceptTypeOverride,
} from '@/actions/concept-type-overrides';

interface ConceptTypeOverridesClientProps {
    initialOverrides: ConceptTypeOverride[];
    companies: Array<{ id: string; name: string }>;
    initialCompanyId?: string;
}

export function ConceptTypeOverridesClient({
    initialOverrides,
    companies,
    initialCompanyId
}: ConceptTypeOverridesClientProps) {
    const [overrides, setOverrides] = useState<ConceptTypeOverride[]>(initialOverrides);
    const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompanyId || '');
    const [loading, setLoading] = useState(false);

    // New override form
    const [showNewForm, setShowNewForm] = useState(false);
    const [newConceptName, setNewConceptName] = useState('');
    const [newConceptType, setNewConceptType] = useState<'INCOME' | 'COST'>('INCOME');
    const [newDescription, setNewDescription] = useState('');

    // Edit mode
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editConceptName, setEditConceptName] = useState('');
    const [editConceptType, setEditConceptType] = useState<'INCOME' | 'COST'>('INCOME');
    const [editDescription, setEditDescription] = useState('');

    const [error, setError] = useState('');

    const loadOverrides = useCallback(async (companyId: string) => {
        setLoading(true);
        try {
            const data = await getConceptTypeOverrides(companyId);
            setOverrides(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCompanyChange = async (companyId: string) => {
        setSelectedCompanyId(companyId);
        if (companyId) {
            await loadOverrides(companyId);
        } else {
            setOverrides([]);
        }
    };

    const handleCreate = async () => {
        if (!newConceptName.trim() || !selectedCompanyId) return;

        setError('');
        const result = await createConceptTypeOverride(
            selectedCompanyId,
            newConceptName,
            newConceptType,
            newDescription
        );

        if (result.success) {
            setNewConceptName('');
            setNewConceptType('INCOME');
            setNewDescription('');
            setShowNewForm(false);
            await loadOverrides(selectedCompanyId);
        } else {
            setError(result.error || 'Error al crear');
        }
    };

    const handleStartEdit = (override: ConceptTypeOverride) => {
        setEditingId(override.id);
        setEditConceptName(override.conceptName);
        setEditConceptType(override.conceptType as 'INCOME' | 'COST');
        setEditDescription(override.description || '');
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editConceptName.trim()) return;

        setError('');
        const result = await updateConceptTypeOverride(editingId, {
            conceptName: editConceptName,
            conceptType: editConceptType,
            description: editDescription,
        });

        if (result.success) {
            setEditingId(null);
            await loadOverrides(selectedCompanyId);
        } else {
            setError(result.error || 'Error al actualizar');
        }
    };

    const handleToggle = async (id: string) => {
        await toggleConceptTypeOverride(id);
        await loadOverrides(selectedCompanyId);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta sobrescritura?')) return;
        await deleteConceptTypeOverride(id);
        await loadOverrides(selectedCompanyId);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                    <Link
                        href="/catalogs"
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Tipos de Concepto</h1>
                        <p className="text-xs text-gray-500">Marcar conceptos como INGRESO o GASTO</p>
                    </div>
                </div>
            </div>

            {/* Company Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-xs font-medium dark:text-gray-200">Empresa:</label>
                    <select
                        value={selectedCompanyId}
                        onChange={(e) => handleCompanyChange(e.target.value)}
                        className="flex-1 sm:flex-none px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="">Seleccionar empresa...</option>
                        {companies.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedCompanyId && (
                <>
                    {/* Add Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowNewForm(!showNewForm)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">Agregar Sobrescritura</span>
                            <span className="sm:hidden">Agregar</span>
                        </button>
                    </div>

                    {/* New Form */}
                    {showNewForm && (
                        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                            <h3 className="font-medium text-sm mb-3 dark:text-white">Nueva Sobrescritura</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <input
                                    type="text"
                                    value={newConceptName}
                                    onChange={(e) => setNewConceptName(e.target.value)}
                                    placeholder="Nombre del concepto"
                                    className="px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                <select
                                    value={newConceptType}
                                    onChange={(e) => setNewConceptType(e.target.value as 'INCOME' | 'COST')}
                                    className="px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="INCOME">INGRESO</option>
                                    <option value="COST">GASTO</option>
                                </select>
                                <input
                                    type="text"
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    placeholder="Descripción (opcional)"
                                    className="px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCreate}
                                        className="flex-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                        Guardar
                                    </button>
                                    <button
                                        onClick={() => setShowNewForm(false)}
                                        className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                        </div>
                    )}

                    {/* Overrides List */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        {loading ? (
                            <div className="p-6 text-center text-gray-500">Cargando...</div>
                        ) : overrides.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No hay sobrescrituras configuradas.
                                <br />
                                <span className="text-xs">Los conceptos se tratarán como GASTO por defecto.</span>
                            </div>
                        ) : (
                            <>
                                {/* Mobile Cards */}
                                <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                                    {overrides.map((override) => (
                                        <div key={override.id} className="p-3">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex-1">
                                                    <p className="font-medium dark:text-white text-sm">{override.conceptName}</p>
                                                    <p className="text-xs text-gray-500">{override.description || 'Sin descripción'}</p>
                                                </div>
                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${override.conceptType === 'INCOME'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                    {override.conceptType === 'INCOME' ? (
                                                        <><TrendingUp size={12} /> I</>
                                                    ) : (
                                                        <><TrendingDown size={12} /> G</>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <button
                                                    onClick={() => handleToggle(override.id)}
                                                    className={`flex items-center gap-1 text-xs ${override.isActive ? 'text-green-600' : 'text-gray-400'}`}
                                                >
                                                    {override.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                                    {override.isActive ? 'Activo' : 'Inactivo'}
                                                </button>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleStartEdit(override)}
                                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded dark:hover:bg-blue-900/30"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(override.id)}
                                                        className="p-1 text-red-600 hover:bg-red-100 rounded dark:hover:bg-red-900/30"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table */}
                                <table className="hidden md:table w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Concepto</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Tipo</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Descripción</th>
                                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">Activo</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {overrides.map((override) => (
                                            <tr key={override.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                {editingId === override.id ? (
                                                    <>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="text"
                                                                value={editConceptName}
                                                                onChange={(e) => setEditConceptName(e.target.value)}
                                                                className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select
                                                                value={editConceptType}
                                                                onChange={(e) => setEditConceptType(e.target.value as 'INCOME' | 'COST')}
                                                                className="px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                            >
                                                                <option value="INCOME">INGRESO</option>
                                                                <option value="COST">GASTO</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="text"
                                                                value={editDescription}
                                                                onChange={(e) => setEditDescription(e.target.value)}
                                                                className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-center">-</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={handleSaveEdit}
                                                                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                                                                >
                                                                    <Check size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingId(null)}
                                                                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                                                >
                                                                    <X size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-4 py-3 font-medium dark:text-white">{override.conceptName}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${override.conceptType === 'INCOME'
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                }`}>
                                                                {override.conceptType === 'INCOME' ? (
                                                                    <><TrendingUp size={14} /> INGRESO</>
                                                                ) : (
                                                                    <><TrendingDown size={14} /> GASTO</>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{override.description || '-'}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => handleToggle(override.id)}
                                                                className={`p-1 rounded ${override.isActive ? 'text-green-600' : 'text-gray-400'}`}
                                                            >
                                                                {override.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleStartEdit(override)}
                                                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded dark:hover:bg-blue-900/30"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(override.id)}
                                                                    className="p-1 text-red-600 hover:bg-red-100 rounded dark:hover:bg-red-900/30"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* Info Box */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <h3 className="font-medium text-sm text-amber-800 dark:text-amber-200 mb-1">¿Cómo funciona?</h3>
                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                    <li>• Los conceptos se tratan como <strong>GASTO</strong> por defecto al importar.</li>
                    <li>• Agrega aquí los que deben ser <strong>INGRESO</strong>.</li>
                    <li>• El nombre debe coincidir exactamente (no distingue mayúsculas).</li>
                </ul>
            </div>
        </div>
    );
}
