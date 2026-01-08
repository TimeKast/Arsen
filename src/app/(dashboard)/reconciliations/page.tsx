import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getUserCompanies } from '@/actions/company-context';
import { db, projects } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { ReconciliationsClient } from './reconciliations-client';

export default async function ReconciliationsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const companies = await getUserCompanies();

    const allProjects = await db.query.projects.findMany({
        where: eq(projects.isActive, true),
        columns: { id: true, name: true },
    });

    return (
        <ReconciliationsClient
            companies={companies}
            projects={allProjects}
        />
    );
}
