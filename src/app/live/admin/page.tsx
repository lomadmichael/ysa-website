import { cookies } from 'next/headers';
import AdminLogin from './AdminLogin';
import AdminPanel from './AdminPanel';
import { ADMIN_COOKIE, verifyAdmin } from './auth';
import { getState, listWinners } from '@/lib/livedraw-db';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function LiveAdminPage() {
  const jar = await cookies();
  if (!verifyAdmin(jar.get(ADMIN_COOKIE)?.value)) return <AdminLogin />;

  const [state, winners] = await Promise.all([getState(), listWinners()]);

  return (
    <AdminPanel
      isOpen={state.is_open}
      entryCount={state.entry_count}
      prizes={state.prizes}
      winners={winners}
    />
  );
}
