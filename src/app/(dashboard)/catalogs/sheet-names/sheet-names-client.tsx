'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, FileSpreadsheet, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import { useConfirm } from '@/components/ui/confirm-modal';
import {
    createValidSheetName,
    deleteValidSheetName,
    toggleValidSheetName,
    type ValidSheetName
} from '@/actions/valid-sheet-names';

interface SheetNamesClientProps {
    sheetNames: ValidSheetName[];
}

export function SheetNamesClient({ sheetNames: initialSheetNames }: SheetNamesClientProps) {
    const [sheetNames, setSheetNames] = useState(initialSheetNames);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setError('');
        startTransition(async () => {
            const result = await createValidSheetName(newName, newDescription);
            if (result.success) {
                setNewName('');
                setNewDescription('');
                // Refresh the list
                window.location.reload();
            } else {
                setError(result.error || 'Error al crear');
            }
        });
    };

    const handleToggle = (id: string) => {
        startTransition(async () => {
            await toggleValidSheetName(id);
            setSheetNames(prev => prev.map(s =>
                s.id === id ? { ...s, isActive: !s.isActive } : s
            ));
        });
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Eliminar pestaña',
            message: '¿Eliminar este nombre de pestaña?',
            confirmText: 'Eliminar',
            variant: 'danger'
        });
        if (!confirmed) return;

        startTransition(async () => {
            await deleteValidSheetName(id);
            setSheetNames(prev => prev.filter(s => s.id !== id));
            showToast({ type: 'success', message: 'Pestaña eliminada' });
        });
    };

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Nombres de Pestañas</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Configura los nombres de pestañas de Excel que el importador reconocerá.
                </p>
            </div>

            {/* Add Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
                <h2 className="text-sm font-semibold mb-2 dark:text-white">Agregar Nuevo</h2>
                <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Nombre exacto (ej: EneR)"
                            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <input
                            type="text"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            placeholder="Descripción (opcional)"
                            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isPending || !newName.trim()}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Plus size={14} />
                        Agregar
                    </button>
                </form>
                {error && (
                    <p className="mt-2 text-xs text-red-600">{error}</p>
                )}
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-2">
                {sheetNames.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500">
                        <FileSpreadsheet size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No hay nombres de pestañas configurados.</p>
                        <p className="text-xs mt-1">Agrega nombres como &quot;EneR&quot;, &quot;FebR&quot;, etc.</p>
                    </div>
                ) : (
                    sheetNames.map((sheet) => (
                        <div key={sheet.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow p-3 ${!sheet.isActive ? 'opacity-50' : ''}`}>
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <span className="font-mono font-medium dark:text-white">{sheet.name}</span>
                                    {sheet.description && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sheet.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleToggle(sheet.id)}
                                        disabled={isPending}
                                        className={`p-1.5 rounded text-xs ${sheet.isActive ? 'text-green-600' : 'text-gray-400'}`}
                                    >
                                        {sheet.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(sheet.id)}
                                        disabled={isPending}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Nombre de Pestaña
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Descripción
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Estado
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sheetNames.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                    <FileSpreadsheet size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No hay nombres de pestañas configurados.</p>
                                    <p className="text-xs mt-1">Agrega nombres como &quot;EneR&quot;, &quot;FebR&quot;, etc.</p>
                                </td>
                            </tr>
                        ) : (
                            sheetNames.map((sheet) => (
                                <tr key={sheet.id} className={!sheet.isActive ? 'opacity-50' : ''}>
                                    <td className="px-4 py-3 dark:text-white font-mono">
                                        {sheet.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                        {sheet.description || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleToggle(sheet.id)}
                                            disabled={isPending}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${sheet.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {sheet.isActive ? (
                                                <>
                                                    <ToggleRight size={14} />
                                                    Activo
                                                </>
                                            ) : (
                                                <>
                                                    <ToggleLeft size={14} />
                                                    Inactivo
                                                </>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(sheet.id)}
                                            disabled={isPending}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Help */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">¿Cómo funciona?</h3>
                <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1">
                    <li>El importador buscará pestañas con estos nombres <strong>exactos</strong> (mayúsculas y minúsculas no importan).</li>
                    <li>Si encuentra múltiples coincidencias, usará la primera.</li>
                    <li>Si no encuentra ninguna, usará la primera pestaña del archivo Excel.</li>
                    <li>Ejemplos comunes: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">EneR</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">FebR</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Desglose de Ingresos y costos m</code></li>
                </ul>
            </div>
        </div>
    );
}
