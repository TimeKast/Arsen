'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Pencil, Power, DollarSign } from 'lucide-react';
import { CompanyForm } from '@/components/forms/company-form';
import {
    createCompany,
    updateCompany,
    toggleCompanyActive,
    toggleProfitSharing,
    type CompanyFormData,
} from '@/actions/companies';

interface Company {
    id: string;
    name: string;
    code: string | null;
    handlesProfitSharing: boolean;
    isActive: boolean;
}

interface CompaniesClientProps {
    initialCompanies: Company[];
}

export function CompaniesClient({ initialCompanies }: CompaniesClientProps) {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'ADMIN';

    const [companies, setCompanies] = useState(initialCompanies);
    const [showForm, setShowForm] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleCreate = async (data: CompanyFormData) => {
        const company = await createCompany(data);
        setCompanies((prev) => [...prev, company as Company].sort((a, b) => a.name.localeCompare(b.name)));
    };

    const handleUpdate = async (data: CompanyFormData) => {
        if (!editingCompany) return;
        const company = await updateCompany(editingCompany.id, data);
        setCompanies((prev) =>
            prev.map((c) => (c.id === editingCompany.id ? (company as Company) : c))
        );
    };

    const handleToggleActive = (id: string) => {
        startTransition(async () => {
            const updated = await toggleCompanyActive(id);
            setCompanies((prev) =>
                prev.map((c) => (c.id === id ? (updated as Company) : c))
            );
        });
    };

    const handleToggleProfitSharing = (id: string) => {
        startTransition(async () => {
            const updated = await toggleProfitSharing(id);
            setCompanies((prev) =>
                prev.map((c) => (c.id === id ? (updated as Company) : c))
            );
        });
    };

    return (
        <div>
            {/* Header - responsive layout */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Empresas</h1>
                {isAdmin && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="p-2 sm:px-3 sm:py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 self-end sm:self-auto"
                    >
                        <Plus size={18} className="sm:hidden" />
                        <span className="hidden sm:inline text-sm">+ Nueva</span>
                    </button>
                )}
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-2">
                {companies.map((company) => (
                    <div
                        key={company.id}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow p-3 ${!company.isActive ? 'opacity-50' : ''}`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium dark:text-white">{company.name}</span>
                                    {company.code && <span className="text-xs text-gray-500">({company.code})</span>}
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {company.handlesProfitSharing && (
                                        <span className="flex items-center gap-0.5 text-green-600">
                                            <DollarSign size={12} /> Reparto
                                        </span>
                                    )}
                                    <span className={`px-1.5 py-0.5 rounded-full ${company.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {company.isActive ? 'Activa' : 'Inactiva'}
                                    </span>
                                </div>
                            </div>
                            {isAdmin && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => { setEditingCompany(company); setShowForm(true); }}
                                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleToggleProfitSharing(company.id)}
                                        disabled={isPending}
                                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        <DollarSign size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(company.id)}
                                        disabled={isPending}
                                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        <Power size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {companies.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500">
                        No hay empresas registradas
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Codigo
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Reparto
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Estado
                            </th>
                            {isAdmin && (
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {companies.map((company) => (
                            <tr key={company.id} className={!company.isActive ? 'opacity-50' : ''}>
                                <td className="px-4 py-3 dark:text-white">{company.name}</td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                    {company.code || '-'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {company.handlesProfitSharing ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                                            <DollarSign size={12} className="mr-1" />
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                                            Inactivo
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span
                                        className={`inline-flex px-2 py-0.5 rounded-full text-xs ${company.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {company.isActive ? 'Activa' : 'Inactiva'}
                                    </span>
                                </td>
                                {isAdmin && (
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingCompany(company);
                                                    setShowForm(true);
                                                }}
                                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                                title="Editar"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleProfitSharing(company.id)}
                                                disabled={isPending}
                                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                                title="Toggle reparto"
                                            >
                                                <DollarSign size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(company.id)}
                                                disabled={isPending}
                                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                                title="Activar/Desactivar"
                                            >
                                                <Power size={15} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {companies.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                                    No hay empresas registradas
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <CompanyForm
                    initialData={editingCompany || undefined}
                    onSubmit={editingCompany ? handleUpdate : handleCreate}
                    onClose={() => {
                        setShowForm(false);
                        setEditingCompany(null);
                    }}
                />
            )}
        </div>
    );
}
