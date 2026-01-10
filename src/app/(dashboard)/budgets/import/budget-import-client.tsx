'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, AlertTriangle, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { parseBudgetFile, getBudgetSheetInfo, type ParsedBudget } from '@/lib/excel/budget-parser';
import { confirmBudgetImport } from '@/actions/budget-import';
import { useCompanyStore } from '@/stores/company-store';

interface BudgetImportClientProps {
    companyId: string;
    companyName: string;
    currentYear: number;
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function BudgetImportClient({ companyId: defaultCompanyId, companyName: defaultCompanyName, currentYear }: BudgetImportClientProps) {
    const router = useRouter();

    // Use selected company from store
    const { selectedCompanyId, companies } = useCompanyStore();
    const selectedCompany = companies.find(c => c.id === selectedCompanyId);
    const companyId = selectedCompanyId || defaultCompanyId;
    const companyName = selectedCompany?.name || defaultCompanyName;

    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedBudget[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [dragActive, setDragActive] = useState(false);
    const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
    const [showAll, setShowAll] = useState(false);

    const handleFile = useCallback(async (selectedFile: File) => {
        setFile(selectedFile);
        setLoading(true);
        setParsedData(null);
        setResult(null);

        try {
            const buffer = await selectedFile.arrayBuffer();
            const parsed = parseBudgetFile(buffer, selectedYear);
            setParsedData(parsed);
        } catch (error) {
            setParsedData([{
                success: false,
                sheetName: 'unknown',
                areaName: 'unknown',
                entries: [],
                year: selectedYear,
                warnings: [error instanceof Error ? error.message : 'Error al leer archivo']
            }]);
        } finally {
            setLoading(false);
        }
    }, [selectedYear]);

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
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    const handleConfirmImport = async () => {
        if (!parsedData || parsedData.length === 0) return;

        setSaving(true);
        try {
            // Collect all entries from all parsed areas
            const allEntries = parsedData.flatMap(p => p.entries);

            const response = await confirmBudgetImport({
                companyId,
                year: selectedYear,
                entries: allEntries,
            });

            if (response.success) {
                setResult({ imported: response.imported, errors: response.errors });
            } else {
                setResult({ imported: 0, errors: response.errors });
            }
        } catch (error) {
            setResult({ imported: 0, errors: ['Error al guardar'] });
        } finally {
            setSaving(false);
        }
    };

    const totalEntries = parsedData?.reduce((sum, p) => sum + p.entries.length, 0) || 0;
    const areas = parsedData?.map(p => p.areaName).filter((v, i, a) => a.indexOf(v) === i) || [];

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <Link href="/budgets" className="p-1 text-gray-500 hover:text-gray-700">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Importar Presupuestos</h1>
                    <p className="text-xs text-gray-500">{companyName}</p>
                </div>
            </div>

            {/* Year Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Año del Presupuesto
                </label>
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full sm:w-auto px-2 py-1.5 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            {/* Upload Zone - Only show when no file parsed */}
            {!parsedData && !loading && (
                <div
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-4 text-center border-2 border-dashed transition-colors ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <FileSpreadsheet size={40} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-base font-medium mb-1 dark:text-white">
                        Arrastra un archivo Excel aquí
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                        o selecciona el archivo
                    </p>
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        className="hidden"
                        id="file-input"
                    />
                    <label
                        htmlFor="file-input"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                        <Upload size={16} />
                        Seleccionar Archivo
                    </label>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Procesando archivo...</p>
                </div>
            )}

            {/* Preview */}
            {parsedData && parsedData.length > 0 && !result && (
                <>
                    {/* Check if file has no valid data */}
                    {totalEntries === 0 || parsedData.every(p => !p.success) ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-red-500">
                            <h3 className="text-lg font-bold text-red-600 mb-2">Archivo Sin Datos</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                El archivo no contiene datos de presupuesto válidos. Verifica que:
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mb-4">
                                <li>El archivo tenga una hoja llamada "Presupuesto" u "Otros"</li>
                                <li>La hoja tenga columnas: Área, Proyecto, Cuenta, Descripción, y 12 meses</li>
                                <li>Existan filas con datos de presupuesto (no solo encabezados)</li>
                            </ul>
                            {parsedData[0]?.warnings?.length > 0 && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded">
                                    <p className="font-medium text-amber-800 mb-1">Detalles:</p>
                                    <p className="text-sm text-amber-700">{parsedData[0].warnings.join(', ')}</p>
                                </div>
                            )}
                            <button
                                onClick={() => { setFile(null); setParsedData(null); }}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Seleccionar Otro Archivo
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-4">
                            <div className="px-3 py-3 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                                <h3 className="font-medium text-sm dark:text-white">Vista Previa</h3>
                            </div>
                            <div className="p-3 md:p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4">
                                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-xl font-bold text-blue-600">{areas.length}</p>
                                        <p className="text-xs text-gray-500">Áreas</p>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <p className="text-xl font-bold text-green-600">{totalEntries}</p>
                                        <p className="text-xs text-gray-500">Conceptos</p>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <p className="text-xl font-bold text-purple-600">{selectedYear}</p>
                                        <p className="text-xs text-gray-500">Año</p>
                                    </div>
                                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                        <p className="text-xl font-bold text-amber-600">12</p>
                                        <p className="text-xs text-gray-500">Meses</p>
                                    </div>
                                </div>

                                {/* Areas List */}
                                <div className="mb-4">
                                    <h4 className="font-medium mb-2 dark:text-white">Áreas encontradas:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {areas.map(area => (
                                            <span key={area} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                                                {area}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Data Table */}
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-medium text-sm dark:text-white">Datos:</h4>
                                    <button
                                        onClick={() => setShowAll(!showAll)}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        {showAll ? 'Ver muestra' : `Ver todo (${totalEntries})`}
                                    </button>
                                </div>
                                {/* Mobile scroll hint */}
                                <div className="md:hidden px-2 py-1 mb-2 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-300 rounded">
                                    ⟷ Desliza horizontalmente para ver todos los meses
                                </div>
                                <div className={`overflow-x-auto ${showAll ? 'max-h-96 overflow-y-auto' : ''}`}>
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Área</th>
                                                <th className="px-3 py-2 text-left">Proyecto</th>
                                                <th className="px-3 py-2 text-left">Concepto</th>
                                                {MONTH_NAMES.map(m => (
                                                    <th key={m} className="px-3 py-2 text-right">{m}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                            {(showAll
                                                ? parsedData.flatMap(p => p.entries)
                                                : parsedData.slice(0, 2).flatMap(p => p.entries.slice(0, 5))
                                            ).map((entry, i) => (
                                                <tr key={i}>
                                                    <td className="px-3 py-2 dark:text-white whitespace-nowrap">{entry.areaName}</td>
                                                    <td className="px-3 py-2 dark:text-white whitespace-nowrap">{entry.projectName || '-'}</td>
                                                    <td className="px-3 py-2 dark:text-white whitespace-nowrap">{entry.conceptCode}</td>
                                                    {entry.amounts.map((amt, j) => (
                                                        <td key={j} className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                                                            ${amt.toLocaleString()}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {!showAll && (
                                    <p className="text-sm text-gray-500 mt-2 text-center">
                                        Mostrando muestra... <button onClick={() => setShowAll(true)} className="text-blue-600 hover:underline">Ver todo</button>
                                    </p>
                                )}
                            </div>
                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600 flex justify-end gap-3">
                                <button
                                    onClick={() => { setFile(null); setParsedData(null); }}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-600"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmImport}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>Guardando...</>
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            Confirmar Importación
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Result */}
            {result && (
                <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${result.imported > 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
                    }`}>
                    {result.imported > 0 ? (
                        <>
                            <h3 className="text-lg font-bold text-green-600 mb-2">¡Importación Exitosa!</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Se importaron <strong>{result.imported}</strong> registros de presupuesto para {selectedYear}.
                            </p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold text-red-600 mb-2">Error en Importación</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                No se pudieron importar los datos.
                            </p>
                        </>
                    )}
                    {result.errors.length > 0 && (
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded">
                            <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">Advertencias:</p>
                            <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-300">
                                {result.errors.slice(0, 5).map((e, i) => (
                                    <li key={i}>{e}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={() => { setFile(null); setParsedData(null); setResult(null); }}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:border-gray-600"
                        >
                            Importar Otro
                        </button>
                        <Link
                            href="/budgets"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Ver Presupuestos
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
