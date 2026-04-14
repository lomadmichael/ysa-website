import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import NoticeList from '@/components/notice/NoticeList';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Notice } from '@/lib/database.types';

export const metadata: Metadata = {
  title: '공지사항',
};

// admin에서 공지 작성/수정 즉시 목록에 반영되도록 매 요청 렌더
// (기본값은 static이라 빌드 시점 데이터로 고정되어 실시간 반영 안 됨)
export const dynamic = 'force-dynamic';

/** Supabase 미설정 시 fallback 데이터. 프로젝트 연결 안 됐을 때만 표시. */
const mockNotices: Notice[] = [
  {
    id: 1,
    title: '2025 서핑심판/강사 양성교육 모집 안내',
    category: 'education',
    created_at: '2025-05-12',
    pinned: true,
    content: '',
    updated_at: '',
    author: null,
    thumbnail_url: null,
  },
  {
    id: 2,
    title: '숏/롱보드, SUP서핑 전문 선수 등록안내',
    category: 'association',
    created_at: '2025-11-05',
    pinned: false,
    content: '',
    updated_at: '',
    author: null,
    thumbnail_url: null,
  },
  {
    id: 3,
    title: 'YY 랜드서핑 무료 체험 이벤트',
    category: 'event',
    created_at: '2025-05-13',
    pinned: false,
    content: '',
    updated_at: '',
    author: null,
    thumbnail_url: null,
  },
];

async function getNotices(): Promise<Notice[]> {
  // 환경변수 미설정 시 mock 반환 (개발 편의)
  if (!isSupabaseConfigured) return mockNotices;
  try {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

const subNav = [
  { label: '공지사항', href: '/notice', active: true },
  { label: '보도자료', href: '/notice/press', active: false },
  { label: '사진·영상', href: '/notice/gallery', active: false },
  { label: '규정·서식', href: '/notice/docs', active: false },
  { label: 'FAQ', href: '/notice/faq', active: false },
];

export default async function NoticePage() {
  const notices = await getNotices();

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

          {/* List + Filter (client) */}
          <NoticeList notices={notices} />
        </div>
      </section>
    </>
  );
}
