import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getUserCompanies } from '@/actions/company-context';
import { ProfitSharingConfigClient } from './config-client';

export default async function ProfitSharingConfigPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    // Only ADMIN and STAFF can configure
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        redirect('/');
    }

    const companies = await getUserCompanies();

    return (
        <ProfitSharingConfigClient companies={companies} />
    );
}
