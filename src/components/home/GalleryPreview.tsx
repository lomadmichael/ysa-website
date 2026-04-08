import Link from 'next/link';

// TODO: Supabase 연동 후 실제 데이터로 교체
const galleryItems = [
  { id: 1, title: '2024 양양군수배 국제서핑대회', alt: '국제서핑대회 사진' },
  { id: 2, title: '2025 강사 양성교육', alt: '강사 양성교육 사진' },
  { id: 3, title: '2023 해양수산부장관배 서핑대회', alt: '해양수산부장관배 사진' },
  { id: 4, title: '서핑특화 교육 현장', alt: '서핑특화 교육 사진' },
  { id: 5, title: '양양서핑페스티벌', alt: '페스티벌 사진' },
  { id: 6, title: '비치요가 체험', alt: '비치요가 사진' },
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
                <div className="absolute inset-0 flex items-center justify-center text-navy/15 text-xs text-center px-4">
                  {item.alt}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="absolute bottom-3 left-3 right-3 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.title}
                </p>
              </Link>
            );
          })}
        </div>

        {galleryItems.length === 0 && (
          <div className="text-center py-16 text-navy/40">
            <p className="mb-2">등록된 사진이 없습니다.</p>
            <p className="text-sm">협회 활동 사진이 등록되면 이곳에서 확인하실 수 있습니다.</p>
          </div>
        )}
      </div>
    </section>
  );
}
