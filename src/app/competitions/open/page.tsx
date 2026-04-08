import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { type Competition } from '@/lib/database.types';

export const metadata: Metadata = {
  title: '모집중 대회',
};

const tabs = [
  { label: '연간 일정', href: '/competitions', active: false },
  { label: '모집중 대회', href: '/competitions/open', active: true },
  { label: '종료된 대회', href: '/competitions/closed', active: false },
  { label: '결과·기록', href: '/competitions/results', active: false },
];

async function getRecruitingCompetitions(): Promise<Competition[]> {
  try {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .eq('status', 'recruiting')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function CompetitionsOpenPage() {
  const competitions = await getRecruitingCompetitions();

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

          {competitions.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {competitions.map((comp) => (
                <Link
                  key={comp.id}
                  href={`/competitions/${comp.id}`}
                  className="block bg-white border border-foam rounded-lg p-6 hover:border-ocean/20 hover:bg-ocean/5 transition-colors group"
                >
                  {comp.image_url && (
                    <div className="aspect-video rounded-md overflow-hidden mb-4 bg-foam">
                      <img src={comp.image_url} alt={comp.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-sm bg-teal/10 text-teal">모집중</span>
                    {comp.schedule && <span className="text-xs text-navy/40">{comp.schedule}</span>}
                  </div>
                  <h3 className="text-lg font-semibold text-navy group-hover:text-ocean transition-colors">{comp.name}</h3>
                  <p className="text-sm text-navy/60 mt-2 line-clamp-2">{comp.description}</p>
                </Link>
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
              <p className="text-sm text-navy/30">모집이 시작되면 이곳에서 확인하실 수 있습니다.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
