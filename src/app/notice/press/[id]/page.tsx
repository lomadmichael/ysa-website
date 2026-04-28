import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { PressItem } from '@/lib/database.types';

// 보도자료 수정 즉시 반영되도록 매 요청 렌더
export const dynamic = 'force-dynamic';

async function getPressItem(id: number): Promise<PressItem | null> {
  try {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('press')
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getPressItem(Number(id));
  if (!item) {
    return { title: '보도자료' };
  }
  const summary = stripHtml(item.content ?? '');
  const descPrefix = item.source ? `[${item.source}] ` : '';
  return {
    title: item.title,
    description: summary || `${descPrefix}${item.title} — 양양군서핑협회 보도자료.`,
    openGraph: {
      title: item.title,
      description: summary || undefined,
      type: 'article',
      publishedTime: item.date,
      url: `/notice/press/${item.id}`,
      images: item.thumbnail_url ? [item.thumbnail_url] : undefined,
    },
    alternates: {
      canonical: `/notice/press/${item.id}`,
    },
  };
}

function isSupabaseUrl(url: string | null): boolean {
  if (!url) return false;
  return /\.supabase\.co\//i.test(url);
}

export default async function PressDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getPressItem(Number(id));

  if (!item) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title="공지·자료실"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '공지·자료실', href: '/notice' },
          { label: '보도자료', href: '/notice/press' },
          { label: item.title },
        ]}
      />

      <section className="py-16 md:py-24">
        <div className="max-w-[800px] mx-auto px-4">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-foam">
            <div className="flex items-center gap-3 mb-4">
              {item.source && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-sm bg-ocean/10 text-ocean">
                  {item.source}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-navy mb-3">
              {item.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-navy/50">
              <span>{new Date(item.date).toLocaleDateString('ko-KR')}</span>
            </div>
          </div>

          {/* 대표 이미지 */}
          {item.thumbnail_url && (
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-8 bg-foam">
              <Image
                src={item.thumbnail_url}
                alt={item.title}
                fill
                priority
                sizes="(max-width: 800px) 100vw, 800px"
                className="object-cover"
                unoptimized={!isSupabaseUrl(item.thumbnail_url)}
              />
            </div>
          )}

          {/* Body Content (HTML from TiptapEditor) */}
          {item.content && item.content.trim().length > 0 ? (
            <div
              className="prose prose-sm max-w-none text-navy/80 leading-relaxed mb-8"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          ) : (
            <p className="text-navy/40 text-sm italic mb-8">
              본문 내용이 없습니다.
            </p>
          )}

          {/* 원문 보기 버튼 */}
          {item.url && (
            <div className="mt-8 p-5 bg-ocean/5 rounded-lg border border-ocean/10">
              <p className="text-xs font-semibold text-navy/60 uppercase tracking-wider mb-2">
                원문 기사
              </p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-ocean hover:underline break-all"
              >
                {item.url}
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-12 pt-6 border-t border-foam">
            <Link
              href="/notice/press"
              className="inline-flex items-center gap-2 text-sm font-medium text-ocean hover:underline"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              보도자료 목록으로
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
