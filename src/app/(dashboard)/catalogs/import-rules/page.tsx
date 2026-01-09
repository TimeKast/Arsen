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
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Reglas de Importación</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Configura reglas automáticas para transformar datos durante la importación de Excel.
                </p>
            </div>
            <ImportRulesClient companyId={companyId} companyName={company?.name || 'Company'} />
        </div>
    );
}
