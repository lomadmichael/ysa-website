import { cookies } from 'next/headers';
import AdminLogin from '../admin/AdminLogin';
import DrawStage from './DrawStage';
import { ADMIN_COOKIE, verifyAdmin } from '../admin/auth';
import { getState } from '@/lib/livedraw-db';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function DrawPage() {
  const jar = await cookies();
  if (!verifyAdmin(jar.get(ADMIN_COOKIE)?.value)) return <AdminLogin />;

  const state = await getState();
  return <DrawStage prizes={state.prizes} entryCount={state.entry_count} />;
}
