'use client';

import { useMemo, useState } from 'react';
import type { CalendarEvent } from '@/lib/calendar-utils';
import { formatEventDate, getDaysUntil } from '@/lib/calendar-utils';

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

/** 제목/설명 키워드로 카테고리 자동 분류 */
function categorize(event: CalendarEvent): 'competition' | 'education' | 'event' {
  const text = `${event.title} ${event.description}`.toLowerCase();
  if (/대회|페스티벌|championship|cup|배/i.test(text)) return 'competition';
  if (/교육|강습|워크샵|training|교실|course/i.test(text)) return 'education';
  return 'event';
}

type Filter = 'all' | 'competition' | 'education' | 'event';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'competition', label: '대회' },
  { value: 'education', label: '교육' },
  { value: 'event', label: '행사' },
];

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
    return events.filter((e) => categorize(e) === filter);
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
    for (const e of events) counts[categorize(e)]++;
    return counts;
  }, [events]);

  return (
    <div>
      {/* 필터 */}
      <div className="flex flex-wrap gap-2 mb-10">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
              filter === f.value
                ? 'border-ocean bg-ocean text-white'
                : 'border-foam bg-white text-navy/70 hover:border-ocean/30 hover:text-ocean'
            }`}
          >
            {f.label}
            <span className={`ml-1.5 text-[11px] font-normal ${
              filter === f.value ? 'text-white/70' : 'text-navy/30'
            }`}>
              {filterCounts[f.value]}
            </span>
          </button>
        ))}
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
                  return (
                    <div
                      key={event.uid}
                      className={`group rounded-2xl p-6 transition-all ${
                        isToday
                          ? 'bg-sunset/5 border-2 border-sunset/40 shadow-sm'
                          : 'bg-white border border-foam hover:border-ocean/30 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
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
                        {event.dayCount && event.dayCount > 1 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-ocean/10 text-ocean">
                            {event.dayCount}일 과정
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
