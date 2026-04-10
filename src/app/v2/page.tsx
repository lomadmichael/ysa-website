import Image from 'next/image';
import Link from 'next/link';
import { SITE } from '@/lib/constants';

export const metadata = { title: 'YSA KOREA — Classic Surf' };

/* ── 핸드드로잉 스타일 SVG 아이콘 ── */
function IconMoon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-10 h-10">
      <path d="M40 12c-12 2-20 12-18 24s14 20 26 18c-6 4-14 4-20-1S18 40 20 28s10-16 20-16z" />
      <circle cx="36" cy="22" r="3" fill="currentColor" />
    </svg>
  );
}
function IconSun() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-10 h-10">
      <circle cx="32" cy="32" r="8" />
      <path d="M32 12v6M32 46v6M12 32h6M46 32h6M19 19l4 4M41 41l4 4M45 19l-4 4M23 41l-4 4" />
      <path d="M26 14l2 4M38 46l2 4M14 38l4-2M46 26l4-2" />
    </svg>
  );
}
function IconSpiral() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-10 h-10">
      <path d="M32 28a4 4 0 0 1 4 4 8 8 0 0 1-8 8 12 12 0 0 1-12-12 16 16 0 0 1 16-16 20 20 0 0 1 20 20 24 24 0 0 1-24 24" />
    </svg>
  );
}
function IconWaves() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-10 h-10">
      <path d="M8 24c4-4 8-4 12 0s8 4 12 0 8-4 12 0 8 4 12 0" />
      <path d="M8 34c4-4 8-4 12 0s8 4 12 0 8-4 12 0 8 4 12 0" />
      <path d="M8 44c4-4 8-4 12 0s8 4 12 0 8-4 12 0 8 4 12 0" />
    </svg>
  );
}
function IconStarfish() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
      <path d="M32 8l4 16 16-4-12 12 12 12-16-4-4 16-4-16-16 4 12-12-12-12 16 4z" />
    </svg>
  );
}

const ICONS = [
  { Icon: IconMoon, label: '달과 밤바다' },
  { Icon: IconSun, label: '태양과 파도' },
  { Icon: IconSpiral, label: '소용돌이' },
  { Icon: IconWaves, label: '파도' },
  { Icon: IconStarfish, label: '불가사리' },
];

