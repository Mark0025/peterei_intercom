import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <>{children}</>;
}
