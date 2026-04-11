import Image from 'next/image';
import Link from 'next/link';
import { SITE } from '@/lib/constants';

// hero_03.png의 축소/블러 처리된 16px JPEG (291 bytes, build time에 sharp로 생성).
// placeholder="blur" + blurDataURL 조합으로 첫 프레임부터 실제 이미지의
// 흐릿한 버전이 보이게 해 배경색 노출 → 이미지 snap 전환 깜박임 제거.
const HERO_BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/2wBDABsSFBcUERsXFhceHBsgKEIrKCUlKFE6PTBCYFVlZF9VXVtqeJmBanGQc1tdhbWGkJ6jq62rZ4C8ybqmx5moq6T/2wBDARweHigjKE4rK06kbl1upKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKT/wAARCAAJABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAQIEBf/EABwQAAICAgMAAAAAAAAAAAAAAAADAQIREyExQf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFREBAQAAAAAAAAAAAAAAAAAAABH/2gAMAwEAAhEDEQA/ANeLqxwyAbVe2wQr6GsIlf/Z';

export default function HeroSection() {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/*
        placeholder='blur' + blurDataURL = 첫 프레임부터 실제 사진의 흐릿한 버전 표시.
        실제 이미지 로드 완료 시 Next.js가 자동으로 부드럽게 크로스페이드.
        → 배경색 snap 전환/깜박임 완전 제거.
      */}
      <Image
        src="/images/hero_03.png"
        alt=""
        fill
        priority
        sizes="100vw"
        quality={85}
        placeholder="blur"
        blurDataURL={HERO_BLUR_DATA_URL}
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
