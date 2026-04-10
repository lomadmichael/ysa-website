import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import {
  fetchCalendarEvents,
  formatEventDate,
  groupEventsByYear,
  type CalendarEvent,
} from '@/lib/google-calendar';

export const metadata: Metadata = {
  title: '대회정보',
};

// ISR: 1시간마다 재검증
export const revalidate = 3600;

const tabs = [
  { label: '연간 일정', href: '/competitions', active: true },
  { label: '모집중 대회', href: '/competitions/open', active: false },
  { label: '종료된 대회', href: '/competitions/closed', active: false },
  { label: '결과·기록', href: '/competitions/results', active: false },
];

const STATUS_LABEL: Record<CalendarEvent['status'], string> = {
  upcoming: '예정',
  ongoing: '진행중',
  past: '종료',
};

const STATUS_COLOR: Record<CalendarEvent['status'], string> = {
  upcoming: 'bg-teal/10 text-teal',
  ongoing: 'bg-sunset/10 text-sunset',
  past: 'bg-navy/10 text-navy/40',
};

export default async function CompetitionsPage() {
  const events = await fetchCalendarEvents();
  const grouped = groupEventsByYear(events);
  const years = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a); // 최신 연도 위로

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

          <p className="text-navy/70 mb-10 text-[15px] leading-relaxed">
            양양군서핑협회가 운영하거나 연계하는 주요 대회 정보를 안내합니다.
            일정은 파도와 기상 조건에 따라 변경될 수 있습니다.
          </p>

          {events.length > 0 ? (
            <div className="space-y-16">
              {years.map((year) => (
                <div key={year}>
                  <h2 className="text-2xl md:text-3xl font-bold text-navy mb-6 pb-3 border-b-2 border-ocean/20">
                    {year}
                  </h2>
                  <ul className="divide-y divide-foam">
                    {grouped[year].map((event) => (
                      <li key={event.uid}>
                        <div className="flex flex-col md:flex-row md:items-start md:gap-6 py-5">
                          <div className="md:w-52 shrink-0 mb-2 md:mb-0">
                            <p className="text-sm font-semibold text-navy/80">
                              {formatEventDate(event)}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${STATUS_COLOR[event.status]}`}
                              >
                                {STATUS_LABEL[event.status]}
                              </span>
                              <h3 className="text-[15px] font-semibold text-navy">
                                {event.title}
                              </h3>
                            </div>
                            {event.location && (
                              <p className="text-xs text-navy/50 mt-1">
                                📍 {event.location}
                              </p>
                            )}
                            {event.description && (
                              <p className="text-sm text-navy/60 mt-2 leading-relaxed line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
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
