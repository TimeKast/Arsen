'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Company {
    id: string;
    name: string;
}

interface CompanyStore {
    // Company state
    selectedCompanyId: string | null;
    companies: Company[];
    setSelectedCompanyId: (id: string) => void;
    setCompanies: (companies: Company[]) => void;
    getSelectedCompany: () => Company | null;
}

export const useCompanyStore = create<CompanyStore>()(
    persist(
        (set, get) => ({
            // Company state
            selectedCompanyId: null,
            companies: [],

            setSelectedCompanyId: (id: string) => {
                set({ selectedCompanyId: id });
                // Trigger page reload to refresh data with new company context
                if (typeof window !== 'undefined') {
                    window.location.reload();
                }
            },

            setCompanies: (companies: Company[]) => {
                const state = get();
                set({ companies });

                // Auto-select first company if none selected
                if (!state.selectedCompanyId && companies.length > 0) {
                    set({ selectedCompanyId: companies[0].id });
                }

                // Reset selection if current company not in list
                if (state.selectedCompanyId && !companies.find(c => c.id === state.selectedCompanyId)) {
                    set({ selectedCompanyId: companies.length > 0 ? companies[0].id : null });
                }
            },

            getSelectedCompany: () => {
                const state = get();
                return state.companies.find(c => c.id === state.selectedCompanyId) || null;
            },
        }),
        {
            name: 'arsen-company-storage',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                selectedCompanyId: state.selectedCompanyId,
            }),
        }
    )
);
