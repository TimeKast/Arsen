'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Project {
    id: string;
    name: string;
}

interface Concept {
    id: string;
    name: string;
    type: 'INCOME' | 'COST';
}

interface ResultFormProps {
    projects: Project[];
    concepts: Concept[];
    initialData?: {
        id?: string;
        projectId: string | null;
        conceptId: string;
        amount: number;
    };
    onSubmit: (data: { projectId: string | null; conceptId: string; amount: number }) => Promise<void>;
    onClose: () => void;
}

export function ResultForm({ projects, concepts, initialData, onSubmit, onClose }: ResultFormProps) {
    const [projectId, setProjectId] = useState<string | null>(initialData?.projectId || null);
    const [conceptId, setConceptId] = useState(initialData?.conceptId || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isEditing = !!initialData?.id;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!conceptId) {
            setError('Selecciona un concepto');
            return;
        }
        if (!amount || isNaN(Number(amount))) {
            setError('Ingresa un monto válido');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await onSubmit({
                projectId: projectId || null,
                conceptId,
                amount: Number(amount),
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    // Group concepts by type
    const incomesConcepts = concepts.filter(c => c.type === 'INCOME');
    const costConcepts = concepts.filter(c => c.type === 'COST');

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold dark:text-white">
                        {isEditing ? 'Editar Resultado' : 'Agregar Resultado'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-white">
                            Proyecto <span className="text-gray-400">(opcional)</span>
                        </label>
                        <select
                            value={projectId || ''}
                            onChange={(e) => setProjectId(e.target.value || null)}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">Sin proyecto (Administración)</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-white">
                            Concepto <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={conceptId}
                            onChange={(e) => setConceptId(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        >
                            <option value="">Seleccionar...</option>
                            <optgroup label="— Ingresos —">
                                {incomesConcepts.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="— Costos —">
                                {costConcepts.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-white">
                            Monto <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Agregar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
