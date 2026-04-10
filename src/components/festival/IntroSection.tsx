import Image from 'next/image';

export default function FestivalIntro() {
  return (
    <section className="py-24 md:py-32 bg-sand">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-16 items-center">
          {/* 2025 포스터 이미지 자리 */}
          {/* 필요 이미지: /images/history/2025-poster.jpg (세로 포스터, 3:4 비율) */}
          <div className="relative aspect-[3/4] bg-foam rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/images/history/2025-poster_01.jpg"
              alt="2025 양양 서핑 페스티벌 포스터"
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </div>

          <div>
            <p className="text-xs font-mono tracking-[0.3em] uppercase text-purple mb-4">
              INTRODUCTION
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy leading-[1.2] mb-8">
              파도 위에 쌓인<br />
              <span className="text-ocean">10년의 시간</span>
            </h2>

            <div className="space-y-5 text-navy/75 leading-[1.9] text-[15px] md:text-base">
              <p>
                2014년 첫 파도를 시작으로, 양양 서핑 페스티벌은 10년 동안
                수많은 순간을 지나왔습니다. 파도는 거센 물결 속에서도
                서퍼들과 함께 성장하며 대한민국 서핑문화의 역사를 써왔습니다.
              </p>
              <p>
                이 기록은 단순한 대회의 면면이 아니라, 양양의 바다와 사람,
                그리고 문화가 함께 만들어온 시간의 흔적입니다. 10년의
                발자취를 따라, 양양이 어떻게 바다를 넘어 문화로 나아갔는지
                여정을 함께 돌아봅니다.
              </p>
            </div>

            <div className="mt-10 pt-8 border-t border-navy/10">
              <p className="text-sm text-navy/50 font-serif italic leading-relaxed">
                &ldquo;Since the first wave in 2014, the Yangyang Surfing Festival
                has journeyed through a decade of unforgettable moments.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
