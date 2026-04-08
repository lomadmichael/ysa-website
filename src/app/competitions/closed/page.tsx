import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '종료된 대회',
};

const tabs = [
  { label: '연간 일정', href: '/competitions', active: false },
  { label: '모집중 대회', href: '/competitions/open', active: false },
  { label: '종료된 대회', href: '/competitions/closed', active: true },
  { label: '결과·기록', href: '/competitions/results', active: false },
];

export default function CompetitionsClosedPage() {
  return (
    <>
      <PageHeader
        title="대회정보"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '대회정보', href: '/competitions' },
          { label: '종료된 대회' },
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <p className="text-[15px] font-medium mb-1">종료된 대회 내역이 없습니다.</p>
            <p className="text-sm text-navy/30">대회가 종료되면 이곳에서 확인하실 수 있습니다.</p>
          </div>
        </div>
      </section>
    </>
  );
}
