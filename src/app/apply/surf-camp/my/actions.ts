'use server';

import { createHmac } from 'crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  cancelRegistration,
  lookupByPhone,
  otpSet,
  otpVerify,
  updateRegistration,
  type ProgramOutcome,
  type Promoted,
  type RpcFailure,
  type SurfcampRegistration,
  type UpdateSuccess,
} from '@/lib/surfcamp-db';
import { generateOtp, hashOtp, signSession, verifySession } from '@/lib/surfcamp-otp';
import {
  sendCancelSms,
  sendOtpSms,
  sendPromotionSms,
  sendUpdateSms,
} from '@/lib/surfcamp-sms';
import { INQUIRY_TEL } from '@/lib/surfcamp-config';
import {
  LESSON_MIN_AGE,
  LESSON_MIN_HEIGHT,
  MAX_PARTICIPANTS,
  isValidKrMobile,
  normalizePhone,
  validateRegistration,
  type ParticipantInput,
  type ProgramKey,
  type RegistrationInput,
} from '@/lib/surfcamp-validate';

/**
 * 2026 양양 서핑캠프 — 본인 신청 조회·수정·취소 서버 액션.
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

const MY_PATH = '/apply/surf-camp/my';
const COOKIE = 'surfcamp_my';
/**
 * 쿠키를 접수 경로에만 붙인다. 삭제할 때도 반드시 같은 path 를 지정해야 한다
 * (문자열 인자로 delete 하면 path '/' 쿠키를 지우려 해서 실제 세션이 남는다).
 */
const COOKIE_PATH = '/apply/surf-camp';
/** 본인인증 세션 30분 */
const SESSION_TTL = 1800;
/** 인증번호 유효시간 5분 */
const OTP_TTL = 300;
/** 재발송 쿨다운 (surfcamp_otp_set 의 p_cooldown_sec 기본값과 맞춘다) */
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

/**
 * 요청 IP 해시. 원본 IP 는 저장하지 않는다(개인정보).
 * SURFCAMP_IP_SALT 가 없으면 빈 키로 HMAC 하지만, 그래도 원문은 남지 않는다.
 */
async function clientIpHash(): Promise<string | null> {
  try {
    const h = await headers();
    const ip = (h.get('x-forwarded-for') ?? '').split(',')[0]?.trim();
    if (!ip) return null;
    return createHmac('sha256', process.env.SURFCAMP_IP_SALT ?? '')
      .update(ip)
      .digest('hex');
  } catch {
    return null;
  }
}

/** surfcamp_otp_set 의 error 코드 → 사용자 문구 */
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
 *   접수 이력이 없는 번호에도 똑같이 문자를 보내고 똑같은 문구로 응답한다.
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
    console.error('[surfcamp] otpSet failed:', e);
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
    console.error('[surfcamp] sendOtpSms failed:', e);
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

/** surfcamp_otp_verify 의 error 코드 → 사용자 문구 */
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
    console.error('[surfcamp] otpVerify failed:', e);
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

// ── 수정 / 취소 ───────────────────────────────────────────────────────────────

export interface MyFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
}

function fail(message: string): MyFormState {
  return { status: 'error', message };
}

const SESSION_EXPIRED = '본인 인증이 만료되었습니다. 다시 인증해 주세요.';

/** surfcamp_update / surfcamp_cancel 의 error 코드 → 사용자 문구 */
const ERROR_MESSAGES: Record<string, string> = {
  closed: `접수가 마감되어 신청 내용을 수정할 수 없습니다. 취소는 계속 가능하며, 변경이 필요하시면 사무국(${INQUIRY_TEL})으로 문의해 주세요.`,
  // 프로그램별 신규접수 게이트 — "새로 추가하는 인원·프로그램"에만 걸린다.
  // 기존 확정·대기는 그대로 유지되며, 취소 시 자동 확정도 계속 동작한다.
  lesson_closed:
    '서핑강습은 신규 접수가 마감되어 인원이나 프로그램을 새로 추가하실 수 없습니다. 기존 신청 내역은 그대로 유지됩니다.',
  special_closed:
    '서핑 특화 체험은 신규 접수가 마감되어 인원이나 프로그램을 새로 추가하실 수 없습니다. 기존 신청 내역은 그대로 유지됩니다.',
  lesson_full:
    '서핑강습은 접수 상한에 도달해 인원을 더 추가하실 수 없습니다. 기존 신청 내역은 그대로 유지됩니다.',
  special_full:
    '서핑 특화 체험은 접수 상한에 도달해 인원을 더 추가하실 수 없습니다. 기존 신청 내역은 그대로 유지됩니다.',
  all_programs_closed:
    '추가하시려는 프로그램이 모두 신규 접수 마감되었습니다. 기존 신청 내역은 그대로 유지되며, 인원 추가 없이 다른 정보만 수정하시는 것은 가능합니다.',
  not_found: '신청 정보를 찾을 수 없습니다. 이미 취소되었을 수 있습니다.',
  forbidden: '해당 신청에 대한 권한이 없습니다.',
  unknown_participant:
    '참가자 정보가 변경되어 저장하지 못했습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.',
  empty_registration:
    '모든 프로그램을 해제할 수는 없습니다. 참가하지 않으시려면 아래 신청 취소를 이용해 주세요.',
  invalid_participants: `참가자는 1명 이상 ${MAX_PARTICIPANTS}명 이하로 신청해 주세요.`,
  invalid_rep_name: '대표 신청자 성명을 입력해 주세요.',
  invalid_address: '주소를 입력해 주세요.',
  invalid_resident_type: '양양군민 / 양양 생활인구 중 하나를 선택해 주세요.',
  invalid_region: '희망 강습권역을 선택해 주세요.',
  invalid_lesson_time: '희망 강습시간을 선택해 주세요.',
  invalid_participant_name: '참가자 성명을 모두 입력해 주세요.',
  invalid_gender: '성별을 선택해 주세요.',
  invalid_age: '나이를 1~100 사이로 입력해 주세요.',
  invalid_height: '신장을 80~230cm 사이로 입력해 주세요.',
  invalid_weight: '몸무게를 10~200kg 사이로 입력해 주세요.',
  invalid_surf_exp: '서핑 경험을 선택해 주세요.',
  no_program: '참가할 프로그램을 1개 이상 선택해 주세요.',
  invalid_program: '선택할 수 없는 프로그램입니다.',
  ineligible_lesson: `서핑강습은 만 ${LESSON_MIN_AGE}세 이상, 신장 ${LESSON_MIN_HEIGHT}cm 이상만 신청할 수 있습니다. 기준에 미치지 않는 분은 서핑 특화 체험에 참여해 주세요.`,
  conflict: '동시에 접수가 몰렸습니다. 잠시 후 다시 시도해 주세요.',
};

