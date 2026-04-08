import Link from 'next/link';
import { type ReactNode } from 'react';

/* ── 핸드드로잉 스타일 SVG 아이콘 ── */
function IconInstructor() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
      <circle cx="24" cy="14" r="6" />
      <path d="M12 38c0-7 5-12 12-12s12 5 12 12" />
      <path d="M30 8l4-4M34 4l-2 6 6-2" />
    </svg>
  );
}

function IconReferee() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
      <rect x="14" y="6" width="20" height="28" rx="2" />
      <line x1="20" y1="14" x2="28" y2="14" />
      <line x1="20" y1="20" x2="28" y2="20" />
      <line x1="20" y1="26" x2="25" y2="26" />
      <path d="M24 34v8M18 42h12" />
    </svg>
  );
}

function IconSurf() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
      <path d="M8 36c4-4 8-4 12 0s8 4 12 0 8-4 12 0" />
      <path d="M32 10c-2 6-6 14-14 22" />
      <path d="M28 8c2 0 6 2 6 6" />
      <circle cx="22" cy="18" r="3" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
      <path d="M16 8h16v12c0 4-4 8-8 8s-8-4-8-8V8z" />
      <path d="M16 12h-4c-2 0-4 2-4 4v2c0 3 3 6 6 6h2" />
      <path d="M32 12h4c2 0 4 2 4 4v2c0 3-3 6-6 6h-2" />
      <line x1="24" y1="28" x2="24" y2="34" />
      <path d="M18 34h12v4H18z" />
    </svg>
  );
}

function IconNotice() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
      <path d="M10 12l14 8 14-8" />
      <path d="M10 12v20c0 2 2 4 4 4h20c2 0 4-2 4-4V12" />
      <path d="M10 12c0-2 2-4 4-4h20c2 0 4 2 4 4" />
    </svg>
  );
}

const items: { title: string; description: string; href: string; Icon: () => ReactNode }[] = [
  {
    title: '강사 교육',
    description: '서핑 강사 양성 프로그램',
    href: '/programs/instructor',
    Icon: IconInstructor,
  },
  {
    title: '심판 교육',
    description: '공정한 경기 운영을 위한 심판 교육',
    href: '/programs/referee',
    Icon: IconReferee,
  },
  {
    title: '서핑특화 교육',
    description: '서프레스큐, 랜드서핑, 요가 등',
    href: '/programs/specialized',
    Icon: IconSurf,
  },
  {
    title: '대회 일정',
    description: '연간 대회 일정과 참가 안내',
    href: '/competitions',
    Icon: IconTrophy,
  },
  {
    title: '공지사항',
    description: '협회 공식 공지 확인',
    href: '/notice',
    Icon: IconNotice,
  },
];

export default function QuickAccess() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-4">
        <h2 className="text-sm font-semibold text-purple tracking-widest uppercase mb-8 text-center">
          자주 찾는 안내
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group block p-6 bg-sand rounded-lg hover:bg-ocean hover:text-white transition-all duration-200"
            >
              <div className="mb-3 text-ocean group-hover:text-white transition-colors">
                <item.Icon />
              </div>
              <p className="font-semibold text-[15px] mb-1 group-hover:text-white">{item.title}</p>
              <p className="text-xs text-navy/50 group-hover:text-white/70 leading-relaxed">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
