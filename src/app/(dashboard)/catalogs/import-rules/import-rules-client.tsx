'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ArrowRight, Ban, Power, PowerOff, Edit2, Save, X } from 'lucide-react';
import {
    getImportRules,
    createImportRule,
    updateImportRule,
    deleteImportRule,
    type ImportRule
} from '@/actions/import-rules';

interface Props {
    companyId: string;
    companyName: string;
}

export default function ImportRulesClient({ companyId, companyName }: Props) {
    const [rules, setRules] = useState<ImportRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [ruleType, setRuleType] = useState<'REDIRECT' | 'EXCLUDE'>('REDIRECT');
    const [sourceProject, setSourceProject] = useState('');
    const [sourceConcept, setSourceConcept] = useState('');
    const [targetProject, setTargetProject] = useState('');
    const [description, setDescription] = useState('');

    const loadRules = useCallback(async () => {
        try {
            const data = await getImportRules(companyId);
            setRules(data);
        } catch (error) {
            console.error('Error loading rules:', error);
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        loadRules();
    }, [loadRules]);

    const resetForm = () => {
        setRuleType('REDIRECT');
        setSourceProject('');
        setSourceConcept('');
        setTargetProject('');
        setDescription('');
        setShowForm(false);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingId) {
                await updateImportRule({
                    id: editingId,
                    ruleType,
                    sourceProjectName: sourceProject || null,
                    sourceConceptName: sourceConcept,
                    targetProjectName: targetProject || null,
                    description: description || null,
                });
            } else {
                await createImportRule({
                    companyId,
                    ruleType,
                    sourceProjectName: sourceProject || null,
                    sourceConceptName: sourceConcept,
                    targetProjectName: ruleType === 'REDIRECT' ? targetProject : null,
                    description: description || null,
                });
            }
            resetForm();
            loadRules();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Error al guardar');
        }
    };

    const handleEdit = (rule: ImportRule) => {
        setEditingId(rule.id);
        setRuleType(rule.ruleType);
        setSourceProject(rule.sourceProjectName || '');
        setSourceConcept(rule.sourceConceptName);
        setTargetProject(rule.targetProjectName || '');
        setDescription(rule.description || '');
        setShowForm(true);
    };

    const handleToggleActive = async (rule: ImportRule) => {
        try {
            await updateImportRule({
                id: rule.id,
                isActive: !rule.isActive,
            });
            loadRules();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta regla?')) return;

        try {
            await deleteImportRule(id);
            loadRules();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Error al eliminar');
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Cargando reglas...</div>;
    }

    return (
        <div className="space-y-4">
            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <h3 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-1">
                    ¿Cómo funcionan las reglas?
                </h3>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
                    <li>• <strong>REDIRIGIR:</strong> Mueve valores a otro proyecto</li>
                    <li>• <strong>EXCLUIR:</strong> No importa esos valores</li>
                </ul>
            </div>

            {/* Add Button */}
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={16} />
                    Nueva Regla
                </button>
            )}

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-sm dark:text-white">
                            {editingId ? 'Editar Regla' : 'Nueva Regla'}
                        </h3>
                        <button type="button" onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Rule Type */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo de Regla
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-1 text-sm">
                                <input
                                    type="radio"
                                    value="REDIRECT"
                                    checked={ruleType === 'REDIRECT'}
                                    onChange={(e) => setRuleType(e.target.value as 'REDIRECT')}
                                    className="text-blue-600"
                                />
                                <ArrowRight size={14} className="text-blue-600" />
                                <span className="dark:text-white">Redirigir</span>
                            </label>
                            <label className="flex items-center gap-1 text-sm">
                                <input
                                    type="radio"
                                    value="EXCLUDE"
                                    checked={ruleType === 'EXCLUDE'}
                                    onChange={(e) => setRuleType(e.target.value as 'EXCLUDE')}
                                    className="text-red-600"
                                />
                                <Ban size={14} className="text-red-600" />
                                <span className="dark:text-white">Excluir</span>
                            </label>
                        </div>
                    </div>

                    {/* Source */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Proyecto Origen (opcional)
                            </label>
                            <input
                                type="text"
                                value={sourceProject}
                                onChange={(e) => setSourceProject(e.target.value)}
                                placeholder="Vacío = cualquier proyecto"
                                className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Concepto Origen *
                            </label>
                            <input
                                type="text"
                                value={sourceConcept}
                                onChange={(e) => setSourceConcept(e.target.value)}
                                placeholder="Ej: Telefonía, Renta..."
                                required
                                className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Target (only for REDIRECT) */}
                    {ruleType === 'REDIRECT' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Proyecto Destino *
                            </label>
                            <input
                                type="text"
                                value={targetProject}
                                onChange={(e) => setTargetProject(e.target.value)}
                                placeholder="Ej: Administración"
                                required
                                className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Descripción (opcional)
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Nota explicativa..."
                            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <button
                            type="submit"
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            <Save size={14} />
                            {editingId ? 'Guardar' : 'Crear'}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Rules List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                    <h3 className="font-medium text-sm dark:text-white">
                        Reglas ({rules.length})
                    </h3>
                </div>

                {rules.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                        No hay reglas configuradas.
                    </div>
                ) : (
                    <div className="divide-y dark:divide-gray-700">
                        {rules.map((rule) => (
                            <div
                                key={rule.id}
                                className={`p-3 ${!rule.isActive ? 'opacity-50' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2 min-w-0">
                                        {/* Type Icon */}
                                        {rule.ruleType === 'REDIRECT' ? (
                                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded shrink-0">
                                                <ArrowRight size={14} className="text-blue-600" />
                                            </div>
                                        ) : (
                                            <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded shrink-0">
                                                <Ban size={14} className="text-red-600" />
                                            </div>
                                        )}

                                        {/* Rule Details */}
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-1 text-sm dark:text-white">
                                                {rule.sourceProjectName && (
                                                    <>
                                                        <span className="font-medium truncate">{rule.sourceProjectName}</span>
                                                        <span className="text-gray-400">+</span>
                                                    </>
                                                )}
                                                <span className="font-medium truncate">{rule.sourceConceptName}</span>

                                                {rule.ruleType === 'REDIRECT' && (
                                                    <>
                                                        <ArrowRight size={12} className="text-gray-400 shrink-0" />
                                                        <span className="text-blue-600 font-medium truncate">
                                                            {rule.targetProjectName}
                                                        </span>
                                                    </>
                                                )}

                                                {rule.ruleType === 'EXCLUDE' && (
                                                    <span className="text-red-600 text-xs">(excluido)</span>
                                                )}
                                            </div>
                                            {rule.description && (
                                                <p className="text-xs text-gray-500 truncate">{rule.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => handleToggleActive(rule)}
                                            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${rule.isActive ? 'text-green-600' : 'text-gray-400'
                                                }`}
                                            title={rule.isActive ? 'Desactivar' : 'Activar'}
                                        >
                                            {rule.isActive ? <Power size={14} /> : <PowerOff size={14} />}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(rule)}
                                            className="p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(rule.id)}
                                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
