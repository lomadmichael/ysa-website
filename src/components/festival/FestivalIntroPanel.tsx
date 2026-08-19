import Link from 'next/link';
import { festivalTabHref, type FestivalTabId } from './tabs';
import { OPEN_COMPETITIONS } from './OpenCompetitionPanel';

/**
 * 기본 탭(페스티벌) — 축제 전체 소개와 대회 갈림길.
 * 탭 개편 전 페이지의 페스티벌 · 주요 일정 · 주최/주관/후원 · 10년의 기록 블록을 그대로 옮겨 왔다.
 */

const ORGANIZERS = [
  { label: '주최', value: '양양군' },
  { label: '주관', value: '양양군서핑협회(YSA) · 대한서핑협회(KSA)' },
  {
    label: '후원',
    value: '문화체육관광부 · 강원특별자치도 · 양양군체육회 · 강원특별자치도서핑협회',
  },
];

interface CompetitionLink {
  id: FestivalTabId;
  icon: string;
  title: string;
  caption: string;
  badge: string;
  badgeClass: string;
  accentClass: string;
}

const COMPETITION_LINKS: CompetitionLink[] = [
  {
    id: 'beginner',
    icon: '🌊',
    title: '비기너 서핑대회',
    caption: '8월 29일(토)~30일(일) · 죽도해변',
    badge: '대진표 발표',
    badgeClass: 'text-ocean bg-ocean/10',
    accentClass: 'bg-ocean/10',
  },
  ...OPEN_COMPETITIONS.map((comp) => ({
    id: comp.id as FestivalTabId,
    icon: comp.icon,
    title: `코리아 오픈 ${comp.shortLabel}`,
    caption: `9~11월 파도 좋은 평일 · ${comp.venue}`,
    badge: '접수 ~ 8/22',
    badgeClass: 'text-sunset bg-sunset/10',
    accentClass: 'bg-sunset/10',
  })),
];

export default function FestivalIntroPanel() {
  return (
    <>
      {/* 대회 갈림길 */}
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-teal">
              COMPETITION
            </p>
            <h2 className="mb-4 text-2xl font-bold text-navy md:text-3xl">
              대한서핑협회장배 서핑대회
            </h2>
            <p className="leading-relaxed text-navy/70">
              2026 양양서핑페스티벌과 함께 열리는 대한서핑협회장배 서핑대회입니다. 비기너
              서핑대회는 8월 말 죽도해변에서, 코리아 오픈 숏보드 · 롱보드 · SUP 서핑 종목은 파도
              상황에 맞춰 9~11월에 진행합니다. 종목별 일정과 진행 방식이 다르니 아래에서 해당
              대회를 확인해 주세요.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COMPETITION_LINKS.map((comp) => (
              <Link
                key={comp.id}
                href={festivalTabHref(comp.id)}
                scroll={false}
                className="group rounded-2xl border border-foam bg-white p-6 transition-all hover:-translate-y-1 hover:border-ocean/30 hover:shadow-lg hover:shadow-navy/5"
              >
                <span
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl ${comp.accentClass}`}
                >
                  {comp.icon}
                </span>
                <span
                  className={`mb-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${comp.badgeClass}`}
                >
                  {comp.badge}
                </span>
                <h3 className="text-base font-bold text-navy">{comp.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy/55">{comp.caption}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ocean">
                  자세히 보기
                  <svg
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
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
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 주요 일정 */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="max-w-3xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-teal">SCHEDULE</p>
            <h2 className="mb-4 text-2xl font-bold text-navy md:text-3xl">주요 일정</h2>
            <p className="leading-relaxed text-navy/70">
              비기너 서핑대회는 8월 29일(토)~30일(일) 죽도해변에서, 코리아 오픈 세 종목은 9월부터
              11월까지 파도가 좋은 평일에 순차 진행합니다. 기상 상황에 따라 변경될 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 페스티벌 현장 */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-teal">FESTIVAL</p>
            <h2 className="mb-4 text-2xl font-bold text-navy md:text-3xl">페스티벌 현장</h2>
          </div>

          <div className="rounded-2xl border border-foam bg-white p-8 md:p-10">
            <p className="leading-relaxed text-navy/70">
              대회와 함께 죽도해변에서 즐기는 현장 프로그램을 준비하고 있습니다.
              <br className="hidden md:block" />
              세부 프로그램은 확정되는 대로 이 페이지와 공지사항을 통해 안내드립니다.
            </p>
            <Link
              href="/notice"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ocean px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-ocean/90"
            >
              공지사항 보기
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
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
      </section>

      {/* 주최·주관·후원 */}
      <section className="border-t border-foam py-12 md:py-16">
        <div className="mx-auto max-w-[1200px] px-4">
          <dl className="max-w-3xl divide-y divide-foam">
            {ORGANIZERS.map((org) => (
              <div key={org.label} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
                <dt className="shrink-0 text-sm font-semibold text-navy sm:w-16">{org.label}</dt>
                <dd className="text-sm leading-relaxed text-navy/70">{org.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 10년의 기록 배너 */}
      <section className="bg-ocean py-16 text-white md:py-20">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 px-4 md:flex-row md:items-center">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-sunset">
              SINCE 2014
            </p>
            <h2 className="mb-2 text-xl font-bold md:text-2xl">양양 서핑페스티벌 10년의 기록</h2>
            <p className="text-sm leading-relaxed text-white/70">
              2014년 첫 파도부터 지금까지, 페스티벌이 지나온 시간을 아카이브로 만나보세요.
            </p>
          </div>
          <Link
            href="/festival/history"
            className="inline-flex shrink-0 items-center gap-2 bg-sunset px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-sunset/90"
          >
            10년의 기록 보기
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
