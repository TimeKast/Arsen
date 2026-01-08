'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, Plus, Search, Trash2, Filter } from 'lucide-react';
import { getReconciliations, deleteReconciliation } from '@/actions/reconciliations';
import Link from 'next/link';

interface Company {
    id: string;
    name: string;
}

interface Project {
    id: string;
    name: string;
}

interface Reconciliation {
    id: string;
    date: Date;
    reference: string | null;
    invoice: string | null;
    supplier: string | null;
    subtotal: string | null;
    tax: string | null;
    total: string;
    project: { name: string } | null;
    concept: { name: string } | null;
}

interface ReconciliationsClientProps {
    companies: Company[];
    projects: Project[];
}

export function ReconciliationsClient({ companies, projects }: ReconciliationsClientProps) {
    const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || '');
    const [data, setData] = useState<Reconciliation[]>([]);
    const [filteredData, setFilteredData] = useState<Reconciliation[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filterProjectId, setFilterProjectId] = useState('');
    const [filterSupplier, setFilterSupplier] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const perPage = 20;

    // Load data
    const loadData = useCallback(async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const result = await getReconciliations(selectedCompanyId);
            setData(result as Reconciliation[]);
        } catch (error) {
            console.error('Error loading reconciliations:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Apply filters
    useEffect(() => {
        let filtered = [...data];

        if (filterProjectId) {
            filtered = filtered.filter(r => r.project?.name === projects.find(p => p.id === filterProjectId)?.name);
        }

        if (filterSupplier) {
            const search = filterSupplier.toLowerCase();
            filtered = filtered.filter(r => r.supplier?.toLowerCase().includes(search));
        }

        if (filterDateFrom) {
            const from = new Date(filterDateFrom);
            filtered = filtered.filter(r => new Date(r.date) >= from);
        }

        if (filterDateTo) {
            const to = new Date(filterDateTo);
            filtered = filtered.filter(r => new Date(r.date) <= to);
        }

        setFilteredData(filtered);
        setPage(1);
    }, [data, filterProjectId, filterSupplier, filterDateFrom, filterDateTo, projects]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / perPage);
    const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);

    const handleDelete = async (id: string) => {
        if (!confirm('Eliminar esta conciliacion?')) return;
        try {
            await deleteReconciliation(id);
            loadData();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const formatCurrency = (value: string | null) => {
        if (!value) return '-';
        const num = parseFloat(value);
        return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('es-MX');
    };

    // Totals
    const totalSum = filteredData.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <FileSpreadsheet className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold dark:text-white">Conciliaciones</h1>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/reconciliations/import"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-md hover:bg-gray-200"
                    >
                        Importar
                    </Link>
                    <Link
                        href="/reconciliations/new"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <Plus size={16} /> Nueva
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                <div className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-400">
                    <Filter size={16} />
                    <span className="text-sm font-medium">Filtros</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Empresa</label>
                        <select
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
                        >
                            {companies.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Proyecto</label>
                        <select
                            value={filterProjectId}
                            onChange={(e) => setFilterProjectId(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="">Todos</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Proveedor</label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={filterSupplier}
                                onChange={(e) => setFilterSupplier(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full pl-8 pr-3 py-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
                        <input
                            type="date"
                            value={filterDateFrom}
                            onChange={(e) => setFilterDateFrom(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
                        <input
                            type="date"
                            value={filterDateTo}
                            onChange={(e) => setFilterDateTo(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Registros</p>
                        <p className="text-xl font-bold dark:text-white">{filteredData.length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(totalSum.toFixed(2))}</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : paginatedData.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500">
                    No hay conciliaciones para mostrar
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Referencia</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Proveedor</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Proyecto</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Factura</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                                    <th className="px-3 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {paginatedData.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-3 py-2">{formatDate(row.date)}</td>
                                        <td className="px-3 py-2">{row.reference || '-'}</td>
                                        <td className="px-3 py-2">{row.supplier || '-'}</td>
                                        <td className="px-3 py-2">{row.project?.name || '-'}</td>
                                        <td className="px-3 py-2">{row.invoice || '-'}</td>
                                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(row.total)}</td>
                                        <td className="px-3 py-2">
                                            <button
                                                onClick={() => handleDelete(row.id)}
                                                className="text-red-500 hover:text-red-700"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                                Pagina {page} de {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
