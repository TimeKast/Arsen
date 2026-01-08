import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';

export default async function Home() {
  const session = await auth();

  // If authenticated, redirect to main dashboard
  if (session?.user) {
    redirect('/comparison');
  }

  // If not authenticated, redirect to login
  redirect('/login');
}
