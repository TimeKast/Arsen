import { getCompaniesForProjectSelect } from '@/actions/projects';
import { ProjectsClient } from './projects-client';

export default async function ProjectsPage() {
    const companies = await getCompaniesForProjectSelect();

    return <ProjectsClient companies={companies} />;
}
