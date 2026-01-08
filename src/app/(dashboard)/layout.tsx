import { getUserCompanies } from '@/actions/company-context';
import { getAvailablePeriods } from '@/actions/periods';
import { DashboardLayoutClient } from './dashboard-layout-client';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [userCompanies, availablePeriods] = await Promise.all([
        getUserCompanies(),
        getAvailablePeriods(),
    ]);

    return (
        <DashboardLayoutClient userCompanies={userCompanies} availablePeriods={availablePeriods}>
            {children}
        </DashboardLayoutClient>
    );
}
