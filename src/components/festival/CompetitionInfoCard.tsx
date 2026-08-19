import type { ReactNode } from 'react';

export interface InfoRow {
  label: string;
  value: string;
  note?: string;
}

/**
 * 대회 정보 카드 — 아이콘·제목·배지 + 항목(dl) 목록.
 * 탭 개편 전 `/festival` 의 대회 카드 마크업을 그대로 옮겨 온 것이라
 * 비기너·숏보드·롱보드·SUP 서핑 탭이 같은 생김새를 공유한다.
 */
export default function CompetitionInfoCard({
  icon,
  title,
  subtitle,
  badge,
  badgeClass,
  accentClass,
  rows,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
  accentClass: string;
  rows: InfoRow[];
  /** 접수 CTA 등 카드 하단 슬롯 */
  children?: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-foam bg-white p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-foam pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${accentClass}`}
          >
            {icon}
          </span>
          <div>
            <h3 className="text-lg font-bold text-navy md:text-xl">{title}</h3>
            <p className="mt-1 text-sm text-navy/60">{subtitle}</p>
          </div>
        </div>
        <span
          className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
        >
          {badge}
        </span>
      </div>

      <dl className="divide-y divide-foam">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
            <dt className="shrink-0 text-sm font-semibold text-navy sm:w-24">{row.label}</dt>
            <dd className="text-sm leading-relaxed text-navy/70">
              {row.value}
              {row.note && <span className="mt-1 block text-xs text-navy/45">{row.note}</span>}
            </dd>
          </div>
        ))}
      </dl>

      {children}
    </article>
  );
}
