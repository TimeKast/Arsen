'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    LayoutDashboard,
    FileText,
    DollarSign,
    PieChart,
    FileCheck,
    BarChart3,
    FolderOpen,
    Users,
    Settings,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    roles?: string[]; // If undefined, visible to all
}

const navItems: NavItem[] = [
    { href: '/comparison', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/results', label: 'Resultados', icon: <FileText size={20} /> },
    { href: '/budgets', label: 'Presupuestos', icon: <DollarSign size={20} /> },
    { href: '/profit-sharing', label: 'Reparto', icon: <PieChart size={20} /> },
    { href: '/reconciliations', label: 'Conciliaciones', icon: <FileCheck size={20} /> },
    { href: '/catalogs/companies', label: 'Catalogos', icon: <FolderOpen size={20} /> },
    { href: '/users', label: 'Usuarios', icon: <Users size={20} />, roles: ['ADMIN'] },
];

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = session?.user?.role || 'READONLY';

    const visibleItems = navItems.filter((item) => {
        if (!item.roles) return true;
        return item.roles.includes(userRole);
    });

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen bg-gray-900 text-white transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
                {!collapsed && (
                    <span className="text-xl font-bold">Arsen</span>
                )}
                <button
                    onClick={onToggle}
                    className="rounded p-1.5 hover:bg-gray-800"
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="mt-4 px-2">
                <ul className="space-y-1">
                    {visibleItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                                        isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                                        collapsed && 'justify-center'
                                    )}
                                    title={collapsed ? item.label : undefined}
                                >
                                    {item.icon}
                                    {!collapsed && <span>{item.label}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}
