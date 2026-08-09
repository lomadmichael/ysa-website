import 'server-only';
import { sendAlimtalk } from '@/lib/solapi';
import {
  EVENT,
  INQUIRY_TEL,
  SMS_SENDER_ORG,
  lessonTimeLabel,
  programLabel,
} from '@/lib/surfcamp-config';
import type { ProgramKey } from '@/lib/surfcamp-validate';
import type { ProgramOutcome } from '@/lib/surfcamp-db';

/**
 * 2026 양양 서핑캠프 안내 문자.
 *
 * templateId 는 전부 "TMPL_SURFCAMP_*" 플레이스홀더다. solapi.ts 가 이를 감지해
 * 알림톡 심사 통과 전까지는 fallbackText 를 일반 SMS 로 자동 발송한다.
 * 따라서 fallbackText 는 그 자체로 완결된 문안이어야 한다.
 *
 * 모든 발송은 호출부에서 try/catch 로 감싸는 fire-and-forget 이다.
 * SOLAPI 장애가 이미 커밋된 접수를 되돌리는 일은 절대 없어야 한다.
 */

const HEAD = `[${EVENT.organizer}] ${EVENT.name}`;
const MY_URL = 'https://ysakorea.com/apply/surf-camp/my';
/**
 * 발송 주체 한 줄. 양양군체육회는 사전등록 발신번호가 없어 대행사 번호로 나가므로,
 * 수신자가 모르는 번호로 오해하지 않도록 반드시 붙인다.
 * 문자 요금이 글자 수에 직결되니 한 줄을 넘기지 말 것. (OTP 문자에는 넣지 않는다)
 */
const SENDER = `[${SMS_SENDER_ORG}] ${EVENT.host} 알림 운영 대행`;
const FOOT = `신청 확인·수정·취소: ${MY_URL}\n문의: ${INQUIRY_TEL}\n${SENDER}`;

/** 프로그램별 일정 한 줄. 강습은 신청한 시간대를 함께 노출한다. */
function scheduleOf(program: ProgramKey, lessonTime?: string | null): string {
  if (program === 'lesson') {
    const time = lessonTime && lessonTime !== 'any' ? ` ${lessonTimeLabel(lessonTime)}` : '';
    return `${EVENT.lessonDateLabel}${time}`;
  }
  return `${EVENT.specialDateLabel} ${EVENT.specialTitle}`;
}

/**
 * 프로그램별 결과 줄.
 * 강습은 확정인데 특화는 대기일 수 있으므로 반드시 프로그램마다 상태를 따로 적는다.
 */
function outcomeLines(
  lesson: ProgramOutcome | null | undefined,
  special: ProgramOutcome | null | undefined,
  lessonTime?: string | null,
): string[] {
  const lines: string[] = [];
  if (lesson) {
    const mark = lesson.status === 'confirmed' ? '확정' : '대기';
    lines.push(`· ${programLabel('lesson')} ${lesson.count}명 — ${mark}`);
    lines.push(`  ${scheduleOf('lesson', lessonTime)}`);
  }
  if (special) {
    const mark = special.status === 'confirmed' ? '확정' : '대기';
    lines.push(`· ${programLabel('special')} ${special.count}명 — ${mark}`);
    lines.push(`  ${scheduleOf('special')}`);
  }
  return lines;
}

function hasWaitlist(...outcomes: (ProgramOutcome | null | undefined)[]): boolean {
  return outcomes.some((o) => o?.status === 'waitlist');
}

const WAIT_NOTE =
  '대기 신청은 자리가 나는 대로 순서대로 확정되며, 확정 시 문자로 개별 안내드립니다.';

/** 본인조회 인증번호 */
export async function sendOtpSms(phone: string, code: string) {
  return sendAlimtalk({
    to: phone,
    templateId: 'TMPL_SURFCAMP_OTP',
    variables: {},
    fallbackText: `${HEAD}\n본인조회 인증번호 ${code} (5분 내 입력)\n타인에게 알려주지 마세요.`,
  });
}

/** 신규 접수 완료 안내 (프로그램별 확정/대기 분리 표기) */
export async function sendApplicationSms(params: {
  phone: string;
  repName: string;
  lesson: ProgramOutcome | null;
  special: ProgramOutcome | null;
  lessonTime?: string | null;
}) {
  const body = [
    HEAD,
    `${params.repName}님, 신청이 정상 접수되었습니다.`,
    '',
    ...outcomeLines(params.lesson, params.special, params.lessonTime),
    '',
    hasWaitlist(params.lesson, params.special) ? WAIT_NOTE : '',
    FOOT,
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return sendAlimtalk({
    to: params.phone,
    templateId: 'TMPL_SURFCAMP_APPLICATION',
    variables: {},
    fallbackText: body,
  });
}

/** 대기 → 확정 승급 안내 */
export async function sendPromotionSms(params: {
  phone: string;
  repName: string;
  programs: { program: ProgramKey; count: number }[];
  lessonTime?: string | null;
}) {
  const lines = params.programs.map(
    (p) =>
      `· ${programLabel(p.program)} ${p.count}명 — 확정\n  ${scheduleOf(p.program, params.lessonTime)}`,
  );
  const body = [
    HEAD,
    `${params.repName}님, 대기 중이던 신청이 확정되었습니다.`,
    '',
    ...lines,
    '',
    FOOT,
  ].join('\n');

  return sendAlimtalk({
    to: params.phone,
    templateId: 'TMPL_SURFCAMP_PROMOTE',
    variables: {},
    fallbackText: body,
  });
}

/** 신청 내용 변경 안내 */
export async function sendUpdateSms(params: {
  phone: string;
  repName: string;
  lesson: ProgramOutcome | null;
  special: ProgramOutcome | null;
  lessonTime?: string | null;
}) {
  const detail = outcomeLines(params.lesson, params.special, params.lessonTime);
  const body = [
    HEAD,
    `${params.repName}님, 신청 내용이 수정되었습니다.`,
    '',
    ...(detail.length > 0 ? detail : ['· 참가자 정보가 변경되었습니다.']),
    '',
    hasWaitlist(params.lesson, params.special) ? WAIT_NOTE : '',
    FOOT,
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return sendAlimtalk({
    to: params.phone,
    templateId: 'TMPL_SURFCAMP_UPDATE',
    variables: {},
    fallbackText: body,
  });
}

/** 신청 취소 안내 (본인 취소 / 관리자 취소) */
export async function sendCancelSms(params: {
  phone: string;
  repName: string;
  byAdmin?: boolean;
  reason?: string | null;
}) {
  const who = params.byAdmin
    ? '운영 사무국에서 신청을 취소 처리했습니다.'
    : '신청이 정상 취소되었습니다.';
  const reason = params.reason?.trim() ? `사유: ${params.reason.trim()}` : '';
  const body = [
    HEAD,
    `${params.repName}님, ${who}`,
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
    templateId: 'TMPL_SURFCAMP_CANCEL',
    variables: {},
    fallbackText: body,
  });
}
