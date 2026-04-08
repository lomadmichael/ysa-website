import Link from 'next/link';

const items = [
  {
    title: '강사 교육',
    description: '서핑 강사 양성 프로그램',
    href: '/programs/instructor',
    icon: '🎓',
  },
  {
    title: '심판 교육',
    description: '공정한 경기 운영을 위한 심판 교육',
    href: '/programs/referee',
    icon: '⚖️',
  },
  {
    title: '서핑특화 교육',
    description: '서프레스큐, 랜드서핑, 요가 등',
    href: '/programs/specialized',
    icon: '🏄',
  },
  {
    title: '대회 일정',
    description: '연간 대회 일정과 참가 안내',
    href: '/competitions',
    icon: '🏆',
  },
  {
    title: '공지사항',
    description: '협회 공식 공지 확인',
    href: '/notice',
    icon: '📢',
  },
];

export default function QuickAccess() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-4">
        <h2 className="text-sm font-semibold text-teal tracking-widest uppercase mb-8 text-center">
          자주 찾는 안내
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group block p-6 bg-sand rounded-lg hover:bg-ocean hover:text-white transition-all duration-200"
            >
              <span className="text-3xl block mb-3">{item.icon}</span>
              <p className="font-semibold text-[15px] mb-1 group-hover:text-white">{item.title}</p>
              <p className="text-xs text-navy/50 group-hover:text-white/70 leading-relaxed">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
