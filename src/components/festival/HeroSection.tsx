export default function FestivalHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-navy">
      {/* 배경 사진 자리 — 필요 이미지: /images/history/festival-hero.jpg (와이드 서핑 사진) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/history/festival-hero.jpg')`,
          backgroundColor: '#0A3D62',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/50 to-navy" />
      </div>

      {/* 콘텐츠 */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 text-center text-white">
        <p className="text-xs md:text-sm font-mono tracking-[0.4em] uppercase mb-6 text-sunset">
          EST. 2014 · YANGYANG, KOREA
        </p>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight">
          양양 서핑 페스티벌
          <br />
          <span className="text-sunset">10년의 역사</span>
        </h1>
        <p className="text-lg md:text-xl text-white/70 mb-3 font-serif italic">
          파도를 넘어, 문화로
        </p>
        <p className="text-sm md:text-base text-white/50 tracking-widest font-mono">
          BEYOND THE WAVES, INTO CULTURE
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="#timeline"
            className="px-8 py-3.5 bg-sunset text-white font-semibold hover:bg-sunset/90 transition-colors text-sm"
          >
            연혁 보기 ↓
          </a>
          <a
            href="#champions"
            className="px-8 py-3.5 bg-white/10 text-white font-semibold border border-white/30 hover:bg-white/20 transition-colors text-sm"
          >
            역대 우승자
          </a>
        </div>
      </div>

      {/* 스크롤 인디케이터 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 animate-bounce">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}
