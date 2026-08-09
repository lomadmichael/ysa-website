/**
 * 2026 양양 서핑캠프 접수 설정.
 *
 * ★ 이 파일에는 `server-only` 를 넣지 말 것 — 클라이언트 폼 컴포넌트가 직접 import 한다.
 *   따라서 비밀값(SOLAPI 키, OTP 시크릿 등)은 절대 여기에 두지 않는다.
 *
 * 접수 오픈/마감과 정원은 여기 상수가 아니라 DB(surfcamp.config)에 있다.
 * 재배포 없이 관리자 화면에서 토글하기 위함이며, KILL_SWITCH 만이
 * 재배포가 필요한 비상 정지 스위치다.
 */

import {
  LESSON_MIN_AGE,
  LESSON_MIN_HEIGHT,
  MAX_PARTICIPANTS,
  type GenderKey,
  type LessonTimeKey,
  type ProgramKey,
  type RegionKey,
  type ResidentTypeKey,
  type SurfExpKey,
} from '@/lib/surfcamp-validate';

// 검증 규칙과 값이 갈라지지 않도록 surfcamp-validate 의 상수를 그대로 재수출한다.
export { LESSON_MIN_AGE, LESSON_MIN_HEIGHT, MAX_PARTICIPANTS };
export type {
  GenderKey,
  LessonTimeKey,
  ProgramKey,
  RegionKey,
  ResidentTypeKey,
  SurfExpKey,
};

/**
 * 비상 정지 스위치. true 로 바꾸고 배포하면 접수 폼과 서버 액션이 즉시 닫힌다.
 * 평상시 오픈/마감은 관리자 화면(= DB surfcamp.config.submissions_open)으로 조작한다.
 */
export const KILL_SWITCH = false;

/** DB 시드용 기본 정원. 실제 판정 기준은 항상 DB 값이다. */
export const DEFAULT_CAPACITY = { lesson: 200, special: 300 } as const;

/** 문의 전화 (협회 대표번호) */
export const INQUIRY_TEL = '033-671-6155';

/**
 * 신규 접수 알림을 받을 운영 담당자 휴대폰 (숫자만).
 * ⚠️ 오픈 전에 실제 담당자 번호로 반드시 확인/교체할 것.
 */
export const ADMIN_ALERT_PHONE = '01095423775';

// ── 행사 정보 ─────────────────────────────────────────────────────────────────
export const EVENT = {
  name: '2026 양양 서핑캠프',
  /** 주최 */
  host: '양양군체육회',
  /** 주관 */
  organizer: '양양군서핑협회',
  /** 서핑강습: 2026년 9월 12일(토) 13:00 / 15:00 2회차 */
  lessonDate: '2026-09-12',
  lessonDateLabel: '9월 12일(토)',
  /** 특화체험: 2026년 9월 12일(토) ~ 13일(일) */
  specialDateLabel: '9월 12일(토)~13일(일)',
  specialTitle: '안전교육 및 서핑 티셔츠 만들기',
  /** 강습 장소는 신청 시 선택한 권역의 지정 해변에서 진행 */
  place: '양양군 일원 (권역별 지정 해변)',
  inquiryTel: INQUIRY_TEL,
} as const;

// ── 코드 ↔ 라벨 ───────────────────────────────────────────────────────────────
export interface Option<K extends string> {
  key: K;
  label: string;
  /** 폼 보조 설명 (없을 수 있음) */
  hint?: string;
}

/** 프로그램 */
export const PROGRAMS: Option<ProgramKey>[] = [
  {
    key: 'lesson',
    label: '서핑강습',
    hint: `${EVENT.lessonDateLabel} · 만 ${LESSON_MIN_AGE}세 이상, 신장 ${LESSON_MIN_HEIGHT}cm 이상`,
  },
  {
    key: 'special',
    label: '특화체험',
    hint: `${EVENT.specialDateLabel} · ${EVENT.specialTitle}`,
  },
];

/** 희망 강습권역 (신청 단위 1택) */
export const REGIONS: Option<RegionKey>[] = [
  { key: 'ganghyeon', label: '강현면' },
  { key: 'yangyang', label: '양양읍' },
  { key: 'sonyang', label: '손양면' },
  { key: 'hyeonbuk', label: '현북면' },
  { key: 'hyeonnam', label: '현남면' },
];

/** 희망 강습시간 (신청 단위 1택) */
export const LESSON_TIMES: Option<LessonTimeKey>[] = [
  { key: '13:00', label: '13:00' },
  { key: '15:00', label: '15:00' },
  { key: 'any', label: '시간무관' },
];

/** 신청 자격 구분 */
export const RESIDENT_TYPES: Option<ResidentTypeKey>[] = [
  { key: 'resident', label: '양양군민' },
  { key: 'life', label: '양양 생활인구' },
];

/** 서핑 경험 */
export const SURF_EXP: Option<SurfExpKey>[] = [
  { key: 'none', label: '처음' },
  { key: '1-3', label: '1-3회' },
  { key: '4+', label: '4회 이상' },
];

/** 성별 */
export const GENDERS: Option<GenderKey>[] = [
  { key: 'M', label: '남' },
  { key: 'F', label: '여' },
];

function labelOf<K extends string>(options: Option<K>[], key: string): string {
  return options.find((o) => o.key === key)?.label ?? key;
}

export function programLabel(key: string): string {
  return labelOf(PROGRAMS, key);
}
export function regionLabel(key: string): string {
  return labelOf(REGIONS, key);
}
export function lessonTimeLabel(key: string): string {
  return labelOf(LESSON_TIMES, key);
}
export function residentTypeLabel(key: string): string {
  return labelOf(RESIDENT_TYPES, key);
}
export function surfExpLabel(key: string): string {
  return labelOf(SURF_EXP, key);
}
export function genderLabel(key: string): string {
  return labelOf(GENDERS, key);
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
