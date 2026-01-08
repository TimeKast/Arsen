import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getUserCompanies } from '@/actions/company-context';
import { ImportPreviewClient } from './import-preview-client';

export default async function ImportPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    // Only ADMIN and STAFF can import
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        redirect('/results');
    }

    const companies = await getUserCompanies();
    const defaultCompany = companies[0];

    if (!defaultCompany) {
        redirect('/');
    }

    const currentYear = new Date().getFullYear();

    return (
        <ImportPreviewClient
            companyId={defaultCompany.id}
            companyName={defaultCompany.name}
            currentYear={currentYear}
        />
    );
}
