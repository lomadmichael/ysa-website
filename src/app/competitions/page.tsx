import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import CompetitionList from '@/components/competitions/CompetitionList';
import {
  fetchCalendarEvents,
  formatEventDate,
  getDaysUntil,
  type CalendarEvent,
} from '@/lib/google-calendar';

export const metadata: Metadata = {
  title: '대회정보',
};

export const revalidate = 3600;

const tabs = [
  { label: '연간 일정', href: '/competitions', active: true },
  { label: '모집중 대회', href: '/competitions/open', active: false },
  { label: '종료된 대회', href: '/competitions/closed', active: false },
  { label: '결과·기록', href: '/competitions/results', active: false },
];

function HeroNextEvent({ event }: { event: CalendarEvent }) {
  const days = getDaysUntil(event);
  const isOngoing = event.status === 'ongoing';

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-8 md:p-12 mb-16"
      style={{ backgroundColor: '#393d7d' }}
    >
      {/* 장식 원 */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" aria-hidden />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5" aria-hidden />

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/60">
            {isOngoing ? 'Happening Now' : 'Next Event'}
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
          <p className="text-white/50 text-sm max-w-2xl leading-relaxed mt-4 line-clamp-2">
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default async function CompetitionsPage() {
  const events = await fetchCalendarEvents();

  // 다음 이벤트: ongoing 우선, 없으면 upcoming 첫 번째
  const nextEvent =
    events.find((e) => e.status === 'ongoing') ??
    events.find((e) => e.status === 'upcoming') ??
    null;

  // 미래 일정만 (과거는 /competitions/closed에서)
  const futureEvents = events.filter((e) => e.status !== 'past');

  return (
    <>
      <PageHeader
        title="대회정보"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '대회정보' },
        ]}
      />

      <section className="py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-4">
          {/* Tab Navigation */}
          <nav className="flex gap-1 border-b border-foam mb-10 overflow-x-auto">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab.active
                    ? 'border-ocean text-ocean'
                    : 'border-transparent text-navy/50 hover:text-navy hover:border-navy/20'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {events.length > 0 ? (
            <>
              {/* Hero: Next Event */}
              {nextEvent && <HeroNextEvent event={nextEvent} />}

              {/* 필터 + 월별 섹션 (클라이언트) */}
              {futureEvents.length > 0 ? (
                <CompetitionList events={futureEvents} />
              ) : (
                <div className="text-center py-16 text-navy/50">
                  <p className="text-[15px] mb-2">예정된 대회가 없습니다.</p>
                  <Link href="/competitions/closed" className="text-sm text-ocean hover:underline">
                    종료된 대회 보기 →
                  </Link>
                </div>
              )}

              <p className="text-xs text-navy/40 text-center mt-16">
                일정은 파도와 기상 조건에 따라 변경될 수 있습니다.
              </p>
            </>
          ) : (
            <div className="text-center py-20 text-navy/40">
              <div className="w-16 h-16 rounded-full bg-foam flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-navy/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <p className="text-[15px] font-medium mb-1">현재 등록된 대회 일정이 없습니다.</p>
              <p className="text-sm text-navy/30">새로운 대회가 등록되면 이곳에서 확인하실 수 있습니다.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
