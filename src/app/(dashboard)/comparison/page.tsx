import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getUserCompanies } from '@/actions/company-context';
import { getAllActiveProjects } from '@/actions/projects';
import { ComparisonClient } from './comparison-client';

export default async function ComparisonPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const companies = await getUserCompanies();
    const projects = await getAllActiveProjects();
    const currentYear = new Date().getFullYear();

    return (
        <ComparisonClient
            companies={companies}
            projects={projects}
            initialYear={currentYear}
        />
    );
}
