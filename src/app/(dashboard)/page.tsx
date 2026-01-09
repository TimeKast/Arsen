import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getUserCompanies } from '@/actions/company-context';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    try {
        const companies = await getUserCompanies();
        const currentYear = new Date().getFullYear();

        // Get all projects for filter
        const allProjects = await db.select({ id: projects.id, name: projects.name, companyId: projects.companyId }).from(projects).where(eq(projects.isActive, true));

        return (
            <DashboardClient
                companies={companies}
                projects={allProjects}
                initialYear={currentYear}
                userName={session.user.name || 'Usuario'}
            />
        );
    } catch (error) {
        // If any auth-related error, redirect to login
        console.error('[DASHBOARD] Error:', error);
        redirect('/login');
    }
}
