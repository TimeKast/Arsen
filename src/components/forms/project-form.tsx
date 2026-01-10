'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { ProjectFormData } from '@/actions/projects';

interface ProjectFormProps {
    companyId: string;
    initialData?: {
        id: string;
        name: string;
        code: string | null;
        appliesProfitSharing: boolean;
    };
    onSubmit: (data: ProjectFormData) => Promise<void>;
    onClose: () => void;
}

export function ProjectForm({ companyId, initialData, onSubmit, onClose }: ProjectFormProps) {
    const [name, setName] = useState(initialData?.name || '');
    const [code, setCode] = useState(initialData?.code || '');
    const [appliesProfitSharing, setAppliesProfitSharing] = useState(
        initialData?.appliesProfitSharing || false
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onSubmit({
                name,
                code: code || null,
                companyId,
                appliesProfitSharing,
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
                        {initialData ? 'Editar Proyecto' : 'Nuevo Proyecto'}
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
                            placeholder="Nombre del proyecto"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Codigo
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Codigo interno"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="appliesProfitSharing"
                            checked={appliesProfitSharing}
                            onChange={(e) => setAppliesProfitSharing(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="appliesProfitSharing" className="text-sm text-gray-700 dark:text-gray-300">
                            Aplica reparto de utilidades
                        </label>
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
