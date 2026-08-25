/**
 * 2026 양양서핑페스티벌 현장 프로그램 접수 설정.
 *
 * ★ 이 파일에는 `server-only` 를 넣지 말 것 — 클라이언트 폼 컴포넌트가 직접 import 한다.
 *   따라서 비밀값(SOLAPI 키, OTP 시크릿 등)은 절대 여기에 두지 않는다.
 *
 * 접수 오픈/마감과 정원은 여기 상수가 아니라 DB(festprog.config)에 있다.
 * 재배포 없이 관리자 화면에서 토글하기 위함이며, KILL_SWITCH 만이
 * 재배포가 필요한 비상 정지 스위치다.
 */

import { PROGRAM_KEYS, type GenderKey, type ProgramKey } from '@/lib/festprog-validate';

export type { GenderKey, ProgramKey };
export { PROGRAM_KEYS };

/**
 * 비상 정지 스위치. true 로 바꾸고 배포하면 접수 폼과 서버 액션이 즉시 닫힌다.
 * 평상시 오픈/마감은 관리자 화면(= DB festprog.config.submissions_open)으로 조작한다.
 */
export const KILL_SWITCH = false;

/** 문자 발송 주체 — 협회는 사전등록 발신번호가 없어 대행사 명의로 나간다. */
export const SMS_SENDER_ORG = '로마드협동조합';

/**
 * 접수 문의 전화 — 운영 사무국(로마드협동조합) 담당자 직통.
 * ⚠️ 협회 대표번호(033-671-6155)는 접수 문의 대응이 안 되므로 쓰지 말 것.
 */
export const INQUIRY_TEL = '010-9542-3775';

// ── 행사 정보 ─────────────────────────────────────────────────────────────────
export const EVENT = {
  name: '2026 양양서핑페스티벌 현장 프로그램',
  shortName: '페스티벌 현장 프로그램',
  host: '양양군서핑협회',
  dateLabel: '8월 29일(토)',
  place: '죽도해변 해양종합레포츠센터 앞',
  fee: '무료',
  inquiryTel: INQUIRY_TEL,
} as const;

// ── 프로그램 ──────────────────────────────────────────────────────────────────
export interface ProgramMeta {
  key: ProgramKey;
  label: string;
  /** 시작 시각 표기 */
  time: string;
  /** 한 줄 소개 */
  desc: string;
  /** 대외 공시 전체 정원 (온라인 + 현장) */
  totalSeats: number;
  /** 온라인 사전신청 정원 (DB 기본값과 일치시킬 것) */
  onlineSeats: number;
  emoji: string;
}

/**
 * ★ totalSeats / onlineSeats 는 "표기"용이다. 실제 판정은 DB(festprog.config)의
 *   barre_capacity / hyrox_capacity 로 한다. 운영 중 정원을 몇 명 조정해도
 *   공고에 나간 숫자는 이 상수로 고정해 안내한다.
 */
export const PROGRAMS: ProgramMeta[] = [
  {
    key: 'barre',
    label: '해변 바레',
    time: '오후 1시',
    desc: '파도 소리와 함께하는 바레 클래스',
    totalSeats: 15,
    onlineSeats: 12,
    emoji: '🧘',
  },
  {
    key: 'hyrox',
    label: '해변 하이록스',
    time: '오후 3시',
    desc: '모래 위에서 겨루는 피트니스 레이스',
    totalSeats: 30,
    onlineSeats: 24,
    emoji: '🏃',
  },
];

export function programMeta(key: string): ProgramMeta | undefined {
  return PROGRAMS.find((p) => p.key === key);
}

export function programLabel(key: string): string {
  return programMeta(key)?.label ?? key;
}

/** '해변 바레 · 8월 29일(토) 오후 1시 · 죽도해변' */
export function programSchedule(key: string): string {
  const p = programMeta(key);
  if (!p) return `${EVENT.dateLabel} · ${EVENT.place}`;
  return `${EVENT.dateLabel} ${p.time} · ${EVENT.place}`;
}

/** 현장 접수분 인원 (전체 - 온라인) */
export function onsiteSeats(key: string): number {
  const p = programMeta(key);
  if (!p) return 0;
  return Math.max(0, p.totalSeats - p.onlineSeats);
}

/** '정원 15명 = 온라인 12명 + 현장 3명(당일 선착순)' */
export function seatBreakdown(key: string): string {
  const p = programMeta(key);
  if (!p) return '';
  return `정원 ${p.totalSeats}명 = 온라인 ${p.onlineSeats}명 + 현장 ${onsiteSeats(key)}명(당일 선착순)`;
}

// ── 성별 ──────────────────────────────────────────────────────────────────────
export const GENDERS: { key: GenderKey; label: string }[] = [
  { key: 'M', label: '남' },
  { key: 'F', label: '여' },
];

export function genderLabel(key: string): string {
  return GENDERS.find((g) => g.key === key)?.label ?? key;
}

/** 'confirmed' | 'waitlist' | 'cancelled' → 한국어 */
export function statusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'confirmed':
      return '확정';
    case 'waitlist':
      return '대기';
    case 'cancelled':
      return '취소';
    default:
      return '-';
  }
}
