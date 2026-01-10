'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, Save, ArrowLeft } from 'lucide-react';
import { confirmReconciliationImport, type ReconciliationEntry } from '@/actions/reconciliations';
import Link from 'next/link';

interface Company {
    id: string;
    name: string;
}

interface Project {
    id: string;
    name: string;
    companyId: string;
}

interface Concept {
    id: string;
    name: string;
    type: string;
}

interface ReconciliationNewClientProps {
    companies: Company[];
    projects: Project[];
    concepts: Concept[];
}

export function ReconciliationNewClient({ companies, projects, concepts }: ReconciliationNewClientProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [companyId, setCompanyId] = useState(companies[0]?.id || '');
    const [projectId, setProjectId] = useState('');
    const [conceptId, setConceptId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState('');
    const [invoice, setInvoice] = useState('');
    const [policy, setPolicy] = useState('');
    const [checkNumber, setCheckNumber] = useState('');
    const [supplier, setSupplier] = useState('');
    const [subtotal, setSubtotal] = useState<number>(0);
    const [tax, setTax] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);

    // Auto-calculate total
    useEffect(() => {
        setTotal(subtotal + tax);
    }, [subtotal, tax]);

    // Filter projects by selected company
    const filteredProjects = projects.filter(p => p.companyId === companyId);

    // Reset project when company changes
    useEffect(() => {
        setProjectId('');
    }, [companyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!companyId || !date || total === 0) {
            setError('Complete los campos requeridos');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const entry: ReconciliationEntry = {
                date,
                reference: reference || undefined,
                invoice: invoice || undefined,
                policy: policy || undefined,
                checkNumber: checkNumber || undefined,
                supplier: supplier || undefined,
                subtotal: subtotal || undefined,
                tax: tax || undefined,
                balance: total || undefined, // Use total as balance
                projectId: projectId || null,
                conceptId: conceptId || null,
            };

            await confirmReconciliationImport({
                companyId,
                entries: [entry],
            });

            setSuccess(true);
            setTimeout(() => {
                router.push('/reconciliations');
            }, 1500);
        } catch (err) {
            setError('Error al guardar conciliacion');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Link href="/reconciliations" className="text-gray-500 hover:text-gray-700">
                    <ArrowLeft size={18} />
                </Link>
                <FileSpreadsheet className="text-blue-600" size={22} />
                <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Nueva Conciliación</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Company */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Empresa *
                        </label>
                        <select
                            value={companyId}
                            onChange={(e) => setCompanyId(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        >
                            {companies.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Project */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Proyecto
                        </label>
                        <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">Sin proyecto</option>
                            {filteredProjects.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Concept */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Concepto
                        </label>
                        <select
                            value={conceptId}
                            onChange={(e) => setConceptId(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">Sin concepto</option>
                            {concepts.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fecha *
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        />
                    </div>

                    {/* Reference */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Referencia
                        </label>
                        <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Num. referencia"
                        />
                    </div>

                    {/* Invoice */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Factura
                        </label>
                        <input
                            type="text"
                            value={invoice}
                            onChange={(e) => setInvoice(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Num. factura"
                        />
                    </div>

                    {/* Policy */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Póliza
                        </label>
                        <input
                            type="text"
                            value={policy}
                            onChange={(e) => setPolicy(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Num. póliza"
                        />
                    </div>

                    {/* Check Number */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Cheque
                        </label>
                        <input
                            type="text"
                            value={checkNumber}
                            onChange={(e) => setCheckNumber(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Num. cheque"
                        />
                    </div>

                    {/* Supplier */}
                    <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Proveedor
                        </label>
                        <input
                            type="text"
                            value={supplier}
                            onChange={(e) => setSupplier(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Nombre del proveedor"
                        />
                    </div>

                    {/* Subtotal */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Subtotal
                        </label>
                        <input
                            type="number"
                            value={subtotal}
                            onChange={(e) => setSubtotal(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    {/* Tax */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            IVA
                        </label>
                        <input
                            type="number"
                            value={tax}
                            onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    {/* Total */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Total *
                        </label>
                        <input
                            type="number"
                            value={total}
                            onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white font-bold"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mt-3 p-2 bg-red-100 text-red-800 text-sm rounded">
                        {error}
                    </div>
                )}

                {/* Success */}
                {success && (
                    <div className="mt-3 p-2 bg-green-100 text-green-800 text-sm rounded">
                        Conciliación guardada
                    </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex justify-end gap-2">
                    <Link
                        href="/reconciliations"
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save size={14} />
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
    );
}
