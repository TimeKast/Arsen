'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Check, X, Plus, Link } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import {
    getExistingConcepts,
    getExistingProjects,
    saveResolutions,
    type ConflictResolution,
    type ResolutionAction,
} from '@/actions/import-resolution';

interface Concept {
    id: string;
    name: string;
    type: 'INCOME' | 'COST';
}

interface Project {
    id: string;
    name: string;
}

interface Conflict {
    originalName: string;
    type: 'PROJECT' | 'CONCEPT';
    conceptType?: 'INCOME' | 'COST';
}

interface ConflictResolverProps {
    companyId: string;
    conflicts: Conflict[];
    onResolved: (resolutions: ConflictResolution[]) => void;
    onCancel: () => void;
}

export function ConflictResolver({ companyId, conflicts, onResolved, onCancel }: ConflictResolverProps) {
    const [existingConcepts, setExistingConcepts] = useState<Concept[]>([]);
    const [existingProjects, setExistingProjects] = useState<Project[]>([]);
    const [resolutions, setResolutions] = useState<Record<string, ConflictResolution>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    // Load existing entities
    useEffect(() => {
        async function load() {
            try {
                const [concepts, projects] = await Promise.all([
                    getExistingConcepts(),
                    getExistingProjects(companyId),
                ]);
                setExistingConcepts(concepts);
                setExistingProjects(projects);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [companyId]);

    // Initialize resolutions
    useEffect(() => {
        const initial: Record<string, ConflictResolution> = {};
        for (const conflict of conflicts) {
            // Include conceptType in key to differentiate "Etiquetas" INCOME vs COST
            const key = conflict.conceptType
                ? `${conflict.type}-${conflict.originalName}-${conflict.conceptType}`
                : `${conflict.type}-${conflict.originalName}`;
            initial[key] = {
                originalName: conflict.originalName,
                type: conflict.type,
                action: 'IGNORE', // Default to ignore
                conceptType: conflict.conceptType,
            };
        }
        setResolutions(initial);
    }, [conflicts]);

    const handleActionChange = useCallback((key: string, action: ResolutionAction) => {
        setResolutions(prev => {
            const current = prev[key];
            return {
                ...prev,
                [key]: {
                    ...current,
                    action,
                    targetId: undefined,
                    // When creating, use original name as default
                    newName: action === 'CREATE' ? current.originalName : undefined,
                },
            };
        });
    }, []);

    // Bulk action: set all projects to a specific action
    const handleBulkProjectAction = useCallback((action: ResolutionAction) => {
        setResolutions(prev => {
            const updated = { ...prev };
            conflicts.filter(c => c.type === 'PROJECT').forEach(conflict => {
                const key = `PROJECT-${conflict.originalName}`;
                const current = prev[key];
                if (current) {
                    updated[key] = {
                        ...current,
                        action,
                        targetId: undefined,
                        newName: action === 'CREATE' ? current.originalName : undefined,
                    };
                }
            });
            return updated;
        });
    }, [conflicts]);

    // Bulk action: set all concepts to a specific action
    const handleBulkConceptAction = useCallback((action: ResolutionAction) => {
        setResolutions(prev => {
            const updated = { ...prev };
            conflicts.filter(c => c.type === 'CONCEPT').forEach(conflict => {
                // Use same key format as initialization
                const key = conflict.conceptType
                    ? `CONCEPT-${conflict.originalName}-${conflict.conceptType}`
                    : `CONCEPT-${conflict.originalName}`;
                const current = prev[key];
                if (current) {
                    updated[key] = {
                        ...current,
                        action,
                        targetId: undefined,
                        newName: action === 'CREATE' ? current.originalName : undefined,
                    };
                }
            });
            return updated;
        });
    }, [conflicts]);

    const handleTargetChange = useCallback((key: string, targetId: string) => {
        setResolutions(prev => ({
            ...prev,
            [key]: { ...prev[key], targetId },
        }));
    }, []);

    const handleNewNameChange = useCallback((key: string, newName: string) => {
        setResolutions(prev => ({
            ...prev,
            [key]: { ...prev[key], newName },
        }));
    }, []);

    const isValid = useCallback(() => {
        for (const resolution of Object.values(resolutions)) {
            if (resolution.action === 'MAP' && !resolution.targetId) return false;
            if (resolution.action === 'CREATE' && !resolution.newName?.trim()) return false;
        }
        return true;
    }, [resolutions]);

    const handleSave = async () => {
        if (!isValid()) return;
        setSaving(true);
        try {
            const resolutionList = Object.values(resolutions).filter(r => r.action !== 'IGNORE');
            console.log('Sending resolutions to server:', resolutionList);
            console.log('Projects to create:', resolutionList.filter(r => r.type === 'PROJECT' && r.action === 'CREATE'));

            const result = await saveResolutions({
                companyId,
                resolutions: resolutionList,
            });
            console.log('Server response:', result);

            // Update resolutions with created entity IDs
            const updatedResolutions = Object.values(resolutions).map(res => {
                if (res.action === 'CREATE') {
                    const created = result.createdEntities.find(
                        e => e.type === res.type && e.name === res.newName
                    );
                    if (created) {
                        return { ...res, targetId: created.id };
                    }
                }
                return res;
            });

            onResolved(updatedResolutions);
        } catch (error) {
            showToast({ type: 'error', message: error instanceof Error ? error.message : 'Error al guardar' });
        } finally {
            setSaving(false);
        }
    };

    const projectConflicts = conflicts.filter(c => c.type === 'PROJECT');
    const conceptConflicts = conflicts.filter(c => c.type === 'CONCEPT');

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Cargando datos...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="text-amber-600" size={20} />
                    <h3 className="font-medium text-amber-800 dark:text-amber-200">
                        Resolver Conflictos ({conflicts.length})
                    </h3>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                    Los siguientes elementos no fueron reconocidos. Elige una accion para cada uno.
                </p>
            </div>

            {/* Project Conflicts */}
            {projectConflicts.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600 flex items-center justify-between">
                        <h3 className="font-medium dark:text-white">
                            Proyectos no reconocidos ({projectConflicts.length})
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkProjectAction('CREATE')}
                                className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                            >
                                Crear todos
                            </button>
                            <button
                                onClick={() => handleBulkProjectAction('IGNORE')}
                                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500"
                            >
                                Ignorar todos
                            </button>
                        </div>
                    </div>
                    <div className="divide-y dark:divide-gray-700">
                        {projectConflicts.map((conflict) => {
                            const key = `PROJECT-${conflict.originalName}`;
                            const resolution = resolutions[key];
                            if (!resolution) return null;

                            return (
                                <div key={key} className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertTriangle size={16} className="text-amber-500" />
                                        <span className="font-medium dark:text-white">{conflict.originalName}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <button
                                            onClick={() => handleActionChange(key, 'MAP')}
                                            className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${resolution.action === 'MAP'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <Link size={14} /> Mapear
                                        </button>
                                        <button
                                            onClick={() => handleActionChange(key, 'CREATE')}
                                            className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${resolution.action === 'CREATE'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <Plus size={14} /> Crear nuevo
                                        </button>
                                        <button
                                            onClick={() => handleActionChange(key, 'IGNORE')}
                                            className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${resolution.action === 'IGNORE'
                                                ? 'bg-gray-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <X size={14} /> Ignorar
                                        </button>
                                    </div>
                                    {resolution.action === 'MAP' && (
                                        <select
                                            value={resolution.targetId || ''}
                                            onChange={(e) => handleTargetChange(key, e.target.value)}
                                            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="">Seleccionar proyecto existente...</option>
                                            <option value="__ADMIN__" className="font-medium bg-amber-50 dark:bg-amber-900/30">
                                                🏢 Gastos de Administración (sin proyecto)
                                            </option>
                                            <optgroup label="Proyectos">
                                                {existingProjects.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    )}
                                    {resolution.action === 'CREATE' && (
                                        <input
                                            type="text"
                                            value={resolution.newName || conflict.originalName}
                                            onChange={(e) => handleNewNameChange(key, e.target.value)}
                                            placeholder="Nombre del nuevo proyecto"
                                            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Concept Conflicts */}
            {conceptConflicts.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600 flex items-center justify-between">
                        <h3 className="font-medium dark:text-white">
                            Conceptos no reconocidos ({conceptConflicts.length})
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkConceptAction('CREATE')}
                                className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                            >
                                Crear todos
                            </button>
                            <button
                                onClick={() => handleBulkConceptAction('IGNORE')}
                                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500"
                            >
                                Ignorar todos
                            </button>
                        </div>
                    </div>
                    <div className="divide-y dark:divide-gray-700">
                        {conceptConflicts.map((conflict) => {
                            // Use same key format as initialization
                            const key = conflict.conceptType
                                ? `CONCEPT-${conflict.originalName}-${conflict.conceptType}`
                                : `CONCEPT-${conflict.originalName}`;
                            const resolution = resolutions[key];
                            if (!resolution) return null;

                            const filteredConcepts = existingConcepts.filter(
                                c => c.type === conflict.conceptType
                            );

                            return (
                                <div key={key} className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertTriangle size={16} className="text-amber-500" />
                                        <span className="font-medium dark:text-white">{conflict.originalName}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${conflict.conceptType === 'INCOME'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {conflict.conceptType === 'INCOME' ? 'Ingreso' : 'Costo'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <button
                                            onClick={() => handleActionChange(key, 'MAP')}
                                            className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${resolution.action === 'MAP'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <Link size={14} /> Mapear
                                        </button>
                                        <button
                                            onClick={() => handleActionChange(key, 'CREATE')}
                                            className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${resolution.action === 'CREATE'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <Plus size={14} /> Crear nuevo
                                        </button>
                                        <button
                                            onClick={() => handleActionChange(key, 'IGNORE')}
                                            className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${resolution.action === 'IGNORE'
                                                ? 'bg-gray-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <X size={14} /> Ignorar
                                        </button>
                                    </div>
                                    {resolution.action === 'MAP' && (
                                        <select
                                            value={resolution.targetId || ''}
                                            onChange={(e) => handleTargetChange(key, e.target.value)}
                                            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="">Seleccionar concepto existente...</option>
                                            {filteredConcepts.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    )}
                                    {resolution.action === 'CREATE' && (
                                        <input
                                            type="text"
                                            value={resolution.newName || conflict.originalName}
                                            onChange={(e) => handleNewNameChange(key, e.target.value)}
                                            placeholder="Nombre del nuevo concepto"
                                            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
                <button
                    onClick={onCancel}
                    className="px-6 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={!isValid() || saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                    <Check size={18} />
                    {saving ? 'Guardando...' : 'Aplicar y Continuar'}
                </button>
            </div>
        </div>
    );
}
