import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getUserCompanies } from '@/actions/company-context';
import { db, projects, concepts } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { ReconciliationNewClient } from './new-client';

export default async function ReconciliationNewPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        redirect('/');
    }

    const companies = await getUserCompanies();

    // Get all active projects
    const allProjects = await db.query.projects.findMany({
        where: eq(projects.isActive, true),
        columns: { id: true, name: true },
    });

    // Get all active concepts
    const allConcepts = await db.query.concepts.findMany({
        where: eq(concepts.isActive, true),
        columns: { id: true, name: true, type: true },
    });

    return (
        <ReconciliationNewClient
            companies={companies}
            projects={allProjects}
            concepts={allConcepts}
        />
    );
}
