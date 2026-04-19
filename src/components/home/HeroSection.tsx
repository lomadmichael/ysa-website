import Image from 'next/image';
import Link from 'next/link';
import { SITE } from '@/lib/constants';

// hero_03.jpg LQIP (16px blur, scripts/optimize-hero.mjs 재생성)
const HERO_BLUR =
  'data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABQAD/8QAHRAAAgIBBQAAAAAAAAAAAAAAAQMAEQITITEygf/EABQBAQAAAAAAAAAAAAAAAAAAAAH/xAAWEQEBAQAAAAAAAAAAAAAAAAAAERL/2gAMAwEAAhEDEQA/AHgxNCmiWsk7HOvIWrrNM+IQaf/Z';

export default function HeroSection() {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden bg-ocean">
      {/* priority preload + LQIP blur placeholder (배경색 노출 제거) */}
      <Image
        src="/images/hero_03.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        quality={85}
        placeholder="blur"
        blurDataURL={HERO_BLUR}
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ocean/50 via-ocean/30 to-ocean/70" />

      {/* Content */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 text-center text-white">
        <p className="text-sm md:text-base font-medium tracking-widest uppercase mb-4 text-white/80">
          {SITE.nameEn}
        </p>
        <h1 className="text-[32px] md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
          파도를 넘어<br />
          사람과 문화를 잇다
        </h1>
        <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          양양군서핑협회는 대회 운영, 교육, 체험, 안전문화 조성을 통해<br className="hidden md:block" />
          양양의 서핑을 기록하고, 키우고, 연결합니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/programs"
            className="px-8 py-3.5 bg-sunset text-white font-semibold rounded-none hover:bg-sunset/90 transition-colors text-sm"
          >
            프로그램 안내
          </Link>
          <Link
            href="/schedule"
            className="px-8 py-3.5 bg-white/10 text-white font-semibold rounded-none border border-white/30 hover:bg-white/20 transition-colors text-sm"
          >
            일정안내
          </Link>
          <Link
            href="/about"
            className="px-8 py-3.5 bg-white/10 text-white font-semibold rounded-none border border-white/30 hover:bg-white/20 transition-colors text-sm"
          >
            협회 소개
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}
