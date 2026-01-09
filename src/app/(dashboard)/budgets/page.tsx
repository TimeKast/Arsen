import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getUserCompanies } from '@/actions/company-context';
import { db } from '@/lib/db';
import { areas } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { BudgetsClient } from './budgets-client';

export default async function BudgetsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const companies = await getUserCompanies();
    const currentYear = new Date().getFullYear();

    // Get all areas for filter
    const allAreas = await db.select({ id: areas.id, name: areas.name, companyId: areas.companyId }).from(areas).where(eq(areas.isActive, true));

    return (
        <BudgetsClient
            companies={companies}
            areas={allAreas}
            initialYear={currentYear}
            userRole={session.user.role}
        />
    );
}
