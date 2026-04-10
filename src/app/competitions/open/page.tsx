import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { fetchCalendarEvents, formatEventDate } from '@/lib/google-calendar';

export const metadata: Metadata = {
  title: '모집중 대회',
};

export const revalidate = 3600;

const tabs = [
  { label: '연간 일정', href: '/competitions', active: false },
  { label: '모집중 대회', href: '/competitions/open', active: true },
  { label: '종료된 대회', href: '/competitions/closed', active: false },
  { label: '결과·기록', href: '/competitions/results', active: false },
];

export default async function CompetitionsOpenPage() {
  const allEvents = await fetchCalendarEvents();
  // 모집중 = 예정 + 진행중 (오늘 이후 일정)
  const events = allEvents.filter(
    (e) => e.status === 'upcoming' || e.status === 'ongoing',
  );

  return (
    <>
      <PageHeader
        title="대회정보"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '대회정보', href: '/competitions' },
          { label: '모집중 대회' },
        ]}
      />

      <section className="py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-4">
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
            현재 모집중이거나 진행중인 대회 목록입니다.
          </p>

          {events.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {events.map((event) => (
                <div
                  key={event.uid}
                  className="block bg-white border border-foam rounded-lg p-6 hover:border-ocean/20 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-sm ${
                        event.status === 'ongoing'
                          ? 'bg-sunset/10 text-sunset'
                          : 'bg-teal/10 text-teal'
                      }`}
                    >
                      {event.status === 'ongoing' ? '진행중' : '예정'}
                    </span>
                    <span className="text-xs text-navy/50 font-medium">
                      {formatEventDate(event)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-navy mb-2">
                    {event.title}
                  </h3>
                  {event.location && (
                    <p className="text-xs text-navy/50 mb-2">📍 {event.location}</p>
                  )}
                  {event.description && (
                    <p className="text-sm text-navy/60 line-clamp-3 leading-relaxed">
                      {event.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-navy/40">
              <div className="w-16 h-16 rounded-full bg-foam flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-navy/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-[15px] font-medium mb-1">현재 모집중인 대회가 없습니다.</p>
              <p className="text-sm text-navy/30">
                <Link href="/competitions" className="text-ocean hover:underline">
                  연간 일정
                </Link>
                에서 전체 대회 정보를 확인하실 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
