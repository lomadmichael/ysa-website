"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { entryWindowState, type EntryWindowKey } from "@/lib/festival-2026";

/* ── 1분 단위 공유 시계 ────────────────────────────────────────
 * 카드가 여러 개여도 인터벌은 하나만 돈다.
 * 서버/하이드레이션 시점 스냅샷은 0 → 항상 'before' UI 로 렌더되므로
 * hydration mismatch가 발생하지 않는다. 하이드레이션 이후 React가
 * 실제 시각 스냅샷을 다시 읽어 상태를 전환한다.
 */
const TICK_MS = 60_000;

let clockNow: number | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribeClock(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  if (timer === null) {
    timer = setInterval(() => {
      clockNow = Date.now();
      listeners.forEach((listener) => listener());
    }, TICK_MS);
  }
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getClockSnapshot() {
  // 스냅샷은 캐시해야 한다 (매번 Date.now()를 반환하면 무한 렌더)
  if (clockNow === null) clockNow = Date.now();
  return clockNow;
}

function getServerClockSnapshot() {
  return 0;
}

/**
 * 종목별 접수창 상태에 따라 안내 / 접수 버튼 / 마감을 전환하는 클라이언트 아일랜드.
 * 페이지 본체는 static 서버 컴포넌트로 유지된다.
 */
export default function EntryCta({
  windowKey,
  badgeLabel,
  badgeClass,
  href = "/apply/competition",
}: {
  windowKey: EntryWindowKey;
  badgeLabel: string;
  badgeClass: string;
  /** 접수 폼 경로. 대회 그룹이 겹치는 기간에는 `?type=` 을 붙여 폼을 나눈다 */
  href?: string;
}) {
  const now = useSyncExternalStore(
    subscribeClock,
    getClockSnapshot,
    getServerClockSnapshot
  );

  const state = entryWindowState(windowKey, now);

  if (state === "open") {
    return (
      <div className="mt-6 flex flex-col gap-3 rounded-xl bg-sand px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-navy/60 md:text-sm">
          접수가 진행 중입니다. 아래 버튼에서 참가 신청서를 작성해 주세요.
        </p>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-purple px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-purple/90"
        >
          참가 신청하기
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    );
  }

  if (state === "closed") {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl bg-foam px-4 py-3">
        <span className="w-fit shrink-0 rounded-full bg-navy/10 px-3 py-1 text-xs font-semibold text-navy/50">
          접수 마감
        </span>
        <p className="text-xs leading-relaxed text-navy/50 md:text-sm">
          접수 기간이 종료되었습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-2 rounded-xl bg-sand px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
      <span
        className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
      >
        {badgeLabel}
      </span>
      <p className="text-xs leading-relaxed text-navy/60 md:text-sm">
        접수 시작과 함께 이 페이지에서 접수 버튼이 열립니다.
      </p>
    </div>
  );
}
