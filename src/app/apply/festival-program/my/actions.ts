'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  cancelRegistration,
  lookupByPhone,
  otpSet,
  otpVerify,
  type FestprogRegistration,
  type Promoted,
  type RpcFailure,
} from '@/lib/festprog-db';
import { generateOtp, hashIp, hashOtp, signSession, verifySession } from '@/lib/festprog-otp';
import { sendCancelSms, sendOtpSms, sendPromotionSms } from '@/lib/festprog-sms';
import { INQUIRY_TEL } from '@/lib/festprog-config';
import { isValidKrMobile, normalizePhone } from '@/lib/festprog-validate';

/**
 * 2026 양양서핑페스티벌 현장 프로그램 — 본인 신청 조회·취소 서버 액션.
 *
 * ★ 수정(update)은 제공하지 않는다. 종목·이름을 바꾸려면 취소 후 재신청이다.
 *   (신청 항목이 4개뿐이라 수정 UI 를 유지하는 비용이 이득보다 크다)
 *
 * 원칙 5가지
 *  1) OTP 발송은 "레이트리밋 RPC 통과 → 그 다음에 SOLAPI" 순서다.
 *     차단된 요청의 문자 비용은 0 이어야 한다.
 *  2) 신청 존재 여부를 절대 노출하지 않는다. 접수 이력이 없는 번호에도 동일하게 응답한다
 *     (번호 열거로 "누가 신청했는지"를 알아낼 수 없어야 한다).
 *  3) 소유권은 TS(lookupByPhone 결과 대조)와 RPC(p_phone 재검사) 양쪽에서 확인한다.
 *  4) 클라이언트 검증은 UX 용일 뿐이다. 여기서 전량 다시 검증한다.
 *  5) 문자 발송은 DB 커밋 이후의 부수효과다. 각각 개별 try/catch 로 삼키되
 *     Vercel serverless 에서 유실되지 않도록 반드시 await 한다
 *     (.catch() fire-and-forget 은 응답 후 실행이 보장되지 않는다).
 */

const MY_PATH = '/apply/festival-program/my';
const COOKIE = 'festprog_my';
/**
 * 쿠키를 이 접수 경로에만 붙인다. 삭제할 때도 반드시 같은 path 를 지정해야 한다
 * (문자열 인자로 delete 하면 path '/' 쿠키를 지우려 해서 실제 세션이 남는다).
 * ★ 서핑캠프('surfcamp_my', '/apply/surf-camp')와 이름·path 가 모두 다르므로 섞이지 않는다.
 */
const COOKIE_PATH = '/apply/festival-program';
/** 본인인증 세션 30분 */
const SESSION_TTL = 1800;
/** 인증번호 유효시간 5분 */
const OTP_TTL = 300;
/** 재발송 쿨다운 (festprog_otp_set 의 p_cooldown_sec 기본값과 맞춘다) */
const RESEND_COOLDOWN = 60;

// ── OTP 게이트 ────────────────────────────────────────────────────────────────

export interface OtpState {
  /** 인증번호가 발송된 적이 있으면 true → 코드 입력 단계를 보여준다 */
  sent: boolean;
  phone?: string;
  message?: string;
  /** 재발송까지 남은 초. 클라이언트가 카운트다운에 쓴다. */
  retryAfter?: number;
  /** 같은 응답이 연속으로 와도 카운트다운을 다시 시작시키기 위한 토큰 */
  nonce?: number;
}

/** 요청 IP 해시. 원본 IP 는 저장하지 않는다(개인정보). */
async function clientIpHash(): Promise<string | null> {
  try {
    const h = await headers();
    const ip = (h.get('x-forwarded-for') ?? '').split(',')[0]?.trim();
    if (!ip) return null;
    return hashIp(ip);
  } catch {
    return null;
  }
}

