'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface Project {
    id: string;
    name: string;
}

interface MultiProjectSelectorProps {
    projects: Project[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    placeholder?: string;
}

export function MultiProjectSelector({
    projects,
    selectedIds,
    onChange,
    placeholder = 'Todos los proyectos'
}: MultiProjectSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleProject = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(i => i !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const selectAll = () => {
        onChange(projects.map(p => p.id));
    };

    const clearAll = () => {
        onChange([]);
    };

    const selectedProjects = projects.filter(p => selectedIds.includes(p.id));
    const displayText = selectedIds.length === 0
        ? placeholder
        : selectedIds.length === projects.length
            ? 'Todos seleccionados'
            : selectedIds.length === 1
                ? selectedProjects[0]?.name
                : `${selectedIds.length} proyectos`;

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

                    {/* Project List */}
                    <div className="max-h-60 overflow-y-auto">
                        {projects.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                No hay proyectos disponibles
                            </div>
                        ) : (
                            projects.map((project) => {
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
                                    {selectedIds.length} de {projects.length} seleccionados
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
