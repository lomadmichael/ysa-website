import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import CompetitionList from '@/components/competitions/CompetitionList';
import HeroSlider from '@/components/schedule/HeroSlider';
import { fetchCalendarEvents, type CalendarEvent } from '@/lib/google-calendar';

export const metadata: Metadata = {
  title: '일정안내',
};

export const revalidate = 3600;

const tabs = [
  { label: '연간 일정', href: '/schedule', active: true },
  { label: '모집중 일정', href: '/schedule/open', active: false },
  { label: '종료된 일정', href: '/schedule/closed', active: false },
];

/** 30일 이내 시작하는 upcoming/ongoing 이벤트 */
function getHeroEvents(events: CalendarEvent[]): CalendarEvent[] {
  const now = Date.now();
  const windowMs = 30 * 24 * 60 * 60 * 1000;
  const cutoff = now + windowMs;
  return events
    .filter((e) => e.status !== 'past' && e.start.getTime() <= cutoff)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export default async function SchedulePage() {
  const events = await fetchCalendarEvents();

  // Hero 슬라이더: 30일 이내 이벤트
  const heroEvents = getHeroEvents(events);

  // 미래 일정만 (과거는 /schedule/closed에서)
  const futureEvents = events.filter((e) => e.status !== 'past');

  return (
    <>
      <PageHeader
        title="일정안내"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '일정안내' },
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
              {/* Hero 슬라이더: 30일 이내 이벤트 순환 */}
              <HeroSlider events={heroEvents} />

              {/* 필터 + 월별 섹션 (클라이언트) */}
              {futureEvents.length > 0 ? (
                <CompetitionList events={futureEvents} />
              ) : (
                <div className="text-center py-16 text-navy/50">
                  <p className="text-[15px] mb-2">예정된 일정이 없습니다.</p>
                  <Link href="/schedule/closed" className="text-sm text-ocean hover:underline">
                    종료된 일정 보기 →
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
              <p className="text-[15px] font-medium mb-1">현재 등록된 일정이 없습니다.</p>
              <p className="text-sm text-navy/30">새로운 일정이 등록되면 이곳에서 확인하실 수 있습니다.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
