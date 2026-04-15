import Image from 'next/image';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { GalleryItem } from '@/lib/database.types';

// 메인 갤러리 프리뷰 fallback. Supabase에 아이템이 부족하면 채워서 6장 유지.
const fallbackItems = [
  { src: '/images/history/Gallery/surfing_01.jpg', title: '양양 서핑 현장' },
  { src: '/images/history/Gallery/surfing_02.jpg', title: '양양 서핑 현장' },
  { src: '/images/history/Gallery/surfing_03.jpg', title: '양양 서핑 현장' },
  { src: '/images/history/Gallery/surfing_06.jpg', title: '양양 서핑 현장' },
  { src: '/images/history/Gallery/surfing_04.jpg', title: '양양 서핑 현장' },
  { src: '/images/history/Gallery/surfing_05.jpg', title: '양양 서핑 현장' },
];

type PreviewItem = { src: string; title: string };

async function getGalleryPreview(): Promise<PreviewItem[]> {
  try {
    if (!isSupabaseConfigured) return fallbackItems;
    const { data, error } = await supabase
      .from('gallery')
      .select('title, media_urls, date')
      .order('date', { ascending: false })
      .limit(6);
    if (error) throw error;

    const fromDb: PreviewItem[] = (data ?? [])
      .filter((row): row is GalleryItem & { media_urls: string[] } =>
        Array.isArray(row.media_urls) && row.media_urls.length > 0,
      )
      .map((row) => ({ src: row.media_urls[0], title: row.title }));

    // 부족분은 fallback으로 채워서 항상 6장 유지
    if (fromDb.length >= 6) return fromDb.slice(0, 6);
    return [...fromDb, ...fallbackItems.slice(0, 6 - fromDb.length)];
  } catch {
    return fallbackItems;
  }
}

export default async function GalleryPreview() {
  const items = await getGalleryPreview();

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <p className="text-sm font-semibold text-purple tracking-widest uppercase mb-4">GALLERY</p>
            <h2 className="text-2xl md:text-3xl font-bold text-navy">
              양양의 파도 위에 쌓인 시간
            </h2>
            <p className="text-navy/60 mt-2">
              협회가 만들어온 현장 기록을 사진과 영상으로 소개합니다.
            </p>
          </div>
          <Link
            href="/notice/gallery"
            className="mt-4 md:mt-0 text-sm text-ocean font-semibold hover:underline"
          >
            전체 갤러리 보기 →
          </Link>
        </div>

        {/* 불규칙 그리드 - 의도적 크기 차이 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item, i) => {
            // 첫 번째와 네 번째를 크게
            const isLarge = i === 0 || i === 3;
            // Supabase에서 온 외부 URL은 next/image 도메인 설정이 필요 → 일반 img 사용,
            // 로컬 public 이미지(fallback)는 next/image로 최적화.
            const isLocal = item.src.startsWith('/');
            return (
              <Link
                key={`${i}-${item.src}`}
                href="/notice/gallery"
                className={`group relative overflow-hidden rounded-lg bg-foam ${
                  isLarge ? 'col-span-2 row-span-2 aspect-square' : 'aspect-[4/3]'
                }`}
              >
                {isLocal ? (
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    sizes={isLarge ? '(max-width: 1024px) 100vw, 600px' : '(max-width: 1024px) 50vw, 300px'}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.src}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="absolute bottom-3 left-3 right-3 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {item.title}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
