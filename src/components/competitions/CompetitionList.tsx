'use client';

import { useMemo, useState } from 'react';
import type { CalendarEvent, EventCategory } from '@/lib/calendar-utils';
import { categorizeEvent, formatEventDate, getDaysUntil } from '@/lib/calendar-utils';

interface Props {
  events: CalendarEvent[];
}

const STATUS_LABEL: Record<CalendarEvent['status'], string> = {
  upcoming: '예정',
  ongoing: '진행중',
  past: '종료',
};

const STATUS_BADGE: Record<CalendarEvent['status'], string> = {
  upcoming: 'bg-teal/10 text-teal',
  ongoing: 'bg-sunset/10 text-sunset',
  past: 'bg-navy/10 text-navy/40',
};

/**
 * 카테고리별 색상 체계
 * - 대회: sunset (주황) - 임팩트 강조
 * - 교육: ocean (파랑) - 학습·성장
 * - 접수: teal (청록) - 참가 신청
 */
const CATEGORY_META: Record<
  EventCategory,
  { label: string; chip: string; chipActive: string; bar: string; badge: string }
> = {
  competition: {
    label: '대회',
    chip: 'border-sunset/30 text-sunset hover:bg-sunset/5',
    chipActive: 'border-sunset bg-sunset text-white',
    bar: 'bg-sunset',
    badge: 'bg-sunset/10 text-sunset',
  },
  education: {
    label: '교육',
    chip: 'border-ocean/30 text-ocean hover:bg-ocean/5',
    chipActive: 'border-ocean bg-ocean text-white',
    bar: 'bg-ocean',
    badge: 'bg-ocean/10 text-ocean',
  },
  event: {
    label: '접수',
    chip: 'border-teal/30 text-teal hover:bg-teal/5',
    chipActive: 'border-teal bg-teal text-white',
    bar: 'bg-teal',
    badge: 'bg-teal/10 text-teal',
  },
};

type Filter = 'all' | EventCategory;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'competition', label: '대회' },
  { value: 'education', label: '교육' },
  { value: 'event', label: '접수' },
];

/** 서버에서 category를 못 받은 이벤트(legacy) 대비 fallback */
function resolveCategory(event: CalendarEvent): EventCategory {
  return event.category ?? categorizeEvent(event);
}

function formatDDay(event: CalendarEvent): string {
  if (event.status === 'ongoing') return '진행중';
  if (event.status === 'past') return '종료';
  const days = getDaysUntil(event);
  if (days === 0) return 'D-Day';
  return `D-${days}`;
}

/** KST 기준 연/월 추출 */
function getKstYearMonth(date: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  return { year, month };
}

export default function CompetitionList({ events }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return events;
    return events.filter((e) => resolveCategory(e) === filter);
  }, [events, filter]);

  // 월별 그룹화
  const monthGroups = useMemo(() => {
    const map = new Map<string, { year: number; month: number; events: CalendarEvent[] }>();
    for (const event of filtered) {
      const { year, month } = getKstYearMonth(event.start);
      const key = `${year}-${String(month).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, { year, month, events: [] });
      map.get(key)!.events.push(event);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [filtered]);

  const filterCounts = useMemo(() => {
    const counts: Record<Filter, number> = {
      all: events.length,
      competition: 0,
      education: 0,
      event: 0,
    };
    for (const e of events) counts[resolveCategory(e)]++;
    return counts;
  }, [events]);

  return (
    <div>
      {/* 필터 */}
      <div className="flex flex-wrap gap-2 mb-10">
        {FILTERS.map((f) => {
          const isActive = filter === f.value;
          const meta = f.value === 'all' ? null : CATEGORY_META[f.value];
          const baseClass = 'px-4 py-2 text-sm font-medium rounded-full border transition-colors';
          let className: string;
          if (f.value === 'all') {
            className = isActive
              ? `${baseClass} border-navy bg-navy text-white`
              : `${baseClass} border-foam bg-white text-navy/70 hover:border-navy/30`;
          } else {
            className = `${baseClass} ${isActive ? meta!.chipActive : `bg-white ${meta!.chip}`}`;
          }
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={className}
            >
              {f.label}
              <span
                className={`ml-1.5 text-[11px] font-normal ${
                  isActive ? 'text-white/70' : 'text-current opacity-60'
                }`}
              >
                {filterCounts[f.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* 월별 그룹 */}
      {monthGroups.length > 0 ? (
        <div className="space-y-16">
          {monthGroups.map((group) => (
            <div key={`${group.year}-${group.month}`}>
              <div className="flex items-baseline gap-3 mb-6 pb-3 border-b-2 border-ocean/20">
                <h2 className="text-2xl md:text-3xl font-bold text-navy">
                  {group.year}년 {group.month}월
                </h2>
                <span className="text-xs text-navy/40 font-medium">
                  {group.events.length}개 일정
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {group.events.map((event) => {
                  const isToday = event.status === 'ongoing';
                  const category = resolveCategory(event);
                  const catMeta = CATEGORY_META[category];
                  return (
                    <div
                      key={event.uid}
                      className={`group relative overflow-hidden rounded-2xl p-6 pl-7 transition-all ${
                        isToday
                          ? 'bg-sunset/5 border-2 border-sunset/40 shadow-sm'
                          : 'bg-white border border-foam hover:border-ocean/30 hover:shadow-sm'
                      }`}
                    >
                      {/* 카테고리 좌측 컬러 바 */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1.5 ${catMeta.bar}`}
                        aria-hidden
                      />

                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm ${catMeta.badge}`}
                        >
                          {catMeta.label}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm ${STATUS_BADGE[event.status]}`}
                        >
                          {STATUS_LABEL[event.status]}
                        </span>
                        {event.status === 'upcoming' && (
                          <span className="text-[11px] font-mono font-semibold text-sunset">
                            {formatDDay(event)}
                          </span>
                        )}
                        {isToday && (
                          <span className="text-[11px] font-bold text-sunset uppercase tracking-wider">
                            Today
                          </span>
                        )}
                        {event.totalSessions && event.totalSessions > 1 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-ocean/10 text-ocean">
                            {event.totalSessions}회 과정
                          </span>
                        )}
                        {!event.totalSessions && event.dayCount && event.dayCount > 1 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-ocean/10 text-ocean">
                            {event.dayCount}일 과정
                          </span>
                        )}
                        {event.seriesTotal && event.seriesTotal > 1 && event.seriesIndex && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-navy/10 text-navy/70">
                            {event.seriesIndex}/{event.seriesTotal}회차
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-navy/50 font-medium mb-2">
                        {formatEventDate(event)}
                      </p>
                      <h3
                        className={`text-[15px] font-bold leading-snug mb-2 transition-colors ${
                          isToday ? 'text-sunset' : 'text-navy group-hover:text-ocean'
                        }`}
                      >
                        {event.title}
                      </h3>
                      {event.location && (
                        <p className="text-xs text-navy/50 mt-2 flex items-start gap-1">
                          <span className="shrink-0">📍</span>
                          <span className="line-clamp-1">{event.location}</span>
                        </p>
                      )}
                      {event.description && (
                        <p className="text-xs text-navy/55 mt-2 leading-relaxed line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-navy/50">
          <p className="text-[15px] mb-2">
            {filter === 'all'
              ? '예정된 일정이 없습니다.'
              : `${FILTERS.find((f) => f.value === filter)?.label} 카테고리에 예정된 일정이 없습니다.`}
          </p>
          {filter !== 'all' && (
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="text-sm text-ocean hover:underline"
            >
              전체 일정 보기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
