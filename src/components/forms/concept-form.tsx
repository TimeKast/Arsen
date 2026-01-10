'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { ConceptFormData } from '@/actions/concepts';

interface Area {
    id: string;
    name: string;
}

interface ConceptFormProps {
    areas: Area[];
    initialData?: {
        id: string;
        name: string;
        type: 'INCOME' | 'COST';
        areaId: string | null;
    };
    onSubmit: (data: ConceptFormData) => Promise<void>;
    onClose: () => void;
}

export function ConceptForm({ areas, initialData, onSubmit, onClose }: ConceptFormProps) {
    const [name, setName] = useState(initialData?.name || '');
    const [type, setType] = useState<'INCOME' | 'COST'>(initialData?.type || 'COST');
    const [areaId, setAreaId] = useState(initialData?.areaId || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onSubmit({
                name,
                type,
                areaId: areaId || null,
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 shadow-xl">
                <div className="flex items-center justify-between border-b p-4 dark:border-gray-700">
                    <h2 className="text-lg font-semibold dark:text-white">
                        {initialData ? 'Editar Concepto' : 'Nuevo Concepto'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Nombre del concepto"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo *
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as 'INCOME' | 'COST')}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="INCOME">Ingreso</option>
                            <option value="COST">Costo</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Area (opcional)
                        </label>
                        <select
                            value={areaId}
                            onChange={(e) => setAreaId(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">Sin area</option>
                            {areas.map((area) => (
                                <option key={area.id} value={area.id}>
                                    {area.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                        >
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
