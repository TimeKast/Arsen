'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Building2, User, ChevronDown } from 'lucide-react';
import { useCompanyStore } from '@/stores/company-store';

interface Company {
    id: string;
    name: string;
}

interface HeaderProps {
    sidebarCollapsed: boolean;
    userCompanies: Company[];
}

export function Header({ sidebarCollapsed, userCompanies }: HeaderProps) {
    const { data: session } = useSession();
    const { selectedCompanyId, companies, setSelectedCompanyId, setCompanies } = useCompanyStore();

    // Initialize companies on mount
    useEffect(() => {
        if (userCompanies.length > 0) {
            setCompanies(userCompanies);
        }
    }, [userCompanies, setCompanies]);

    const handleLogout = () => {
        signOut({ callbackUrl: '/login' });
    };

    const handleCompanyChange = (companyId: string) => {
        if (companyId !== selectedCompanyId) {
            setSelectedCompanyId(companyId);
        }
    };

    const selectedCompany = companies.find(c => c.id === selectedCompanyId);

    return (
        <header
            className={`fixed top-0 right-0 z-30 h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-64'
                }`}
        >
            <div className="flex h-full items-center justify-between px-6">
                {/* Company Selector */}
                <div className="relative">
                    {companies.length > 1 ? (
                        <div className="relative">
                            <select
                                value={selectedCompanyId || ''}
                                onChange={(e) => handleCompanyChange(e.target.value)}
                                className="appearance-none flex items-center gap-2 px-4 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.name}
                                    </option>
                                ))}
                            </select>
                            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 px-3 py-2">
                            <Building2 size={20} />
                            <span className="font-medium">{selectedCompany?.name || 'Sin empresa'}</span>
                        </div>
                    )}
                </div>

                {/* User Info & Logout */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <User size={18} />
                        <div className="text-sm">
                            <p className="font-medium">{session?.user?.name || 'Usuario'}</p>
                            <p className="text-xs text-gray-500">{session?.user?.role || 'READONLY'}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                        title="Cerrar sesion"
                    >
                        <LogOut size={18} />
                        <span className="hidden sm:inline text-sm">Salir</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
