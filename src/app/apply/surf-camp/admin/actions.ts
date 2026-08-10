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
import {
  adminCancel,
  setCapacity,
  setNotes,
  setOpen,
  setOpenAt,
  type Promoted,
} from '@/lib/surfcamp-db';
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

// ── 신청 건별 메모 ────────────────────────────────────────────────────────────

/** 메모 입력 상한. 운영 메모·신청자 안내 모두 같은 값을 쓴다(폼 maxLength 와 일치). */
const NOTE_MAX = 500;

/**
 * 운영 메모 · 신청자 안내 저장.
 *
 * ★ 두 값을 항상 함께 덮어쓴다. 폼이 두 textarea 를 함께 제출하므로
 *   한쪽만 고쳐도 나머지는 화면에 있던 값이 그대로 다시 저장된다.
 * ★ staff_note 는 내부 전용이다. 결과 안내 문구에도 내용을 되풀이하지 않는다.
 */
export async function setNotesAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED };

  const id = ((formData.get('registration_id') as string | null) ?? '').trim();
  if (!id) return { error: '메모를 저장할 신청을 찾지 못했습니다.' };

  const staffNote = ((formData.get('staff_note') as string | null) ?? '').trim();
  const applicantNotice = ((formData.get('applicant_notice') as string | null) ?? '').trim();

  if (staffNote.length > NOTE_MAX || applicantNotice.length > NOTE_MAX) {
    backWithMessage(`메모는 각각 ${NOTE_MAX}자까지 입력할 수 있습니다.`);
  }

  const result = await setNotes(id, staffNote || null, applicantNotice || null).catch(
    (e: unknown) => {
      console.error('[surfcamp] 메모 저장 실패:', e);
      return null;
    },
  );

  if (!result) {
    backWithMessage('메모를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  if (!result.ok) {
    backWithMessage(`메모를 저장하지 못했습니다. (${result.error})`);
  }

  backWithMessage(
    result.applicant_notice
      ? '메모를 저장했습니다. 신청자 안내는 신청 조회 화면에 바로 표시됩니다.'
      : '메모를 저장했습니다. (신청자 안내는 비어 있어 신청자에게 표시되지 않습니다)',
  );
}

// ── 접수 오픈 / 마감 ──────────────────────────────────────────────────────────

export async function setOpenAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED };

  const open = ((formData.get('open') as string | null) ?? '') === 'true';
  const result = await setOpen(open).catch((e: unknown) => {
    console.error('[surfcamp] 접수 오픈/마감 실패:', e);
    return null;
  });

  if (!result) {
    backWithMessage('접수 상태를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  if (!open) {
    backWithMessage('접수를 마감했습니다.');
  }
  // RPC 의 open 은 "실질 오픈"이다. 스위치를 켰는데 false 라면 예약 시각이 아직 안 지난 것.
  // 여기서 분명히 알려주지 않으면 운영자가 열렸다고 착각한다.
  if (!result.open) {
    backWithMessage(
      '접수 스위치를 켰지만 예약 오픈 시각이 아직 지나지 않아 접수는 닫혀 있습니다. 예약 시각이 되면 자동으로 열립니다.',
    );
  }
  backWithMessage('접수를 열었습니다.');
}

// ── 예약 오픈 시각 ────────────────────────────────────────────────────────────

/** ISO(UTC) → '8월 10일(월) 09:00' (안내 문구용) */
const WEEKDAY_KO: Record<string, string> = {
  Sun: '일',
  Mon: '월',
  Tue: '화',
  Wed: '수',
  Thu: '목',
  Fri: '금',
  Sat: '토',
};

function kstLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(d);
  const at = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const wd = WEEKDAY_KO[at('weekday')] ?? at('weekday');
  return `${Number(at('month'))}월 ${Number(at('day'))}일(${wd}) ${at('hour')}:${at('minute')}`;
}

/**
 * datetime-local 입력값(한국시간)을 UTC ISO 로 바꾼다.
 * 브라우저는 'YYYY-MM-DDTHH:mm'(초가 붙기도 한다)을 타임존 없이 보내므로,
 * 서버 타임존(Vercel = UTC)에 좌우되지 않도록 +09:00 을 명시해 해석한다.
 */
function kstLocalToUtcIso(raw: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(raw.trim());
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? '00'}+09:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * 예약 오픈 시각 설정 / 해제.
 * intent=clear 이면 예약을 지우고 수동 스위치만으로 판단하게 되돌린다.
 */
export async function setOpenAtAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED };

  const clear = ((formData.get('intent') as string | null) ?? '') === 'clear';
  let openAtIso: string | null = null;

  if (!clear) {
    const raw = ((formData.get('open_at') as string | null) ?? '').trim();
    if (!raw) {
      backWithMessage('예약 오픈 시각을 입력해 주세요.');
    }
    openAtIso = kstLocalToUtcIso(raw);
    if (!openAtIso) {
      backWithMessage('예약 오픈 시각 형식이 올바르지 않습니다. 날짜와 시간을 다시 확인해 주세요.');
    }
  }

  const result = await setOpenAt(openAtIso).catch((e: unknown) => {
    console.error('[surfcamp] 예약 오픈 시각 설정 실패:', e);
    return null;
  });

  if (!result) {
    backWithMessage('예약 오픈 시각을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  if (!result.ok) {
    backWithMessage(`예약 오픈 시각을 저장하지 못했습니다. (${result.error})`);
  }
  if (!result.open_at) {
    backWithMessage('예약 오픈을 해제했습니다. 이제 오픈/마감 스위치대로만 동작합니다.');
  }
  backWithMessage(
    `${kstLabel(result.open_at)}에 접수가 자동으로 열리도록 예약했습니다. (접수 스위치가 켜져 있어야 합니다)`,
  );
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
