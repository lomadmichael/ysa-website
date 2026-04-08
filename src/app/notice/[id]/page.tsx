import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { NOTICE_CATEGORY_LABEL, type Notice } from '@/lib/database.types';

const categoryColor: Record<string, string> = {
  '대회': 'bg-sunset/10 text-sunset',
  '교육': 'bg-teal/10 text-teal',
  '행사': 'bg-ocean/10 text-ocean',
  '협회': 'bg-navy/10 text-navy',
};

async function getNotice(id: number): Promise<Notice | null> {
  try {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('notices')
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
  const notice = await getNotice(Number(id));
  return {
    title: notice?.title || '공지사항',
  };
}

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notice = await getNotice(Number(id));

  if (!notice) {
    notFound();
  }

  const categoryLabel = NOTICE_CATEGORY_LABEL[notice.category] || notice.category;

  return (
    <>
      <PageHeader
        title="공지·자료실"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '공지·자료실', href: '/notice' },
          { label: '공지사항', href: '/notice' },
          { label: notice.title },
        ]}
      />

      <section className="py-16 md:py-24">
        <div className="max-w-[800px] mx-auto px-4">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-foam">
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ${categoryColor[categoryLabel] || 'bg-foam text-navy/60'}`}>
                {categoryLabel}
              </span>
              {notice.pinned && (
                <span className="text-sunset text-xs font-bold">고정</span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-navy mb-3">
              {notice.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-navy/50">
              <span>{new Date(notice.created_at).toLocaleDateString('ko-KR')}</span>
              {notice.author && <span>{notice.author}</span>}
            </div>
          </div>

          {/* Content */}
          <div
            className="prose prose-sm max-w-none text-navy/80 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: notice.content }}
          />

          {/* Back Button */}
          <div className="mt-12 pt-6 border-t border-foam">
            <Link
              href="/notice"
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
