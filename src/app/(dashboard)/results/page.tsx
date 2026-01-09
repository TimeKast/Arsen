import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getUserCompanies } from '@/actions/company-context';
import { db } from '@/lib/db';
import { projects, concepts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ResultsClient } from './results-client';

export default async function ResultsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const companies = await getUserCompanies();
    const currentYear = new Date().getFullYear();

    // Get all projects and concepts for the form
    const allProjects = await db.select({ id: projects.id, name: projects.name, companyId: projects.companyId }).from(projects).where(eq(projects.isActive, true));
    const allConcepts = await db.select({ id: concepts.id, name: concepts.name, type: concepts.type }).from(concepts).where(eq(concepts.isActive, true));

    return (
        <ResultsClient
            companies={companies}
            projects={allProjects}
            concepts={allConcepts}
            initialYear={currentYear}
            userRole={session.user.role}
        />
    );
}
