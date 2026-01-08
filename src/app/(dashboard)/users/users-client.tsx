'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil, Power, Shield } from 'lucide-react';
import { UserForm } from '@/components/forms/user-form';
import {
    createUser,
    updateUser,
    toggleUserActive,
    type UserFormData,
} from '@/actions/users';

interface Company {
    id: string;
    name: string;
}

interface Area {
    id: string;
    name: string;
}

interface UserCompany {
    company: Company;
}

interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'STAFF' | 'AREA_USER' | 'READONLY';
    areaId: string | null;
    area: Area | null;
    isActive: boolean;
    companies: UserCompany[];
}

interface UsersClientProps {
    initialUsers: User[];
    companies: Company[];
    areas: Area[];
}

const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    STAFF: 'Staff',
    AREA_USER: 'Usuario de Area',
    READONLY: 'Solo Lectura',
};

const roleColors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800',
    STAFF: 'bg-blue-100 text-blue-800',
    AREA_USER: 'bg-green-100 text-green-800',
    READONLY: 'bg-gray-100 text-gray-600',
};

export function UsersClient({ initialUsers, companies, areas }: UsersClientProps) {
    const [users, setUsers] = useState(initialUsers);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleCreate = async (data: UserFormData) => {
        await createUser(data);
        // Reload to get fresh data with relations
        window.location.reload();
    };

    const handleUpdate = async (data: UserFormData) => {
        if (!editingUser) return;
        await updateUser(editingUser.id, data);
        window.location.reload();
    };

    const handleToggleActive = (id: string) => {
        startTransition(async () => {
            const updated = await toggleUserActive(id);
            setUsers((prev) =>
                prev.map((u) => (u.id === id ? { ...u, isActive: updated.isActive } : u))
            );
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Usuarios</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Nuevo Usuario
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Usuario
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Rol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Empresas
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                            <tr key={user.id} className={!user.isActive ? 'opacity-50' : ''}>
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-medium dark:text-white">{user.name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                        {user.area && (
                                            <div className="text-xs text-gray-400">Area: {user.area.name}</div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${roleColors[user.role]}`}>
                                        <Shield size={12} className="mr-1" />
                                        {roleLabels[user.role]}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {user.companies.map((uc) => (
                                            <span
                                                key={uc.company.id}
                                                className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                            >
                                                {uc.company.name}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span
                                        className={`inline-flex px-2 py-1 rounded-full text-xs ${user.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {user.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingUser(user);
                                                setShowForm(true);
                                            }}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                            title="Editar"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(user.id)}
                                            disabled={isPending}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                            title="Activar/Desactivar"
                                        >
                                            <Power size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No hay usuarios registrados
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <UserForm
                    companies={companies}
                    areas={areas}
                    initialData={
                        editingUser
                            ? {
                                id: editingUser.id,
                                email: editingUser.email,
                                name: editingUser.name,
                                role: editingUser.role,
                                areaId: editingUser.areaId,
                                companyIds: editingUser.companies.map((uc) => uc.company.id),
                            }
                            : undefined
                    }
                    onSubmit={editingUser ? handleUpdate : handleCreate}
                    onClose={() => {
                        setShowForm(false);
                        setEditingUser(null);
                    }}
                />
            )}
        </div>
    );
}
