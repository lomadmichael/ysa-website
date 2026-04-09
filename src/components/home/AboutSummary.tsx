import Link from 'next/link';
import Image from 'next/image';

export default function AboutSummary() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* 사진 */}
          <div className="relative aspect-[4/3] bg-foam rounded-lg overflow-hidden">
            <Image src="/images/about.jpg" alt="SURFING YANGYANG 조형물" fill className="object-cover" />
          </div>

          {/* 텍스트 */}
          <div>
            <p className="text-sm font-semibold text-purple tracking-widest uppercase mb-4">ABOUT YSA</p>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-6 leading-snug">
              2013년부터,<br />
              양양의 서핑문화를 함께 만들어왔습니다
            </h2>
            <p className="text-navy/70 leading-relaxed mb-4">
              양양군서핑협회는 2013년 발족 이후 서핑의 저변 확대와 청소년 육성,
              대회 운영, 교육 프로그램 개발을 통해 양양의 서핑문화를 함께 만들어 왔습니다.
            </p>
            <p className="text-navy/70 leading-relaxed mb-8">
              양양이 대한민국 대표 서핑 거점으로 성장할 수 있었던 이유는
              단지 좋은 파도 때문만은 아닙니다. 지역주민과 이주민, 여행자, 지역사회가
              함께 서핑을 통한 새로운 해변문화를 발전시켜 왔기 때문입니다.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-ocean font-semibold text-sm hover:gap-3 transition-all"
            >
              자세히 보기
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
