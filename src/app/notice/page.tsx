import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '공지사항',
};

const categories = ['전체', '대회', '교육', '행사', '협회'];

const categoryColor: Record<string, string> = {
  '대회': 'bg-sunset/10 text-sunset',
  '교육': 'bg-teal/10 text-teal',
  '행사': 'bg-ocean/10 text-ocean',
  '협회': 'bg-navy/10 text-navy',
};

const notices = [
  {
    id: 1,
    title: '2025 서핑심판/강사 양성교육 모집 안내',
    category: '교육',
    date: '2025-05-12',
    pinned: true,
  },
  {
    id: 2,
    title: '숏/롱보드, SUP서핑 전문 선수 등록안내',
    category: '협회',
    date: '2025-11-05',
    pinned: false,
  },
  {
    id: 3,
    title: 'YY 랜드서핑 무료 체험 이벤트',
    category: '행사',
    date: '2025-05-13',
    pinned: false,
  },
];

const subNav = [
  { label: '공지사항', href: '/notice', active: true },
  { label: '보도자료', href: '/notice/press', active: false },
  { label: '사진·영상', href: '/notice/gallery', active: false },
  { label: '규정·서식', href: '/notice/docs', active: false },
  { label: 'FAQ', href: '/notice/faq', active: false },
];

export default function NoticePage() {
  return (
    <>
      <PageHeader
        title="공지·자료실"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '공지·자료실' },
        ]}
      />

      <section className="py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-4">
          {/* Sub Navigation */}
          <nav className="flex gap-1 border-b border-foam mb-10 overflow-x-auto">
            {subNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  item.active
                    ? 'border-ocean text-ocean'
                    : 'border-transparent text-navy/50 hover:text-navy hover:border-navy/20'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Category Filter */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
            {categories.map((cat, i) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  i === 0
                    ? 'bg-ocean text-white'
                    : 'bg-foam text-navy/60 hover:bg-ocean/10 hover:text-ocean'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Notice List */}
          <div className="space-y-3">
            {notices.map((notice) => (
              <Link
                key={notice.id}
                href={`/notice/${notice.id}`}
                className="flex items-center gap-4 p-5 bg-white rounded-lg border border-foam hover:border-ocean/20 hover:bg-ocean/5 transition-colors group"
              >
                {notice.pinned && (
                  <span className="text-sunset text-xs font-bold shrink-0">
                    고정
                  </span>
                )}
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-sm shrink-0 ${
                    categoryColor[notice.category] || 'bg-foam text-navy/60'
                  }`}
                >
                  {notice.category}
                </span>
                <span className="text-[15px] text-navy font-medium group-hover:text-ocean transition-colors truncate flex-1">
                  {notice.title}
                </span>
                <span className="text-xs text-navy/40 shrink-0 hidden sm:block">
                  {notice.date}
                </span>
              </Link>
            ))}
          </div>

          {notices.length === 0 && (
            <div className="text-center py-20 text-navy/40">
              <p className="text-[15px] font-medium mb-1">등록된 공지가 없습니다.</p>
              <p className="text-sm text-navy/30">
                새로운 소식이 등록되면 이곳에서 확인하실 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