export default function V2HomePage() {
  return (
    <div className="-mt-16" style={{ background: '#f0ebe1', color: '#1a2e44' }}>

      {/* ── 그레인 텍스처 오버레이 ── */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.04]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
      />

      {/* ══════════════════════════════════════ */}
      {/* ── HERO: 빈티지 서프 포스터 스타일 ── */}
      {/* ══════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
        {/* 배경 사진 + 듀오톤 */}
        <div className="absolute inset-0">
          <Image src="/images/hero.png" alt="" fill className="object-cover" style={{ filter: 'grayscale(100%) contrast(1.1)' }} priority />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(26,62,92,0.7), rgba(26,62,92,0.4), rgba(240,235,225,1))' }} />
        </div>

        {/* 콘텐츠 */}
        <div className="relative z-10 text-center px-6 max-w-3xl">
          {/* 아이콘 라인 */}
          <div className="flex justify-center gap-6 mb-10 text-[#f0ebe1]/80">
            {ICONS.map(({ Icon, label }) => (
              <div key={label} className="opacity-70">
                <Icon />
              </div>
            ))}
          </div>

          <p className="text-[#f0ebe1]/60 tracking-[0.4em] uppercase text-xs mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            Est. 2013 &middot; Yangyang, Korea
          </p>

          <h1 className="text-[#f0ebe1] leading-[1.1] mb-6" style={{ fontFamily: 'Georgia, "Noto Serif KR", serif', fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 400 }}>
            파도를 넘어,<br />
            사람과 문화를 잇다
          </h1>

          <p className="text-[#f0ebe1]/60 text-base max-w-md mx-auto mb-10" style={{ fontFamily: 'Georgia, serif' }}>
            대회 운영 &middot; 교육 &middot; 체험 &middot; 안전문화 조성을 통해<br />
            양양의 서핑을 기록하고, 키우고, 연결합니다.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/programs" className="px-8 py-3 text-sm tracking-wider uppercase border-2 border-[#f0ebe1] text-[#f0ebe1] hover:bg-[#f0ebe1] hover:text-[#1a2e44] transition-all duration-300" style={{ fontFamily: 'Georgia, serif' }}>
              프로그램
            </Link>
            <Link href="/about" className="px-8 py-3 text-sm tracking-wider uppercase border-2 border-[#f0ebe1]/40 text-[#f0ebe1]/70 hover:border-[#f0ebe1] hover:text-[#f0ebe1] transition-all duration-300" style={{ fontFamily: 'Georgia, serif' }}>
              협회 소개
            </Link>
          </div>
        </div>

        {/* 하단 스크롤 화살표 */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[#f0ebe1]/40 animate-bounce">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
        </div>
      </section>

      {/* ══════════════════════════════════════ */}
      {/* ── ABOUT: 세리프 + 좌우 분할 ──────── */}
      {/* ══════════════════════════════════════ */}
      <section className="py-24 md:py-32">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[3/4] overflow-hidden" style={{ borderRadius: '2px' }}>
              <Image src="/images/about.jpg" alt="SURFING YANGYANG" fill className="object-cover" style={{ filter: 'grayscale(40%) sepia(20%)' }} />
            </div>
            <div>
              <div className="flex gap-4 mb-8 text-[#1a3e5c]/40">
                <IconWaves />
              </div>
              <h2 className="text-3xl md:text-4xl mb-6 leading-snug" style={{ fontFamily: 'Georgia, "Noto Serif KR", serif', fontWeight: 400 }}>
                2013년부터,<br />양양의 파도 위에<br />시간을 쌓아왔습니다
              </h2>
              <p className="text-[#1a2e44]/60 leading-[1.9] text-[15px] mb-6">
                양양군서핑협회는 서핑의 저변 확대와 청소년 육성,
                대회 운영, 교육 프로그램 개발을 통해 양양의 서핑문화를 함께 만들어 왔습니다.
                양양이 대한민국 대표 서핑 거점으로 성장한 이유는 좋은 파도뿐 아니라,
                지역사회가 함께 해변문화의 시간을 쌓아왔기 때문입니다.
              </p>
              <Link href="/about" className="inline-flex items-center gap-2 text-sm tracking-wider uppercase text-[#1a3e5c] hover:gap-3 transition-all" style={{ fontFamily: 'Georgia, serif' }}>
                자세히 보기
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════ */}
      {/* ── 아이콘 밴드: 가치 ─────────────── */}
      {/* ══════════════════════════════════════ */}
      <section className="py-20" style={{ background: '#1a3e5c', color: '#f0ebe1' }}>
        <div className="max-w-[1000px] mx-auto px-6">
          <p className="text-center tracking-[0.4em] uppercase text-xs mb-12 opacity-50" style={{ fontFamily: 'Georgia, serif' }}>Our Values</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { Icon: IconMoon, title: '자연과의 조화', desc: '파도와 함께 자연을\n존중하는 태도' },
              { Icon: IconSun, title: '사람을 키우는 교육', desc: '좋은 문화는 좋은\n사람에서 시작됩니다' },
              { Icon: IconSpiral, title: '존중의 해변문화', desc: '여행자와 주민이\n함께 만드는 해변' },
              { Icon: IconStarfish, title: '지역과 함께', desc: '양양의 지속 가능한\n서핑 생태계' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center">
                <div className="mb-4 opacity-60"><Icon /></div>
                <h3 className="text-base font-semibold mb-2">{title}</h3>
                <p className="text-xs leading-relaxed opacity-50 whitespace-pre-line">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════ */}
      {/* ── 사진 스트립: 빈티지 듀오톤 ─────── */}
      {/* ══════════════════════════════════════ */}
      <section className="py-24 md:py-32">
        <div className="max-w-[1000px] mx-auto px-6 mb-10">
          <p className="tracking-[0.4em] uppercase text-xs mb-3 opacity-40" style={{ fontFamily: 'Georgia, serif' }}>Gallery</p>
          <h2 className="text-2xl md:text-3xl" style={{ fontFamily: 'Georgia, "Noto Serif KR", serif', fontWeight: 400 }}>
            양양의 파도 위에 쌓인 시간
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto px-6 pb-4 snap-x">
          {[
            { src: '/images/value-1.png', title: '바다 위의 교감' },
            { src: '/images/value-2.png', title: '파도를 타는 순간' },
            { src: '/images/value-3.png', title: '함께하는 문화' },
            { src: '/images/value-4.png', title: '양양의 사람들' },
            { src: '/images/about.jpg', title: 'SURFING YANGYANG' },
          ].map((item) => (
            <div key={item.title} className="relative shrink-0 w-[260px] md:w-[320px] aspect-[3/4] overflow-hidden snap-start group" style={{ borderRadius: '2px' }}>
              <Image src={item.src} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" style={{ filter: 'grayscale(30%) sepia(15%) contrast(1.05)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,46,68,0.7) 0%, transparent 50%)' }} />
              <p className="absolute bottom-4 left-4 text-[#f0ebe1] text-sm" style={{ fontFamily: 'Georgia, serif' }}>{item.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════ */}
      {/* ── 프로그램: 미니멀 리스트 ─────────── */}
      {/* ══════════════════════════════════════ */}
      <section className="py-24 md:py-32" style={{ background: '#e8e2d6' }}>
        <div className="max-w-[1000px] mx-auto px-6">
          <p className="tracking-[0.4em] uppercase text-xs mb-3 opacity-40" style={{ fontFamily: 'Georgia, serif' }}>Programs</p>
          <div className="flex items-end justify-between mb-12">
            <h2 className="text-2xl md:text-3xl" style={{ fontFamily: 'Georgia, "Noto Serif KR", serif', fontWeight: 400 }}>프로그램</h2>
            <Link href="/programs" className="text-xs tracking-wider uppercase opacity-40 hover:opacity-100 transition-opacity" style={{ fontFamily: 'Georgia, serif' }}>전체 보기 →</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: '강사 교육', desc: 'KSA 자격 강사진 지도\n2일, 16시간 과정', src: '/images/program-instructor_01.jpg' },
              { title: '심판 교육', desc: '공정한 경기 운영을 위한\n전문 심판 양성', src: '/images/program-referee.png' },
              { title: '서핑특화 교육', desc: '서프레스큐, 랜드서핑\n서핑요가, 선수교육', src: '/images/program-special.png' },
            ].map((prog) => (
              <Link key={prog.title} href="/programs" className="group block">
                <div className="relative aspect-[4/5] overflow-hidden mb-4" style={{ borderRadius: '2px' }}>
                  <Image src={prog.src} alt={prog.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" style={{ filter: 'grayscale(40%) sepia(15%)' }} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,46,68,0.6) 0%, transparent 40%)' }} />
                </div>
                <h3 className="text-lg mb-1 group-hover:text-[#1a3e5c] transition-colors" style={{ fontFamily: 'Georgia, "Noto Serif KR", serif' }}>{prog.title}</h3>
                <p className="text-xs leading-relaxed opacity-50 whitespace-pre-line">{prog.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════ */}
      {/* ── 공지: 타이프라이터 느낌 ─────────── */}
      {/* ══════════════════════════════════════ */}
      <section className="py-24 md:py-32">
        <div className="max-w-[1000px] mx-auto px-6">
          <p className="tracking-[0.4em] uppercase text-xs mb-3 opacity-40" style={{ fontFamily: 'Georgia, serif' }}>Notice</p>
          <div className="flex items-end justify-between mb-10">
            <h2 className="text-2xl md:text-3xl" style={{ fontFamily: 'Georgia, "Noto Serif KR", serif', fontWeight: 400 }}>공지사항</h2>
            <Link href="/notice" className="text-xs tracking-wider uppercase opacity-40 hover:opacity-100 transition-opacity" style={{ fontFamily: 'Georgia, serif' }}>전체 보기 →</Link>
          </div>
          {[
            { title: '2025 서핑심판/강사 양성교육 모집 안내', cat: '교육', date: '2025.05' },
            { title: '숏/롱보드, SUP서핑 전문 선수 등록안내', cat: '협회', date: '2025.11' },
            { title: 'YY 랜드서핑 무료 체험 이벤트', cat: '행사', date: '2025.05' },
          ].map((n, i) => (
            <Link key={i} href="/notice" className="flex items-baseline gap-4 py-5 border-b border-[#1a2e44]/10 hover:border-[#1a3e5c]/40 transition-colors group">
              <span className="text-xs opacity-30 shrink-0 w-16" style={{ fontFamily: 'Georgia, serif' }}>{n.date}</span>
              <span className="text-xs opacity-30 shrink-0 w-10">{n.cat}</span>
              <span className="flex-1 group-hover:text-[#1a3e5c] transition-colors text-[15px]">{n.title}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════ */}
      {/* ── 숫자: 미니멀 카운터 ──────────────── */}
      {/* ══════════════════════════════════════ */}
      <section className="py-20" style={{ background: '#1a3e5c', color: '#f0ebe1' }}>
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { num: '2013', sub: '협회 발족' },
              { num: '10+', sub: '연간 대회' },
              { num: '120+', sub: '배출 강사' },
              { num: '10th', sub: '서핑페스티벌' },
            ].map((s) => (
              <div key={s.sub}>
                <p className="text-4xl md:text-5xl mb-2" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>{s.num}</p>
                <p className="text-xs tracking-wider uppercase opacity-40">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════ */}
      {/* ── CTA 밴드 ─────────────────────── */}
      {/* ══════════════════════════════════════ */}
      <section className="py-24 md:py-32 text-center">
        <div className="max-w-[600px] mx-auto px-6">
          <div className="flex justify-center gap-6 mb-8 opacity-30">
            {ICONS.map(({ Icon, label }) => <div key={label}><Icon /></div>)}
          </div>
          <h2 className="text-2xl md:text-4xl mb-4 leading-snug" style={{ fontFamily: 'Georgia, "Noto Serif KR", serif', fontWeight: 400 }}>
            양양의 파도가<br />당신을 기다립니다
          </h2>
          <p className="text-sm opacity-50 mb-10 max-w-sm mx-auto leading-relaxed">
            교육, 대회, 체험 프로그램에 참여하고<br />양양의 서핑문화를 함께 만들어가세요.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/programs" className="px-8 py-3 text-sm tracking-wider uppercase border-2 border-[#1a3e5c] hover:bg-[#1a3e5c] hover:text-[#f0ebe1] transition-all duration-300" style={{ fontFamily: 'Georgia, serif' }}>
              프로그램 신청
            </Link>
            <Link href="/contact" className="px-8 py-3 text-sm tracking-wider uppercase border-2 border-[#1a3e5c]/30 text-[#1a3e5c]/60 hover:border-[#1a3e5c] hover:text-[#1a3e5c] transition-all duration-300" style={{ fontFamily: 'Georgia, serif' }}>
              문의하기
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════ */}
      {/* ── 미니 푸터 ────────────────────── */}
      {/* ══════════════════════════════════════ */}
      <section className="py-16 border-t border-[#1a2e44]/10">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs opacity-40">
            <div>
              <p className="opacity-100 text-base mb-2" style={{ fontFamily: 'Georgia, serif' }}>{SITE.nameEn}</p>
              <p className="leading-relaxed">{SITE.address}</p>
            </div>
            <div>
              <p className="opacity-100 font-semibold mb-2">연락처</p>
              <p>{SITE.phone}</p>
              <p>{SITE.email}</p>
              <p>{SITE.hours}</p>
            </div>
            <div>
              <p className="opacity-100 font-semibold mb-2">바로가기</p>
              <div className="flex flex-col gap-1">
                <Link href="/about" className="hover:opacity-100 transition-opacity">협회소개</Link>
                <Link href="/programs" className="hover:opacity-100 transition-opacity">프로그램</Link>
                <Link href="/competitions" className="hover:opacity-100 transition-opacity">대회정보</Link>
                <Link href="/notice" className="hover:opacity-100 transition-opacity">공지사항</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
