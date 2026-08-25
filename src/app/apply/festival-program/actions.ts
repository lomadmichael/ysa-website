'use server';

import { KILL_SWITCH, programLabel } from '@/lib/festprog-config';
import {
  normalizePhone,
  validateRegistration,
  type RegistrationInput,
} from '@/lib/festprog-validate';
import {
  submitRegistration,
  type Promoted,
  type RpcFailure,
  type SubmitSuccess,
} from '@/lib/festprog-db';
import { sendApplicationSms, sendPromotionSms } from '@/lib/festprog-sms';

/**
 * 2026 양양서핑페스티벌 현장 프로그램 공개 접수 서버 액션.
 *
 * 원칙 3가지
 *  1) 클라이언트 검증은 UX 용일 뿐이다. 여기서 전량 다시 검증한다.
 *  2) 문자 발송은 접수 성공 뒤의 부수효과다. 실패해도 접수를 뒤집지 않는다
 *     (각각 개별 try/catch. Vercel serverless 에서 유실되지 않도록 반드시 await).
 *  3) RPC 가 돌려주는 기계용 error 코드는 반드시 한국어 문장으로 바꿔서 내보낸다.
 */

export interface FestProgFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  result?: SubmitSuccess;
}

// ★ 'use server' 파일은 async 함수 외의 값을 export 할 수 없다.
//   초기 state 상수는 폼 컴포넌트 쪽에 둔다.

function fail(message: string): FestProgFormState {
  return { status: 'error', message };
}

/** RPC error 코드 → 사용자 문구 */
const ERROR_MESSAGES: Record<string, string> = {
  closed: '지금은 온라인 사전신청 기간이 아닙니다. 오픈 후 다시 시도하시거나 당일 현장 접수(선착순)를 이용해 주세요.',
  consent_required: '개인정보 수집·이용 동의가 필요합니다.',
  invalid_name: '성명을 정확히 입력해 주세요.',
  invalid_phone: '휴대폰 번호를 정확히 입력해 주세요. (예: 010-1234-5678)',
  invalid_gender: '성별을 선택해 주세요.',
  invalid_program: '참여할 프로그램을 선택해 주세요.',
  conflict: '동시에 접수가 몰렸습니다. 잠시 후 다시 시도해 주세요.',
};

function messageFor(f: RpcFailure): string {
  if (f.error === 'duplicate_phone') {
    // 1인 1건 · 프로그램 택1 — 어느 프로그램에 신청돼 있는지 알려줘야 스스로 판단할 수 있다.
    const where = f.program ? `이미 ${programLabel(f.program)}에 신청하셨습니다.` : '이미 다른 프로그램에 신청하셨습니다.';
    return `${where} 현장 프로그램은 한 분당 한 종목만 신청할 수 있습니다. 종목을 바꾸시려면 「신청 조회」에서 기존 신청을 취소한 뒤 다시 신청해 주세요.`;
  }
  return (
    ERROR_MESSAGES[f.error] ?? '접수 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  );
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

export async function submitFestivalProgram(
  _prev: FestProgFormState,
  formData: FormData,
): Promise<FestProgFormState> {
  if (KILL_SWITCH) {
    return fail('현재 접수가 일시 중단되었습니다. 잠시 후 다시 시도해 주세요.');
  }

  const text = (key: string) => (formData.get(key) as string | null)?.trim() ?? '';

  const input: RegistrationInput = {
    name: text('name'),
    phone: normalizePhone(text('phone')),
    gender: text('gender'),
    program: text('program'),
    consent_privacy: formData.get('consent_privacy') != null,
  };

  // ── 1) 서버 재검증 (클라이언트 검증을 믿지 않는다) ──────────────────────────
  const invalid = validateRegistration(input);
  if (invalid) return fail(invalid);

  // ── 2) 접수 ────────────────────────────────────────────────────────────────
  let result;
  try {
    result = await submitRegistration(input);
  } catch (e) {
    console.error('[festprog] submit error:', e);
    return fail('접수 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  }

  if (!result.ok) return fail(messageFor(result));

  // ── 3) 부수효과: 문자 발송 (실패해도 접수는 이미 확정이다) ──────────────────
  try {
    await sendApplicationSms({
      phone: result.phone,
      name: result.name,
      program: result.program,
      status: result.status,
      waitAhead: result.wait_ahead,
    });
  } catch (e) {
    console.error('[festprog] application SMS failed:', e);
  }

  // 이번 접수 트랜잭션에서 대기열이 밀려 확정된 다른 신청들
  await notifyPromoted(result.promoted);

  return {
    status: 'success',
    message:
      result.status === 'confirmed'
        ? '신청이 정상 접수되었습니다.'
        : '대기자로 등록되었습니다.',
    result,
  };
}
