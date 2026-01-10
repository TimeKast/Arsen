'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'danger';
}

interface ConfirmContextValue {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}

interface ConfirmState extends ConfirmOptions {
    isOpen: boolean;
    resolve: ((value: boolean) => void) | null;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ConfirmState>({
        isOpen: false,
        message: '',
        resolve: null,
    });

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                ...options,
                resolve,
            });
        });
    }, []);

    const handleConfirm = () => {
        state.resolve?.(true);
        setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
    };

    const handleCancel = () => {
        state.resolve?.(false);
        setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
    };

    const isDanger = state.variant === 'danger';

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {/* Confirm Modal */}
            {state.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4">
                            {/* Icon & Title */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2 rounded-full ${isDanger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                    {isDanger ? (
                                        <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                                    ) : (
                                        <AlertTriangle size={20} className="text-blue-600 dark:text-blue-400" />
                                    )}
                                </div>
                                <h3 className="text-lg font-semibold dark:text-white">
                                    {state.title || (isDanger ? 'Confirmar eliminación' : 'Confirmar acción')}
                                </h3>
                            </div>

                            {/* Message */}
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 ml-11">
                                {state.message}
                            </p>

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {state.cancelText || 'Cancelar'}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${isDanger
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {state.confirmText || (isDanger ? 'Eliminar' : 'Confirmar')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}
