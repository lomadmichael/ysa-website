'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { NOTICE_CATEGORY_LABEL, type Notice, type NoticeCategory } from '@/lib/database.types';

interface Props {
  notices: Notice[];
}

type Filter = 'all' | NoticeCategory;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'competition', label: '대회' },
  { value: 'education', label: '교육' },
  { value: 'event', label: '행사' },
  { value: 'association', label: '협회' },
];

const PAGE_SIZE = 10;

const CATEGORY_BADGE: Record<NoticeCategory, string> = {
  competition: 'bg-sunset/10 text-sunset',
  education: 'bg-teal/10 text-teal',
  event: 'bg-ocean/10 text-ocean',
  association: 'bg-navy/10 text-navy',
};

/** HTML 태그 제거 (검색용 본문 정규화) */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export default function NoticeList({ notices }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  // 필터·검색어가 바뀌면 1페이지로 리셋
  useEffect(() => {
    setPage(1);
  }, [filter, query]);

  // 본문 검색을 위해 한 번만 정규화 (notices가 바뀔 때만 재계산)
  const haystacks = useMemo(() => {
    const map = new Map<number, string>();
    for (const n of notices) {
      map.set(n.id, `${n.title.toLowerCase()} ${stripHtml(n.content || '')}`);
    }
    return map;
  }, [notices]);

  const filtered = useMemo(() => {
    let list = notices;
    if (filter !== 'all') {
      list = list.filter((n) => n.category === filter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((n) => (haystacks.get(n.id) ?? '').includes(q));
    }
    return list;
  }, [notices, filter, query, haystacks]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: notices.length,
      competition: 0,
      education: 0,
      event: 0,
      association: 0,
    };
    for (const n of notices) c[n.category]++;
    return c;
  }, [notices]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-ocean text-white'
                    : 'bg-foam text-navy/60 hover:bg-ocean/10 hover:text-ocean'
                }`}
              >
                {f.label}
                <span className={`ml-1.5 text-[11px] ${active ? 'text-white/70' : 'text-navy/40'}`}>
                  {counts[f.value]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative sm:w-64">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목·본문 검색"
            className="w-full pl-9 pr-3 py-2 text-sm border border-foam rounded-full focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal/60 transition-colors"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
      </div>

      {/* Notice List */}
      {filtered.length > 0 ? (
        <>
          <div className="space-y-3">
            {pageItems.map((notice) => {
              const categoryLabel = NOTICE_CATEGORY_LABEL[notice.category] || notice.category;
              const badgeClass = CATEGORY_BADGE[notice.category] || 'bg-foam text-navy/60';
              return (
                <Link
                  key={notice.id}
                  href={`/notice/${notice.id}`}
                  className="flex items-center gap-4 p-5 bg-white rounded-lg border border-foam hover:border-ocean/20 hover:bg-ocean/5 transition-colors group"
                >
                  {notice.pinned && (
                    <span className="text-sunset text-xs font-bold shrink-0">고정</span>
                  )}
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-sm shrink-0 ${badgeClass}`}
                  >
                    {categoryLabel}
                  </span>
                  <span className="text-[15px] text-navy font-medium group-hover:text-ocean transition-colors truncate flex-1">
                    {notice.title}
                  </span>
                  <span className="text-xs text-navy/40 shrink-0 hidden sm:block">
                    {new Date(notice.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-10">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-3 py-1.5 text-sm text-navy/70 rounded hover:bg-foam disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="이전 페이지"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const active = p === safePage;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`min-w-[34px] px-2 py-1.5 text-sm rounded transition-colors ${
                      active
                        ? 'bg-ocean text-white font-medium'
                        : 'text-navy/70 hover:bg-foam'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="px-3 py-1.5 text-sm text-navy/70 rounded hover:bg-foam disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="다음 페이지"
              >
                ›
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-navy/40">
          <p className="text-[15px] font-medium mb-1">
            {query
              ? `"${query}" 검색 결과가 없습니다.`
              : filter === 'all'
              ? '등록된 공지가 없습니다.'
              : `${FILTERS.find((f) => f.value === filter)?.label} 카테고리에 등록된 공지가 없습니다.`}
          </p>
          {(filter !== 'all' || query) ? (
            <button
              type="button"
              onClick={() => {
                setFilter('all');
                setQuery('');
              }}
              className="text-sm text-ocean hover:underline"
            >
              전체 보기 →
            </button>
          ) : (
            <p className="text-sm text-navy/30">
              새로운 소식이 등록되면 이곳에서 확인하실 수 있습니다.
            </p>
          )}
        </div>
      )}
    </>
  );
}
