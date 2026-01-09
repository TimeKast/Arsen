'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, AlertTriangle, AlertCircle, X, ArrowLeft, Wrench, Save, AlertOctagon, Settings } from 'lucide-react';
import Link from 'next/link';
import {
    parseResultsSheet,
    getMonthSheets,
    detectDateFromFile,
    hasOtrosSheet,
    getOtrosYear,
    parseOtrosAsResults,
    parseOtrosAllMonths,
    findMonthlySheets,
    getMonthFromSheetName,
    type ParsedResults,
    type OtrosMonthlyData
} from '@/lib/excel/results-parser';
import { ConflictResolver } from './conflict-resolver';
import type { ConflictResolution } from '@/actions/import-resolution';
import { getSavedMappings, getSavedProjectMappings } from '@/actions/import-resolution';
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
    knownProjects?: string[];
    knownConcepts?: string[];
}

export function ImportPreviewClient({ companyId: defaultCompanyId, companyName: defaultCompanyName, currentYear, validSheetNames, knownProjects, knownConcepts }: ImportPreviewClientProps) {
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
    const [savedMappings, setSavedMappings] = useState<{ externalName: string; conceptId: string }[]>([]);
    const [savedProjectMappings, setSavedProjectMappings] = useState<{ externalName: string; projectId: string }[]>([]);
    const [appliedRulesInfo, setAppliedRulesInfo] = useState<{ excluded: number; redirected: number }>({ excluded: 0, redirected: 0 });
    const [otrosMonthlyData, setOtrosMonthlyData] = useState<OtrosMonthlyData | null>(null);
    const [isOtrosSheet, setIsOtrosSheet] = useState(false);
    const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
    // Multi-month import mode (when file has multiple monthly sheets like ene, feb, mar...)
    const [isMultiMonthMode, setIsMultiMonthMode] = useState(false);
    const [detectedMonthlySheets, setDetectedMonthlySheets] = useState<Array<{ sheetName: string; month: number }>>([]);

    // Load import rules and saved mappings on mount
    useEffect(() => {
        getActiveImportRules(companyId).then(setImportRules).catch(console.error);
        getSavedMappings(companyId).then(mappings => {
            console.log('[MAPPINGS] Loaded concept mappings:', mappings.length);
            setSavedMappings(mappings.map(m => ({ externalName: m.externalName, conceptId: m.conceptId })));
        }).catch(console.error);
        getSavedProjectMappings(companyId).then(mappings => {
            console.log('[MAPPINGS] Loaded project mappings:', mappings.length, mappings.map(m => m.externalName));
            setSavedProjectMappings(mappings.map(m => ({ externalName: m.externalName, projectId: m.projectId })));
        }).catch(console.error);
    }, [companyId]);

    const handleFile = useCallback(async (selectedFile: File) => {
        setFile(selectedFile);
        setLoading(true);
        setParsedData(null);
        setIsMultiMonthMode(false);
        setDetectedMonthlySheets([]);

        try {
            const buffer = await selectedFile.arrayBuffer();
            setFileBuffer(buffer);
            let sheets = getMonthSheets(buffer, validSheetNames);

            // Check for Otros sheet (budget format for results)
            const fileHasOtros = hasOtrosSheet(buffer);
            if (fileHasOtros) {
                sheets = [...sheets, 'Otros (Resultados)'];
                // Auto-detect year from Otros file
                const otrosYear = getOtrosYear(buffer);
                setSelectedYear(otrosYear);
            }

            setAvailableSheets(sheets);

            // Auto-detect date from file
            const detectedDate = detectDateFromFile(buffer, selectedFile.name);
            if (detectedDate) {
                setSelectedYear(detectedDate.year);
                setSelectedMonth(detectedDate.month);
            }

            // Detect multiple monthly sheets for batch import
            const monthlySheets = findMonthlySheets(buffer, validSheetNames);

            if (monthlySheets.length >= 2) {
                // Multi-month mode: file has 2+ monthly sheets (ene, feb, mar, etc.)
                console.log('[MULTI-MONTH] Detected sheets:', monthlySheets);
                setIsMultiMonthMode(true);
                setDetectedMonthlySheets(monthlySheets);
                setIsOtrosSheet(false);
                setOtrosMonthlyData(null);
                // Parse first sheet for preview
                const firstSheet = monthlySheets[0];
                setSelectedSheet(firstSheet.sheetName);
                const result = parseResultsSheet(buffer, firstSheet.sheetName, knownProjects, validSheetNames);
                setParsedData(result);
            } else if (sheets.length > 0) {
                setSelectedSheet(sheets[0]);
                // Handle Otros sheet differently - parse ALL months at once
                if (sheets[0].includes('Otros')) {
                    setIsOtrosSheet(true);
                    // Parse all 12 months
                    const otrosData = parseOtrosAllMonths(buffer, knownProjects, knownConcepts);
                    setOtrosMonthlyData(otrosData);
                    setSelectedYear(otrosData.year);
                    // Create a preview using month 1 (January) data for display
                    const previewMonth = 1;
                    const result = parseOtrosAsResults(buffer, previewMonth, knownProjects, knownConcepts);
                    setParsedData(result);
                } else {
                    setIsOtrosSheet(false);
                    setOtrosMonthlyData(null);
                    const result = parseResultsSheet(buffer, sheets[0], knownProjects, validSheetNames);
                    setParsedData(result);
                }
            } else {
                setParsedData({
                    success: false,
                    sheetName: 'unknown',
                    anchorCell: '',
                    projects: [],
                    concepts: [],
                    values: [],
                    warnings: [{ type: 'STRUCTURE_ERROR', message: 'No se encontraron hojas de resultados (EneR, FebR, etc.) ni hoja Otros' }],
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
    }, [validSheetNames, knownProjects]);

    const handleSheetChange = useCallback(async (sheetName: string) => {
        if (!file) return;
        setSelectedSheet(sheetName);
        setLoading(true);
        try {
            const buffer = await file.arrayBuffer();
            // Handle Otros sheet differently
            if (sheetName.includes('Otros')) {
                const result = parseOtrosAsResults(buffer, selectedMonth, knownProjects, knownConcepts);
                setParsedData(result);
            } else {
                const result = parseResultsSheet(buffer, sheetName, undefined, validSheetNames);
                setParsedData(result);
            }
        } finally {
            setLoading(false);
        }
    }, [file, validSheetNames, selectedMonth, knownProjects, knownConcepts]);

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

    // Filter warnings to exclude already-mapped projects and concepts
    const effectiveWarnings = parsedData?.warnings.filter(w => {
        if (w.type === 'PROJECT_NOT_FOUND') {
            // Extract project name from warning message
            const match = w.message.match(/Proyecto no reconocido: "(.+)"/);
            if (match) {
                const projectName = match[1].toLowerCase();
                // Skip if already mapped
                if (savedProjectMappings.some(m => m.externalName.toLowerCase() === projectName)) {
                    return false;
                }
            }
        }
        if (w.type === 'CONCEPT_NOT_FOUND') {
            // Extract concept name from warning message
            const match = w.message.match(/Concepto no reconocido: "(.+)" \(/);
            if (match) {
                const conceptName = match[1].toLowerCase();
                // Skip if already mapped
                if (savedMappings.some(m => m.externalName.toLowerCase() === conceptName)) {
                    return false;
                }
            }
        }
        return true;
    }) || [];

    const warningCount = effectiveWarnings.filter(w =>
        w.type === 'PROJECT_NOT_FOUND' || w.type === 'CONCEPT_NOT_FOUND'
    ).length;

    const errorCount = effectiveWarnings.filter(w =>
        w.type === 'STRUCTURE_ERROR' || w.type === 'INVALID_VALUE'
    ).length;

    // Get conflicts for resolver
    const getConflicts = useCallback(() => {
        if (!parsedData) return [];
        const conflicts: { originalName: string; type: 'PROJECT' | 'CONCEPT'; conceptType?: 'INCOME' | 'COST' }[] = [];

        // Check savedProjectMappings to exclude already mapped projects
        const mappedProjectNames = new Set(savedProjectMappings.map(m => m.externalName.toLowerCase()));

        // Exclude admin expenses from project conflicts (they don't need a project in DB)
        parsedData.projects.filter(p => !p.isRecognized && !p.isAdministration).forEach(p => {
            // Skip if this project name was already mapped before
            if (mappedProjectNames.has(p.name.toLowerCase())) {
                return;
            }
            conflicts.push({ originalName: p.name, type: 'PROJECT' });
        });

        // Check savedMappings to exclude already mapped concepts
        const mappedNames = new Set(savedMappings.map(m => m.externalName.toLowerCase()));

        parsedData.concepts.filter(c => !c.isRecognized).forEach(c => {
            // Skip if this concept name was already mapped before
            if (mappedNames.has(c.name.toLowerCase())) {
                return;
            }
            conflicts.push({ originalName: c.name, type: 'CONCEPT', conceptType: c.type });
        });

        return conflicts;
    }, [parsedData, savedMappings, savedProjectMappings]);

    // Helper to check if project is effectively recognized (in DB or has saved mapping)
    const isProjectEffectivelyRecognized = useCallback((project: { name: string; isRecognized: boolean }) => {
        if (project.isRecognized) return true;
        return savedProjectMappings.some(m => m.externalName.toLowerCase() === project.name.toLowerCase());
    }, [savedProjectMappings]);

    // Helper to check if concept is effectively recognized (in DB or has saved mapping)
    const isConceptEffectivelyRecognized = useCallback((concept: { name: string; isRecognized: boolean }) => {
        if (concept.isRecognized) return true;
        return savedMappings.some(m => m.externalName.toLowerCase() === concept.name.toLowerCase());
    }, [savedMappings]);

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
            const source = isOtrosSheet ? 'O' : 'M';
            const { exists, count } = await checkExistingResults(companyId, selectedYear, month, source);

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
            // Special handling for Otros sheet - import ALL 12 months at once
            if (isOtrosSheet && otrosMonthlyData && otrosMonthlyData.valuesByMonth.size > 0) {
                console.log('[OTROS] Importing all months from Otros sheet...');
                let totalInserted = 0;

                // Helper to get conceptId from resolution or saved mapping
                const getConceptIdForOtros = (conceptName: string | undefined, conceptType: 'INCOME' | 'COST' | undefined): string | undefined => {
                    if (!conceptName) return undefined;
                    const resolution = resolvedConflicts.find(
                        r => r.type === 'CONCEPT' && r.originalName === conceptName && r.conceptType === conceptType
                    );
                    if (resolution?.targetId) return resolution.targetId;
                    const savedMapping = savedMappings.find(
                        m => m.externalName.toLowerCase() === conceptName.toLowerCase()
                    );
                    if (savedMapping?.conceptId) return savedMapping.conceptId;
                    return undefined;
                };

                // Helper to get projectId from resolution or saved mapping
                const getProjectIdForOtros = (projectName: string | undefined): string | null => {
                    if (!projectName) return null;

                    // First check resolved conflicts
                    const resolution = resolvedConflicts.find(
                        r => r.type === 'PROJECT' && r.originalName === projectName
                    );
                    if (resolution?.targetId) {
                        return resolution.targetId === '__ADMIN__' ? null : resolution.targetId;
                    }

                    // Then check saved project mappings (case insensitive)
                    const savedMapping = savedProjectMappings.find(
                        m => m.externalName.toLowerCase() === projectName.toLowerCase()
                    );
                    if (savedMapping?.projectId) return savedMapping.projectId;

                    return null; // Will be resolved by name in backend
                };

                // Import each month that has data
                for (let month = 1; month <= 12; month++) {
                    const monthValues = otrosMonthlyData.valuesByMonth.get(month);
                    if (!monthValues || monthValues.length === 0) continue;

                    console.log(`[OTROS] Processing month ${month} with ${monthValues.length} entries...`);

                    const entries = monthValues.map(v => {
                        const project = otrosMonthlyData.projects[v.projectIndex];
                        const concept = otrosMonthlyData.concepts[v.conceptIndex];

                        // Handle project resolution - check saved mappings too
                        const finalProjectId = project?.isAdministration ? null : getProjectIdForOtros(project?.name);

                        return {
                            projectId: finalProjectId,
                            projectName: project?.name || null,
                            conceptId: getConceptIdForOtros(concept?.name, concept?.type),
                            conceptName: concept?.name || undefined,
                            conceptType: concept?.type as 'INCOME' | 'COST' | undefined,
                            amount: v.value,
                        };
                    }).filter(e => (e.conceptId || e.conceptName) && e.amount !== 0);

                    if (entries.length > 0) {
                        const result = await confirmResultsImport({
                            companyId,
                            year: selectedYear,
                            month,
                            source: 'O', // Otros sheet
                            entries: entries as Array<{ projectId: string | null; projectName?: string; conceptId?: string; conceptName?: string; conceptType?: 'INCOME' | 'COST'; amount: number }>,
                        });
                        totalInserted += result.insertedCount || 0;
                        console.log(`[OTROS] Month ${month}: inserted ${result.insertedCount} entries`);
                    }
                }

                console.log(`[OTROS] Total inserted across all months: ${totalInserted}`);
                router.push('/results');
                return;
            }

            // Multi-month batch import - import all detected monthly sheets
            if (isMultiMonthMode && detectedMonthlySheets.length > 0 && fileBuffer) {
                console.log('[MULTI-MONTH] Starting batch import for', detectedMonthlySheets.length, 'sheets');
                let totalInserted = 0;

                for (const sheet of detectedMonthlySheets) {
                    console.log(`[MULTI-MONTH] Processing sheet "${sheet.sheetName}" for month ${sheet.month}...`);

                    // Parse this sheet
                    const sheetData = parseResultsSheet(fileBuffer, sheet.sheetName, knownProjects, validSheetNames);
                    if (!sheetData.success) {
                        console.warn(`[MULTI-MONTH] Failed to parse sheet ${sheet.sheetName}`);
                        continue;
                    }

                    // Build entries for this sheet
                    const getConceptIdForSheet = (conceptName: string | undefined, conceptType: 'INCOME' | 'COST' | undefined): string | undefined => {
                        if (!conceptName) return undefined;
                        const resolution = resolvedConflicts.find(
                            r => r.type === 'CONCEPT' && r.originalName === conceptName && r.conceptType === conceptType
                        );
                        if (resolution?.targetId) return resolution.targetId;
                        const savedMapping = savedMappings.find(
                            m => m.externalName.toLowerCase() === conceptName.toLowerCase()
                        );
                        if (savedMapping?.conceptId) return savedMapping.conceptId;
                        return undefined;
                    };

                    const entries = sheetData.values.map(v => {
                        const project = sheetData.projects[v.projectIndex];
                        const concept = sheetData.concepts[v.conceptIndex];

                        // Admin expenses have no project
                        if (project?.isAdministration) {
                            return {
                                projectId: null,
                                projectName: null,
                                conceptId: getConceptIdForSheet(concept?.name, concept?.type),
                                conceptName: concept?.name || undefined,
                                conceptType: concept?.type as 'INCOME' | 'COST' | undefined,
                                amount: v.value,
                            };
                        }

                        const projectResolution = resolvedConflicts.find(
                            r => r.type === 'PROJECT' && r.originalName === project?.name
                        );
                        const savedProjectMapping = !projectResolution && project?.name
                            ? savedProjectMappings.find(m => m.externalName.toLowerCase() === project.name.toLowerCase())
                            : null;

                        const resolvedProjectId = projectResolution?.targetId || savedProjectMapping?.projectId || null;
                        const finalProjectId = resolvedProjectId === '__ADMIN__' ? null : resolvedProjectId;

                        return {
                            projectId: finalProjectId,
                            projectName: project?.name || null,
                            conceptId: getConceptIdForSheet(concept?.name, concept?.type),
                            conceptName: concept?.name || undefined,
                            conceptType: concept?.type as 'INCOME' | 'COST' | undefined,
                            amount: v.value,
                        };
                    }).filter(e => (e.conceptId || e.conceptName) && e.amount !== 0);

                    if (entries.length > 0) {
                        const result = await confirmResultsImport({
                            companyId,
                            year: selectedYear,
                            month: sheet.month, // Use the detected month for this sheet
                            source: 'M',
                            entries: entries as Array<{ projectId: string | null; projectName?: string; conceptId?: string; conceptName?: string; conceptType?: 'INCOME' | 'COST'; amount: number }>,
                        });
                        totalInserted += result.insertedCount || 0;
                        console.log(`[MULTI-MONTH] Sheet ${sheet.sheetName} (month ${sheet.month}): inserted ${result.insertedCount} entries`);
                    }
                }

                console.log(`[MULTI-MONTH] Total inserted across all sheets: ${totalInserted}`);
                router.push('/results');
                return;
            }

            // Regular single-month import
            const month = getMonth();

            // Build entries from parsed data
            console.log('Resolved conflicts:', resolvedConflicts);
            console.log('Saved mappings:', savedMappings);
            console.log('Parsed projects:', parsedData.projects.map(p => p.name));

            // Helper to get conceptId from resolution or saved mapping
            const getConceptId = (conceptName: string | undefined, conceptType: 'INCOME' | 'COST' | undefined): string | undefined => {
                if (!conceptName) return undefined;

                // First check resolved conflicts
                const resolution = resolvedConflicts.find(
                    r => r.type === 'CONCEPT' && r.originalName === conceptName && r.conceptType === conceptType
                );
                if (resolution?.targetId) return resolution.targetId;

                // Then check saved mappings (case insensitive)
                const savedMapping = savedMappings.find(
                    m => m.externalName.toLowerCase() === conceptName.toLowerCase()
                );
                if (savedMapping?.conceptId) return savedMapping.conceptId;

                return undefined;
            };

            let entries = parsedData.values.map(v => {
                const project = parsedData.projects[v.projectIndex];
                const concept = parsedData.concepts[v.conceptIndex];

                // Admin expenses have no project (projectId = null)
                if (project?.isAdministration) {
                    return {
                        projectId: null,
                        projectName: null, // No project for admin expenses
                        conceptId: getConceptId(concept?.name, concept?.type),
                        conceptName: concept?.name || undefined,
                        conceptType: concept?.type as 'INCOME' | 'COST' | undefined,
                        amount: v.value,
                    };
                }

                // Find resolved project/concept IDs if they were mapped
                const projectResolution = resolvedConflicts.find(
                    r => r.type === 'PROJECT' && r.originalName === project?.name
                );

                // Also check saved project mappings if no resolution found
                const savedProjectMapping = !projectResolution && project?.name
                    ? savedProjectMappings.find(
                        m => m.externalName.toLowerCase() === project.name.toLowerCase()
                    )
                    : null;

                if (project && !projectResolution && !savedProjectMapping && !project.isAdministration && !project.isRecognized) {
                    console.log(`No resolution or mapping for project: "${project.name}"`);
                }

                // Handle __ADMIN__ special value - convert to null for admin expenses
                // Priority: resolved conflicts > saved mappings > null
                const resolvedProjectId = projectResolution?.targetId
                    || savedProjectMapping?.projectId
                    || null;
                const finalProjectId = resolvedProjectId === '__ADMIN__' ? null : resolvedProjectId;

                return {
                    projectId: finalProjectId,
                    projectName: project?.name || null,
                    conceptId: getConceptId(concept?.name, concept?.type),
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
                projectId: e.projectId,
                concept: e.conceptName,
                conceptId: e.conceptId,
                amount: e.amount
            })));
            console.log('Total entries:', entries.length);
            console.log('Import rules active:', importRules.length);

            // Visible debug - count entries with conceptId
            const withConceptId = entries.filter(e => e.conceptId).length;
            const withoutConceptId = entries.filter(e => !e.conceptId && e.conceptName).length;
            console.log(`[DEBUG] Entries with conceptId: ${withConceptId}, without: ${withoutConceptId}`);

            const result = await confirmResultsImport({
                companyId,
                year: selectedYear,
                month,
                source: 'M', // Monthly sheet (contador)
                entries: entries as Array<{ projectId: string | null; projectName?: string; conceptId?: string; conceptName?: string; conceptType?: 'INCOME' | 'COST'; amount: number }>,
            });

            console.log('[DEBUG] Import result:', result);

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

                            {/* Multi-Month Mode Panel */}
                            {isMultiMonthMode && detectedMonthlySheets.length > 0 && (
                                <div className="flex flex-col gap-2 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet size={16} className="text-blue-600" />
                                        <span className="font-medium text-blue-800 dark:text-blue-200">
                                            Importación Multi-Mes Detectada
                                        </span>
                                    </div>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Se encontraron {detectedMonthlySheets.length} pestañas mensuales en el archivo:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {detectedMonthlySheets.map((sheet) => (
                                            <span
                                                key={sheet.sheetName}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-sm border border-blue-300 dark:border-blue-600"
                                            >
                                                <span className="font-medium">{sheet.sheetName}</span>
                                                <span className="text-gray-500">→</span>
                                                <span className="text-blue-600 dark:text-blue-400">
                                                    {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][sheet.month - 1]}
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm text-gray-500">Año:</span>
                                        <input
                                            type="number"
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                            className="w-20 px-3 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            min={2020}
                                            max={2030}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Year/Month Selector (only show when NOT in multi-month mode) */}
                            {!isMultiMonthMode && (
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
                            )}

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
                    {effectiveWarnings.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                                Advertencias y Errores
                            </h3>
                            <ul className="space-y-1 text-sm">
                                {effectiveWarnings.map((warning, idx) => (
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
                                                className={`px-3 py-1 rounded-full text-sm ${isProjectEffectivelyRecognized(project)
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                                    }`}
                                            >
                                                {!isProjectEffectivelyRecognized(project) && <AlertTriangle size={12} className="inline mr-1" />}
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
                                                    className={`flex items-center gap-2 ${!isConceptEffectivelyRecognized(concept) ? 'text-amber-600' : 'dark:text-white'
                                                        }`}
                                                >
                                                    {!isConceptEffectivelyRecognized(concept) && <AlertTriangle size={12} />}
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
                                                    className={`flex items-center gap-2 ${!isConceptEffectivelyRecognized(concept) ? 'text-amber-600' : 'dark:text-white'
                                                        }`}
                                                >
                                                    {!isConceptEffectivelyRecognized(concept) && <AlertTriangle size={12} />}
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
                                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                                            Ya existen {existingCount} registros para este periodo.
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            {isOtrosSheet
                                                ? 'Solo se reemplazarán los datos importados desde Otros (O). Los datos del contador (M) no serán afectados.'
                                                : 'Solo se reemplazarán los datos del contador (M). Los datos de Otros (O) no serán afectados.'
                                            }
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
