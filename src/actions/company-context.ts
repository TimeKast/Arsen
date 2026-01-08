'use server';

import { eq } from 'drizzle-orm';
import { db, companies, userCompanies } from '@/lib/db';
import { auth } from '@/lib/auth/config';

export async function getUserCompanies() {
    const session = await auth();
    if (!session?.user) {
        throw new Error('No autenticado');
    }

    // ADMIN and STAFF see all active companies
    if (session.user.role === 'ADMIN' || session.user.role === 'STAFF') {
        return await db.query.companies.findMany({
            where: eq(companies.isActive, true),
            orderBy: (companies, { asc }) => [asc(companies.name)],
        });
    }

    // AREA_USER and READONLY only see assigned companies
    const userCompanyList = await db.query.userCompanies.findMany({
        where: eq(userCompanies.userId, session.user.id),
        with: {
            company: true,
        },
    });

    return userCompanyList
        .filter(uc => uc.company.isActive)
        .map(uc => uc.company)
        .sort((a, b) => a.name.localeCompare(b.name));
}
