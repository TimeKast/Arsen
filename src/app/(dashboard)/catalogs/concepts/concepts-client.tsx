'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Pencil, Power, TrendingUp, TrendingDown, Trash2, Merge, AlertTriangle, Sparkles } from 'lucide-react';
import { ConceptForm } from '@/components/forms/concept-form';
import { useToast } from '@/components/ui/toast-provider';
import { useConfirm } from '@/components/ui/confirm-modal';
import {
    createConcept,
    updateConcept,
    toggleConceptActive,
    deleteConcept,
    checkConceptNameExists,
    getConceptStats,
    mergeConcepts,
    findDuplicateConcepts,
    autoMergeDuplicates,
    type ConceptFormData,
    type ConceptStats,
    type AutoMergeResult,
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
    const { showToast } = useToast();
    const { confirm } = useConfirm();
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
        // Pass the source type to prioritize finding concepts of the same type
        const duplicate = await checkConceptNameExists(data.name, editingConcept.id, editingConcept.type);
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
                showToast({ type: 'success', message: `Fusión completada! Movidos: ${result.budgetsMoved} presupuestos, ${result.resultsMoved} resultados` });
            } else {
                showToast({ type: 'error', message: result.error || 'Error al fusionar' });
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

    const handleDelete = async (id: string, name: string) => {
        const confirmed = await confirm({
            title: 'Eliminar concepto',
            message: `¿Eliminar el concepto "${name}"? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            variant: 'danger'
        });
        if (!confirmed) return;
        startTransition(async () => {
            const result = await deleteConcept(id);
            if (result.success) {
                setConcepts((prev) => prev.filter((c) => c.id !== id));
                showToast({ type: 'success', message: 'Concepto eliminado' });
            } else {
                showToast({ type: 'error', message: result.error || 'Error al eliminar' });
            }
        });
    };

    const handleCleanDuplicates = async () => {
        const confirmed = await confirm({
            title: 'Fusionar duplicados',
            message: '¿Fusionar automáticamente todos los conceptos duplicados? Se mantendrá el más antiguo.',
            confirmText: 'Fusionar',
            variant: 'danger'
        });
        if (!confirmed) return;
        startTransition(async () => {
            const result = await autoMergeDuplicates();
            if (result.success) {
                showToast({ type: 'success', message: `Limpieza completada! ${result.merged} conceptos fusionados` });
                window.location.reload();
            } else {
                showToast({ type: 'error', message: 'Error: ' + result.errors.join(', ') });
            }
        });
    };

    return (
        <div>
            {/* Header - responsive layout */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Conceptos</h1>
                <div className="flex items-center gap-2">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as 'ALL' | 'INCOME' | 'COST')}
                        className="flex-1 sm:flex-none px-2 py-1.5 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="ALL">Todos</option>
                        <option value="INCOME">Ingresos</option>
                        <option value="COST">Costos</option>
                    </select>
                    {canEdit && (
                        <>
                            <button
                                onClick={handleCleanDuplicates}
                                disabled={isPending}
                                className="p-2 sm:px-3 sm:py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                                title="Fusionar conceptos duplicados automáticamente"
                            >
                                <Sparkles size={18} className="sm:hidden" />
                                <span className="hidden sm:inline text-sm">Limpiar</span>
                            </button>
                            <button
                                onClick={() => setShowForm(true)}
                                className="p-2 sm:px-3 sm:py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Plus size={18} className="sm:hidden" />
                                <span className="hidden sm:inline text-sm">+ Nuevo</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-2">
                {filteredConcepts.map((concept) => (
                    <div
                        key={concept.id}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow p-3 ${!concept.isActive ? 'opacity-50' : ''}`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium dark:text-white truncate">{concept.name}</span>
                                    {concept.type === 'INCOME' ? (
                                        <TrendingUp size={14} className="flex-shrink-0 text-green-600" />
                                    ) : (
                                        <TrendingDown size={14} className="flex-shrink-0 text-red-600" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    {concept.area?.name && <span>{concept.area.name}</span>}
                                    <span className={`px-1.5 py-0.5 rounded-full ${concept.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {concept.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                            {canEdit && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => { setEditingConcept(concept); setShowForm(true); }}
                                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(concept.id)}
                                        disabled={isPending}
                                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        <Power size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(concept.id, concept.name)}
                                        disabled={isPending}
                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded dark:text-red-400 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {filteredConcepts.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500">
                        No hay conceptos registrados
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Nombre
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Tipo
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Area
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Estado
                            </th>
                            {canEdit && (
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredConcepts.map((concept) => (
                            <tr key={concept.id} className={!concept.isActive ? 'opacity-50' : ''}>
                                <td className="px-4 py-3 dark:text-white">{concept.name}</td>
                                <td className="px-4 py-3 text-center">
                                    {concept.type === 'INCOME' ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                                            <TrendingUp size={12} className="mr-1" />
                                            Ingreso
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                                            <TrendingDown size={12} className="mr-1" />
                                            Costo
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                    {concept.area?.name || '-'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span
                                        className={`inline-flex px-2 py-0.5 rounded-full text-xs ${concept.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {concept.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                {canEdit && (
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingConcept(concept);
                                                    setShowForm(true);
                                                }}
                                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                                title="Editar"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(concept.id)}
                                                disabled={isPending}
                                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                                title="Activar/Desactivar"
                                            >
                                                <Power size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(concept.id, concept.name)}
                                                disabled={isPending}
                                                className="p-1.5 text-red-600 hover:bg-red-100 rounded dark:text-red-400 dark:hover:bg-red-900/20"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {filteredConcepts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
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
