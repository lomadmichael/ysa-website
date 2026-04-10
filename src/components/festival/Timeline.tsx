import Image from 'next/image';
import { FESTIVAL_HISTORY, HIATUS_YEARS } from '@/lib/festival-data';

export default function FestivalTimeline() {
  return (
    <section id="timeline" className="py-24 md:py-32 bg-white">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-20">
          <p className="text-xs font-mono tracking-[0.4em] uppercase text-sunset mb-4">
            BEYOND THE WAVES, INTO CULTURE
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-navy leading-tight">
            양양, 바다를 넘어 문화로
            <br />
            <span className="text-ocean">&lt;10년의 기록&gt;</span>
          </h2>
        </div>

        {/* 타임라인 */}
        <div className="relative max-w-[900px] mx-auto">
          {/* 세로선 (데스크톱만) */}
          <div
            className="hidden md:block absolute left-[120px] top-6 bottom-6 w-px bg-foam"
            aria-hidden
          />

          <div className="space-y-20">
            {FESTIVAL_HISTORY.map((item, idx) => {
              const prevItem = FESTIVAL_HISTORY[idx - 1];
              const hiatusBefore =
                prevItem && HIATUS_YEARS.some((h) => h < prevItem.year && h > item.year);

              return (
                <div key={item.year}>
                  {/* COVID-19 공백 표시 */}
                  {hiatusBefore && (
                    <div className="flex items-center gap-6 mb-16 md:ml-[100px] pl-0 md:pl-[20px]">
                      <div className="hidden md:block w-[40px] h-px bg-navy/20" />
                      <div className="flex items-center gap-3 text-xs font-mono tracking-widest uppercase text-navy/40">
                        <span>⏸</span>
                        <span>2020 — 2021 · COVID-19 Pause</span>
                      </div>
                    </div>
                  )}

                  {/* 연도 카드 */}
                  <div className="relative flex flex-col md:flex-row gap-6 md:gap-0">
                    {/* 연도 (왼쪽 고정) */}
                    <div className="md:w-[100px] shrink-0 md:pr-6">
                      <p className="text-4xl md:text-5xl font-extrabold text-sunset leading-none font-mono">
                        {item.year}
                      </p>
                      <p className="text-xs text-navy/50 mt-2 font-medium">
                        {item.period}
                      </p>
                    </div>

                    {/* 점 마커 (데스크톱만) */}
                    <div className="hidden md:block relative w-[40px] shrink-0">
                      <div className="absolute left-1/2 top-3 -translate-x-1/2 w-3 h-3 rounded-full bg-sunset ring-4 ring-white z-10" />
                    </div>

                    {/* 카드 콘텐츠 */}
                    <div className="flex-1 bg-sand rounded-2xl overflow-hidden border border-foam hover:border-ocean/20 transition-colors">
                      {/* 이미지 영역 */}
                      {/* 필요 이미지: /images/history/{year}-photo.jpg (현장 사진, 16:9) */}
                      <div className="relative aspect-[16/9] bg-foam overflow-hidden">
                        {item.thumbnail && (
                          <Image
                            src={item.thumbnail}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 60vw"
                          />
                        )}
                        {/* placeholder 표시용 (이미지 없을 때) */}
                        <div className="absolute inset-0 flex items-center justify-center text-navy/20 text-xs font-mono tracking-widest uppercase pointer-events-none">
                          {item.year} · Photo Needed
                        </div>
                      </div>

                      {/* 본문 */}
                      <div className="p-6 md:p-8">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-ocean/10 text-ocean">
                            제{item.edition}회
                          </span>
                          {item.slogan && (
                            <span className="text-[11px] font-mono font-semibold text-sunset uppercase tracking-wider">
                              {item.slogan}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-navy mb-3 leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-sm text-navy/70 leading-[1.8] mb-4">
                          {item.descriptionKo}
                        </p>
                        <p className="text-xs text-navy/40 leading-relaxed font-serif italic border-l-2 border-ocean/20 pl-3">
                          {item.descriptionEn}
                        </p>

                        {item.highlights && item.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-5">
                            {item.highlights.map((h) => (
                              <span
                                key={h}
                                className="text-[11px] font-medium px-2 py-1 rounded-sm bg-foam text-navy/60"
                              >
                                #{h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
