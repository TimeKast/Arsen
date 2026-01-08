'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Period {
    year: number;
    month: number;
    isClosed: boolean;
}

interface PeriodStore {
    selectedYear: number;
    selectedMonth: number;
    availablePeriods: Period[];
    setSelectedPeriod: (year: number, month: number) => void;
    setAvailablePeriods: (periods: Period[]) => void;
    getSelectedPeriod: () => Period | null;
    isCurrentPeriodClosed: () => boolean;
}

const currentDate = new Date();

export const usePeriodStore = create<PeriodStore>()(
    persist(
        (set, get) => ({
            selectedYear: currentDate.getFullYear(),
            selectedMonth: currentDate.getMonth() + 1, // 1-indexed
            availablePeriods: [],

            setSelectedPeriod: (year: number, month: number) => {
                set({ selectedYear: year, selectedMonth: month });
                // Reload to refresh data with new period context
                if (typeof window !== 'undefined') {
                    window.location.reload();
                }
            },

            setAvailablePeriods: (periods: Period[]) => {
                set({ availablePeriods: periods });
            },

            getSelectedPeriod: () => {
                const state = get();
                return state.availablePeriods.find(
                    (p) => p.year === state.selectedYear && p.month === state.selectedMonth
                ) || null;
            },

            isCurrentPeriodClosed: () => {
                const state = get();
                const period = state.availablePeriods.find(
                    (p) => p.year === state.selectedYear && p.month === state.selectedMonth
                );
                return period?.isClosed || false;
            },
        }),
        {
            name: 'arsen-period-storage',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                selectedYear: state.selectedYear,
                selectedMonth: state.selectedMonth
            }),
        }
    )
);
