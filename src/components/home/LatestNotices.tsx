import Link from 'next/link';

// TODO: Supabase 연동 후 실제 데이터로 교체
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

const categoryColor: Record<string, string> = {
  '대회': 'bg-sunset/10 text-sunset',
  '교육': 'bg-teal/10 text-teal',
  '행사': 'bg-ocean/10 text-ocean',
  '협회': 'bg-navy/10 text-navy',
};

export default function LatestNotices() {
  return (
    <section className="py-24 md:py-32 bg-foam/50">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <p className="text-sm font-semibold text-teal tracking-widest uppercase mb-4">NOTICE</p>
            <h2 className="text-2xl md:text-3xl font-bold text-navy">
              최신 공지
            </h2>
          </div>
          <Link
            href="/notice"
            className="mt-4 md:mt-0 text-sm text-ocean font-semibold hover:underline"
          >
            전체 공지 보기 →
          </Link>
        </div>

        <div className="space-y-3">
          {notices.map((notice) => (
            <Link
              key={notice.id}
              href={`/notice/${notice.id}`}
              className="flex items-center gap-4 p-5 bg-white rounded-lg hover:bg-ocean/5 transition-colors group"
            >
              {notice.pinned && (
                <span className="text-sunset text-xs font-bold shrink-0">고정</span>
              )}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-sm shrink-0 ${categoryColor[notice.category] || 'bg-foam text-navy/60'}`}>
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
          <div className="text-center py-16 text-navy/40">
            <p className="mb-2">등록된 공지가 없습니다.</p>
            <p className="text-sm">새로운 소식이 등록되면 이곳에서 확인하실 수 있습니다.</p>
          </div>
        )}
      </div>
    </section>
  );
}