/** festprog_otp_set 의 error 코드 → 사용자 문구 */
function otpSetMessage(f: RpcFailure): string {
  switch (f.error) {
    case 'cooldown':
      return `인증번호는 ${f.retry_after ?? RESEND_COOLDOWN}초 후에 다시 받을 수 있습니다. 이미 받은 인증번호를 입력해 주세요.`;
    case 'rate_hour':
      return '인증번호 요청이 너무 많습니다. 1시간 후에 다시 시도해 주세요.';
    case 'rate_day':
      return `오늘 인증번호 요청 한도를 초과했습니다. 내일 다시 시도하시거나 사무국(${INQUIRY_TEL})으로 문의해 주세요.`;
    case 'rate_ip':
      return '같은 네트워크에서 요청이 많습니다. 잠시 후 다시 시도해 주세요.';
    case 'rate_global':
      return '지금 인증 요청이 몰리고 있습니다. 잠시 후 다시 시도해 주세요.';
    case 'invalid_phone':
      return '휴대폰 번호를 정확히 입력해 주세요. (예: 010-1234-5678)';
    default:
      return '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  }
}

/**
 * 1단계 — 인증번호 발송.
 *
 * ★ 이 액션은 "해당 번호로 접수된 신청이 있는지"를 조회하지 않는다.
 *   조회해서 분기하면 응답 차이로 신청 여부가 새어 나간다(열거 공격).
 */
export async function requestOtp(prev: OtpState, formData: FormData): Promise<OtpState> {
  const phone = normalizePhone((formData.get('phone') as string | null) ?? '');
  if (!isValidKrMobile(phone)) {
    return {
      ...prev,
      phone,
      message: '휴대폰 번호를 정확히 입력해 주세요. (예: 010-1234-5678)',
    };
  }

  const code = generateOtp();

  // ① 레이트리밋 게이트 + 코드 저장을 먼저 통과시킨다. (차단 시 문자 비용 0)
  let gate;
  try {
    gate = await otpSet(phone, hashOtp(phone, code), OTP_TTL, await clientIpHash());
  } catch (e) {
    console.error('[festprog] otpSet failed:', e);
    return {
      ...prev,
      phone,
      message: '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    };
  }

  if (!gate.ok) {
    return {
      // 쿨다운이면 직전에 보낸 코드가 아직 살아 있으므로 입력 단계를 열어 둔다.
      sent: gate.error === 'cooldown' ? true : prev.sent,
      phone,
      message: otpSetMessage(gate),
      retryAfter: gate.retry_after,
      nonce: Date.now(),
    };
  }

  // ② 게이트를 통과했을 때만 실제 발송
  try {
    await sendOtpSms(phone, code);
  } catch (e) {
    console.error('[festprog] sendOtpSms failed:', e);
    return {
      ...prev,
      phone,
      message: '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    };
  }

  return {
    sent: true,
    phone,
    message: '인증번호를 발송했습니다. 5분 안에 입력해 주세요.',
    retryAfter: RESEND_COOLDOWN,
    nonce: Date.now(),
  };
}

/** festprog_otp_verify 의 error 코드 → 사용자 문구 */
function otpVerifyMessage(f: RpcFailure): string {
  switch (f.error) {
    case 'mismatch':
      return typeof f.attempts_left === 'number'
        ? `인증번호가 올바르지 않습니다. (남은 시도 ${f.attempts_left}회)`
        : '인증번호가 올바르지 않습니다.';
    case 'too_many_attempts':
      return '인증 시도 횟수를 초과했습니다. 인증번호를 다시 받아 주세요.';
    case 'expired':
    case 'not_found':
      return '인증번호가 만료되었습니다. 인증번호를 다시 받아 주세요.';
    default:
      return '인증에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  }
}

/** 2단계 — 인증번호 확인 → 본인인증 세션 쿠키 발급. */
export async function verifyOtp(prev: OtpState, formData: FormData): Promise<OtpState> {
  const phone = normalizePhone((formData.get('phone') as string | null) ?? '');
  const code = ((formData.get('code') as string | null) ?? '').replace(/\D/g, '');

  if (!phone || code.length !== 6) {
    return { ...prev, sent: true, phone, message: '인증번호 6자리를 입력해 주세요.' };
  }

  let result;
  try {
    result = await otpVerify(phone, hashOtp(phone, code));
  } catch (e) {
    console.error('[festprog] otpVerify failed:', e);
    return {
      ...prev,
      sent: true,
      phone,
      message: '인증에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    };
  }

  if (!result.ok) {
    return { ...prev, sent: true, phone, message: otpVerifyMessage(result) };
  }

  const store = await cookies();
  store.set(COOKIE, signSession(result.phone, SESSION_TTL), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: COOKIE_PATH,
    maxAge: SESSION_TTL,
  });

  revalidatePath(MY_PATH);
  // 리디렉트로 새 요청을 태워야 방금 심은 세션 쿠키가 반영된 화면이 뜬다.
  redirect(MY_PATH);
}

/** 로그아웃 — 쿠키 삭제는 반드시 객체 형태로 path 를 함께 지정한다. */
export async function logoutMy(): Promise<void> {
  const store = await cookies();
  store.delete({ name: COOKIE, path: COOKIE_PATH });
  revalidatePath(MY_PATH);
  redirect(MY_PATH);
}

// ── 취소 ──────────────────────────────────────────────────────────────────────

export interface MyFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
}

function fail(message: string): MyFormState {
  return { status: 'error', message };
}

const SESSION_EXPIRED = '본인 인증이 만료되었습니다. 다시 인증해 주세요.';

const ERROR_MESSAGES: Record<string, string> = {
  not_found: '신청 정보를 찾을 수 없습니다. 이미 취소되었을 수 있습니다.',
  forbidden: '해당 신청에 대한 권한이 없습니다.',
  conflict: '동시에 요청이 몰렸습니다. 잠시 후 다시 시도해 주세요.',
};

function messageFor(f: RpcFailure): string {
  return ERROR_MESSAGES[f.error] ?? '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

/** 승급 안내 문자. 한 건이 실패해도 나머지는 계속 발송한다. */
async function notifyPromoted(promoted: Promoted[] | undefined): Promise<void> {
  for (const p of promoted ?? []) {
    try {
      await sendPromotionSms({ phone: p.phone, name: p.name, program: p.program });
    } catch (e) {
      console.error('[festprog] 승급 문자 발송 실패:', p.registration_id, e);
    }
  }
}

type Authorized =
  | { ok: false; message: string }
  | { ok: true; phone: string; target: FestprogRegistration };

/**
 * 소유권 확인 1차 — 인증 세션의 번호로 조회한 신청 목록에 그 registration_id 가 있는지 본다.
 * (2차는 RPC 다. cancelRegistration 에 phone 을 넘기면 festprog_cancel 이 저장된 번호와 대조한다.)
 */
async function authorize(registrationId: string): Promise<Authorized> {
  const store = await cookies();
  const phone = verifySession(store.get(COOKIE)?.value);
  if (!phone) return { ok: false, message: SESSION_EXPIRED };
  if (!registrationId) return { ok: false, message: '신청 정보를 찾을 수 없습니다.' };

  let regs: FestprogRegistration[];
  try {
    regs = await lookupByPhone(phone);
  } catch (e) {
    console.error('[festprog] lookupByPhone failed:', e);
    return {
      ok: false,
      message: '신청 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    };
  }

  const target = regs.find((r) => r.id === registrationId);
  if (!target) {
    return { ok: false, message: '신청 정보를 찾을 수 없습니다. 이미 취소되었을 수 있습니다.' };
  }
  return { ok: true, phone, target };
}

/** 본인 신청 취소. */
export async function cancelMyRegistration(
  _prev: MyFormState,
  formData: FormData,
): Promise<MyFormState> {
  const registrationId = ((formData.get('registration_id') as string | null) ?? '').trim();

  // 실수 방지 — 클라이언트 required 만 믿지 않는다.
  if (formData.get('confirm') == null) {
    return fail('취소를 진행하시려면 확인란에 체크해 주세요.');
  }

  const auth = await authorize(registrationId);
  if (!auth.ok) return fail(auth.message);
  const { phone, target } = auth;

  // 본인 취소는 사유를 받지 않는다(마찰만 늘고 운영에 쓰이지 않음).
  let result;
  try {
    result = await cancelRegistration(registrationId, phone, null);
  } catch (e) {
    console.error('[festprog] cancelRegistration failed:', e);
    return fail('취소 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  }
  if (!result.ok) return fail(messageFor(result));

  revalidatePath(MY_PATH);

  if (!result.cancelled) {
    return { status: 'success', message: '이미 취소된 신청입니다.' };
  }

  try {
    await sendCancelSms({
      phone: result.phone ?? phone,
      name: result.name ?? target.name,
      program: result.program ?? target.program,
      byAdmin: false,
      reason: null,
    });
  } catch (e) {
    console.error('[festprog] cancel SMS failed:', e);
  }

  await notifyPromoted(result.promoted);

  return {
    status: 'success',
    message: '신청이 취소되었습니다. 접수 기간 중에는 같은 번호로 다시 신청할 수 있습니다.',
  };
}
