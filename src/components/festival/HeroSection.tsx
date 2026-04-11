import Image from 'next/image';

// hero_02.jpg의 축소/블러 처리된 16px JPEG (315 bytes, build time에 sharp로 생성).
// placeholder='blur'로 첫 프레임부터 실제 이미지의 흐릿한 버전이 보여 깜박임 없음.
const HERO_BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/2wBDABsSFBcUERsXFhceHBsgKEIrKCUlKFE6PTBCYFVlZF9VXVtqeJmBanGQc1tdhbWGkJ6jq62rZ4C8ybqmx5moq6T/2wBDARweHigjKE4rK06kbl1upKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKT/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAQIDBP/EACAQAAEEAgEFAAAAAAAAAAAAAAIAAQMEEiERFDJSYaH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAv/EABYRAAMAAAAAAAAAAAAAAAAAAAABE//aAAwDAQACEQMRAD8AQKtQI9nLl6ZVqn0kuYllrYvyyzjYl47vjIvYl832pmxRH//Z';

export default function FestivalHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-navy">
      {/*
        placeholder='blur' + blurDataURL = 첫 프레임부터 실제 사진의 흐릿한 버전 표시.
        실제 이미지 로드 완료 시 Next.js가 자동으로 부드럽게 크로스페이드.
      */}
      <Image
        src="/images/history/hero_02.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        quality={85}
        placeholder="blur"
        blurDataURL={HERO_BLUR_DATA_URL}
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/40 to-navy" />

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
            역대 입상자
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
