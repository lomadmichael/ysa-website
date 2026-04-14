import Image from 'next/image';
import Link from 'next/link';

// 메인 갤러리 프리뷰: public/images/history/Gallery 의 대표 이미지 6장.
// 전체 갤러리는 Supabase 연동 후 /notice/gallery 에서 제공.
const galleryItems = [
  { id: 1, src: '/images/history/Gallery/surfing_01.jpg', alt: '양양 서핑 현장' },
  { id: 2, src: '/images/history/Gallery/surfing_02.jpg', alt: '양양 서핑 현장' },
  { id: 3, src: '/images/history/Gallery/surfing_03.jpg', alt: '양양 서핑 현장' },
  { id: 4, src: '/images/history/Gallery/surfing_06.jpg', alt: '양양 서핑 현장' },
  { id: 5, src: '/images/history/Gallery/surfing_04.jpg', alt: '양양 서핑 현장' },
  { id: 6, src: '/images/history/Gallery/surfing_05.jpg', alt: '양양 서핑 현장' },
];

export default function GalleryPreview() {
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
          {galleryItems.map((item, i) => {
            // 첫 번째와 네 번째를 크게
            const isLarge = i === 0 || i === 3;
            return (
              <Link
                key={item.id}
                href="/notice/gallery"
                className={`group relative overflow-hidden rounded-lg bg-foam ${
                  isLarge ? 'col-span-2 row-span-2 aspect-square' : 'aspect-[4/3]'
                }`}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes={isLarge ? '(max-width: 1024px) 100vw, 600px' : '(max-width: 1024px) 50vw, 300px'}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
