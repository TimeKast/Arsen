import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getUserCompanies } from '@/actions/company-context';
import { ReconciliationImportClient } from './import-client';

export default async function ReconciliationImportPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        redirect('/');
    }

    const companies = await getUserCompanies();

    return (
        <ReconciliationImportClient companies={companies} />
    );
}
