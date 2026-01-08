import { getUserCompanies } from '@/actions/company-context';
import { DashboardLayoutClient } from './dashboard-layout-client';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const userCompanies = await getUserCompanies();

    return (
        <DashboardLayoutClient userCompanies={userCompanies}>
            {children}
        </DashboardLayoutClient>
    );
}
