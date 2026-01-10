'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Pencil, Power, DollarSign, Trash2 } from 'lucide-react';
import { ProjectForm } from '@/components/forms/project-form';
import { useToast } from '@/components/ui/toast-provider';
import { useConfirm } from '@/components/ui/confirm-modal';
import {
    getProjectsByCompany,
    createProject,
    updateProject,
    toggleProjectActive,
    toggleProjectProfitSharing,
    deleteProject,
    type ProjectFormData,
} from '@/actions/projects';

interface Company {
    id: string;
    name: string;
}

interface Project {
    id: string;
    name: string;
    code: string | null;
    companyId: string;
    appliesProfitSharing: boolean;
    isActive: boolean;
}

interface ProjectsClientProps {
    companies: Company[];
}

export function ProjectsClient({ companies }: ProjectsClientProps) {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const canEdit = session?.user?.role === 'ADMIN' || session?.user?.role === 'STAFF';

    const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || '');
    const [projects, setProjects] = useState<Project[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(true);

    const loadProjects = useCallback(async (companyId: string) => {
        setLoading(true);
        const data = await getProjectsByCompany(companyId);
        setProjects(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (selectedCompanyId) {
            loadProjects(selectedCompanyId);
        }
    }, [selectedCompanyId, loadProjects]);

    const handleCreate = async (data: ProjectFormData) => {
        const project = await createProject(data);
        setProjects((prev) => [...prev, project as Project].sort((a, b) => a.name.localeCompare(b.name)));
    };

    const handleUpdate = async (data: ProjectFormData) => {
        if (!editingProject) return;
        const project = await updateProject(editingProject.id, data);
        setProjects((prev) => prev.map((p) => (p.id === editingProject.id ? (project as Project) : p)));
    };

    const handleToggleActive = (id: string) => {
        startTransition(async () => {
            const updated = await toggleProjectActive(id);
            setProjects((prev) => prev.map((p) => (p.id === id ? (updated as Project) : p)));
        });
    };

    const handleToggleProfitSharing = (id: string) => {
        startTransition(async () => {
            const updated = await toggleProjectProfitSharing(id);
            setProjects((prev) => prev.map((p) => (p.id === id ? (updated as Project) : p)));
        });
    };

    const handleDelete = async (id: string, name: string) => {
        const confirmed = await confirm({
            title: 'Eliminar proyecto',
            message: `¿Eliminar el proyecto "${name}"? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            variant: 'danger'
        });
        if (!confirmed) return;
        startTransition(async () => {
            const result = await deleteProject(id);
            if (result.success) {
                setProjects((prev) => prev.filter((p) => p.id !== id));
                showToast({ type: 'success', message: 'Proyecto eliminado correctamente' });
            } else {
                showToast({ type: 'error', message: result.error || 'Error al eliminar' });
            }
        });
    };

    return (
        <div>
            {/* Header - responsive layout */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Proyectos</h1>
                <div className="flex items-center gap-2">
                    <select
                        value={selectedCompanyId}
                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                        className="flex-1 sm:flex-none px-2 py-1.5 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                            className="p-2 sm:px-3 sm:py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus size={18} className="sm:hidden" />
                            <span className="hidden sm:inline text-sm">+ Nuevo</span>
                        </button>
                    )}
                </div>
            </div>

            {!selectedCompanyId ? (
                <div className="text-center py-8 text-gray-500">
                    Selecciona una empresa para ver sus proyectos
                </div>
            ) : loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : (
                <>
                    {/* Mobile Cards View */}
                    <div className="md:hidden space-y-2">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className={`bg-white dark:bg-gray-800 rounded-lg shadow p-3 ${!project.isActive ? 'opacity-50' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium dark:text-white truncate">{project.name}</span>
                                            {project.code && <span className="text-xs text-gray-500">({project.code})</span>}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            {project.appliesProfitSharing && (
                                                <span className="flex items-center gap-0.5 text-green-600">
                                                    <DollarSign size={12} /> Reparto
                                                </span>
                                            )}
                                            <span className={`px-1.5 py-0.5 rounded-full ${project.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {project.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </div>
                                    {canEdit && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => { setEditingProject(project); setShowForm(true); }}
                                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleProfitSharing(project.id)}
                                                disabled={isPending}
                                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                            >
                                                <DollarSign size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(project.id)}
                                                disabled={isPending}
                                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                            >
                                                <Power size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(project.id, project.name)}
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
                        {projects.length === 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500">
                                No hay proyectos registrados
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
                                    {canEdit && (
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                            Acciones
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {projects.map((project) => (
                                    <tr key={project.id} className={!project.isActive ? 'opacity-50' : ''}>
                                        <td className="px-4 py-3 dark:text-white">{project.name}</td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                            {project.code || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {project.appliesProfitSharing ? (
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
                                                className={`inline-flex px-2 py-0.5 rounded-full text-xs ${project.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {project.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        {canEdit && (
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingProject(project);
                                                            setShowForm(true);
                                                        }}
                                                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleProfitSharing(project.id)}
                                                        disabled={isPending}
                                                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                                        title="Toggle reparto"
                                                    >
                                                        <DollarSign size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleActive(project.id)}
                                                        disabled={isPending}
                                                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                                        title="Activar/Desactivar"
                                                    >
                                                        <Power size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(project.id, project.name)}
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
                                {projects.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                                            No hay proyectos registrados
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {showForm && selectedCompanyId && (
                <ProjectForm
                    companyId={selectedCompanyId}
                    initialData={editingProject || undefined}
                    onSubmit={editingProject ? handleUpdate : handleCreate}
                    onClose={() => {
                        setShowForm(false);
                        setEditingProject(null);
                    }}
                />
            )}
        </div>
    );
}
