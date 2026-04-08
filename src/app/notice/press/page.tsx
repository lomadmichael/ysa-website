import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { type PressItem } from '@/lib/database.types';

export const metadata: Metadata = {
  title: '보도자료',
};

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
              {items.map((item) => (
                <a
                  key={item.id}
                  href={item.url || '#'}
                  target={item.url ? '_blank' : undefined}
                  rel={item.url ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-4 p-5 bg-white rounded-lg border border-foam hover:border-ocean/20 hover:bg-ocean/5 transition-colors group"
                >
                  {item.source && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-sm bg-ocean/10 text-ocean shrink-0">
                      {item.source}
                    </span>
                  )}
                  <span className="text-[15px] text-navy font-medium group-hover:text-ocean transition-colors truncate flex-1">
                    {item.title}
                  </span>
                  <span className="text-xs text-navy/40 shrink-0 hidden sm:block">
                    {new Date(item.date).toLocaleDateString('ko-KR')}
                  </span>
                  {item.url && (
                    <svg className="w-4 h-4 text-navy/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  )}
                </a>
              ))}
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
