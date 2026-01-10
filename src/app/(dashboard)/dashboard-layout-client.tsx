'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useIsMobile } from '@/hooks/use-media-query';

interface Company {
    id: string;
    name: string;
}

interface Period {
    year: number;
    month: number;
    isClosed: boolean;
}

interface DashboardLayoutClientProps {
    children: React.ReactNode;
    userCompanies: Company[];
    availablePeriods: Period[];
}

export function DashboardLayoutClient({ children, userCompanies, availablePeriods }: DashboardLayoutClientProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isMobile = useIsMobile();

    const handleMobileMenuToggle = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const handleMobileMenuClose = () => {
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Desktop Sidebar */}
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                isMobile={false}
            />

            {/* Mobile Sidebar (Drawer) */}
            <Sidebar
                collapsed={false}
                onToggle={() => { }}
                isMobile={true}
                isOpen={mobileMenuOpen}
                onClose={handleMobileMenuClose}
            />

            <Header
                sidebarCollapsed={sidebarCollapsed}
                userCompanies={userCompanies}
                availablePeriods={availablePeriods}
                isMobile={isMobile}
                onMenuToggle={handleMobileMenuToggle}
                menuOpen={mobileMenuOpen}
            />

            <main
                className={`pt-16 transition-all duration-300 ${isMobile ? 'ml-0' : (sidebarCollapsed ? 'ml-16' : 'ml-64')
                    }`}
            >
                <div className="p-3 md:p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
