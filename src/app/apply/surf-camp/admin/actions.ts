'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_PATH,
  ADMIN_TTL,
  checkPassword,
  makeToken,
  verifyAdmin,
} from './auth';
import { adminCancel, setCapacity, setOpen, type Promoted } from '@/lib/surfcamp-db';
import { sendCancelSms, sendPromotionSms } from '@/lib/surfcamp-sms';
import type { ProgramKey } from '@/lib/surfcamp-validate';

/**
 * 서핑캠프 관리자 서버 액션.
 *
 * 규칙 1: 로그인을 제외한 모든 액션은 맨 앞에서 세션을 다시 검증한다.
 *         (페이지 렌더 시점의 인증만 믿으면, 만료 후에도 열려 있던 탭에서 조작이 가능해진다.)
 * 규칙 2: 문자 발송은 DB 커밋 이후의 부수효과다. 발송이 실패해도 취소/정원 변경은 되돌리지 않는다.
 *         단 Vercel 서버리스에서는 응답 후 실행이 보장되지 않으므로 반드시 await 한다.
 */

const ADMIN_PATH = ADMIN_COOKIE_PATH;

export interface AdminLoginState {
  error?: string;
}

export interface AdminActionState {
  error?: string;
}

const SESSION_EXPIRED = '세션이 만료되었습니다. 다시 로그인해 주세요.';

async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyAdmin(store.get(ADMIN_COOKIE)?.value);
}

/** 관리자 화면으로 되돌아가며 결과 메시지를 한 번 보여준다. */
function backWithMessage(message: string): never {
  revalidatePath(ADMIN_PATH);
  redirect(`${ADMIN_PATH}?m=${encodeURIComponent(message)}`);
}

/**
 * 승급 대상은 신청서 단위로 묶는다.
 * RPC 는 (신청서 × 프로그램) 단위로 돌려주므로, 묶지 않으면 강습·특화가 동시에 승급된
 * 신청자에게 문자가 2통 간다.
 */
function groupPromoted(promoted: Promoted[] | undefined) {
  const map = new Map<
    string,
    { phone: string; repName: string; programs: { program: ProgramKey; count: number }[] }
  >();
  for (const p of promoted ?? []) {
    const found = map.get(p.registration_id);
    if (found) {
      found.programs.push({ program: p.program, count: p.count });
    } else {
      map.set(p.registration_id, {
        phone: p.phone,
        repName: p.rep_name,
        programs: [{ program: p.program, count: p.count }],
      });
    }
  }
  return Array.from(map.values());
}

/** 승급 안내 문자. 한 건이 실패해도 나머지는 계속 발송한다. */
async function notifyPromoted(promoted: Promoted[] | undefined): Promise<number> {
  const groups = groupPromoted(promoted);
  for (const g of groups) {
    try {
      await sendPromotionSms({ phone: g.phone, repName: g.repName, programs: g.programs });
    } catch (e) {
      console.error('[surfcamp] 승급 문자 발송 실패:', e);
    }
  }
  return groups.length;
}

// ── 로그인 / 로그아웃 ─────────────────────────────────────────────────────────

export async function adminLogin(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const pw = (formData.get('password') as string | null) ?? '';
  if (!checkPassword(pw)) {
    return { error: '비밀번호가 올바르지 않습니다.' };
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE, makeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: ADMIN_COOKIE_PATH,
    maxAge: ADMIN_TTL,
  });
  revalidatePath(ADMIN_PATH);
  // 리디렉트로 새 요청을 태워야 방금 심은 세션 쿠키가 확실히 반영된 화면이 뜬다.
  redirect(ADMIN_PATH);
}

export async function adminLogout(): Promise<void> {
  const store = await cookies();
  // ★ 문자열 인자로 지우면 path '/' 쿠키를 지우려 해서 실제 세션 쿠키가 남는다.
  store.delete({ name: ADMIN_COOKIE, path: ADMIN_COOKIE_PATH });
  revalidatePath(ADMIN_PATH);
  redirect(ADMIN_PATH);
}

// ── 강제취소 ──────────────────────────────────────────────────────────────────

export async function adminForceCancel(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED };

  const id = ((formData.get('registration_id') as string | null) ?? '').trim();
  const reason = ((formData.get('reason') as string | null) ?? '').trim();
  if (!id) return { error: '취소할 신청을 찾지 못했습니다.' };

  const result = await adminCancel(id, reason || null).catch((e: unknown) => {
    console.error('[surfcamp] 강제취소 실패:', e);
    return null;
  });

  if (!result) {
    backWithMessage('취소 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  }
  if (!result.ok) {
    backWithMessage(`취소하지 못했습니다. (${result.error})`);
  }
  if (!result.cancelled) {
    backWithMessage('이미 취소된 신청입니다.');
  }

  // 취소 당사자 안내
  if (result.phone && result.rep_name) {
    try {
      await sendCancelSms({
        phone: result.phone,
        repName: result.rep_name,
        byAdmin: true,
        reason: reason || null,
      });
    } catch (e) {
      console.error('[surfcamp] 취소 문자 발송 실패:', e);
    }
  }

  const promotedCount = await notifyPromoted(result.promoted);
  backWithMessage(
    promotedCount > 0
      ? `취소 처리했습니다. 대기 ${promotedCount}건이 확정으로 승급되어 안내 문자를 보냈습니다.`
      : '취소 처리했습니다.',
  );
}

// ── 접수 오픈 / 마감 ──────────────────────────────────────────────────────────

export async function setOpenAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED };

  const open = ((formData.get('open') as string | null) ?? '') === 'true';
  const ok = await setOpen(open).then(
    () => true,
    (e: unknown) => {
      console.error('[surfcamp] 접수 오픈/마감 실패:', e);
      return false;
    },
  );
  if (!ok) {
    backWithMessage('접수 상태를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  backWithMessage(open ? '접수를 열었습니다.' : '접수를 마감했습니다.');
}

// ── 정원 변경 ─────────────────────────────────────────────────────────────────

const MAX_CAPACITY = 9999;

function parseCapacity(value: FormDataEntryValue | null): number | null {
  const n = Number(String(value ?? '').trim());
  if (!Number.isFinite(n) || n < 0 || n > MAX_CAPACITY) return null;
  return Math.floor(n);
}

export async function setCapacityAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED };

  const lesson = parseCapacity(formData.get('lesson'));
  const special = parseCapacity(formData.get('special'));
  if (lesson === null || special === null) {
    backWithMessage(`정원은 0 ~ ${MAX_CAPACITY} 사이의 숫자로 입력해 주세요.`);
  }

  const result = await setCapacity(lesson, special).catch((e: unknown) => {
    console.error('[surfcamp] 정원 변경 실패:', e);
    return null;
  });

  if (!result) {
    backWithMessage('정원을 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  if (!result.ok) {
    backWithMessage(`정원을 바꾸지 못했습니다. (${result.error})`);
  }

  // 증설이면 대기열이 자동 승급된다. 승급된 신청자에게 확정 안내를 보낸다.
  const promotedCount = await notifyPromoted(result.promoted);
  backWithMessage(
    promotedCount > 0
      ? `정원을 강습 ${result.lesson}명 · 특화 ${result.special}명으로 변경했습니다. 대기 ${promotedCount}건이 확정으로 승급되어 안내 문자를 보냈습니다.`
      : `정원을 강습 ${result.lesson}명 · 특화 ${result.special}명으로 변경했습니다.`,
  );
}
