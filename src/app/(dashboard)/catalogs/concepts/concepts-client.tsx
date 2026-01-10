'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Pencil, Power, TrendingUp, TrendingDown, Trash2, Merge, AlertTriangle } from 'lucide-react';
import { ConceptForm } from '@/components/forms/concept-form';
import {
    createConcept,
    updateConcept,
    toggleConceptActive,
    deleteConcept,
    checkConceptNameExists,
    getConceptStats,
    mergeConcepts,
    type ConceptFormData,
    type ConceptStats,
} from '@/actions/concepts';

interface Area {
    id: string;
    name: string;
}

interface Concept {
    id: string;
    name: string;
    type: 'INCOME' | 'COST';
    areaId: string | null;
    isActive: boolean;
    area: Area | null;
}

interface ConceptsClientProps {
    initialConcepts: Concept[];
    areas: Area[];
}

export function ConceptsClient({ initialConcepts, areas }: ConceptsClientProps) {
    const { data: session } = useSession();
    const canEdit = session?.user?.role === 'ADMIN' || session?.user?.role === 'STAFF';

    const [concepts, setConcepts] = useState(initialConcepts);
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'COST'>('ALL');
    const [showForm, setShowForm] = useState(false);
    const [editingConcept, setEditingConcept] = useState<Concept | null>(null);
    const [isPending, startTransition] = useTransition();

    // Merge modal state
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [mergeSource, setMergeSource] = useState<Concept | null>(null);
    const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);
    const [mergeTargetName, setMergeTargetName] = useState<string>('');
    const [mergeStats, setMergeStats] = useState<ConceptStats | null>(null);
    const [pendingFormData, setPendingFormData] = useState<ConceptFormData | null>(null);

    const filteredConcepts = concepts.filter((c) =>
        typeFilter === 'ALL' || c.type === typeFilter
    );

    const handleCreate = async (data: ConceptFormData) => {
        const concept = await createConcept(data);
        setConcepts((prev) => [...prev, { ...concept, area: null } as Concept]);
    };

    const handleUpdate = async (data: ConceptFormData) => {
        if (!editingConcept) return;

        // Always check if name exists in another concept (to detect pre-existing duplicates)
        const duplicate = await checkConceptNameExists(data.name, editingConcept.id);
        if (duplicate.exists && duplicate.existingId) {
            // Show merge modal
            const stats = await getConceptStats(editingConcept.id);
            setMergeSource(editingConcept);
            setMergeTargetId(duplicate.existingId);
            setMergeTargetName(data.name.trim());
            setMergeStats(stats);
            setPendingFormData(data);
            setShowForm(false);
            setShowMergeModal(true);
            return;
        }

        const concept = await updateConcept(editingConcept.id, data);
        setConcepts((prev) =>
            prev.map((c) => (c.id === editingConcept.id ? { ...concept, area: c.area } as Concept : c))
        );
    };

    const handleMerge = async () => {
        if (!mergeSource || !mergeTargetId) return;

        startTransition(async () => {
            const result = await mergeConcepts(mergeSource.id, mergeTargetId);
            if (result.success) {
                // Remove merged concept from list
                setConcepts((prev) => prev.filter((c) => c.id !== mergeSource.id));
                setShowMergeModal(false);
                setMergeSource(null);
                setMergeTargetId(null);
                setMergeStats(null);
                setPendingFormData(null);
                alert(`Fusión completada! Movidos: ${result.budgetsMoved} presupuestos, ${result.resultsMoved} resultados, ${result.mappingsMoved} mappings, ${result.reconciliationsMoved} conciliaciones.`);
            } else {
                alert(result.error || 'Error al fusionar');
            }
        });
    };

    const cancelMerge = () => {
        setShowMergeModal(false);
        setMergeSource(null);
        setMergeTargetId(null);
        setMergeStats(null);
        setPendingFormData(null);
        // Re-open form to let user choose different name
        setShowForm(true);
    };

    const handleToggleActive = (id: string) => {
        startTransition(async () => {
            const updated = await toggleConceptActive(id);
            setConcepts((prev) =>
                prev.map((c) => (c.id === id ? { ...c, isActive: updated.isActive } : c))
            );
        });
    };

    const handleDelete = (id: string, name: string) => {
        if (!confirm(`¿Eliminar el concepto "${name}"? Esta acción no se puede deshacer.`)) return;
        startTransition(async () => {
            const result = await deleteConcept(id);
            if (result.success) {
                setConcepts((prev) => prev.filter((c) => c.id !== id));
            } else {
                alert(result.error);
            }
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Conceptos</h1>
                <div className="flex items-center gap-4">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as 'ALL' | 'INCOME' | 'COST')}
                        className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="ALL">Todos</option>
                        <option value="INCOME">Ingresos</option>
                        <option value="COST">Costos</option>
                    </select>
                    {canEdit && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus size={20} />
                            Nuevo Concepto
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Nombre
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Area
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Estado
                            </th>
                            {canEdit && (
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredConcepts.map((concept) => (
                            <tr key={concept.id} className={!concept.isActive ? 'opacity-50' : ''}>
                                <td className="px-6 py-4 dark:text-white">{concept.name}</td>
                                <td className="px-6 py-4 text-center">
                                    {concept.type === 'INCOME' ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                            <TrendingUp size={12} className="mr-1" />
                                            Ingreso
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                            <TrendingDown size={12} className="mr-1" />
                                            Costo
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                    {concept.area?.name || '-'}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span
                                        className={`inline-flex px-2 py-1 rounded-full text-xs ${concept.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {concept.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                {canEdit && (
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingConcept(concept);
                                                    setShowForm(true);
                                                }}
                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(concept.id)}
                                                disabled={isPending}
                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                                title="Activar/Desactivar"
                                            >
                                                <Power size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(concept.id, concept.name)}
                                                disabled={isPending}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded dark:text-red-400 dark:hover:bg-red-900/20"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {filteredConcepts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No hay conceptos registrados
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <ConceptForm
                    areas={areas}
                    initialData={editingConcept || undefined}
                    onSubmit={editingConcept ? handleUpdate : handleCreate}
                    onClose={() => {
                        setShowForm(false);
                        setEditingConcept(null);
                    }}
                />
            )}

            {/* Merge Confirmation Modal */}
            {showMergeModal && mergeSource && mergeStats && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4 text-amber-600">
                            <AlertTriangle size={24} />
                            <h3 className="text-lg font-semibold dark:text-white">Fusionar Conceptos</h3>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Ya existe un concepto llamado <strong>&quot;{mergeTargetName}&quot;</strong>.
                            ¿Desea fusionar <strong>&quot;{mergeSource.name}&quot;</strong> con el existente?
                        </p>

                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Se moverán:</p>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <li>• {mergeStats.budgetsCount} presupuestos</li>
                                <li>• {mergeStats.resultsCount} resultados</li>
                                <li>• {mergeStats.mappingsCount} mappings de importación</li>
                                <li>• {mergeStats.reconciliationsCount} conciliaciones</li>
                            </ul>
                        </div>

                        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                            El concepto &quot;{mergeSource.name}&quot; será eliminado después de la fusión.
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelMerge}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleMerge}
                                disabled={isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                            >
                                <Merge size={16} />
                                {isPending ? 'Fusionando...' : 'Fusionar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
