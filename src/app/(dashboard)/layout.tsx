import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getUserCompanies } from '@/actions/company-context';
import { getAvailablePeriods } from '@/actions/periods';
import { DashboardLayoutClient } from './dashboard-layout-client';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    try {
        const [userCompanies, availablePeriods] = await Promise.all([
            getUserCompanies(),
            getAvailablePeriods(),
        ]);

        return (
            <DashboardLayoutClient userCompanies={userCompanies} availablePeriods={availablePeriods}>
                {children}
            </DashboardLayoutClient>
        );
    } catch (error) {
        console.error('[DASHBOARD LAYOUT] Error:', error);
        redirect('/login');
    }
}
