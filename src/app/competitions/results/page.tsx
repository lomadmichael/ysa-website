import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '결과·기록',
};

const tabs = [
  { label: '연간 일정', href: '/competitions', active: false },
  { label: '모집중 대회', href: '/competitions/open', active: false },
  { label: '종료된 대회', href: '/competitions/closed', active: false },
  { label: '결과·기록', href: '/competitions/results', active: true },
];

export default function CompetitionsResultsPage() {
  return (
    <>
      <PageHeader
        title="대회정보"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '대회정보', href: '/competitions' },
          { label: '결과·기록' },
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

          {/* Empty State */}
          <div className="text-center py-20 text-navy/40">
            <div className="w-16 h-16 rounded-full bg-foam flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-navy/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.996.178-1.768.563-2.15 1.106a2.182 2.182 0 0 0-.126.224M18.75 4.236c.996.178 1.768.563 2.15 1.106.057.085.106.147.126.224M12 2.25a2.25 2.25 0 0 0-2.25 2.25v.894m4.5 0V4.5A2.25 2.25 0 0 0 12 2.25Z" />
              </svg>
            </div>
            <p className="text-[15px] font-medium mb-1">등록된 대회 결과가 없습니다.</p>
            <p className="text-sm text-navy/30">대회 결과가 등록되면 이곳에서 확인하실 수 있습니다.</p>
          </div>
        </div>
      </section>
    </>
  );
}
