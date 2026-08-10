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
  LESSON_YOUTH_AGE,
  MAX_PARTICIPANTS,
  type GenderKey,
  type LessonTimeKey,
  type ProgramKey,
  type RegionKey,
  type ResidentTypeKey,
  type SurfExpKey,
} from '@/lib/surfcamp-validate';

// 검증 규칙과 값이 갈라지지 않도록 surfcamp-validate 의 상수를 그대로 재수출한다.
export { LESSON_MIN_AGE, LESSON_MIN_HEIGHT, LESSON_YOUTH_AGE, MAX_PARTICIPANTS };

/** 문자 발송 주체 — 양양군체육회는 사전등록 발신번호가 없어 대행사 명의로 나간다. */
export const SMS_SENDER_ORG = '로마드협동조합';
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

/**
 * 접수 문의 전화 — 운영 사무국(로마드협동조합) 담당자 직통.
 * ⚠️ 협회 대표번호(033-671-6155)는 접수 문의 대응이 안 되므로 쓰지 말 것.
 */
export const INQUIRY_TEL = '010-9542-3775';

// 신규 접수 관리자 알림 문자는 쓰지 않는다(운영진이 관리자 화면에서 직접 확인).
// 되살릴 일이 생기면 surfcamp-admin-notify.ts 를 git 히스토리에서 복구할 것.

// ── 행사 정보 ─────────────────────────────────────────────────────────────────
export const EVENT = {
  name: '2026 양양 서핑캠프',
  /** 주최 */
  host: '양양군체육회',
  /** 주관 */
  organizer: '양양군서핑협회',
  /** 서핑강습: 2026년 9월 19일(토) 13:00 / 15:00 2회차 (당초 9/12 → 9/19 변경) */
  lessonDate: '2026-09-19',
  lessonDateLabel: '9월 19일(토)',
  /** 서핑 특화 체험: 2026년 9월 19일(토) ~ 20일(일) */
  specialDateLabel: '9월 19일(토)~20일(일)',
  /** 운영계획서 기준 체험 구성 */
  specialTitle: '파도·안전 이해, 양양 서핑문화, 티셔츠 만들기 체험',
  /** 서핑 특화 체험 장소 (확정) */
  specialPlace: '웨이브웍스',
  specialAddress: '강원 양양군 현남면 인구중앙길 110',
  /** 장소는 확정됐지만 회차별 시간은 아직 미정이다. */
  specialScheduleNote: '세부 스케줄은 별도 안내드립니다.',
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
    label: '서핑 특화 체험',
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

// ── KST 날짜 포맷 ─────────────────────────────────────────────────────────────
/**
 * 예약 오픈 시각을 화면에 찍을 때 쓰는 헬퍼.
 *
 * ★ `toLocaleString`/`Intl` 을 쓰지 않는다.
 *   서버(UTC)와 브라우저(사용자 로캘·타임존)가 서로 다른 문자열을 만들어
 *   hydration mismatch 가 나기 때문이다. (festival-2026.ts 의 formatKrw 와 같은 이유)
 *   대신 KST 고정 오프셋(+9h)을 epoch 에 더한 뒤 `getUTC*` 로만 읽어
 *   어느 환경에서든 동일한 결과가 나오도록 한다.
 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const KST_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** `2026-08-10T00:00:00+00:00` / `... Z` / `2026-08-10 00:00:00+00` 형태를 모두 받는다. */
const TIMESTAMP_RE =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*(Z|z|[+-]\d{2}:?\d{2}|[+-]\d{2})?$/;

/**
 * ISO8601(또는 Postgres timestamptz) 문자열 → epoch ms.
 * 파싱 불가면 null.
 *
 * `new Date(str)` 대신 직접 파싱하는 이유: 오프셋이 없는 문자열을 엔진이
 * "로컬 시간"으로 해석해 서버/클라이언트 값이 갈리기 때문. 여기서는 오프셋이
 * 없으면 UTC 로 간주해 항상 같은 값을 만든다.
 */
export function parseIsoToEpochMs(value: string): number | null {
  const m = TIMESTAMP_RE.exec(value.trim());
  if (!m) {
    const fallback = Date.parse(value);
    return Number.isNaN(fallback) ? null : fallback;
  }
  const [, y, mo, d, h, mi, s, tz] = m;
  let ms = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? 0));
  if (tz && tz !== 'Z' && tz !== 'z') {
    const sign = tz.startsWith('-') ? -1 : 1;
    const body = tz.slice(1).replace(':', '');
    const offsetMin = sign * (Number(body.slice(0, 2)) * 60 + Number(body.slice(2, 4) || 0));
    ms -= offsetMin * 60_000;
  }
  return ms;
}

/**
 * KST 기준 사람이 읽는 날짜/시각.
 * 예: `2026-08-10T00:00:00Z` → `8월 10일(월) 오전 9시`
 * (분이 0이 아니면 `오전 9시 30분` 형태)
 */
export function formatKst(iso: string): string {
  const t = parseIsoToEpochMs(iso);
  if (t === null) return '';
  const k = new Date(t + KST_OFFSET_MS);
  const month = k.getUTCMonth() + 1;
  const day = k.getUTCDate();
  const weekday = KST_WEEKDAYS[k.getUTCDay()];
  const hour24 = k.getUTCHours();
  const minute = k.getUTCMinutes();
  const meridiem = hour24 < 12 ? '오전' : '오후';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const time = minute === 0 ? `${meridiem} ${hour12}시` : `${meridiem} ${hour12}시 ${minute}분`;
  return `${month}월 ${day}일(${weekday}) ${time}`;
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
