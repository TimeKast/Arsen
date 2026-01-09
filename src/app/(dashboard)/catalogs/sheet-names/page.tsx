import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { getValidSheetNames } from '@/actions/valid-sheet-names';
import { SheetNamesClient } from './sheet-names-client';

export default async function SheetNamesPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    // Only ADMIN and STAFF can manage sheet names
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        redirect('/');
    }

    const sheetNames = await getValidSheetNames();

    return <SheetNamesClient sheetNames={sheetNames} />;
}
