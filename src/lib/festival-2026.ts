/**
 * 2026 양양 서핑페스티벌·대회 접수 공통 상수/유틸
 *
 * - 접수창(ENTRY_WINDOWS)은 KST 기준 일정을 UTC epoch(ms)로 고정해 둔다.
 *   서버(UTC)와 브라우저(로컬 타임존)에서 동일한 값을 계산해야 하므로
 *   `new Date("...")` 문자열 파싱 대신 `Date.UTC()`를 사용한다. (month는 0-index)
 * - 입금 계좌 / 참가비는 협회 확정값이며 임의로 변경하지 않는다.
 */

// 2026-08-03 홍보 일정표 확정으로 조정: 비기너·SUP 시작 8/4 → 8/5.
// 접수 시작은 자정이 아니라 **오전 9시**(형님 지시 2026-08-03), 마감은 23:59 유지.
// 오픈부 마감은 **8/22 유지**(형님 재확인) — 일정표의 8/16 은 마감일이 아니다.
// cert-manager `scripts/setup-2026-yangyang.mjs` 의 접수창 상수와 반드시 동일해야 한다
// (여기는 버튼 노출용 클라 시계, 실제 게이트는 서버 competitions.entry_opens_at/closes_at).
//
// 2026-08-11: SUP 레이싱 대회 취소 → beach 창은 **비기너 전용**이 됐다.
// 비기너는 추가 접수로 마감 8/9 → **8/14** 연장 (운영 DB 는 이미 반영돼 있었고
// 이 클라 상수만 8/9 로 남아 있어 /festival CTA 가 "접수 마감"으로 떴다).
export const ENTRY_WINDOWS = {
  /** 비기너 서핑대회 — 8/5 09:00 ~ 8/14 23:59 (KST). 추가 접수로 연장됨 */
  beach: {
    opensAt: Date.UTC(2026, 7, 5, 0, 0, 0),
    closesAt: Date.UTC(2026, 7, 14, 14, 59, 59),
  },
  /** 코리아 오픈 숏보드·롱보드·SUP 서핑 — 8/13 09:00 ~ 8/22 23:59 (KST) */
  open: {
    opensAt: Date.UTC(2026, 7, 13, 0, 0, 0),
    closesAt: Date.UTC(2026, 7, 22, 14, 59, 59),
  },
} as const;

export type EntryWindowKey = keyof typeof ENTRY_WINDOWS;

export type EntryWindowState = "before" | "open" | "closed";

/** 주어진 시각(now, epoch ms) 기준 접수창 상태 */
export function entryWindowState(
  key: EntryWindowKey,
  now: number
): EntryWindowState {
  const window = ENTRY_WINDOWS[key];
  if (now < window.opensAt) return "before";
  if (now > window.closesAt) return "closed";
  return "open";
}

/** 참가비 입금 계좌 (협회 확정) */
export const DEPOSIT_ACCOUNT = {
  bank: "신한은행",
  number: "100-035-939329",
  holder: "국민생활체육양양군서핑연합회",
} as const;

/** 부문(종목) 1개당 기본 참가비 — API가 금액을 주지 않을 때의 폴백 */
export const ENTRY_FEE_PER_DIVISION = 50000;

/**
 * 천 단위 콤마 포맷.
 * `toLocaleString`은 서버/클라이언트 로케일에 따라 결과가 달라져
 * hydration mismatch를 유발할 수 있어 결정적 구현을 사용한다.
 */
export function formatKrw(value: number): string {
  const n = Math.round(Number.isFinite(value) ? value : 0);
  const sign = n < 0 ? "-" : "";
  return sign + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * 접수 폼 그룹 — `/apply/competition?type=` 로 대회를 나눠 보여준다.
 *
 * 8/13~8/14 는 비기너(마감 8/14)와 코리아 오픈(8/13~8/22) 접수창이 겹쳐,
 * 한 폼에 네 대회가 함께 뜨면 신청자가 혼동한다(형님 지적 2026-08-12).
 * 파라미터가 없으면 종전대로 전부 노출하므로 기존에 배포한 링크는 그대로 동작한다.
 */
export type EntryGroup = "beginner" | "open";

const ENTRY_GROUP_PREFIX: Record<EntryGroup, string> = {
  beginner: "ksa-cup-2026-beginner",
  open: "ksa-cup-2026-open", // -shortboard / -longboard / -sup-surfing
};

/** 쿼리스트링 값 → 그룹. 알 수 없는 값은 null(전체 노출) */
export function parseEntryGroup(value: unknown): EntryGroup | null {
  return value === "beginner" || value === "open" ? value : null;
}

/** 그룹에 속한 대회인지 (slug prefix 매칭) */
export function isInEntryGroup(slug: string, group: EntryGroup | null): boolean {
  if (!group) return true;
  return slug.startsWith(ENTRY_GROUP_PREFIX[group]);
}

/** 그룹별 페이지 문구 — 어떤 대회 접수인지 제목에서 바로 드러나게 한다 */
export const ENTRY_GROUP_LABEL: Record<EntryGroup, { title: string; description: string }> = {
  beginner: {
    title: "비기너 서핑대회 참가 신청",
    description: "대한서핑협회장배 비기너 서핑대회 온라인 참가 신청 (주관: 양양군서핑협회)",
  },
  open: {
    title: "코리아 오픈 참가 신청",
    description:
      "대한서핑협회장배 코리아 오픈 — 숏보드 · 롱보드 · SUP 서핑 온라인 참가 신청 (주관: 양양군서핑협회)",
  },
};
