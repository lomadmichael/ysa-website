'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  FESTIVAL_TABS,
  festivalTabHref,
  type FestivalTabId,
} from './tabs';

interface TabPanel {
  id: FestivalTabId;
  content: ReactNode;
}

/**
 * `/festival` 탭 바 + 패널 전환.
 *
 * 패널 내용은 **서버 컴포넌트가 미리 렌더해서 props 로 넘긴다**.
 * 그래서 (1) `?tab=beginner` 로 들어와도 첫 페인트에 대진표가 이미 있고,
 * (2) 탭을 눌렀을 때 서버 왕복 없이 즉시 전환된다. URL 은 뒤따라 갱신될 뿐이다.
 */
export default function FestivalTabs({
  initialTab,
  panels,
}: {
  initialTab: FestivalTabId;
  panels: TabPanel[];
}) {
  const router = useRouter();
  const [active, setActive] = useState<FestivalTabId>(initialTab);
  const listRef = useRef<HTMLDivElement>(null);

  // 페이지 안팎의 링크(`/festival?tab=...`)로 들어오면 그 탭을 따라간다
  useEffect(() => {
    setActive(initialTab);
  }, [initialTab]);

  // 모바일 가로 스크롤 탭 바 — 활성 칩이 화면 밖이면 가로로만 끌어온다
  // (scrollIntoView 는 세로 스크롤까지 건드려서 쓰지 않는다)
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const chip = list.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!chip) return;
    const left = chip.offsetLeft;
    const right = left + chip.offsetWidth;
    if (left < list.scrollLeft) {
      list.scrollLeft = Math.max(0, left - 16);
    } else if (right > list.scrollLeft + list.clientWidth) {
      list.scrollLeft = right - list.clientWidth + 16;
    }
  }, [active]);

  const select = (id: FestivalTabId) => {
    setActive(id);
    // 공유·새로고침 대비로 쿼리만 갱신 (히스토리 쌓지 않음 / 스크롤 유지)
    router.replace(festivalTabHref(id), { scroll: false });
  };

  return (
    <>
      {/* 모바일 탭 바 스크롤바 숨김 — Firefox 는 scrollbarWidth, WebKit 은 아래 규칙 */}
      <style href="ysa-festival-tabs" precedence="default">
        {`.ysa-tabbar::-webkit-scrollbar{display:none}`}
      </style>

      <div className="sticky top-16 z-30 border-b border-foam bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-[1200px] px-4">
          <div
            ref={listRef}
            role="tablist"
            aria-label="페스티벌 정보 탭"
            className="ysa-tabbar flex gap-2 overflow-x-auto py-3"
            style={{ scrollbarWidth: 'none' }}
          >
            {FESTIVAL_TABS.map((tab) => {
              const isActive = tab.id === active;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  data-tab={tab.id}
                  id={`festival-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`festival-panel-${tab.id}`}
                  onClick={() => select(tab.id)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-ocean text-white'
                      : 'text-navy/60 hover:bg-foam hover:text-navy'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {panels.map((panel) => {
        const isActive = panel.id === active;
        return (
          <div
            key={panel.id}
            role="tabpanel"
            id={`festival-panel-${panel.id}`}
            aria-labelledby={`festival-tab-${panel.id}`}
            hidden={!isActive}
            className={isActive ? undefined : 'hidden'}
          >
            {panel.content}
          </div>
        );
      })}
    </>
  );
}
