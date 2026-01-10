'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Check, X } from 'lucide-react';
import { confirmReconciliationImport, resolveProjectByName, resolveConceptByName, type ReconciliationEntry } from '@/actions/reconciliations';
import type { ParsedReconciliation } from '@/lib/excel/reconciliations-parser';

interface Company {
    id: string;
    name: string;
}

interface ReconciliationImportClientProps {
    companies: Company[];
}

export function ReconciliationImportClient({ companies }: ReconciliationImportClientProps) {
    const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || '');
    const [file, setFile] = useState<File | null>(null);
    const [parsing, setParsing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState<ParsedReconciliation[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [result, setResult] = useState<{ success: boolean; count: number } | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setParsing(true);
        setErrors([]);
        setPreview([]);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch('/api/reconciliations/parse', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setPreview(data.data);
                setErrors(data.errors || []);
            } else {
                setErrors(data.errors || ['Error al parsear archivo']);
            }
        } catch (error) {
            setErrors(['Error al procesar archivo']);
        } finally {
            setParsing(false);
        }
    };

    const handleConfirm = async () => {
        if (preview.length === 0 || !selectedCompanyId) return;

        setSaving(true);
        try {
            // Pass entries directly - server will resolve projectIds in bulk
            const entries: ReconciliationEntry[] = preview.map(item => ({
                date: item.date,
                reference: item.reference,
                invoice: item.invoice,
                policy: item.policy,
                checkNumber: item.checkNumber,
                supplier: item.supplier,
                businessUnit: item.businessUnit,
                account: item.account,
                cancelled: item.cancelled,
                inTransit: item.inTransit,
                entries: item.entries,
                subtotal: item.subtotal,
                tax: item.tax,
                withdrawals: item.withdrawals,
                balance: item.balance,
                observations: item.observations,
            }));

            const response = await confirmReconciliationImport({
                companyId: selectedCompanyId,
                entries,
            });

            setResult({ success: true, count: response.insertedCount });
            setPreview([]);
            setFile(null);
        } catch (error) {
            setErrors(['Error al guardar conciliaciones']);
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value: number) => {
        return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('es-MX');
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <FileSpreadsheet className="text-blue-600" size={24} />
                <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Importar Conciliaciones</h1>
            </div>

            {/* Company Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Empresa
                </label>
                <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                            {company.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Upload Zone - Only show when no preview data */}
            {preview.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 mb-4">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 md:p-8 text-center">
                        <Upload className="mx-auto text-gray-400 mb-3" size={40} />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Arrastra un archivo Excel o haz clic para seleccionar
                        </p>
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-input"
                        />
                        <label
                            htmlFor="file-input"
                            className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-md cursor-pointer hover:bg-blue-700"
                        >
                            Seleccionar Archivo
                        </label>
                        {file && (
                            <p className="mt-3 text-sm text-gray-600">
                                Archivo: {file.name}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Selected file info - Show when preview has data */}
            {preview.length > 0 && file && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="text-blue-600" size={20} />
                            <div>
                                <p className="font-medium dark:text-white text-sm">{file.name}</p>
                                <p className="text-xs text-gray-500">{preview.length} registros listos</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setPreview([]); setFile(null); setErrors([]); setResult(null); }}
                            className="self-end sm:self-auto px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                            Cambiar archivo
                        </button>
                    </div>
                </div>
            )}

            {/* Parsing indicator */}
            {parsing && (
                <div className="text-center py-4 text-blue-600">
                    Procesando archivo...
                </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                        <AlertCircle size={20} />
                        <span className="font-medium">Errores encontrados</span>
                    </div>
                    <ul className="text-sm text-red-600 dark:text-red-400 list-disc pl-5">
                        {errors.map((error, i) => (
                            <li key={i}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Success Result */}
            {result?.success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <Check size={20} />
                        <span className="font-medium">
                            {result.count} conciliaciones importadas correctamente
                        </span>
                    </div>
                </div>
            )}

            {/* Preview Table */}
            {preview.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-4">
                    <div className="px-3 py-3 bg-gray-50 dark:bg-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <h2 className="font-medium dark:text-white text-sm">
                            Vista Previa ({preview.length} registros)
                        </h2>
                        <button
                            onClick={handleConfirm}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                            <Check size={16} />
                            {saving ? 'Guardando...' : 'Confirmar'}
                        </button>
                    </div>

                    {/* Mobile summary note */}
                    <div className="md:hidden px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-300">
                        ⟷ Desliza horizontalmente para ver todos los campos
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Referencia</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Factura</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Poliza</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Cheque</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Proveedor</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">U. Negocio</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Cuenta</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Cancelados</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Transito</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Entradas</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Subtotal</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">IVA</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Salidas</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Saldo</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Observaciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {preview.slice(0, 50).map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-3 py-2 whitespace-nowrap">{formatDate(row.date)}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{row.reference || '-'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{row.invoice || '-'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{row.policy || '-'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{row.checkNumber || '-'}</td>
                                        <td className="px-3 py-2">{row.supplier || '-'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{row.businessUnit || '-'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{row.account || '-'}</td>
                                        <td className="px-3 py-2 text-right">{row.cancelled ? formatCurrency(row.cancelled) : '-'}</td>
                                        <td className="px-3 py-2 text-right">{row.inTransit ? formatCurrency(row.inTransit) : '-'}</td>
                                        <td className="px-3 py-2 text-right text-green-600">{row.entries ? formatCurrency(row.entries) : '-'}</td>
                                        <td className="px-3 py-2 text-right">{row.subtotal ? formatCurrency(row.subtotal) : '-'}</td>
                                        <td className="px-3 py-2 text-right">{row.tax ? formatCurrency(row.tax) : '-'}</td>
                                        <td className="px-3 py-2 text-right text-red-600">{row.withdrawals ? formatCurrency(row.withdrawals) : '-'}</td>
                                        <td className="px-3 py-2 text-right font-medium">{row.balance ? formatCurrency(row.balance) : '-'}</td>
                                        <td className="px-3 py-2 max-w-xs truncate">{row.observations || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {preview.length > 50 && (
                        <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-700">
                            Mostrando primeros 50 de {preview.length} registros
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
