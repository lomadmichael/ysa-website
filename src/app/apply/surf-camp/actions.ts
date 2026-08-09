'use server';

import { KILL_SWITCH } from '@/lib/surfcamp-config';
import {
  LESSON_MIN_AGE,
  MAX_PARTICIPANTS,
  validateRegistration,
  normalizePhone,
  type ParticipantInput,
  type RegistrationInput,
} from '@/lib/surfcamp-validate';
import {
  submitRegistration,
  type RpcFailure,
  type SubmitSuccess,
} from '@/lib/surfcamp-db';
import { sendApplicationSms, sendPromotionSms } from '@/lib/surfcamp-sms';
import { notifyAdmin } from '@/lib/surfcamp-admin-notify';

/**
 * 2026 양양 서핑캠프 공개 접수 서버 액션.
 *
 * 원칙 3가지
 *  1) 클라이언트 검증은 UX 용일 뿐이다. 여기서 전량 다시 검증한다.
 *  2) 문자 발송은 접수 성공 뒤의 부수효과다. 실패해도 접수를 뒤집지 않는다
 *     (각각 개별 try/catch. Vercel serverless 에서 유실되지 않도록 반드시 await).
 *  3) RPC 가 돌려주는 기계용 error 코드는 반드시 한국어 문장으로 바꿔서 내보낸다.
 */

export interface SurfCampFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  result?: SubmitSuccess;
}

// ★ 'use server' 파일은 async 함수 외의 값을 export 할 수 없다.
//   초기 state 상수는 폼 컴포넌트 쪽에 둔다.

function fail(message: string): SurfCampFormState {
  return { status: 'error', message };
}

/** RPC error 코드 → 사용자 문구 */
const ERROR_MESSAGES: Record<string, string> = {
  closed: '접수가 마감되었습니다.',
  duplicate_phone:
    '이미 해당 번호로 접수된 신청이 있습니다. 수정·취소는 본인 인증 후 가능합니다.',
  consent_required:
    '개인정보 수집·이용 및 제3자 제공, 초상권 활용 동의가 필요합니다.',
  invalid_participants: `참가자는 1명 이상 ${MAX_PARTICIPANTS}명 이하로 신청해 주세요.`,
  invalid_phone: '휴대폰 번호를 정확히 입력해 주세요. (예: 010-1234-5678)',
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
  ineligible_lesson: `서핑강습은 만 ${LESSON_MIN_AGE}세 이상만 신청할 수 있습니다. 만 ${LESSON_MIN_AGE}세 미만은 특화체험에 참여해 주세요.`,
  conflict: '동시에 접수가 몰렸습니다. 잠시 후 다시 시도해 주세요.',
  not_found: '신청 정보를 찾을 수 없습니다.',
  forbidden: '해당 신청에 대한 권한이 없습니다.',
};

function messageFor(f: RpcFailure): string {
  let base =
    ERROR_MESSAGES[f.error] ??
    '접수 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

  // 자격 미달은 어느 참가자인지 + 현재 값까지 보여줘야 스스로 고칠 수 있다.
  // 신장은 더 이상 자격 요소가 아니므로(장비 준비용) 나이만 보여준다.
  if (f.error === 'ineligible_lesson' && f.age != null) {
    base = `${base} (현재 만 ${f.age}세)`;
  }
  return f.name ? `${f.name} : ${base}` : base;
}

/** 참가자 JSON 한 건을 검증 가능한 형태로 정규화. 값 판정은 전부 validate 쪽에 맡긴다. */
function toParticipant(raw: unknown): ParticipantInput {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    // 신규 접수에서는 클라이언트가 보낸 id 를 신뢰하지 않고 버린다.
    name: String(o.name ?? '').trim(),
    gender: String(o.gender ?? ''),
    age: Number(o.age),
    height_cm: Number(o.height_cm),
    weight_kg: Number(o.weight_kg),
    surf_exp: String(o.surf_exp ?? ''),
    programs: Array.isArray(o.programs) ? o.programs.map((p) => String(p)) : [],
  };
}

