import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import {
  categorizeEvent,
  fetchCalendarEvents,
  formatEventDate,
  type EventCategory,
} from '@/lib/google-calendar';

export const metadata: Metadata = {
  title: '종료된 일정',
  description: '양양군서핑협회에서 진행이 완료된 대회·교육·행사 일정 아카이브.',
};

export const revalidate = 3600;

const tabs = [
  { label: '연간 일정', href: '/schedule', active: false },
  { label: '모집중 일정', href: '/schedule/open', active: false },
  { label: '종료된 일정', href: '/schedule/closed', active: true },
];

/**
 * 카테고리별 좌측 컬러 바 + 라벨 뱃지 색상
 */
const CATEGORY_META: Record<EventCategory, { label: string; bar: string; badge: string }> = {
  competition: { label: '대회', bar: 'bg-sunset', badge: 'bg-sunset/10 text-sunset' },
  education: { label: '교육', bar: 'bg-ocean', badge: 'bg-ocean/10 text-ocean' },
  event: { label: '접수', bar: 'bg-teal', badge: 'bg-teal/10 text-teal' },
};

export default async function ScheduleClosedPage() {
  const allEvents = await fetchCalendarEvents();
  // 종료 = past 상태 (최신순으로 역정렬)
  const events = allEvents
    .filter((e) => e.status === 'past')
    .sort((a, b) => b.start.getTime() - a.start.getTime());

  return (
    <>
      <PageHeader
        title="일정안내"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '일정안내', href: '/schedule' },
          { label: '종료된 일정' },
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
            양양군서핑협회가 운영하거나 연계했던 종료된 일정 목록입니다.
          </p>

          {events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => {
                const category = event.category ?? categorizeEvent(event);
                const catMeta = CATEGORY_META[category];
                return (
                  <div
                    key={event.uid}
                    className="relative overflow-hidden flex items-center gap-3 sm:gap-4 p-4 sm:p-5 pl-5 sm:pl-6 bg-white rounded-lg border border-foam hover:border-ocean/20 transition-colors"
                  >
                    {/* 좌측 카테고리 컬러 바 */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${catMeta.bar}`}
                      aria-hidden
                    />
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm shrink-0 ${catMeta.badge}`}
                    >
                      {catMeta.label}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-sm bg-navy/10 text-navy/50 shrink-0">
                      종료
                    </span>
                    <span className="text-[14px] sm:text-[15px] text-navy font-medium truncate flex-1 min-w-0">
                      {event.title}
                    </span>
                    <span className="text-xs text-navy/40 shrink-0 hidden sm:block">
                      {formatEventDate(event)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-navy/40">
              <div className="w-16 h-16 rounded-full bg-foam flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-navy/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-[15px] font-medium mb-1">종료된 일정 내역이 없습니다.</p>
              <p className="text-sm text-navy/30">일정이 종료되면 이곳에서 확인하실 수 있습니다.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
