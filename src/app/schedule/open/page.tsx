import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import CompetitionList from '@/components/competitions/CompetitionList';
import { fetchCalendarEvents } from '@/lib/google-calendar';

export const metadata: Metadata = {
  title: '모집중 일정',
};

export const revalidate = 3600;

const tabs = [
  { label: '연간 일정', href: '/schedule', active: false },
  { label: '모집중 일정', href: '/schedule/open', active: true },
  { label: '종료된 일정', href: '/schedule/closed', active: false },
  { label: '결과·기록', href: '/schedule/results', active: false },
];

export default async function ScheduleOpenPage() {
  const allEvents = await fetchCalendarEvents();
  // 모집중 = 예정 + 진행중 (오늘 이후 일정)
  const events = allEvents.filter(
    (e) => e.status === 'upcoming' || e.status === 'ongoing',
  );

  return (
    <>
      <PageHeader
        title="일정안내"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '일정안내', href: '/schedule' },
          { label: '모집중 일정' },
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
            현재 모집중이거나 진행중인 일정 목록입니다.
          </p>

          {events.length > 0 ? (
            <CompetitionList events={events} />
          ) : (
            <div className="text-center py-20 text-navy/40">
              <div className="w-16 h-16 rounded-full bg-foam flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-navy/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-[15px] font-medium mb-1">현재 모집중인 일정이 없습니다.</p>
              <p className="text-sm text-navy/30">
                <Link href="/schedule" className="text-ocean hover:underline">
                  연간 일정
                </Link>
                에서 전체 일정 정보를 확인하실 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
