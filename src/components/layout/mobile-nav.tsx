'use client';

import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
    isOpen: boolean;
    onToggle: () => void;
    className?: string;
}

/**
 * Mobile navigation hamburger button
 * Only visible on mobile viewports (< 768px)
 */
export function MobileNav({ isOpen, onToggle, className }: MobileNavProps) {
    return (
        <button
            onClick={onToggle}
            className={cn(
                'md:hidden flex items-center justify-center p-2 rounded-lg',
                'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
                'transition-colors',
                className
            )}
            aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isOpen}
        >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
    );
}
