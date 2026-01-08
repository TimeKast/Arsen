import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getUserCompanies } from '@/actions/company-context';
import { BudgetsClient } from './budgets-client';

export default async function BudgetsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const companies = await getUserCompanies();
    const currentYear = new Date().getFullYear();

    return (
        <BudgetsClient
            companies={companies}
            initialYear={currentYear}
            userRole={session.user.role}
        />
    );
}
