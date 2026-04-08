import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { STATUS_LABEL, type Competition } from '@/lib/database.types';

const statusColor: Record<string, string> = {
  '모집중': 'bg-teal/10 text-teal',
  '진행중': 'bg-ocean/10 text-ocean',
  '종료': 'bg-navy/10 text-navy/50',
};

async function getCompetition(id: number): Promise<Competition | null> {
  try {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const competition = await getCompetition(Number(id));
  return {
    title: competition?.name || '대회정보',
  };
}

export default async function CompetitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const competition = await getCompetition(Number(id));

  if (!competition) {
    notFound();
  }

  const statusLabel = STATUS_LABEL[competition.status] || competition.status;

  return (
    <>
      <PageHeader
        title="대회정보"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '대회정보', href: '/competitions' },
          { label: competition.name },
        ]}
      />

      <section className="py-16 md:py-24">
        <div className="max-w-[800px] mx-auto px-4">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-foam">
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ${statusColor[statusLabel] || 'bg-foam text-navy/60'}`}>
                {statusLabel}
              </span>
              <span className="text-xs text-navy/40">{competition.year}년</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-navy mb-3">
              {competition.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-navy/50">
              {competition.schedule && <span>{competition.schedule}</span>}
              <span>{new Date(competition.created_at).toLocaleDateString('ko-KR')} 등록</span>
            </div>
          </div>

          {/* Image */}
          {competition.image_url && (
            <div className="mb-8 rounded-lg overflow-hidden bg-foam">
              <img src={competition.image_url} alt={competition.name} className="w-full object-cover" />
            </div>
          )}

          {/* Description */}
          <div
            className="prose prose-sm max-w-none text-navy/80 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: competition.description }}
          />

          {/* Result */}
          {competition.result && (
            <div className="mt-8 p-6 bg-foam/50 rounded-lg">
              <h3 className="text-sm font-semibold text-navy mb-3">대회 결과</h3>
              <div
                className="prose prose-sm max-w-none text-navy/70"
                dangerouslySetInnerHTML={{ __html: competition.result }}
              />
            </div>
          )}

          {/* Back Button */}
          <div className="mt-12 pt-6 border-t border-foam">
            <Link
              href="/competitions"
              className="inline-flex items-center gap-2 text-sm font-medium text-ocean hover:underline"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              목록으로 돌아가기
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
