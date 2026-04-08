import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { type GalleryItem } from '@/lib/database.types';

export const metadata: Metadata = {
  title: '사진·영상',
};

const subNav = [
  { label: '공지사항', href: '/notice', active: false },
  { label: '보도자료', href: '/notice/press', active: false },
  { label: '사진·영상', href: '/notice/gallery', active: true },
  { label: '규정·서식', href: '/notice/docs', active: false },
  { label: 'FAQ', href: '/notice/faq', active: false },
];

async function getGalleryItems(): Promise<GalleryItem[]> {
  try {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function GalleryPage() {
  const items = await getGalleryItems();

  return (
    <>
      <PageHeader
        title="공지·자료실"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '공지·자료실', href: '/notice' },
          { label: '사진·영상' },
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div key={item.id} className="group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-foam mb-2">
                    {item.media_urls && item.media_urls.length > 0 ? (
                      <img
                        src={item.media_urls[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-navy/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-navy truncate">{item.title}</h3>
                  <p className="text-xs text-navy/40">{new Date(item.date).toLocaleDateString('ko-KR')}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-navy/40">
              <div className="w-16 h-16 rounded-full bg-foam flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-navy/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
              </div>
              <p className="text-[15px] font-medium mb-1">등록된 사진·영상이 없습니다.</p>
              <p className="text-sm text-navy/30">사진과 영상이 등록되면 이곳에서 확인하실 수 있습니다.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
