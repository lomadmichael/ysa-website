import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { type PressItem } from '@/lib/database.types';

export const metadata: Metadata = {
  title: '보도자료',
  description: '양양군서핑협회와 양양 서핑 문화에 대한 언론 보도자료. 대회·교육·행사 관련 기사 모음.',
};

// admin에서 수정 즉시 목록에 반영되도록 매 요청 렌더
export const dynamic = 'force-dynamic';

const subNav = [
  { label: '공지사항', href: '/notice', active: false },
  { label: '보도자료', href: '/notice/press', active: true },
  { label: '사진·영상', href: '/notice/gallery', active: false },
  { label: '규정·서식', href: '/notice/docs', active: false },
  { label: 'FAQ', href: '/notice/faq', active: false },
];

async function getPressItems(): Promise<PressItem[]> {
  try {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('press')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

/** HTML 태그 제거 후 간단 요약 텍스트로 변환 */
function stripHtml(html: string, maxLen = 140): string {
  if (!html) return '';
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

export default async function PressPage() {
  const items = await getPressItems();

  return (
    <>
      <PageHeader
        title="공지·자료실"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '공지·자료실', href: '/notice' },
          { label: '보도자료' },
        ]}
      />

      <section className="py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-4">
          <nav className="flex gap-1 border-b border-foam mb-10 overflow-x-auto">
            {subNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  item.active
                    ? 'border-ocean text-ocean'
                    : 'border-transparent text-navy/50 hover:text-navy hover:border-navy/20'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => {
                const summary = stripHtml(item.content ?? '');
                return (
                  <Link
                    key={item.id}
                    href={`/notice/press/${item.id}`}
                    className="block p-5 bg-white rounded-lg border border-foam hover:border-ocean/20 hover:bg-ocean/5 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {item.source && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-sm bg-ocean/10 text-ocean">
                              {item.source}
                            </span>
                          )}
                          <span className="text-xs text-navy/40">
                            {new Date(item.date).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <h3 className="text-[15px] text-navy font-medium group-hover:text-ocean transition-colors mb-1">
                          {item.title}
                        </h3>
                        {summary && (
                          <p className="text-xs text-navy/55 leading-relaxed line-clamp-2">
                            {summary}
                          </p>
                        )}
                      </div>
                      {item.url && (
                        <span
                          className="shrink-0 inline-flex items-center gap-1 text-[11px] text-navy/40 mt-1"
                          title="원문 링크가 있습니다"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                          원문
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-navy/40">
              <div className="w-16 h-16 rounded-full bg-foam flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-navy/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z" />
                </svg>
              </div>
              <p className="text-[15px] font-medium mb-1">등록된 보도자료가 없습니다.</p>
              <p className="text-sm text-navy/30">보도자료가 등록되면 이곳에서 확인하실 수 있습니다.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
