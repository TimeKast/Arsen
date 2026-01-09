'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Pencil, Power, Trash2 } from 'lucide-react';
import { AreaForm } from '@/components/forms/area-form';
import {
    getAreasByCompany,
    createArea,
    updateArea,
    toggleAreaActive,
    deleteArea,
    type AreaFormData,
} from '@/actions/areas';

interface Company {
    id: string;
    name: string;
}

interface Area {
    id: string;
    name: string;
    companyId: string;
    isActive: boolean;
}

interface AreasClientProps {
    companies: Company[];
}

export function AreasClient({ companies }: AreasClientProps) {
    const { data: session } = useSession();
    const canEdit = session?.user?.role === 'ADMIN' || session?.user?.role === 'STAFF';

    const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || '');
    const [areas, setAreas] = useState<Area[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingArea, setEditingArea] = useState<Area | null>(null);
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(true);

    const loadAreas = useCallback(async (companyId: string) => {
        setLoading(true);
        const data = await getAreasByCompany(companyId);
        setAreas(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (selectedCompanyId) {
            loadAreas(selectedCompanyId);
        }
    }, [selectedCompanyId, loadAreas]);

    const handleCreate = async (data: AreaFormData) => {
        const area = await createArea(data);
        setAreas((prev) => [...prev, area as Area].sort((a, b) => a.name.localeCompare(b.name)));
    };

    const handleUpdate = async (data: AreaFormData) => {
        if (!editingArea) return;
        const area = await updateArea(editingArea.id, data);
        setAreas((prev) => prev.map((a) => (a.id === editingArea.id ? (area as Area) : a)));
    };

    const handleToggleActive = (id: string) => {
        startTransition(async () => {
            const updated = await toggleAreaActive(id);
            setAreas((prev) => prev.map((a) => (a.id === id ? (updated as Area) : a)));
        });
    };

    const handleDelete = (id: string, name: string) => {
        if (!confirm(`¿Eliminar el área "${name}"? Esta acción no se puede deshacer.`)) return;
        startTransition(async () => {
            const result = await deleteArea(id);
            if (result.success) {
                setAreas((prev) => prev.filter((a) => a.id !== id));
            } else {
                alert(result.error);
            }
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Áreas</h1>
                <div className="flex items-center gap-4">
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
                    {canEdit && selectedCompanyId && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus size={20} />
                            Nueva Área
                        </button>
                    )}
                </div>
            </div>

            {!selectedCompanyId ? (
                <div className="text-center py-8 text-gray-500">
                    Selecciona una empresa para ver sus áreas
                </div>
            ) : loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                    Nombre
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
                            {areas.map((area) => (
                                <tr key={area.id} className={!area.isActive ? 'opacity-50' : ''}>
                                    <td className="px-6 py-4 dark:text-white">{area.name}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span
                                            className={`inline-flex px-2 py-1 rounded-full text-xs ${area.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {area.isActive ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    {canEdit && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingArea(area);
                                                        setShowForm(true);
                                                    }}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(area.id)}
                                                    disabled={isPending}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                                    title="Activar/Desactivar"
                                                >
                                                    <Power size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(area.id, area.name)}
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
                            {areas.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                        No hay áreas registradas
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && selectedCompanyId && (
                <AreaForm
                    companyId={selectedCompanyId}
                    initialData={editingArea || undefined}
                    onSubmit={editingArea ? handleUpdate : handleCreate}
                    onClose={() => {
                        setShowForm(false);
                        setEditingArea(null);
                    }}
                />
            )}
        </div>
    );
}

