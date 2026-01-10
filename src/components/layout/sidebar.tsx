'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    FileText,
    DollarSign,
    PieChart,
    Users,
    FolderOpen,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    FileCheck,
    Building2,
    Briefcase,
    Tag,
    Layers,
    FileSpreadsheet,
    Shuffle,
    Scale,
    X
} from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    roles?: string[];
    subItems?: NavItem[];
}

const navItems: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/comparison', label: 'Comparativo', icon: <Scale size={20} /> },
    { href: '/results', label: 'Resultados', icon: <FileText size={20} /> },
    { href: '/budgets', label: 'Presupuestos', icon: <DollarSign size={20} /> },
    { href: '/profit-sharing', label: 'Reparto', icon: <PieChart size={20} /> },
    { href: '/reconciliations', label: 'Conciliaciones', icon: <FileCheck size={20} /> },
    {
        href: '/catalogs',
        label: 'Catálogos',
        icon: <FolderOpen size={20} />,
        subItems: [
            { href: '/catalogs/companies', label: 'Empresas', icon: <Building2 size={16} /> },
            { href: '/catalogs/projects', label: 'Proyectos', icon: <Briefcase size={16} /> },
            { href: '/catalogs/areas', label: 'Áreas', icon: <Layers size={16} /> },
            { href: '/catalogs/concepts', label: 'Conceptos', icon: <Tag size={16} /> },
            { href: '/catalogs/import-rules', label: 'Reglas de Import', icon: <Shuffle size={16} /> },
            { href: '/catalogs/sheet-names', label: 'Nombres de Pestañas', icon: <FileSpreadsheet size={16} /> },
            { href: '/catalogs/concept-types', label: 'Tipos de Concepto', icon: <Tag size={16} /> },
        ]
    },
    { href: '/users', label: 'Usuarios', icon: <Users size={20} />, roles: ['ADMIN'] },
];

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    isMobile?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, isMobile = false, isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = session?.user?.role || 'READONLY';
    const [catalogsExpanded, setCatalogsExpanded] = useState(pathname.startsWith('/catalogs'));

    const visibleItems = navItems.filter((item) => {
        if (!item.roles) return true;
        return item.roles.includes(userRole);
    });

    // Mobile drawer mode
    if (isMobile) {
        return (
            <>
                {/* Overlay */}
                {isOpen && (
                    <div
                        className="mobile-overlay"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                )}
                {/* Drawer */}
                <aside
                    className={cn(
                        'fixed left-0 top-0 z-40 h-screen w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out',
                        isOpen ? 'translate-x-0' : '-translate-x-full'
                    )}
                >
                    {/* Header with close button */}
                    <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
                        <span className="text-xl font-bold">Arsen</span>
                        <button
                            onClick={onClose}
                            className="rounded p-1.5 hover:bg-gray-800"
                            aria-label="Cerrar menú"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="mt-4 px-2 overflow-y-auto max-h-[calc(100vh-4rem)]">
                        <ul className="space-y-1">
                            {visibleItems.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== '/' && pathname.startsWith(item.href));
                                const hasSubItems = item.subItems && item.subItems.length > 0;

                                if (hasSubItems) {
                                    return (
                                        <li key={item.href}>
                                            <button
                                                onClick={() => setCatalogsExpanded(!catalogsExpanded)}
                                                className={cn(
                                                    'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                                                    isActive
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                                )}
                                            >
                                                {item.icon}
                                                <span className="flex-1 text-left">{item.label}</span>
                                                <ChevronDown
                                                    size={16}
                                                    className={cn('transition-transform', catalogsExpanded && 'rotate-180')}
                                                />
                                            </button>
                                            {catalogsExpanded && (
                                                <ul className="mt-1 ml-4 space-y-1 border-l border-gray-700 pl-3">
                                                    {item.subItems!.map((subItem) => {
                                                        const isSubActive = pathname === subItem.href;
                                                        return (
                                                            <li key={subItem.href}>
                                                                <Link
                                                                    href={subItem.href}
                                                                    onClick={onClose}
                                                                    className={cn(
                                                                        'flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors',
                                                                        isSubActive
                                                                            ? 'bg-blue-600 text-white'
                                                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                                                    )}
                                                                >
                                                                    {subItem.icon}
                                                                    <span>{subItem.label}</span>
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </li>
                                    );
                                }

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={onClose}
                                            className={cn(
                                                'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                                                isActive
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            )}
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </aside>
            </>
        );
    }

    // Desktop sidebar (unchanged behavior)
    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen bg-gray-900 text-white transition-all duration-300 hidden md:block',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
                {!collapsed && <span className="text-xl font-bold">Arsen</span>}
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
                        const hasSubItems = item.subItems && item.subItems.length > 0;

                        if (hasSubItems) {
                            return (
                                <li key={item.href}>
                                    <button
                                        onClick={() => setCatalogsExpanded(!catalogsExpanded)}
                                        className={cn(
                                            'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                                            isActive
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                                            collapsed && 'justify-center'
                                        )}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        {item.icon}
                                        {!collapsed && (
                                            <>
                                                <span className="flex-1 text-left">{item.label}</span>
                                                <ChevronDown
                                                    size={16}
                                                    className={cn('transition-transform', catalogsExpanded && 'rotate-180')}
                                                />
                                            </>
                                        )}
                                    </button>
                                    {!collapsed && catalogsExpanded && (
                                        <ul className="mt-1 ml-4 space-y-1 border-l border-gray-700 pl-3">
                                            {item.subItems!.map((subItem) => {
                                                const isSubActive = pathname === subItem.href;
                                                return (
                                                    <li key={subItem.href}>
                                                        <Link
                                                            href={subItem.href}
                                                            className={cn(
                                                                'flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors',
                                                                isSubActive
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                                            )}
                                                        >
                                                            {subItem.icon}
                                                            <span>{subItem.label}</span>
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </li>
                            );
                        }

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
