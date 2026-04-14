'use client';

import { useMemo, useState } from 'react';
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

/** 카테고리별 뱃지 색상 */
const CATEGORY_BADGE: Record<NoticeCategory, string> = {
  competition: 'bg-sunset/10 text-sunset',
  education: 'bg-teal/10 text-teal',
  event: 'bg-ocean/10 text-ocean',
  association: 'bg-navy/10 text-navy',
};

export default function NoticeList({ notices }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return notices;
    return notices.filter((n) => n.category === filter);
  }, [notices, filter]);

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

  return (
    <>
      {/* Category Filter */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
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

      {/* Notice List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((notice) => {
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
      ) : (
        <div className="text-center py-20 text-navy/40">
          <p className="text-[15px] font-medium mb-1">
            {filter === 'all'
              ? '등록된 공지가 없습니다.'
              : `${FILTERS.find((f) => f.value === filter)?.label} 카테고리에 등록된 공지가 없습니다.`}
          </p>
          {filter !== 'all' ? (
            <button
              type="button"
              onClick={() => setFilter('all')}
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
