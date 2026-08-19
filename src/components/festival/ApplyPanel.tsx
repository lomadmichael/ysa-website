import Link from 'next/link';
import EntryCta from './EntryCta';
import { festivalTabHref } from './tabs';
import {
  OPEN_COMPETITIONS,
  OPEN_ENTRY_HREF,
  OPEN_ENTRY_PERIOD,
} from './OpenCompetitionPanel';

/**
 * 참가신청 탭 — "지금 접수 가능한 대회" 한눈 요약.
 *
 * 접수 버튼 상태는 `EntryCta` 가 `ENTRY_WINDOWS.open` 을 보고 스스로 판단한다.
 * 마감(8/22 23:59)이 지나면 이 탭도 별도 수정 없이 "접수 마감" 으로 바뀐다.
 */
export default function ApplyPanel() {
  return (
    <section className="py-14 md:py-20">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-teal">ENTRY</p>
          <h2 className="mb-4 text-2xl font-bold text-navy md:text-3xl">참가신청</h2>
          <p className="leading-relaxed text-navy/70">
            현재 접수 중인 대회는 코리아 오픈 세 종목(숏보드 · 롱보드 · SUP 서핑)입니다. 한 폼에서
            원하는 종목을 골라 신청할 수 있습니다.
          </p>
        </div>

        {/* 코리아 오픈 3종 */}
        <div className="rounded-2xl border border-foam bg-white p-6 md:p-8">
          <div className="flex flex-col gap-3 border-b border-foam pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-navy md:text-xl">
                코리아 오픈 — 숏보드 · 롱보드 · SUP 서핑
              </h3>
              <p className="mt-1 text-sm text-navy/60">접수 기간 {OPEN_ENTRY_PERIOD}</p>
            </div>
            <span className="w-fit shrink-0 rounded-full bg-sunset/10 px-3 py-1 text-sm font-bold text-sunset">
              마감 8/22(토) 23:59
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {OPEN_COMPETITIONS.map((comp) => (
              <Link
                key={comp.id}
                href={festivalTabHref(comp.id)}
                scroll={false}
                className="group flex items-center gap-3 rounded-xl border border-foam bg-sand/40 px-4 py-4 transition-colors hover:border-ocean/30 hover:bg-ocean/5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sunset/10 text-lg">
                  {comp.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-navy">{comp.shortLabel}</span>
                  <span className="block truncate text-xs text-navy/45">{comp.venue}</span>
                </span>
                <svg
                  className="ml-auto h-4 w-4 shrink-0 text-navy/30 transition-colors group-hover:text-ocean"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            ))}
          </div>

          <EntryCta
            windowKey="open"
            badgeLabel="8/13 09시 접수 시작"
            badgeClass="text-sunset bg-sunset/10"
            href={OPEN_ENTRY_HREF}
          />
        </div>

        {/* 비기너 — 접수 마감, 대진표로 안내 */}
        <div className="mt-6 rounded-2xl border border-foam bg-white p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-navy md:text-xl">비기너 서핑대회</h3>
              <p className="mt-1 text-sm text-navy/60">
                접수가 마감되었습니다. 1라운드 히트 편성을 확인해 주세요.
              </p>
            </div>
            <Link
              href={festivalTabHref('beginner')}
              scroll={false}
              className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-ocean px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ocean/90"
            >
              접수 마감 — 대진표 확인
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
