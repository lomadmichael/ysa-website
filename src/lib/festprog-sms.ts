import 'server-only';
import { sendAlimtalk } from '@/lib/solapi';
import {
  EVENT,
  INQUIRY_TEL,
  SMS_SENDER_ORG,
  programLabel,
  programSchedule,
} from '@/lib/festprog-config';
import type { ProgramKey } from '@/lib/festprog-validate';

/**
 * 2026 양양서핑페스티벌 현장 프로그램 안내 문자.
 *
 * templateId 는 전부 "TMPL_FESTPROG_*" 플레이스홀더다. solapi.ts 가 이를 감지해
 * 알림톡 심사 통과 전까지는 fallbackText 를 일반 SMS 로 자동 발송한다.
 * 따라서 fallbackText 는 그 자체로 완결된 문안이어야 한다.
 *
 * 모든 발송은 호출부에서 try/catch 로 감싸는 부수효과다.
 * SOLAPI 장애가 이미 커밋된 접수를 되돌리는 일은 절대 없어야 한다.
 * (단 Vercel serverless 에서는 반드시 await — .catch() 체인은 응답 후 유실된다)
 */

const HEAD = `[${EVENT.host}] ${EVENT.name}`;
const MY_URL = 'https://ysakorea.com/apply/festival-program/my';
/**
 * 발송 주체 한 줄. 협회는 사전등록 발신번호가 없어 대행사 번호로 나가므로,
 * 수신자가 모르는 번호로 오해하지 않도록 반드시 붙인다.
 * 문자 요금이 글자 수에 직결되니 한 줄을 넘기지 말 것. (OTP 문자에는 넣지 않는다)
 */
const SENDER = `[${SMS_SENDER_ORG}] ${EVENT.host} 알림 운영 대행`;
const FOOT = `신청 확인·취소: ${MY_URL}\n문의: ${INQUIRY_TEL}\n${SENDER}`;

const WAIT_NOTE =
  '대기 신청은 자리가 나는 대로 순서대로 확정되며, 확정 시 문자로 개별 안내드립니다.';

/** 본인조회 인증번호 */
export async function sendOtpSms(phone: string, code: string) {
  return sendAlimtalk({
    to: phone,
    templateId: 'TMPL_FESTPROG_OTP',
    variables: {},
    fallbackText: `${HEAD}\n본인조회 인증번호 ${code} (5분 내 입력)\n타인에게 알려주지 마세요.`,
  });
}

/** 신규 접수 완료 안내 (확정 / 대기 구분) */
export async function sendApplicationSms(params: {
  phone: string;
  name: string;
  program: ProgramKey;
  status: 'confirmed' | 'waitlist';
  waitAhead?: number | null;
}) {
  const confirmed = params.status === 'confirmed';
  const body = [
    HEAD,
    `${params.name}님, 신청이 정상 접수되었습니다.`,
    '',
    `· ${programLabel(params.program)} — ${confirmed ? '참가 확정' : '대기'}`,
    `  ${programSchedule(params.program)} · 참가비 ${EVENT.fee}`,
    '',
    confirmed
      ? '당일 시작 15분 전까지 죽도해변 해양종합레포츠센터 앞 프로그램 부스로 와 주세요.'
      : typeof params.waitAhead === 'number'
        ? `현재 대기 순번은 ${params.waitAhead + 1}번입니다. ${WAIT_NOTE}`
        : WAIT_NOTE,
    FOOT,
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return sendAlimtalk({
    to: params.phone,
    templateId: 'TMPL_FESTPROG_APPLICATION',
    variables: {},
    fallbackText: body,
  });
}

/** 대기 → 확정 승급 안내 */
export async function sendPromotionSms(params: {
  phone: string;
  name: string;
  program: ProgramKey;
}) {
  const body = [
    HEAD,
    `${params.name}님, 대기 중이던 신청이 확정되었습니다.`,
    '',
    `· ${programLabel(params.program)} — 참가 확정`,
    `  ${programSchedule(params.program)} · 참가비 ${EVENT.fee}`,
    '',
    '당일 시작 15분 전까지 죽도해변 해양종합레포츠센터 앞 프로그램 부스로 와 주세요.',
    '참석이 어려우시면 아래 링크에서 취소해 주시면 다음 대기자에게 자리가 돌아갑니다.',
    FOOT,
  ].join('\n');

  return sendAlimtalk({
    to: params.phone,
    templateId: 'TMPL_FESTPROG_PROMOTE',
    variables: {},
    fallbackText: body,
  });
}

/** 신청 취소 안내 (본인 취소 / 관리자 취소) */
export async function sendCancelSms(params: {
  phone: string;
  name: string;
  program: ProgramKey;
  byAdmin?: boolean;
  reason?: string | null;
}) {
  const who = params.byAdmin
    ? '운영 사무국에서 신청을 취소 처리했습니다.'
    : '신청이 정상 취소되었습니다.';
  const reason = params.reason?.trim() ? `사유: ${params.reason.trim()}` : '';
  const body = [
    HEAD,
    `${params.name}님, ${programLabel(params.program)} ${who}`,
    reason,
    '',
    '재신청은 접수 기간 중 언제든 가능합니다.',
    `문의: ${INQUIRY_TEL}`,
    SENDER,
  ]
    .filter(Boolean)
    .join('\n');

  return sendAlimtalk({
    to: params.phone,
    templateId: 'TMPL_FESTPROG_CANCEL',
    variables: {},
    fallbackText: body,
  });
}
