import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getConceptTypeOverrides, getCompaniesForOverrides } from '@/actions/concept-type-overrides';
import { ConceptTypeOverridesClient } from './concept-types-client';

export default async function ConceptTypesPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        redirect('/');
    }

    const companies = await getCompaniesForOverrides();
    const defaultCompanyId = companies[0]?.id;
    const overrides = defaultCompanyId ? await getConceptTypeOverrides(defaultCompanyId) : [];

    return (
        <ConceptTypeOverridesClient
            initialOverrides={overrides}
            companies={companies}
            initialCompanyId={defaultCompanyId}
        />
    );
}
