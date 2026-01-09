'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, AlertTriangle, AlertCircle, X, ArrowLeft, Wrench, Save, AlertOctagon, Settings } from 'lucide-react';
import Link from 'next/link';
import {
    parseResultsSheet,
    getMonthSheets,
    detectDateFromFile,
    type ParsedResults
} from '@/lib/excel/results-parser';
import { ConflictResolver } from './conflict-resolver';
import type { ConflictResolution } from '@/actions/import-resolution';
import { checkExistingResults, confirmResultsImport } from '@/actions/results';
import { getActiveImportRules, type ImportRule } from '@/actions/import-rules';
import { applyImportRules } from '@/lib/import-rules-utils';
import { useCompanyStore } from '@/stores/company-store';

const MONTH_MAP: Record<string, number> = {
    'ener': 1, 'febr': 2, 'marr': 3, 'abrr': 4,
    'mayr': 5, 'junr': 6, 'julr': 7, 'agor': 8,
    'sepr': 9, 'octr': 10, 'novr': 11, 'dicr': 12,
};

interface ImportPreviewClientProps {
    companyId: string;
    companyName: string;
    currentYear: number;
    validSheetNames: string[];
}

export function ImportPreviewClient({ companyId: defaultCompanyId, companyName: defaultCompanyName, currentYear, validSheetNames }: ImportPreviewClientProps) {
    const router = useRouter();

    // Use selected company from store (falls back to props if not set)
    const { selectedCompanyId, companies } = useCompanyStore();
    const selectedCompany = companies.find(c => c.id === selectedCompanyId);
    const companyId = selectedCompanyId || defaultCompanyId;
    const companyName = selectedCompany?.name || defaultCompanyName;
    const [file, setFile] = useState<File | null>(null);
    const [availableSheets, setAvailableSheets] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<string>('');
    const [parsedData, setParsedData] = useState<ParsedResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [showResolver, setShowResolver] = useState(false);
    const [resolvedConflicts, setResolvedConflicts] = useState<ConflictResolution[]>([]);
    const [saving, setSaving] = useState(false);
    const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
    const [existingCount, setExistingCount] = useState(0);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [importRules, setImportRules] = useState<ImportRule[]>([]);
    const [appliedRulesInfo, setAppliedRulesInfo] = useState<{ excluded: number; redirected: number }>({ excluded: 0, redirected: 0 });

    // Load import rules on mount
    useEffect(() => {
        getActiveImportRules(companyId).then(setImportRules).catch(console.error);
    }, [companyId]);

    const handleFile = useCallback(async (selectedFile: File) => {
        setFile(selectedFile);
        setLoading(true);
        setParsedData(null);

        try {
            const buffer = await selectedFile.arrayBuffer();
            const sheets = getMonthSheets(buffer, validSheetNames);
            setAvailableSheets(sheets);

            // Auto-detect date from file
            const detectedDate = detectDateFromFile(buffer, selectedFile.name);
            if (detectedDate) {
                setSelectedYear(detectedDate.year);
                setSelectedMonth(detectedDate.month);
            }

            if (sheets.length > 0) {
                setSelectedSheet(sheets[0]);
                const result = parseResultsSheet(buffer, sheets[0], undefined, validSheetNames);
                setParsedData(result);
            } else {
                setParsedData({
                    success: false,
                    sheetName: 'unknown',
                    anchorCell: '',
                    projects: [],
                    concepts: [],
                    values: [],
                    warnings: [{ type: 'STRUCTURE_ERROR', message: 'No se encontraron hojas mensuales (EneR, FebR, etc.)' }],
                    totals: {},
                });
            }
        } catch (error) {
            setParsedData({
                success: false,
                sheetName: 'unknown',
                anchorCell: '',
                projects: [],
                concepts: [],
                values: [],
                warnings: [{ type: 'STRUCTURE_ERROR', message: error instanceof Error ? error.message : 'Error al leer archivo' }],
                totals: {},
            });
        } finally {
            setLoading(false);
        }
    }, [validSheetNames]);

    const handleSheetChange = useCallback(async (sheetName: string) => {
        if (!file) return;
        setSelectedSheet(sheetName);
        setLoading(true);
        try {
            const buffer = await file.arrayBuffer();
            const result = parseResultsSheet(buffer, sheetName, undefined, validSheetNames);
            setParsedData(result);
        } finally {
            setLoading(false);
        }
    }, [file, validSheetNames]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
                handleFile(droppedFile);
            }
        }
    }, [handleFile]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    }, [handleFile]);

    const handleCancel = useCallback(() => {
        setFile(null);
        setParsedData(null);
        setAvailableSheets([]);
        setSelectedSheet('');
        setShowResolver(false);
        setResolvedConflicts([]);
    }, []);

    const warningCount = parsedData?.warnings.filter(w =>
        w.type === 'PROJECT_NOT_FOUND' || w.type === 'CONCEPT_NOT_FOUND'
    ).length || 0;

    const errorCount = parsedData?.warnings.filter(w =>
        w.type === 'STRUCTURE_ERROR' || w.type === 'INVALID_VALUE'
    ).length || 0;

    // Get conflicts for resolver
    const getConflicts = useCallback(() => {
        if (!parsedData) return [];
        const conflicts: { originalName: string; type: 'PROJECT' | 'CONCEPT'; conceptType?: 'INCOME' | 'COST' }[] = [];

        // Exclude admin expenses from project conflicts (they don't need a project in DB)
        parsedData.projects.filter(p => !p.isRecognized && !p.isAdministration).forEach(p => {
            conflicts.push({ originalName: p.name, type: 'PROJECT' });
        });

        parsedData.concepts.filter(c => !c.isRecognized).forEach(c => {
            conflicts.push({ originalName: c.name, type: 'CONCEPT', conceptType: c.type });
        });

        return conflicts;
    }, [parsedData]);

    const handleResolved = useCallback((resolutions: ConflictResolution[]) => {
        console.log('Resolutions received from conflict resolver:', resolutions);
        console.log('Project resolutions:', resolutions.filter(r => r.type === 'PROJECT'));
        setResolvedConflicts(resolutions);
        setShowResolver(false);
        // After resolving, mark all as resolved for UI purposes
        if (parsedData) {
            const updated = { ...parsedData };
            updated.warnings = updated.warnings.filter(
                w => w.type !== 'PROJECT_NOT_FOUND' && w.type !== 'CONCEPT_NOT_FOUND'
            );
            updated.projects = updated.projects.map(p => ({ ...p, isRecognized: true }));
            updated.concepts = updated.concepts.map(c => ({ ...c, isRecognized: true }));
            setParsedData(updated);
        }
    }, [parsedData]);

    const hasConflicts = warningCount > 0 && resolvedConflicts.length === 0;

    // Get month - now uses selectedMonth state (which may come from auto-detection or user selection)
    const getMonth = useCallback(() => {
        return selectedMonth;
    }, [selectedMonth]);

    // Handle confirm - check for existing data first
    const handleConfirm = async () => {
        if (!parsedData) return;
        setSaving(true);
        try {
            const month = getMonth();
            const { exists, count } = await checkExistingResults(companyId, selectedYear, month);

            if (exists) {
                setExistingCount(count);
                setShowOverwriteWarning(true);
            } else {
                await handleSaveConfirmed();
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Error al verificar');
        } finally {
            setSaving(false);
        }
    };

    // Save confirmed - actually save the data
    const handleSaveConfirmed = async () => {
        if (!parsedData) return;
        setSaving(true);
        setShowOverwriteWarning(false);

        try {
            const month = getMonth();

            // Build entries from parsed data
            console.log('Resolved conflicts:', resolvedConflicts);
            console.log('Parsed projects:', parsedData.projects.map(p => p.name));

            let entries = parsedData.values.map(v => {
                const project = parsedData.projects[v.projectIndex];
                const concept = parsedData.concepts[v.conceptIndex];

                // Admin expenses have no project (projectId = null)
                if (project?.isAdministration) {
                    const conceptResolution = resolvedConflicts.find(
                        r => r.type === 'CONCEPT' && r.originalName === concept?.name && r.conceptType === concept?.type
                    );
                    return {
                        projectId: null,
                        projectName: null, // No project for admin expenses
                        conceptId: conceptResolution?.targetId || undefined,
                        conceptName: concept?.name || undefined,
                        conceptType: concept?.type as 'INCOME' | 'COST' | undefined,
                        amount: v.value,
                    };
                }

                // Find resolved project/concept IDs if they were mapped
                const projectResolution = resolvedConflicts.find(
                    r => r.type === 'PROJECT' && r.originalName === project?.name
                );
                // Match concept by name AND type to differentiate "Etiquetas" INCOME vs COST
                const conceptResolution = resolvedConflicts.find(
                    r => r.type === 'CONCEPT' && r.originalName === concept?.name && r.conceptType === concept?.type
                );

                if (project && !projectResolution && !project.isAdministration) {
                    console.log(`No resolution for project: "${project.name}"`);
                }

                return {
                    projectId: projectResolution?.targetId || null,
                    projectName: project?.name || null,
                    conceptId: conceptResolution?.targetId || undefined,
                    conceptName: concept?.name || undefined,
                    conceptType: concept?.type as 'INCOME' | 'COST' | undefined, // Pass type for backend lookup
                    amount: v.value,
                };
            }).filter(e => (e.conceptId || e.conceptName) && e.amount !== 0);

            // Apply import rules (REDIRECT and EXCLUDE)
            if (importRules.length > 0) {
                const originalCount = entries.length;
                const transformedEntries = applyImportRules(
                    entries.map(e => ({
                        projectName: e.projectName,
                        conceptName: e.conceptName || '',
                        amount: e.amount,
                    })),
                    importRules
                );

                // Rebuild entries with applied rules
                entries = transformedEntries.map(te => {
                    const original = entries.find(
                        e => e.conceptName === te.conceptName && e.projectName !== te.projectName
                    ) || entries.find(e => e.conceptName === te.conceptName);

                    return {
                        projectId: null as string | null, // Will be resolved by name
                        projectName: te.projectName,
                        conceptId: original?.conceptId,
                        conceptName: te.conceptName,
                        conceptType: original?.conceptType as 'INCOME' | 'COST' | undefined, // Preserve the type
                        amount: te.amount,
                    };
                });

                const excluded = originalCount - entries.length;
                if (excluded > 0) {
                    console.log(`Rules applied: ${excluded} entries excluded`);
                }
            }

            // Debug: log entries before sending
            console.log('Entries to import:', entries.slice(0, 5).map(e => ({
                project: e.projectName,
                concept: e.conceptName,
                amount: e.amount
            })));
            console.log('Total entries:', entries.length);
            console.log('Import rules active:', importRules.length);

            await confirmResultsImport({
                companyId,
                year: selectedYear,
                month,
                entries: entries as Array<{ projectId: string | null; projectName?: string; conceptId?: string; conceptName?: string; conceptType?: 'INCOME' | 'COST'; amount: number }>,
            });

            router.push('/results');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/results')}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold dark:text-white">Importar Resultados</h1>
                        <p className="text-sm text-gray-500">{companyName}</p>
                    </div>
                    {/* Import Rules Indicator */}
                    <Link
                        href="/catalogs/import-rules"
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${importRules.length > 0
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                        title="Configurar reglas de importación"
                    >
                        <Settings size={12} />
                        {importRules.length} reglas
                    </Link>
                </div>
                {parsedData && (
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        <X size={20} />
                        Cancelar
                    </button>
                )}
            </div>

            {!parsedData && (
                /* Upload Zone */
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                >
                    <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                        Arrastra el archivo Excel aqui
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                        o
                    </p>
                    <label className="cursor-pointer">
                        <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Seleccionar archivo
                        </span>
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileInput}
                            className="hidden"
                        />
                    </label>
                    <p className="text-xs text-gray-400 mt-4">
                        Formatos aceptados: .xlsx, .xls
                    </p>
                </div>
            )}

            {loading && (
                <div className="text-center py-12 text-gray-500">
                    <FileSpreadsheet size={48} className="mx-auto animate-pulse mb-4" />
                    <p>Procesando archivo...</p>
                </div>
            )}

            {parsedData && !loading && (
                <div className="space-y-6">
                    {/* File Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet size={20} className="text-green-600" />
                                <span className="font-medium dark:text-white">{file?.name}</span>
                            </div>

                            {availableSheets.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Hoja:</span>
                                    <select
                                        value={selectedSheet}
                                        onChange={(e) => handleSheetChange(e.target.value)}
                                        className="px-3 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        {availableSheets.map((sheet) => (
                                            <option key={sheet} value={sheet}>{sheet}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Year/Month Selector */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Periodo:</span>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="px-3 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value={1}>Enero</option>
                                    <option value={2}>Febrero</option>
                                    <option value={3}>Marzo</option>
                                    <option value={4}>Abril</option>
                                    <option value={5}>Mayo</option>
                                    <option value={6}>Junio</option>
                                    <option value={7}>Julio</option>
                                    <option value={8}>Agosto</option>
                                    <option value={9}>Septiembre</option>
                                    <option value={10}>Octubre</option>
                                    <option value={11}>Noviembre</option>
                                    <option value={12}>Diciembre</option>
                                </select>
                                <input
                                    type="number"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="w-20 px-3 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    min={2020}
                                    max={2030}
                                />
                            </div>

                            <div className="flex items-center gap-4 ml-auto">
                                {warningCount > 0 && (
                                    <span className="flex items-center gap-1 text-amber-600">
                                        <AlertTriangle size={16} />
                                        {warningCount} advertencias
                                    </span>
                                )}
                                {errorCount > 0 && (
                                    <span className="flex items-center gap-1 text-red-600">
                                        <AlertCircle size={16} />
                                        {errorCount} errores
                                    </span>
                                )}
                                {warningCount === 0 && errorCount === 0 && parsedData.success && (
                                    <span className="text-green-600">✓ Sin problemas</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Warnings Panel */}
                    {parsedData.warnings.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                                Advertencias y Errores
                            </h3>
                            <ul className="space-y-1 text-sm">
                                {parsedData.warnings.map((warning, idx) => (
                                    <li
                                        key={idx}
                                        className={`flex items-start gap-2 ${warning.type === 'STRUCTURE_ERROR' || warning.type === 'INVALID_VALUE'
                                            ? 'text-red-700 dark:text-red-300'
                                            : 'text-amber-700 dark:text-amber-300'
                                            }`}
                                    >
                                        {warning.type === 'STRUCTURE_ERROR' || warning.type === 'INVALID_VALUE'
                                            ? <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                            : <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                                        }
                                        {warning.message}
                                        {warning.row && <span className="text-gray-500">(fila {warning.row})</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Preview Tables */}
                    {parsedData.success && (
                        <div className="space-y-6">
                            {/* Projects */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                                    <h3 className="font-medium dark:text-white">
                                        Proyectos ({parsedData.projects.length})
                                    </h3>
                                </div>
                                <div className="p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {parsedData.projects.map((project) => (
                                            <span
                                                key={project.columnIndex}
                                                className={`px-3 py-1 rounded-full text-sm ${project.isRecognized
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                                    }`}
                                            >
                                                {!project.isRecognized && <AlertTriangle size={12} className="inline mr-1" />}
                                                {project.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Concepts by Type */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Income Concepts */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                                    <div className="px-4 py-3 bg-green-50 dark:bg-green-900/30 border-b dark:border-gray-600">
                                        <h3 className="font-medium text-green-800 dark:text-green-200">
                                            Conceptos de Ingreso ({parsedData.concepts.filter(c => c.type === 'INCOME').length})
                                        </h3>
                                    </div>
                                    <div className="p-4 max-h-64 overflow-y-auto">
                                        <ul className="space-y-1 text-sm">
                                            {parsedData.concepts.filter(c => c.type === 'INCOME').map((concept) => (
                                                <li
                                                    key={concept.rowIndex}
                                                    className={`flex items-center gap-2 ${!concept.isRecognized ? 'text-amber-600' : 'dark:text-white'
                                                        }`}
                                                >
                                                    {!concept.isRecognized && <AlertTriangle size={12} />}
                                                    {concept.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Cost Concepts */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                                    <div className="px-4 py-3 bg-red-50 dark:bg-red-900/30 border-b dark:border-gray-600">
                                        <h3 className="font-medium text-red-800 dark:text-red-200">
                                            Conceptos de Costo ({parsedData.concepts.filter(c => c.type === 'COST').length})
                                        </h3>
                                    </div>
                                    <div className="p-4 max-h-64 overflow-y-auto">
                                        <ul className="space-y-1 text-sm">
                                            {parsedData.concepts.filter(c => c.type === 'COST').map((concept) => (
                                                <li
                                                    key={concept.rowIndex}
                                                    className={`flex items-center gap-2 ${!concept.isRecognized ? 'text-amber-600' : 'dark:text-white'
                                                        }`}
                                                >
                                                    {!concept.isRecognized && <AlertTriangle size={12} />}
                                                    {concept.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                                <h3 className="font-medium dark:text-white mb-3">Resumen</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-blue-600">{parsedData.projects.length}</p>
                                        <p className="text-sm text-gray-500">Proyectos</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-green-600">
                                            {parsedData.concepts.filter(c => c.type === 'INCOME').length}
                                        </p>
                                        <p className="text-sm text-gray-500">Ingresos</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-red-600">
                                            {parsedData.concepts.filter(c => c.type === 'COST').length}
                                        </p>
                                        <p className="text-sm text-gray-500">Costos</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-600">{parsedData.values.length}</p>
                                        <p className="text-sm text-gray-500">Valores</p>
                                    </div>
                                </div>
                            </div>

                            {/* Conflict Resolver */}
                            {showResolver && (
                                <ConflictResolver
                                    companyId={companyId}
                                    conflicts={getConflicts()}
                                    onResolved={handleResolved}
                                    onCancel={() => setShowResolver(false)}
                                />
                            )}

                            {/* Action Buttons */}
                            {!showResolver && (
                                <div className="flex justify-end gap-4">
                                    <button
                                        onClick={handleCancel}
                                        className="px-6 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                                    >
                                        Cancelar
                                    </button>
                                    {hasConflicts && (
                                        <button
                                            onClick={() => setShowResolver(true)}
                                            className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                                        >
                                            <Wrench size={18} />
                                            Resolver Conflictos ({warningCount})
                                        </button>
                                    )}
                                    <button
                                        onClick={handleConfirm}
                                        disabled={hasConflicts || errorCount > 0 || saving}
                                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        title={hasConflicts ? 'Resuelve los conflictos antes de continuar' : ''}
                                    >
                                        <Save size={18} />
                                        {saving ? 'Guardando...' : 'Guardar Resultados'}
                                    </button>
                                </div>
                            )}

                            {/* Overwrite Warning Modal */}
                            {showOverwriteWarning && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4">
                                        <div className="flex items-center gap-3 text-amber-600 mb-4">
                                            <AlertOctagon size={32} />
                                            <h3 className="text-lg font-medium dark:text-white">Datos Existentes</h3>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                                            Ya existen {existingCount} registros para este periodo.
                                            Al continuar, se sobrescribiran los datos existentes.
                                        </p>
                                        <div className="flex justify-end gap-4">
                                            <button
                                                onClick={() => setShowOverwriteWarning(false)}
                                                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveConfirmed}
                                                disabled={saving}
                                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                                            >
                                                {saving ? 'Guardando...' : 'Sobrescribir'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
