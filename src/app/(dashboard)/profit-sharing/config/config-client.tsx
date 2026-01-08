'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Trash2, Plus, X } from 'lucide-react';
import { getProfitSharingProjects, getProjectRule, saveProjectRule, deleteProjectRule, type RuleFormData } from '@/actions/profit-sharing';
import { getFormulaTypes, type FormulaType } from '@/lib/profit-sharing/engine';

interface Company {
    id: string;
    name: string;
}

interface ProfitSharingConfigClientProps {
    companies: Company[];
}

interface TierInput {
    minProfit: number;
    maxProfit?: number;
    percentRate: number;
}

interface GroupInput {
    groupName: string;
    percentRate: number;
    members: string[];
}

export function ProfitSharingConfigClient({ companies }: ProfitSharingConfigClientProps) {
    const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || '');
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form state
    const [formulaType, setFormulaType] = useState<FormulaType>('PERCENT_SIMPLE');
    const [fixedAmount, setFixedAmount] = useState<number>(0);
    const [percentRate, setPercentRate] = useState<number>(0);
    const [tiers, setTiers] = useState<TierInput[]>([]);
    const [minimumProfit, setMinimumProfit] = useState<number>(0);
    const [maximumShare, setMaximumShare] = useState<number>(0);
    const [groups, setGroups] = useState<GroupInput[]>([]);
    const [baseAmount, setBaseAmount] = useState<number>(0);
    const [incrementPercent, setIncrementPercent] = useState<number>(0);
    const [incrementThreshold, setIncrementThreshold] = useState<number>(0);

    const formulaTypes = getFormulaTypes();

    // Load projects when company changes
    useEffect(() => {
        async function loadProjects() {
            if (!selectedCompanyId) return;
            setLoading(true);
            try {
                const projectList = await getProfitSharingProjects(selectedCompanyId);
                setProjects(projectList);
                setSelectedProjectId('');
                resetForm();
            } catch (error) {
                console.error('Error loading projects:', error);
            } finally {
                setLoading(false);
            }
        }
        loadProjects();
    }, [selectedCompanyId]);

    // Load rule when project changes
    useEffect(() => {
        async function loadRule() {
            if (!selectedProjectId) {
                resetForm();
                return;
            }
            setLoading(true);
            try {
                const rule = await getProjectRule(selectedProjectId);
                if (rule) {
                    setFormulaType(rule.formulaType as FormulaType);
                    setFixedAmount(parseFloat(rule.fixedAmount || '0'));
                    setPercentRate(parseFloat(rule.percent1 || '0'));
                    // Note: tiers stored as threshold1 for simplicity, or use percent2 for second tier rate
                    if (rule.threshold1) {
                        setTiers([
                            { minProfit: 0, maxProfit: parseFloat(rule.threshold1), percentRate: parseFloat(rule.percent1 || '0') },
                            { minProfit: parseFloat(rule.threshold1), percentRate: parseFloat(rule.percent2 || '0') },
                        ]);
                    } else {
                        setTiers([]);
                    }
                    setMinimumProfit(0);
                    setMaximumShare(parseFloat(rule.dynamicIncrement || '0'));
                    setGroups([]);
                    setBaseAmount(parseFloat(rule.fixedAmount || '0'));
                    setIncrementPercent(parseFloat(rule.percent1 || '0'));
                    setIncrementThreshold(parseFloat(rule.threshold1 || '0'));
                } else {
                    resetForm();
                }
            } catch (error) {
                console.error('Error loading rule:', error);
            } finally {
                setLoading(false);
            }
        }
        loadRule();
    }, [selectedProjectId]);

    const resetForm = () => {
        setFormulaType('PERCENT_SIMPLE');
        setFixedAmount(0);
        setPercentRate(0);
        setTiers([]);
        setMinimumProfit(0);
        setMaximumShare(0);
        setGroups([]);
        setBaseAmount(0);
        setIncrementPercent(0);
        setIncrementThreshold(0);
    };

    const handleSave = async () => {
        if (!selectedProjectId) return;
        setSaving(true);
        setMessage(null);

        try {
            const data: RuleFormData = {
                projectId: selectedProjectId,
                formulaType,
                fixedAmount: fixedAmount || undefined,
                percentRate: percentRate || undefined,
                tiers: tiers.length > 0 ? tiers : undefined,
                minimumProfit: minimumProfit || undefined,
                maximumShare: maximumShare || undefined,
                groups: groups.length > 0 ? groups : undefined,
                baseAmount: baseAmount || undefined,
                incrementPercent: incrementPercent || undefined,
                incrementThreshold: incrementThreshold || undefined,
            };

            await saveProjectRule(data);
            setMessage({ type: 'success', text: 'Configuracion guardada correctamente' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al guardar configuracion' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedProjectId) return;
        if (!confirm('Eliminar la configuracion de reparto para este proyecto?')) return;

        try {
            await deleteProjectRule(selectedProjectId);
            resetForm();
            setMessage({ type: 'success', text: 'Configuracion eliminada' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al eliminar' });
        }
    };

    const addTier = () => {
        const lastMax = tiers.length > 0 ? (tiers[tiers.length - 1].maxProfit || 0) : 0;
        setTiers([...tiers, { minProfit: lastMax, maxProfit: lastMax + 50000, percentRate: 5 }]);
    };

    const removeTier = (index: number) => {
        setTiers(tiers.filter((_, i) => i !== index));
    };

    const updateTier = (index: number, field: keyof TierInput, value: number | undefined) => {
        const newTiers = [...tiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setTiers(newTiers);
    };

    const addGroup = () => {
        setGroups([...groups, { groupName: '', percentRate: 5, members: [] }]);
    };

    const removeGroup = (index: number) => {
        setGroups(groups.filter((_, i) => i !== index));
    };

    const updateGroup = (index: number, field: keyof GroupInput, value: string | number | string[]) => {
        const newGroups = [...groups];
        newGroups[index] = { ...newGroups[index], [field]: value };
        setGroups(newGroups);
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Settings className="text-blue-600" size={28} />
                <h1 className="text-2xl font-bold dark:text-white">Configuracion de Reparto</h1>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Empresa
                        </label>
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
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Proyecto
                        </label>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[200px]"
                            disabled={projects.length === 0}
                        >
                            <option value="">Seleccionar proyecto...</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {projects.length === 0 && !loading && (
                    <p className="text-sm text-amber-600 mt-2">
                        No hay proyectos con reparto de utilidades activo en esta empresa
                    </p>
                )}
            </div>

            {selectedProjectId && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    {/* Formula Type Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipo de Formula
                        </label>
                        <select
                            value={formulaType}
                            onChange={(e) => setFormulaType(e.target.value as FormulaType)}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {formulaTypes.map((ft) => (
                                <option key={ft.type} value={ft.type}>
                                    {ft.label} - {ft.description}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Dynamic fields based on formula type */}
                    <div className="space-y-4">
                        {/* FIXED_ONLY, FIXED_PLUS_PERCENT */}
                        {(formulaType === 'FIXED_ONLY' || formulaType === 'FIXED_PLUS_PERCENT') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Monto Fijo ($)
                                </label>
                                <input
                                    type="number"
                                    value={fixedAmount}
                                    onChange={(e) => setFixedAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    min="0"
                                    step="100"
                                />
                            </div>
                        )}

                        {/* PERCENT_SIMPLE, FIXED_PLUS_PERCENT, SPECIAL_FORMULA */}
                        {(formulaType === 'PERCENT_SIMPLE' || formulaType === 'FIXED_PLUS_PERCENT' || formulaType === 'SPECIAL_FORMULA') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Porcentaje (%)
                                </label>
                                <input
                                    type="number"
                                    value={percentRate}
                                    onChange={(e) => setPercentRate(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                />
                            </div>
                        )}

                        {/* SPECIAL_FORMULA */}
                        {formulaType === 'SPECIAL_FORMULA' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Utilidad Minima ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={minimumProfit}
                                        onChange={(e) => setMinimumProfit(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        min="0"
                                        step="1000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Tope Maximo ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={maximumShare}
                                        onChange={(e) => setMaximumShare(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        min="0"
                                        step="1000"
                                    />
                                </div>
                            </>
                        )}

                        {/* TIERED */}
                        {formulaType === 'TIERED' && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Escalones
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addTier}
                                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        <Plus size={16} /> Agregar escalon
                                    </button>
                                </div>
                                {tiers.map((tier, index) => (
                                    <div key={index} className="flex items-center gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                        <input
                                            type="number"
                                            value={tier.minProfit}
                                            onChange={(e) => updateTier(index, 'minProfit', parseFloat(e.target.value) || 0)}
                                            className="w-28 px-2 py-1 border rounded text-sm"
                                            placeholder="Min"
                                        />
                                        <span className="text-gray-500">-</span>
                                        <input
                                            type="number"
                                            value={tier.maxProfit || ''}
                                            onChange={(e) => updateTier(index, 'maxProfit', e.target.value ? parseFloat(e.target.value) : undefined)}
                                            className="w-28 px-2 py-1 border rounded text-sm"
                                            placeholder="Max (vacio=sin limite)"
                                        />
                                        <span className="text-gray-500">@</span>
                                        <input
                                            type="number"
                                            value={tier.percentRate}
                                            onChange={(e) => updateTier(index, 'percentRate', parseFloat(e.target.value) || 0)}
                                            className="w-20 px-2 py-1 border rounded text-sm"
                                            placeholder="%"
                                        />
                                        <span className="text-gray-500">%</span>
                                        <button
                                            type="button"
                                            onClick={() => removeTier(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                {tiers.length === 0 && (
                                    <p className="text-sm text-gray-500 italic">Sin escalones configurados</p>
                                )}
                            </div>
                        )}

                        {/* GROUPED */}
                        {formulaType === 'GROUPED' && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Grupos
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addGroup}
                                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        <Plus size={16} /> Agregar grupo
                                    </button>
                                </div>
                                {groups.map((group, index) => (
                                    <div key={index} className="flex items-center gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                        <input
                                            type="text"
                                            value={group.groupName}
                                            onChange={(e) => updateGroup(index, 'groupName', e.target.value)}
                                            className="flex-1 px-2 py-1 border rounded text-sm"
                                            placeholder="Nombre del grupo"
                                        />
                                        <input
                                            type="number"
                                            value={group.percentRate}
                                            onChange={(e) => updateGroup(index, 'percentRate', parseFloat(e.target.value) || 0)}
                                            className="w-20 px-2 py-1 border rounded text-sm"
                                            placeholder="%"
                                        />
                                        <span className="text-gray-500">%</span>
                                        <button
                                            type="button"
                                            onClick={() => removeGroup(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                {groups.length === 0 && (
                                    <p className="text-sm text-gray-500 italic">Sin grupos configurados</p>
                                )}
                            </div>
                        )}

                        {/* DYNAMIC */}
                        {formulaType === 'DYNAMIC' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Monto Base ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={baseAmount}
                                        onChange={(e) => setBaseAmount(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        min="0"
                                        step="100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Porcentaje por Incremento (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={incrementPercent}
                                        onChange={(e) => setIncrementPercent(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Umbral de Incremento ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={incrementThreshold}
                                        onChange={(e) => setIncrementThreshold(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        min="0"
                                        step="10000"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`mt-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between mt-6 pt-4 border-t dark:border-gray-700">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800"
                        >
                            <Trash2 size={16} /> Eliminar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
