import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { STATUS_LABEL, type Competition } from '@/lib/database.types';

export const metadata: Metadata = {
  title: '대회정보',
};

const tabs = [
  { label: '연간 일정', href: '/competitions', active: true },
  { label: '모집중 대회', href: '/competitions/open', active: false },
  { label: '종료된 대회', href: '/competitions/closed', active: false },
  { label: '결과·기록', href: '/competitions/results', active: false },
];

async function getCompetitions(): Promise<Competition[]> {
  try {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

const statusColor: Record<string, string> = {
  '모집중': 'bg-teal/10 text-teal',
  '진행중': 'bg-ocean/10 text-ocean',
  '종료': 'bg-navy/10 text-navy/50',
};

export default async function CompetitionsPage() {
  const competitions = await getCompetitions();

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
          </p>

          {competitions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-ocean/20">
                    <th className="text-left py-3 px-4 font-semibold text-navy">날짜</th>
                    <th className="text-left py-3 px-4 font-semibold text-navy">대회명</th>
                    <th className="text-left py-3 px-4 font-semibold text-navy hidden sm:table-cell">연도</th>
                    <th className="text-left py-3 px-4 font-semibold text-navy">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {competitions.map((comp) => {
                    const statusLabel = STATUS_LABEL[comp.status] || comp.status;
                    return (
                      <tr key={comp.id} className="border-b border-foam hover:bg-ocean/5 transition-colors">
                        <td className="py-3 px-4 text-navy/60 whitespace-nowrap">
                          {comp.schedule || new Date(comp.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/competitions/${comp.id}`} className="text-navy font-medium hover:text-ocean transition-colors">
                            {comp.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-navy/60 hidden sm:table-cell">{comp.year}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ${statusColor[statusLabel] || 'bg-foam text-navy/60'}`}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
