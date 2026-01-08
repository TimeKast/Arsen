'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

interface Company {
    id: string;
    name: string;
}

interface DashboardLayoutClientProps {
    children: React.ReactNode;
    userCompanies: Company[];
}

export function DashboardLayoutClient({ children, userCompanies }: DashboardLayoutClientProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <Header sidebarCollapsed={sidebarCollapsed} userCompanies={userCompanies} />

            <main
                className={`pt-16 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'
                    }`}
            >
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
