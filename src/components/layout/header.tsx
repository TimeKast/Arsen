'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Building2, User, ChevronDown, Calendar, Lock } from 'lucide-react';
import { useCompanyStore } from '@/stores/company-store';
import { usePeriodStore } from '@/stores/period-store';

interface Company {
    id: string;
    name: string;
}

interface Period {
    year: number;
    month: number;
    isClosed: boolean;
}

interface HeaderProps {
    sidebarCollapsed: boolean;
    userCompanies: Company[];
    availablePeriods: Period[];
}

const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export function Header({ sidebarCollapsed, userCompanies, availablePeriods }: HeaderProps) {
    const { data: session } = useSession();
    const { selectedCompanyId, companies, setSelectedCompanyId, setCompanies } = useCompanyStore();
    const {
        selectedYear,
        selectedMonth,
        setSelectedPeriod,
        setAvailablePeriods,
        isCurrentPeriodClosed
    } = usePeriodStore();

    // Initialize companies on mount
    useEffect(() => {
        if (userCompanies.length > 0) {
            setCompanies(userCompanies);
        }
    }, [userCompanies, setCompanies]);

    // Initialize periods on mount
    useEffect(() => {
        if (availablePeriods.length > 0) {
            setAvailablePeriods(availablePeriods);
        }
    }, [availablePeriods, setAvailablePeriods]);

    const handleLogout = () => {
        signOut({ callbackUrl: '/login' });
    };

    const handleCompanyChange = (companyId: string) => {
        if (companyId !== selectedCompanyId) {
            setSelectedCompanyId(companyId);
        }
    };

    const handleYearChange = (year: number) => {
        if (year !== selectedYear) {
            setSelectedPeriod(year, selectedMonth);
        }
    };

    const handleMonthChange = (month: number) => {
        if (month !== selectedMonth) {
            setSelectedPeriod(selectedYear, month);
        }
    };

    const selectedCompany = companies.find(c => c.id === selectedCompanyId);
    const isClosed = isCurrentPeriodClosed();

    // Get unique years from available periods
    const availableYears = [...new Set(availablePeriods.map(p => p.year))].sort((a, b) => b - a);
    // If selectedYear is not in availableYears, add it
    if (!availableYears.includes(selectedYear)) {
        availableYears.unshift(selectedYear);
    }

    return (
        <header
            className={`fixed top-0 right-0 z-30 h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-64'
                }`}
        >
            <div className="flex h-full items-center justify-between px-6">
                {/* Selectors */}
                <div className="flex items-center gap-4">
                    {/* Company Selector */}
                    <div className="relative">
                        {companies.length > 1 ? (
                            <div className="relative">
                                <select
                                    value={selectedCompanyId || ''}
                                    onChange={(e) => handleCompanyChange(e.target.value)}
                                    className="appearance-none flex items-center gap-2 pl-9 pr-8 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                                >
                                    {companies.map((company) => (
                                        <option key={company.id} value={company.id}>
                                            {company.name}
                                        </option>
                                    ))}
                                </select>
                                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 px-3 py-2">
                                <Building2 size={18} />
                                <span className="text-sm font-medium">{selectedCompany?.name || 'Sin empresa'}</span>
                            </div>
                        )}
                    </div>

                    {/* Period Selector - Year */}
                    <div className="relative">
                        <select
                            value={selectedYear}
                            onChange={(e) => handleYearChange(Number(e.target.value))}
                            className="appearance-none pl-9 pr-8 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                        >
                            {availableYears.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>

                    {/* Period Selector - Month */}
                    <div className="relative">
                        <select
                            value={selectedMonth}
                            onChange={(e) => handleMonthChange(Number(e.target.value))}
                            className="appearance-none pl-3 pr-8 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                        >
                            <option value={0}>Todos</option>
                            {monthNames.map((name, idx) => (
                                <option key={idx + 1} value={idx + 1}>
                                    {name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>

                    {/* Closed Period Badge */}
                    {isClosed && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            <Lock size={12} />
                            Cerrado
                        </span>
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
