import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getUserCompanies } from '@/actions/company-context';
import { BudgetCaptureClient } from './budget-capture-client';

export default async function BudgetCapturePage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    // Only ADMIN, STAFF, AREA_USER can capture
    const allowed = ['ADMIN', 'STAFF', 'AREA_USER'];
    if (!allowed.includes(session.user.role)) {
        redirect('/budgets');
    }

    const companies = await getUserCompanies();
    const currentYear = new Date().getFullYear();

    return <BudgetCaptureClient companies={companies} initialYear={currentYear} />;
}
