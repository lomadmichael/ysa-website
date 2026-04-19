import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { NOTICE_CATEGORY_LABEL, type Notice, type NoticeAttachment } from '@/lib/database.types';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// admin 수정 즉시 반영되도록 매 요청 렌더
export const dynamic = 'force-dynamic';

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

/** HTML 태그 제거해서 검색·SNS 미리보기용 요약 텍스트 생성 */
function stripHtml(html: string, maxLen = 160): string {
  if (!html) return '';
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length <= maxLen ? text : `${text.slice(0, maxLen)}…`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const notice = await getNotice(Number(id));
  if (!notice) {
    return { title: '공지사항' };
  }
  const summary = stripHtml(notice.content);
  return {
    title: notice.title,
    description: summary || `${notice.title} — 양양군서핑협회 공지사항.`,
    openGraph: {
      title: notice.title,
      description: summary || undefined,
      type: 'article',
      publishedTime: notice.created_at,
      url: `/notice/${notice.id}`,
    },
    alternates: {
      canonical: `/notice/${notice.id}`,
    },
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

          {/* Attachments */}
          {Array.isArray(notice.attachments) && notice.attachments.length > 0 && (
            <div className="mt-10 p-5 border border-foam rounded-xl bg-foam/20">
              <h2 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                </svg>
                첨부파일 ({notice.attachments.length})
              </h2>
              <ul className="space-y-2">
                {(notice.attachments as NoticeAttachment[]).map((att, idx) => (
                  <li key={`${att.url}-${idx}`}>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={att.name}
                      className="flex items-center gap-3 px-3 py-2 bg-white border border-foam rounded-lg hover:border-ocean hover:bg-white transition-colors group"
                    >
                      <span className="text-lg shrink-0" aria-hidden>📄</span>
                      <span className="flex-1 min-w-0 truncate text-sm text-navy group-hover:text-ocean">
                        {att.name}
                      </span>
                      <span className="text-xs text-navy/50 shrink-0">
                        {formatSize(att.size)}
                      </span>
                      <span className="text-xs text-ocean shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        다운로드
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