function messageFor(f: RpcFailure): string {
  let base =
    ERROR_MESSAGES[f.error] ?? '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  // 나이·신장 둘 다 자격 요소이므로 둘 다 보여준다.
  if (f.error === 'ineligible_lesson' && f.age != null && f.height_cm != null) {
    base = `${base} (현재 만 ${f.age}세 · ${f.height_cm}cm)`;
  }
  return f.name ? `${f.name} : ${base}` : base;
}

/** 참가자 JSON 한 건 정규화. 기존 참가자의 id 는 반드시 살려서 넘긴다(확정 좌석 유지). */
function toParticipant(raw: unknown): ParticipantInput {
  const o = (raw ?? {}) as Record<string, unknown>;
  const id = typeof o.id === 'string' && o.id.trim() !== '' ? o.id.trim() : null;
  return {
    id,
    name: String(o.name ?? '').trim(),
    gender: String(o.gender ?? ''),
    age: Number(o.age),
    height_cm: Number(o.height_cm),
    weight_kg: Number(o.weight_kg),
    surf_exp: String(o.surf_exp ?? ''),
    programs: Array.isArray(o.programs) ? o.programs.map((p) => String(p)) : [],
  };
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
async function notifyPromoted(promoted: Promoted[] | undefined): Promise<void> {
  for (const g of groupPromoted(promoted)) {
    try {
      await sendPromotionSms({ phone: g.phone, repName: g.repName, programs: g.programs });
    } catch (e) {
      console.error('[surfcamp] 승급 문자 발송 실패:', e);
    }
  }
}

/**
 * 수정 후 상태 → 안내 문자용 ProgramOutcome.
 *
 * 문자 템플릿은 프로그램마다 상태를 1개만 실을 수 있는데, 한 신청서 안에서
 * 일부는 확정 · 일부는 대기일 수 있다(확정 가족이 인원을 추가한 경우).
 * 그때는 "대기 N명"을 싣는다 — 확정을 대기로 잘못 알리는 것보다
 * 확정분을 생략하는 쪽이 안전하다(정확한 내역은 조회 화면에서 확인).
 */
function outcomeOf(
  current: UpdateSuccess['current'],
  program: ProgramKey,
): ProgramOutcome | null {
  const c = current?.[program];
  if (!c) return null;
  if (c.waitlist > 0) return { count: c.waitlist, status: 'waitlist' };
  if (c.confirmed > 0) return { count: c.confirmed, status: 'confirmed' };
  return null;
}

type Authorized =
  | { ok: false; message: string }
  | { ok: true; phone: string; target: SurfcampRegistration };

/**
 * 소유권 확인 1차 — 인증 세션의 번호로 조회한 신청 목록에 그 registration_id 가 있는지 본다.
 * (2차는 RPC 다. updateRegistration / cancelRegistration 에 phone 을 넘기면
 *  surfcamp_update / surfcamp_cancel 이 저장된 번호와 다시 대조한다.)
 */
async function authorize(registrationId: string): Promise<Authorized> {
  const store = await cookies();
  const phone = verifySession(store.get(COOKIE)?.value);
  if (!phone) return { ok: false, message: SESSION_EXPIRED };
  if (!registrationId) return { ok: false, message: '신청 정보를 찾을 수 없습니다.' };

  let regs: SurfcampRegistration[];
  try {
    regs = await lookupByPhone(phone);
  } catch (e) {
    console.error('[surfcamp] lookupByPhone failed:', e);
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

/** 본인 신청 수정. */
export async function updateMyRegistration(
  _prev: MyFormState,
  formData: FormData,
): Promise<MyFormState> {
  const text = (key: string) => (formData.get(key) as string | null)?.trim() ?? '';
  const registrationId = text('registration_id');

  // ── 1) 인증 + 소유권 (TS 측) ───────────────────────────────────────────────
  const auth = await authorize(registrationId);
  if (!auth.ok) return fail(auth.message);
  const { phone, target } = auth;

  // ── 2) 참가자 파싱 ────────────────────────────────────────────────────────
  let parsed: unknown;
  try {
    parsed = JSON.parse(text('participants_json') || '[]');
  } catch {
    return fail('참가자 정보를 다시 입력해 주세요.');
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return fail('참가자를 1명 이상 등록해 주세요.');
  }
  const participants = parsed.map(toParticipant);

  // 넘어온 기존 참가자 id 가 정말 이 신청서의 것인지 확인 (RPC 도 다시 검사한다)
  const ownIds = new Set(target.participants.map((p) => p.id));
  if (participants.some((p) => p.id && !ownIds.has(p.id))) {
    return fail('참가자 정보가 변경되었습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.');
  }

  const input: RegistrationInput = {
    rep_name: text('rep_name'),
    // 휴대폰 번호는 중복 방지 키라 수정 대상이 아니다. 인증된 번호를 그대로 쓴다.
    phone,
    address: text('address'),
    address_detail: text('address_detail'),
    resident_type: text('resident_type'),
    region: text('region'),
    lesson_time: text('lesson_time'),
    // 필수 동의는 최초 접수 때 이미 받았다. 수정 화면에서 다시 요구하지 않는다.
    consent_privacy: true,
    consent_media: formData.get('consent_media') != null,
    // 비고는 수정 대상이 아니지만, 보내지 않으면 RPC 가 NULL 로 덮는다 → 원본을 그대로 실어 보낸다.
    note: text('note'),
    participants,
  };

  // ── 3) 서버 전량 재검증 ───────────────────────────────────────────────────
  const invalid = validateRegistration(input);
  if (invalid) return fail(invalid);

  // ── 4) 수정 (RPC 가 phone 으로 소유권을 다시 검사한다) ─────────────────────
  let result;
  try {
    result = await updateRegistration(registrationId, phone, input);
  } catch (e) {
    console.error('[surfcamp] updateRegistration failed:', e);
    return fail('수정 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  }
  if (!result.ok) return fail(messageFor(result));

  revalidatePath(MY_PATH);

  // ── 5) 부수효과: 안내 문자 (실패해도 수정은 이미 확정이다) ─────────────────
  try {
    await sendUpdateSms({
      phone,
      repName: input.rep_name,
      lesson: outcomeOf(result.current, 'lesson'),
      special: outcomeOf(result.current, 'special'),
      lessonTime: input.lesson_time,
    });
  } catch (e) {
    console.error('[surfcamp] update SMS failed:', e);
  }

  // 이번 수정으로 좌석이 반납되어 확정된 다른 신청들
  await notifyPromoted(result.promoted);

  const waiting =
    (result.current?.lesson?.waitlist ?? 0) + (result.current?.special?.waitlist ?? 0);
  return {
    status: 'success',
    message:
      waiting > 0
        ? `신청 내용을 수정했습니다. 대기 ${waiting}명은 자리가 나는 대로 순서대로 확정되며, 확정 시 문자로 안내드립니다.`
        : '신청 내용을 수정했습니다.',
  };
}

/** 본인 신청 취소. */
export async function cancelMyRegistration(
  _prev: MyFormState,
  formData: FormData,
): Promise<MyFormState> {
  const text = (key: string) => (formData.get(key) as string | null)?.trim() ?? '';
  const registrationId = text('registration_id');

  // 실수 방지 — 클라이언트 required 만 믿지 않는다.
  if (formData.get('confirm') == null) {
    return fail('취소를 진행하시려면 확인란에 체크해 주세요.');
  }

  const auth = await authorize(registrationId);
  if (!auth.ok) return fail(auth.message);
  const { phone, target } = auth;

  // 본인 취소는 사유를 받지 않는다(마찰만 늘고 운영에 쓰이지 않음).
  // 관리자 강제취소는 통보 문자에 사유가 필요하므로 그대로 받는다.
  let result;
  try {
    result = await cancelRegistration(registrationId, phone, null);
  } catch (e) {
    console.error('[surfcamp] cancelRegistration failed:', e);
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
      repName: result.rep_name ?? target.rep_name,
      byAdmin: false,
      reason: null,
    });
  } catch (e) {
    console.error('[surfcamp] cancel SMS failed:', e);
  }

  await notifyPromoted(result.promoted);

  return {
    status: 'success',
    message: '신청이 취소되었습니다. 접수 기간 중에는 같은 번호로 다시 신청할 수 있습니다.',
  };
}
