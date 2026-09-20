'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ADMIN_COOKIE, ADMIN_COOKIE_PATH, ADMIN_TTL, checkPassword, makeToken, verifyAdmin } from './auth';
import { pickWinners, setOpen, type PickResult } from '@/lib/livedraw-db';

export async function login(_prev: string, formData: FormData): Promise<string> {
  const pw = String(formData.get('password') ?? '');
  if (!checkPassword(pw)) return '비밀번호가 올바르지 않습니다.';
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, makeToken(), {
    path: ADMIN_COOKIE_PATH,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ADMIN_TTL,
  });
  revalidatePath('/live/admin');
  return '';
}

async function requireAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifyAdmin(jar.get(ADMIN_COOKIE)?.value);
}

export async function toggleOpen(isOpen: boolean): Promise<void> {
  if (!(await requireAdmin())) return;
  await setOpen(isOpen);
  revalidatePath('/live/admin');
  revalidatePath('/live');
}

export async function drawPrize(prizeCode: string, count: number): Promise<PickResult> {
  if (!(await requireAdmin())) return { ok: false, code: 'forbidden' };
  const result = await pickWinners(prizeCode, count);
  revalidatePath('/live/admin');
  return result;
}
