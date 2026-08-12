/**
 * 2026 맞춤형 서핑대회 상수 — 생활체육 「맞춤형 서핑교실」 1~4기 수료생 대상 대회.
 *
 * 코리아 오픈(대한서핑협회장배)과 성격이 완전히 다르다:
 *   참가비 없음 · 부문 택1(성인부/아동부) · 정원 있음(각 48명) · 주소·국적 안 받음.
 * 그래서 `/apply/competition`(복수 종목·유료) 폼을 공유하지 않고 별도 폼을 쓴다.
 *
 * lineup 서버가 실제 접수 게이트(competitions.entry_opens_at/closes_at)이고,
 * 여기 상수는 화면 문구·버튼 노출용 클라 시계다 — 두 값은 항상 같아야 한다.
 */

/** lineup 대회 slug — 이 대회만 이 폼에서 접수하고, 코리아 오픈 폼에서는 제외한다 */
export const CUSTOM_COMP_SLUG = "surfcomp-yysports";

/** 접수창 — 2026-08-11(화) ~ 8/17(일) 23:59 KST (형님 확정 2026-08-11) */
export const CUSTOM_COMP_ENTRY_WINDOW = {
  /** 접수 시작: 페이지 공개와 동시 (8/11 00:00 KST) */
  opensAt: Date.UTC(2026, 7, 10, 15, 0, 0),
  /** 접수 마감: 8/17 23:59:59 KST */
  closesAt: Date.UTC(2026, 7, 17, 14, 59, 59),
} as const;

/** 대회 개요 — 화면 안내 문구의 단일 소스 */
export const CUSTOM_COMP = {
  title: "2026 맞춤형 서핑대회",
  /** 대회 일시 — DB(starts_on)에는 날짜만 있어 시각은 여기서 관리한다 */
  dateLabel: "2026년 8월 23일(일) 오전 10시",
  venue: "죽도해변",
  target: "2026 맞춤형 서핑교실 1~4기 참가자",
  feeLabel: "무료",
  host: "양양군체육회",
  organizer: "양양군서핑협회",
} as const;

/**
 * 맞춤형 서핑교실 기수 — 접수 시 택1 (lineup 에는 소속(affiliation) 값으로 저장된다).
 * 수강생이 자기 기수를 기억 못 해도 요일반·시간으로 찾을 수 있게 함께 표기한다.
 */
export const COHORT_OPTIONS = [
  { value: "1기", note: "주말반 12시 30분" },
  { value: "2기", note: "주말반 15시" },
  { value: "3기", note: "방학반 12시 30분" },
  { value: "4기", note: "방학반 15시" },
] as const;

export type CohortOption = (typeof COHORT_OPTIONS)[number]["value"];

/** 소속 필드에 저장할 표기 — 콘솔·CSV 에서 바로 읽히도록 대회명을 붙인다 */
export function cohortAffiliation(cohort: string): string {
  return `맞춤형 ${cohort}`;
}
