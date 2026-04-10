import Link from 'next/link';

export default function FestivalCTA() {
  return (
    <section className="py-24 md:py-32 bg-ocean text-white text-center">
      <div className="max-w-[800px] mx-auto px-4">
        <p className="text-xs font-mono tracking-[0.4em] uppercase text-sunset mb-6">
          THE NEXT WAVE
        </p>
        <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6">
          10년의 기록은 끝이 아닙니다
        </h2>
        <p className="text-white/70 text-base md:text-lg leading-relaxed mb-12 max-w-lg mx-auto">
          양양의 다음 파도를 함께 만들어가세요.
          <br />
          서핑이 만든 변화의 시간은 지금도 계속됩니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/programs"
            className="px-8 py-3.5 bg-sunset text-white font-semibold hover:bg-sunset/90 transition-colors text-sm"
          >
            프로그램 참여하기
          </Link>
          <Link
            href="/schedule"
            className="px-8 py-3.5 bg-white/10 text-white font-semibold border border-white/30 hover:bg-white/20 transition-colors text-sm"
          >
            일정 보기
          </Link>
          <Link
            href="/contact"
            className="px-8 py-3.5 bg-white/10 text-white font-semibold border border-white/30 hover:bg-white/20 transition-colors text-sm"
          >
            협회 문의
          </Link>
        </div>
      </div>
    </section>
  );
}
