'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Counts = {
  notices: number;
  press: number;
  programs: number;
  competitions: number;
  gallery: number;
  documents: number;
  faq: number;
};

type RecentItem = {
  kind: 'notice' | 'press' | 'gallery';
  id: number;
  title: string;
  created_at: string;
  href: string;
  badge: string;
  badgeColor: string;
};

const STATS = [
  { key: 'notices' as const, label: '공지사항', href: '/admin/notices', color: 'bg-ocean' },
  { key: 'press' as const, label: '보도자료', href: '/admin/press', color: 'bg-teal' },
  { key: 'programs' as const, label: '프로그램', href: '/admin/programs', color: 'bg-sunset' },
  { key: 'competitions' as const, label: '대회', href: '/admin/competitions', color: 'bg-navy' },
  { key: 'gallery' as const, label: '갤러리', href: '/admin/gallery', color: 'bg-ocean' },
  { key: 'documents' as const, label: '규정·서식', href: '/admin/docs', color: 'bg-teal' },
  { key: 'faq' as const, label: 'FAQ', href: '/admin/faq', color: 'bg-sunset' },
];

const QUICK_ACTIONS = [
  { label: '새 공지 작성', href: '/admin/notices/new', color: 'bg-ocean hover:bg-ocean-light' },
  { label: '새 보도자료', href: '/admin/press/new', color: 'bg-teal hover:bg-teal/90' },
  { label: '새 갤러리', href: '/admin/gallery/new', color: 'bg-sunset hover:bg-sunset/90' },
];

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [
        noticesCount,
        pressCount,
        programsCount,
        competitionsCount,
        galleryCount,
        documentsCount,
        faqCount,
        noticesRecent,
        pressRecent,
        galleryRecent,
      ] = await Promise.all([
        supabase.from('notices').select('*', { count: 'exact', head: true }),
        supabase.from('press').select('*', { count: 'exact', head: true }),
        supabase.from('programs').select('*', { count: 'exact', head: true }),
        supabase.from('competitions').select('*', { count: 'exact', head: true }),
        supabase.from('gallery').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase.from('faq').select('*', { count: 'exact', head: true }),
        supabase.from('notices').select('id, title, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('press').select('id, title, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('gallery').select('id, title, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      if (cancelled) return;

      setCounts({
        notices: noticesCount.count ?? 0,
        press: pressCount.count ?? 0,
        programs: programsCount.count ?? 0,
        competitions: competitionsCount.count ?? 0,
        gallery: galleryCount.count ?? 0,
        documents: documentsCount.count ?? 0,
        faq: faqCount.count ?? 0,
      });

      const merged: RecentItem[] = [
        ...(noticesRecent.data ?? []).map((n) => ({
          kind: 'notice' as const,
          id: n.id,
          title: n.title,
          created_at: n.created_at,
          href: `/admin/notices/${n.id}/edit`,
          badge: '공지',
          badgeColor: 'bg-ocean/10 text-ocean',
        })),
        ...(pressRecent.data ?? []).map((p) => ({
          kind: 'press' as const,
          id: p.id,
          title: p.title,
          created_at: p.created_at,
          href: `/admin/press/${p.id}/edit`,
          badge: '보도',
          badgeColor: 'bg-teal/10 text-teal',
        })),
        ...(galleryRecent.data ?? []).map((g) => ({
          kind: 'gallery' as const,
          id: g.id,
          title: g.title,
          created_at: g.created_at,
          href: `/admin/gallery/${g.id}/edit`,
          badge: '갤러리',
          badgeColor: 'bg-sunset/10 text-sunset',
        })),
      ]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 8);

      setRecent(merged);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy mb-1">대시보드</h1>
          <p className="text-sm text-navy/60">YSA 어드민 홈 — 한눈에 보는 콘텐츠 현황</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`${a.color} text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors`}
            >
              + {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Count cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-lg ${stat.color} mb-3`} />
            <p className="text-sm text-navy/60">{stat.label}</p>
            <p className="text-3xl font-bold text-navy mt-1 tabular-nums">
              {counts ? counts[stat.key].toLocaleString('ko-KR') : <span className="text-navy/20">…</span>}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-foam flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">최근 업데이트</h2>
          <span className="text-xs text-navy/50">공지 · 보도 · 갤러리 통합 최근 8건</span>
        </div>
        {loading ? (
          <div className="p-6 text-navy/50 text-sm">불러오는 중…</div>
        ) : recent.length === 0 ? (
          <div className="p-6 text-navy/50 text-sm">등록된 콘텐츠가 없습니다.</div>
        ) : (
          <ul className="divide-y divide-foam">
            {recent.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <Link
                  href={item.href}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-sand/50 transition-colors"
                >
                  <span
                    className={`shrink-0 inline-flex items-center justify-center text-xs font-medium px-2 py-0.5 rounded ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-navy text-sm">{item.title}</span>
                  <span className="shrink-0 text-xs text-navy/50 tabular-nums">
                    {formatRelativeDate(item.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
