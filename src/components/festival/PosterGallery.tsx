import Image from 'next/image';
import { FESTIVAL_HISTORY } from '@/lib/festival-data';

export default function PosterGallery() {
  // 포스터가 있는 회차만 표시 (없으면 placeholder)
  const years = FESTIVAL_HISTORY;

  return (
    <section className="py-24 md:py-32 bg-sand">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-xs font-mono tracking-[0.4em] uppercase text-purple mb-4">
            POSTER ARCHIVE
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-navy">
            역대 페스티벌 포스터
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {years.map((year) => (
            <div key={year.year} className="group">
              {/* 필요 이미지: /images/history/{year}-poster.jpg (포스터 스캔, 3:4 비율) */}
              <div className="relative aspect-[3/4] bg-foam rounded-lg overflow-hidden mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                {year.posterImage ? (
                  <Image
                    src={year.posterImage}
                    alt={`${year.year} 양양 서핑 페스티벌 포스터`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 20vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-navy/20">
                    <span className="text-3xl font-mono font-bold">{year.year}</span>
                    <span className="text-[10px] uppercase tracking-widest mt-2">
                      Poster Needed
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs font-mono font-semibold text-navy/80">
                {year.year}
              </p>
              <p className="text-[11px] text-navy/50 line-clamp-1">
                제{year.edition}회
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
