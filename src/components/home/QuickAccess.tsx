import Link from 'next/link';
import { type ReactNode } from 'react';
import { IconInstructor, IconReferee, IconSurf, IconTrophy, IconNotice } from '@/components/icons';

const IconApply = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 7h6M9 11h6M9 15h4" />
    <circle cx="17" cy="17" r="2.5" />
    <path d="M15.5 17.5l1 1 2-2.5" />
  </svg>
);

const items: { title: string; description: string; href: string; icon: ReactNode }[] = [
  {
    title: '교육 접수',
    description: '심판/강사 인증 온라인 접수',
    href: '/apply',
    icon: <IconApply className="w-9 h-9" />,
  },
  {
    title: '강사 교육',
    description: '서핑 강사 양성 프로그램',
    href: '/programs/instructor',
    icon: <IconInstructor className="w-9 h-9" />,
  },
  {
    title: '심판 교육',
    description: '공정한 경기운영을 위한 교육',
    href: '/programs/referee',
    icon: <IconReferee className="w-9 h-9" />,
  },
  {
    title: '서핑특화 교육',
    description: '서프레스큐, 랜드서핑, 요가 등',
    href: '/programs/specialized',
    icon: <IconSurf className="w-9 h-9" />,
  },
  {
    title: '일정안내',
    description: '연간 일정과 참가 안내',
    href: '/schedule',
    icon: <IconTrophy className="w-9 h-9" />,
  },
  {
    title: '공지사항',
    description: '협회 공식 공지 확인',
    href: '/notice',
    icon: <IconNotice className="w-9 h-9" />,
  },
];

export default function QuickAccess() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-4">
        <h2 className="text-sm font-semibold text-purple tracking-widest uppercase mb-8 text-center">
          자주 찾는 안내
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group block p-6 bg-sand rounded-lg hover:bg-ocean hover:text-white transition-all duration-200"
            >
              <div className="mb-3 text-ocean group-hover:text-white transition-colors">
                {item.icon}
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
