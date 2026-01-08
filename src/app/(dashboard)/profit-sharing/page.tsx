import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getUserCompanies } from '@/actions/company-context';
import { ProfitSharingViewClient } from './profit-sharing-client';

export default async function ProfitSharingPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const companies = await getUserCompanies();
    const currentYear = new Date().getFullYear();

    return (
        <ProfitSharingViewClient
            companies={companies}
            initialYear={currentYear}
        />
    );
}
