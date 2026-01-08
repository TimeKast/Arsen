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

    const [users, companies, areas] = await Promise.all([
        getUsers(),
        getCompaniesForUserSelect(),
        getAreasForUserSelect(),
    ]);

    return <UsersClient initialUsers={users} companies={companies} areas={areas} />;
}
