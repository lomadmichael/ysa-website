'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CalendarEvent } from '@/lib/calendar-utils';
import { formatEventDate, getDaysUntil } from '@/lib/calendar-utils';

interface Props {
  events: CalendarEvent[];
  /** 자동 전환 간격 (ms). 0이면 자동 전환 안 함. 기본 6000. */
  autoplayMs?: number;
}

const DEFAULT_AUTOPLAY = 6000;

/**
 * 임박 일정 슬라이더
 *
 * - 30일 이내 이벤트를 순환 표시
 * - fade 전환 + 자동 advance (hover/hidden 시 pause)
 * - 좌/우 화살표 + 하단 도트 + 상단 progress bar
 * - 키보드 좌/우 화살표 지원
 * - 1개 → 정적 표시, 0개 → 렌더 안 함
 */
export default function HeroSlider({ events, autoplayMs = DEFAULT_AUTOPLAY }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  // progress key는 리셋 트리거용. 슬라이드 이동할 때마다 애니메이션 재시작.
  const [progressKey, setProgressKey] = useState(0);

  const count = events.length;
  const hasMany = count > 1;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      const safe = ((next % count) + count) % count;
      setActive(safe);
      setProgressKey((k) => k + 1);
    },
    [count],
  );

  const prev = useCallback(() => go(active - 1), [active, go]);
  const next = useCallback(() => go(active + 1), [active, go]);

  // 자동 전환
  useEffect(() => {
    if (!hasMany || paused || autoplayMs <= 0) return;
    const t = setTimeout(() => go(active + 1), autoplayMs);
    return () => clearTimeout(t);
  }, [active, hasMany, paused, autoplayMs, go]);

  // 페이지 숨김 시 pause
  useEffect(() => {
    const handler = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // 키보드 좌/우
  useEffect(() => {
    if (!hasMany) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasMany, prev, next]);

  if (count === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-16 select-none"
      style={{ backgroundColor: '#393d7d' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="임박 일정 슬라이더"
    >
      {/* 진행 바 (자동 전환 시각화) */}
      {hasMany && !paused && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 z-20">
          <div
            key={progressKey}
            className="h-full bg-sunset"
            style={{
              animation: `heroProgress ${autoplayMs}ms linear forwards`,
            }}
          />
        </div>
      )}

      {/* 장식 원 */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5 pointer-events-none" aria-hidden />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5 pointer-events-none" aria-hidden />

      {/* 슬라이드 stack - fade 전환 */}
      <div className="relative">
        {events.map((event, i) => (
          <Slide
            key={event.uid}
            event={event}
            active={i === active}
            index={i}
            total={count}
          />
        ))}
      </div>

      {/* 좌/우 네비게이션 */}
      {hasMany && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="이전 일정"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="다음 일정"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* 도트 인디케이터 */}
          <div className="absolute bottom-4 left-0 right-0 z-10 flex items-center justify-center gap-1.5">
            {events.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`${i + 1}번째 일정으로 이동`}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? 'w-6 bg-sunset' : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* progress animation keyframes */}
      <style jsx>{`
        @keyframes heroProgress {
          from {
            transform: scaleX(0);
            transform-origin: left center;
          }
          to {
            transform: scaleX(1);
            transform-origin: left center;
          }
        }
      `}</style>
    </div>
  );
}

/** 개별 슬라이드 (absolute로 겹치고 opacity로 전환) */
function Slide({
  event,
  active,
  index,
  total,
}: {
  event: CalendarEvent;
  active: boolean;
  index: number;
  total: number;
}) {
  const days = getDaysUntil(event);
  const isOngoing = event.status === 'ongoing';

  return (
    <div
      className={`transition-opacity duration-500 ease-out ${
        active ? 'relative opacity-100' : 'absolute inset-0 opacity-0 pointer-events-none'
      } p-8 md:p-12 pb-16 md:pb-16`}
      aria-hidden={!active}
      aria-roledescription="slide"
      aria-label={`${index + 1} / ${total}`}
    >
      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/60">
            {isOngoing ? 'Happening Now' : 'Upcoming'}
          </span>
          <div className="h-px flex-1 bg-white/20" />
          {!isOngoing && (
            <span className="text-2xl md:text-3xl font-extrabold text-sunset font-mono">
              {days === 0 ? 'D-DAY' : `D-${days}`}
            </span>
          )}
          {isOngoing && (
            <span className="text-sm font-bold px-3 py-1 rounded-full bg-sunset text-white">
              진행중
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <p className="text-white/70 text-sm md:text-base font-medium">
            {formatEventDate(event)}
          </p>
          {event.dayCount && event.dayCount > 1 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
              {event.dayCount}일 과정
            </span>
          )}
          {event.seriesTotal && event.seriesTotal > 1 && event.seriesIndex && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
              {event.seriesIndex}/{event.seriesTotal}회차
            </span>
          )}
        </div>

        <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mb-6">
          {event.title}
        </h2>

        {event.location && (
          <p className="text-white/60 text-sm flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {event.location}
          </p>
        )}

        {event.description && (
          <p className="text-white/50 text-sm max-w-2xl leading-relaxed mt-4 line-clamp-2 whitespace-pre-line">
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
}
