/**
 * `/festival` 탭 정의.
 *
 * URL 쿼리 `?tab=` 와 1:1로 묶인다 — 인스타 등 외부 링크에서
 * `/festival?tab=beginner` 로 바로 보내면 그 탭이 SSR 로 그려진다.
 * 서버(page.tsx)와 클라이언트(FestivalTabs) 양쪽에서 쓰므로 "use client" 를 두지 않는다.
 */

export const FESTIVAL_TABS = [
  { id: 'festival', label: '페스티벌' },
  { id: 'beginner', label: '비기너 서핑대회' },
  { id: 'shortboard', label: '숏보드' },
  { id: 'longboard', label: '롱보드' },
  { id: 'supsurfing', label: 'SUP 서핑' },
  { id: 'apply', label: '참가신청' },
] as const;

export type FestivalTabId = (typeof FESTIVAL_TABS)[number]['id'];

export const DEFAULT_FESTIVAL_TAB: FestivalTabId = 'festival';

/** 쿼리 값 → 탭 id. 알 수 없는 값은 기본 탭 */
export function parseFestivalTab(value: unknown): FestivalTabId {
  const raw = Array.isArray(value) ? value[0] : value;
  const hit = FESTIVAL_TABS.find((tab) => tab.id === raw);
  return hit ? hit.id : DEFAULT_FESTIVAL_TAB;
}

/** 탭 링크 — 기본 탭은 쿼리 없이 깔끔한 `/festival` 로 */
export function festivalTabHref(id: FestivalTabId): string {
  return id === DEFAULT_FESTIVAL_TAB ? '/festival' : `/festival?tab=${id}`;
}
