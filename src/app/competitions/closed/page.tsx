import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { type Competition } from '@/lib/database.types';

export const metadata: Metadata = {
  title: '종료된 대회',
};

const tabs = [
  { label: '연간 일정', href: '/competitions', active: false },
  { label: '모집중 대회', href: '/competitions/open', active: false },
  { label: '종료된 대회', href: '/competitions/closed', active: true },
  { label: '결과·기록', href: '/competitions/results', active: false },
];

async function getClosedCompetitions(): Promise<Competition[]> {
  try {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .eq('status', 'closed')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function CompetitionsClosedPage() {
  const competitions = await getClosedCompetitions();

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

          {competitions.length > 0 ? (
            <div className="space-y-3">
              {competitions.map((comp) => (
                <Link
                  key={comp.id}
                  href={`/competitions/${comp.id}`}
                  className="flex items-center gap-4 p-5 bg-white rounded-lg border border-foam hover:border-ocean/20 hover:bg-ocean/5 transition-colors group"
                >
                  <span className="text-xs font-medium px-2 py-0.5 rounded-sm bg-navy/10 text-navy/50 shrink-0">종료</span>
                  <span className="text-[15px] text-navy font-medium group-hover:text-ocean transition-colors truncate flex-1">
                    {comp.name}
                  </span>
                  <span className="text-xs text-navy/40 shrink-0 hidden sm:block">
                    {comp.schedule || comp.year}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-navy/40">
              <div className="w-16 h-16 rounded-full bg-foam flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-navy/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-[15px] font-medium mb-1">종료된 대회 내역이 없습니다.</p>
              <p className="text-sm text-navy/30">대회가 종료되면 이곳에서 확인하실 수 있습니다.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
