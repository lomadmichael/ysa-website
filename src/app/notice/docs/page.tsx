import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { type DocumentItem } from '@/lib/database.types';

export const metadata: Metadata = {
  title: '규정·서식',
  description: '양양군서핑협회 규정, 정관, 신청서, 서식 등 공식 문서 다운로드 자료실.',
};

// admin에서 수정 즉시 목록에 반영되도록 매 요청 렌더
export const dynamic = 'force-dynamic';

const subNav = [
  { label: '공지사항', href: '/notice', active: false },
  { label: '보도자료', href: '/notice/press', active: false },
  { label: '사진·영상', href: '/notice/gallery', active: false },
  { label: '규정·서식', href: '/notice/docs', active: true },
  { label: 'FAQ', href: '/notice/faq', active: false },
];

async function getDocuments(): Promise<DocumentItem[]> {
  try {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractExtension(fileName: string | null): string {
  if (!fileName) return '파일';
  const dot = fileName.lastIndexOf('.');
  if (dot === -1) return '파일';
  return fileName.slice(dot + 1).toUpperCase();
}

export default async function DocsPage() {
  const items = await getDocuments();

  return (
    <>
      <PageHeader
        title="공지·자료실"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '공지·자료실', href: '/notice' },
          { label: '규정·서식' },
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
                const isFile = Boolean(item.file_url);
                const typeLabel = isFile ? extractExtension(item.file_name) : '외부 링크';
                const sizeLabel = isFile && item.file_size ? formatSize(item.file_size) : '';
                const href = item.file_url ?? item.external_url ?? '#';

                return (
                  <div
                    key={item.id}
                    className="p-5 bg-white rounded-lg border border-foam hover:border-ocean/20 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-sm ${
                              isFile ? 'bg-ocean/10 text-ocean' : 'bg-teal/10 text-teal'
                            }`}
                          >
                            {typeLabel}
                          </span>
                          {sizeLabel && (
                            <span className="text-xs text-navy/40">{sizeLabel}</span>
                          )}
                          <span className="text-xs text-navy/40">
                            {new Date(item.date).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <h3 className="text-[15px] text-navy font-medium mb-1">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-navy/55 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={isFile ? item.file_name ?? undefined : undefined}
                        className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-ocean text-white text-xs font-medium rounded-lg hover:bg-ocean-light transition-colors"
                      >
                        {isFile ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            다운로드
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                            링크 열기
                          </>
                        )}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-navy/40">
              <div className="w-16 h-16 rounded-full bg-foam flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-navy/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <p className="text-[15px] font-medium mb-1">등록된 규정·서식이 없습니다.</p>
              <p className="text-sm text-navy/30">규정 및 서식이 등록되면 이곳에서 다운로드하실 수 있습니다.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
