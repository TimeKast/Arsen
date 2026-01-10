import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { db, companies } from '@/lib/db';
import { eq } from 'drizzle-orm';
import ImportRulesClient from './import-rules-client';

export default async function ImportRulesPage() {
    const session = await auth();
    if (!session?.user) {
        redirect('/login');
    }

    // Only ADMIN and STAFF can manage rules
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        redirect('/comparison');
    }

    // Get user's company
    const companyId = session.user.companyIds?.[0];
    if (!companyId) {
        return (
            <div className="p-8 text-center text-gray-500">
                No company assigned
            </div>
        );
    }

    const company = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
    });

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Reglas de Importación</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Configura reglas automáticas para transformar datos al importar.
                    </p>
                </div>
            </div>
            <ImportRulesClient companyId={companyId} companyName={company?.name || 'Company'} />
        </>
    );
}
