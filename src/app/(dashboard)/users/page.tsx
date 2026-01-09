import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getUsers, getCompaniesForUserSelect, getAreasForUserSelect } from '@/actions/users';
import { UsersClient } from './users-client';

export default async function UsersPage() {
    const session = await auth();

    // ADMIN only
    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/');
    }

    try {
        const [users, companies, areas] = await Promise.all([
            getUsers(),
            getCompaniesForUserSelect(),
            getAreasForUserSelect(),
        ]);

        return <UsersClient initialUsers={users} companies={companies} areas={areas} />;
    } catch (error) {
        console.error('[USERS PAGE] Error loading data:', error);
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Error cargando usuarios</h1>
                <p className="text-gray-600">Hubo un problema al cargar los datos. Revisa los logs del servidor.</p>
                <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
                    {error instanceof Error ? error.message : 'Error desconocido'}
                </pre>
            </div>
        );
    }
}