export async function submitSurfCamp(
  _prev: SurfCampFormState,
  formData: FormData,
): Promise<SurfCampFormState> {
  if (KILL_SWITCH) {
    return fail('현재 접수가 일시 중단되었습니다. 잠시 후 다시 시도해 주세요.');
  }

  const text = (key: string) => (formData.get(key) as string | null)?.trim() ?? '';
  const checked = (key: string) => formData.get(key) != null;

  // 필수 동의 3종. 초상권은 별도 항목이 아니라 개인정보 동의문 안에 통합돼 있다.
  const consentPrivacy = checked('consent_privacy');
  const consentWeather = checked('consent_weather');
  const consentAssignment = checked('consent_assignment');

  // ── 1) 참가자 JSON 파싱 ────────────────────────────────────────────────────
  let parsed: unknown;
  try {
    parsed = JSON.parse(text('participants_json') || '[]');
  } catch {
    return fail('참가자 정보를 다시 입력해 주세요.');
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return fail('참가자를 1명 이상 등록해 주세요.');
  }

  const input: RegistrationInput = {
    rep_name: text('rep_name'),
    phone: normalizePhone(text('phone')),
    address: text('address'),
    address_detail: text('address_detail'),
    resident_type: text('resident_type'),
    region: text('region'),
    lesson_time: text('lesson_time'),
    consent_privacy: consentPrivacy,
    // 기상·안전수칙 / 스쿨 배정 은 DB 컬럼이 따로 없다.
    // 둘 다 true 일 때만 consent_notice=true 로 접어서 저장한다.
    consent_notice: consentWeather && consentAssignment,
    // 초상권 동의는 개인정보 동의문에 통합됐다 → 개인정보 동의값을 그대로 쓴다.
    consent_media: consentPrivacy,
    participants: parsed.map(toParticipant),
  };

  // ── 2) 서버 재검증 (클라이언트 검증을 믿지 않는다) ──────────────────────────
  const invalid = validateRegistration(input);
  if (invalid) return fail(invalid);

  // ── 3) 필수 동의 3종 ───────────────────────────────────────────────────────
  if (!consentPrivacy) {
    return fail('개인정보 수집·이용 및 제3자 제공, 초상권 활용에 동의해 주세요.');
  }
  if (!consentWeather) {
    return fail('안전 및 기상상황 확인, 안전수칙 준수에 동의해 주세요.');
  }
  if (!consentAssignment) return fail('스쿨 배정 확인에 동의해 주세요.');

  // ── 4) 접수 ────────────────────────────────────────────────────────────────
  let result;
  try {
    result = await submitRegistration(input);
  } catch (e) {
    console.error('[surfcamp] submit error:', e);
    return fail('접수 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  }

  if (!result.ok) return fail(messageFor(result));

  // ── 5) 부수효과: 문자 발송 (실패해도 접수는 이미 확정이다) ──────────────────
  try {
    await sendApplicationSms({
      phone: result.phone,
      repName: result.rep_name,
      lesson: result.programs.lesson,
      special: result.programs.special,
      lessonTime: input.lesson_time,
    });
  } catch (e) {
    console.error('[surfcamp] application SMS failed:', e);
  }

  try {
    await notifyAdmin({
      repName: result.rep_name,
      phone: result.phone,
      region: input.region,
      lessonTime: input.lesson_time,
      residentType: input.resident_type,
      participantCount: input.participants.length,
      lesson: result.programs.lesson,
      special: result.programs.special,
    });
  } catch (e) {
    console.error('[surfcamp] admin notify failed:', e);
  }

  // 이번 접수 때문에 대기열이 밀려 확정된 다른 신청들
  for (const p of result.promoted) {
    try {
      await sendPromotionSms({
        phone: p.phone,
        repName: p.rep_name,
        programs: [{ program: p.program, count: p.count }],
      });
    } catch (e) {
      console.error('[surfcamp] promotion SMS failed:', p.registration_id, e);
    }
  }

  return {
    status: 'success',
    message: '신청이 정상 접수되었습니다.',
    result,
  };
}
