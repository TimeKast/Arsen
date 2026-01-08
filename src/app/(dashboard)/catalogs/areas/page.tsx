import { getCompaniesForSelect } from '@/actions/areas';
import { AreasClient } from './areas-client';

export default async function AreasPage() {
    const companies = await getCompaniesForSelect();

    return <AreasClient companies={companies} />;
}
