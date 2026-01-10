'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { UserFormData } from '@/actions/users';

interface Company {
    id: string;
    name: string;
}

interface Area {
    id: string;
    name: string;
}

interface UserFormProps {
    companies: Company[];
    areas: Area[];
    initialData?: {
        id: string;
        email: string;
        name: string;
        role: 'ADMIN' | 'STAFF' | 'AREA_USER' | 'READONLY';
        areaId: string | null;
        companyIds: string[];
    };
    onSubmit: (data: UserFormData) => Promise<void>;
    onClose: () => void;
}

export function UserForm({ companies, areas, initialData, onSubmit, onClose }: UserFormProps) {
    const [email, setEmail] = useState(initialData?.email || '');
    const [name, setName] = useState(initialData?.name || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'STAFF' | 'AREA_USER' | 'READONLY'>(
        initialData?.role || 'READONLY'
    );
    const [areaId, setAreaId] = useState(initialData?.areaId || '');
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>(
        initialData?.companyIds || []
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCompanyToggle = (companyId: string) => {
        setSelectedCompanyIds((prev) =>
            prev.includes(companyId)
                ? prev.filter((id) => id !== companyId)
                : [...prev, companyId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onSubmit({
                email,
                name,
                password: password || undefined,
                role,
                areaId: role === 'AREA_USER' ? areaId || null : null,
                companyIds: selectedCompanyIds,
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-4 px-4">
            <div className="w-full max-w-lg rounded-lg bg-white dark:bg-gray-800 shadow-xl">
                <div className="flex items-center justify-between border-b p-4 dark:border-gray-700">
                    <h2 className="text-lg font-semibold dark:text-white">
                        {initialData ? 'Editar Usuario' : 'Nuevo Usuario'}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email *
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
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
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Contrasena {initialData ? '(dejar vacio para mantener)' : '*'}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required={!initialData}
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Rol *
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as typeof role)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="ADMIN">Administrador</option>
                                <option value="STAFF">Staff</option>
                                <option value="AREA_USER">Usuario de Area</option>
                                <option value="READONLY">Solo Lectura</option>
                            </select>
                        </div>
                    </div>

                    {role === 'AREA_USER' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Area asignada
                            </label>
                            <select
                                value={areaId}
                                onChange={(e) => setAreaId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="">Seleccionar area</option>
                                {areas.map((area) => (
                                    <option key={area.id} value={area.id}>
                                        {area.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Empresas asignadas *
                        </label>
                        <div className="border rounded-md p-3 max-h-40 overflow-y-auto dark:border-gray-600">
                            {companies.map((company) => (
                                <label key={company.id} className="flex items-center gap-2 py-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedCompanyIds.includes(company.id)}
                                        onChange={() => handleCompanyToggle(company.id)}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{company.name}</span>
                                </label>
                            ))}
                        </div>
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
