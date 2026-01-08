import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getUserCompanies } from '@/actions/company-context';
import { ResultsClient } from './results-client';

export default async function ResultsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const companies = await getUserCompanies();
    const currentYear = new Date().getFullYear();

    return (
        <ResultsClient
            companies={companies}
            initialYear={currentYear}
            userRole={session.user.role}
        />
    );
}
