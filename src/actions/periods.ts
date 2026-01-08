'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth/config';

interface Period {
    year: number;
    month: number;
    isClosed: boolean;
}

// Get available periods (generate from current date back 2 years)
export async function getAvailablePeriods(): Promise<Period[]> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    const periods: Period[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Generate periods for current year and previous 2 years
    for (let year = currentYear; year >= currentYear - 2; year--) {
        const maxMonth = year === currentYear ? currentMonth : 12;
        const minMonth = 1;

        for (let month = maxMonth; month >= minMonth; month--) {
            // Period is closed if it's before the current month
            const isClosed = year < currentYear || (year === currentYear && month < currentMonth);

            periods.push({
                year,
                month,
                isClosed,
            });
        }
    }

    return periods;
}
