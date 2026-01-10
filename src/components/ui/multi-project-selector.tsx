'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X, Search, Building2 } from 'lucide-react';

// Special ID for administrative expenses (items without a project)
export const ADMIN_PROJECT_ID = '__ADMIN__';

interface Project {
    id: string;
    name: string;
}

interface MultiProjectSelectorProps {
    projects: Project[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    placeholder?: string;
    showAdminOption?: boolean;
}

export function MultiProjectSelector({
    projects,
    selectedIds,
    onChange,
    placeholder = 'Todos los proyectos',
    showAdminOption = false
}: MultiProjectSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Virtual "Administración" project for items without a project
    const adminProject: Project = { id: ADMIN_PROJECT_ID, name: 'Administración' };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Autofocus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const toggleProject = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(i => i !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const selectAll = () => {
        const allIds = projects.map(p => p.id);
        if (showAdminOption) {
            allIds.unshift(ADMIN_PROJECT_ID);
        }
        onChange(allIds);
    };

    const clearAll = () => {
        onChange([]);
    };

    // All projects including admin if enabled
    const allProjects = showAdminOption ? [adminProject, ...projects] : projects;
    const totalCount = allProjects.length;

    // Filter projects based on search query and sort alphabetically
    const filteredProjects = projects
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));

    // Check if admin matches search
    const showAdminInResults = showAdminOption &&
        adminProject.name.toLowerCase().includes(searchQuery.toLowerCase());

    const selectedProjects = allProjects.filter(p => selectedIds.includes(p.id));
    const displayText = selectedIds.length === 0
        ? placeholder
        : selectedIds.length === totalCount
            ? 'Todos seleccionados'
            : selectedIds.length === 1
                ? selectedProjects[0]?.name
                : `${selectedIds.length} seleccionados`;

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between gap-2 w-full min-w-[200px]
                    px-3 py-2 border rounded-lg text-left text-sm
                    bg-white dark:bg-gray-800 
                    border-gray-300 dark:border-gray-600
                    hover:border-gray-400 dark:hover:border-gray-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    transition-colors
                `}
            >
                <span className={selectedIds.length === 0 ? 'text-gray-500' : 'dark:text-white'}>
                    {displayText}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full min-w-[240px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                    {/* Quick Actions */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <button
                            type="button"
                            onClick={selectAll}
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                        >
                            Seleccionar todos
                        </button>
                        <button
                            type="button"
                            onClick={clearAll}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            Limpiar
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar proyecto..."
                                className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Project List */}
                    <div className="max-h-60 overflow-y-auto">
                        {/* Admin Option - Always first when enabled and matches search */}
                        {showAdminInResults && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => toggleProject(ADMIN_PROJECT_ID)}
                                    className={`
                                        flex items-center gap-3 w-full px-3 py-2 text-left text-sm
                                        hover:bg-gray-50 dark:hover:bg-gray-700/50
                                        transition-colors
                                        ${selectedIds.includes(ADMIN_PROJECT_ID) ? 'bg-amber-50 dark:bg-amber-900/20' : ''}
                                    `}
                                >
                                    <div className={`
                                        flex items-center justify-center w-4 h-4 rounded border
                                        ${selectedIds.includes(ADMIN_PROJECT_ID)
                                            ? 'bg-amber-600 border-amber-600'
                                            : 'border-gray-300 dark:border-gray-600'
                                        }
                                    `}>
                                        {selectedIds.includes(ADMIN_PROJECT_ID) && <Check size={12} className="text-white" />}
                                    </div>
                                    <Building2 size={14} className="text-amber-600 dark:text-amber-400" />
                                    <span className={`
                                        flex-1 truncate
                                        ${selectedIds.includes(ADMIN_PROJECT_ID)
                                            ? 'text-amber-700 dark:text-amber-300 font-medium'
                                            : 'text-gray-700 dark:text-gray-300'
                                        }
                                    `}>
                                        Administración
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        Sin proyecto
                                    </span>
                                </button>
                                {filteredProjects.length > 0 && (
                                    <div className="border-b border-gray-100 dark:border-gray-700" />
                                )}
                            </>
                        )}

                        {filteredProjects.length === 0 && !showAdminInResults ? (
                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                {searchQuery ? 'No se encontraron proyectos' : 'No hay proyectos disponibles'}
                            </div>
                        ) : (
                            filteredProjects.map((project) => {
                                const isSelected = selectedIds.includes(project.id);
                                return (
                                    <button
                                        key={project.id}
                                        type="button"
                                        onClick={() => toggleProject(project.id)}
                                        className={`
                                            flex items-center gap-3 w-full px-3 py-2 text-left text-sm
                                            hover:bg-gray-50 dark:hover:bg-gray-700/50
                                            transition-colors
                                            ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                                        `}
                                    >
                                        <div className={`
                                            flex items-center justify-center w-4 h-4 rounded border
                                            ${isSelected
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'border-gray-300 dark:border-gray-600'
                                            }
                                        `}>
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                        <span className={`
                                            flex-1 truncate
                                            ${isSelected
                                                ? 'text-blue-700 dark:text-blue-300 font-medium'
                                                : 'text-gray-700 dark:text-gray-300'
                                            }
                                        `}>
                                            {project.name}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Selected Count Footer */}
                    {selectedIds.length > 0 && (
                        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    {selectedIds.length} de {totalCount} seleccionados
                                </span>
                                <button
                                    type="button"
                                    onClick={() => { clearAll(); setIsOpen(false); }}
                                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                                >
                                    <X size={12} />
                                    Quitar filtro
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Selected Tags (when dropdown is closed and has selections) */}
            {!isOpen && selectedIds.length > 0 && selectedIds.length <= 3 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {selectedProjects.map((project) => (
                        <span
                            key={project.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                        >
                            {project.name}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleProject(project.id); }}
                                className="hover:text-blue-900 dark:hover:text-blue-100"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
