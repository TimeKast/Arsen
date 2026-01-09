import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getUserCompanies } from '@/actions/company-context';
import { getActiveSheetNames } from '@/actions/valid-sheet-names';
import { ImportPreviewClient } from './import-preview-client';
import { db, projects, concepts } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

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
    const validSheetNames = await getActiveSheetNames();

    // Load project and concept names for recognition
    // Projects are company-specific, concepts are global
    const allProjects = await db.query.projects.findMany({
        where: and(
            eq(projects.isActive, true),
            eq(projects.companyId, defaultCompany.id)
        ),
        columns: { name: true },
    });
    const allConcepts = await db.query.concepts.findMany({
        where: eq(concepts.isActive, true),
        columns: { name: true },
    });

    return (
        <ImportPreviewClient
            companyId={defaultCompany.id}
            companyName={defaultCompany.name}
            currentYear={currentYear}
            validSheetNames={validSheetNames}
            knownProjects={allProjects.map(p => p.name)}
            knownConcepts={allConcepts.map(c => c.name)}
        />
    );
}
