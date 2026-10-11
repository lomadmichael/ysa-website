'use server';

import { createHmac } from 'crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cancelEduApplication, otpSet, otpVerify, type RpcFailure } from '@/lib/edu-db';
import { generateOtp, hashOtp, signSession, verifySession } from '@/lib/edu-otp';
import { sendEduOtpSms } from '@/lib/edu-sms';

/**
 * 심판·강사교육 — 본인 신청 조회·취소 서버 액션.
 * (서핑캠프 /apply/surf-camp/my/actions.ts 의 OTP 게이트를 그대로 따른다)
 *
 *  1) OTP 발송은 "레이트리밋 RPC 통과 → 그 다음에 SOLAPI" 순서. 차단된 요청의 문자 비용은 0.
 *  2) 신청 존재 여부를 노출하지 않는다. 접수 이력이 없는 번호에도 동일하게 응답한다.
 *  3) 취소는 세션 쿠키의 번호로만 한다(폼에서 번호를 받지 않음). cert-manager 가
 *     applicant_phone 대조를 한 번 더 하고, 불일치면 404 로 존재 여부를 숨긴다.
 */

const MY_PATH = '/apply/education/my';
const COOKIE = 'edu_my';
/** 쿠키를 이 경로에만 붙인다. 삭제할 때도 같은 path 를 지정해야 한다. */
const COOKIE_PATH = '/apply/education';
/** 본인인증 세션 30분 */
const SESSION_TTL = 1800;
/** 인증번호 유효시간 5분 */
const OTP_TTL = 300;
/** 재발송 쿨다운 (edu_otp_set 의 p_cooldown_sec 기본값과 맞춘다) */
const RESEND_COOLDOWN = 60;
const INQUIRY_TEL = '033-671-6155';

function normalizePhone(raw: string): string {
  return (raw ?? '').replace(/\D/g, '');
}
function isValidKrMobile(raw: string): boolean {
  return /^01[016789][0-9]{7,8}$/.test(normalizePhone(raw));
}

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

/** 요청 IP 해시. 원본 IP 는 저장하지 않는다. (서핑캠프와 같은 솔트 env 재사용) */
async function clientIpHash(): Promise<string | null> {
  try {
    const h = await headers();
    const ip = (h.get('x-forwarded-for') ?? '').split(',')[0]?.trim();
    if (!ip) return null;
    return createHmac('sha256', process.env.SURFCAMP_IP_SALT ?? '')
      .update(`edu:${ip}`)
      .digest('hex');
  } catch {
    return null;
  }
}

function otpSetMessage(f: RpcFailure): string {
  switch (f.error) {
    case 'cooldown':
      return `인증번호는 ${f.retry_after ?? RESEND_COOLDOWN}초 후에 다시 받을 수 있습니다. 이미 받은 인증번호를 입력해 주세요.`;
    case 'rate_hour':
      return '인증번호 요청이 너무 많습니다. 1시간 후에 다시 시도해 주세요.';
    case 'rate_day':
      return `오늘 인증번호 요청 한도를 초과했습니다. 내일 다시 시도하시거나 협회(${INQUIRY_TEL})로 문의해 주세요.`;
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
 * ★ 신청 존재 여부를 조회하지 않는다(응답 차이로 신청 여부가 새지 않게).
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

  // ① 레이트리밋 게이트 + 코드 저장 먼저 (차단 시 문자 비용 0)
  let gate;
  try {
    gate = await otpSet(phone, hashOtp(phone, code), OTP_TTL, await clientIpHash());
  } catch (e) {
    console.error('[edu-my] otpSet failed:', e);
    return {
      ...prev,
      phone,
      message: '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    };
  }

  if (!gate.ok) {
    return {
      sent: gate.error === 'cooldown' ? true : prev.sent,
      phone,
      message: otpSetMessage(gate),
      retryAfter: gate.retry_after,
      nonce: Date.now(),
    };
  }

  // ② 게이트를 통과했을 때만 실제 발송
  try {
    await sendEduOtpSms(phone, code);
  } catch (e) {
    console.error('[edu-my] sendEduOtpSms failed:', e);
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
    console.error('[edu-my] otpVerify failed:', e);
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
  redirect(MY_PATH);
}

/** 로그아웃 — 쿠키 삭제는 반드시 객체 형태로 path 를 함께 지정한다. */
export async function logoutEduMy(): Promise<void> {
  const store = await cookies();
  store.delete({ name: COOKIE, path: COOKIE_PATH });
  revalidatePath(MY_PATH);
  redirect(MY_PATH);
}

// ── 취소 ──────────────────────────────────────────────────────────────────────

export interface CancelState {
  status: 'idle' | 'error' | 'success';
  message?: string;
}

/** 신청 취소. 번호는 폼이 아니라 세션 쿠키에서만 가져온다. */
export async function cancelEduMy(_prev: CancelState, formData: FormData): Promise<CancelState> {
  const store = await cookies();
  const phone = verifySession(store.get(COOKIE)?.value);
  if (!phone) {
    return { status: 'error', message: '본인 인증이 만료되었습니다. 다시 인증해 주세요.' };
  }

  const id = String(formData.get('applicationId') ?? '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { status: 'error', message: '신청 정보를 찾을 수 없습니다. 화면을 새로고침해 주세요.' };
  }

  let result;
  try {
    result = await cancelEduApplication(id, phone);
  } catch (e) {
    console.error('[edu-my] cancel failed:', e);
    return {
      status: 'error',
      message: `취소 처리에 실패했습니다. 잠시 후 다시 시도하시거나 협회(${INQUIRY_TEL})로 문의해 주세요.`,
    };
  }

  if (!result.ok) {
    const message =
      result.status === 404
        ? '신청 정보를 찾을 수 없습니다. 화면을 새로고침해 주세요.'
        : result.status === 400 && result.error
          ? result.error
          : `취소 처리에 실패했습니다. 잠시 후 다시 시도하시거나 협회(${INQUIRY_TEL})로 문의해 주세요.`;
    return { status: 'error', message };
  }

  revalidatePath(MY_PATH);
  return { status: 'success', message: '신청이 취소되었습니다.' };
}
